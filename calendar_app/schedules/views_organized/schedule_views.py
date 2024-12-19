from datetime import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.forms import ValidationError
from django.utils import timezone
import zoneinfo
from django.db.models import Q

from ..permissions import IsEventOwnerOrShared
from ..models import RecurringSchedule, WorkSchedule, Availability, Event
from ..serializers import EventSerializer, RecurringScheduleSerializer, WorkScheduleSerializer, AvailabilitySerializer

def find_common_free_time(user_events, start_date, end_date):
    """
    Utility function to find common free time for multiple users.
    :param user_events: Dictionary with user_id as key and events as values
    :param start_date: The start date for checking availability
    :param end_date: The end date for checking availability
    :return: List of common free time slots
    """
    # This is a placeholder implementation; real logic would differ
    free_time_slots = []
    for user_id, events in user_events.items():
        for event in events:
            # Ensure event times are aware
            if event.start_time and timezone.is_naive(event.start_time):
                tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                event.start_time = timezone.make_aware(event.start_time, tz)
            if event.end_time and timezone.is_naive(event.end_time):
                tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                event.end_time = timezone.make_aware(event.end_time, tz)
            busy_slot = (event.start_time, event.end_time)
            free_time_slots.append(busy_slot)

    return free_time_slots


class WorkScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling WorkSchedule operations.
    """
    queryset = WorkSchedule.objects.all()
    serializer_class = WorkScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkSchedule.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def handle_schedule_exception(self, request, pk=None):
        """
        Handle exceptions in the work schedule for a specific date.
        """
        work_schedule = self.get_object()
        date_str = request.data.get('date')

        if not date_str:
            return Response({"error": "date is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            date = datetime.fromisoformat(date_str).date()
        except ValueError:
            return Response({"error": "Invalid date format, must be YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            work_schedule.handle_exception(date)
            return Response({"status": "Schedule exception handled"}, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AvailabilityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling user availability operations.
    """
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Availability.objects.filter(user=self.request.user)


class UserAvailabilityView(APIView):
    """
    API view to get user's availability based on their events and work schedules.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_iso_date(self, date_str):
        if not date_str:
            return None
        try:
            return datetime.fromisoformat(date_str).date()
        except ValueError:
            return None

    def get(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if start_date_str:
            start_date = self.get_iso_date(start_date_str)
            if not start_date:
                return Response({"error": "Invalid start_date format, must be YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            start_date = timezone.now().date()

        if end_date_str:
            end_date = self.get_iso_date(end_date_str)
            if not end_date:
                return Response({"error": "Invalid end_date format, must be YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            end_date = start_date + timezone.timedelta(days=7)

        events = request.user.event_set.filter(
            start_time__date__gte=start_date,
            end_time__date__lte=end_date
        )

        # Ensure event times are aware
        for event in events:
            if timezone.is_naive(event.start_time):
                tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                event.start_time = timezone.make_aware(event.start_time, tz)
            if timezone.is_naive(event.end_time):
                tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                event.end_time = timezone.make_aware(event.end_time, tz)

        work_schedules = WorkSchedule.objects.filter(
            user=request.user,
            day_of_week__in=[d.weekday() for d in [start_date + timezone.timedelta(days=i) for i in range((end_date - start_date).days + 1)]]
        )

        availability = []
        current_date = start_date
        while current_date <= end_date:
            day_events = events.filter(start_time__date=current_date)
            day_schedule = work_schedules.filter(day_of_week=current_date.weekday()).first()

            if day_schedule:
                start_time = timezone.make_aware(timezone.datetime.combine(current_date, day_schedule.start_time), timezone.utc)
                end_time = timezone.make_aware(timezone.datetime.combine(current_date, day_schedule.end_time), timezone.utc)
                available_slots = [(start_time, end_time)]

                for event in day_events:
                    new_available_slots = []
                    for slot_start, slot_end in available_slots:
                        # Check overlapping slots
                        if event.start_time > slot_start:
                            new_start = slot_start
                            new_end = min(slot_end, event.start_time)
                            if new_end > new_start:
                                new_available_slots.append((new_start, new_end))
                        if event.end_time < slot_end:
                            new_start = max(slot_start, event.end_time)
                            new_end = slot_end
                            if new_end > new_start:
                                new_available_slots.append((new_start, new_end))
                    available_slots = new_available_slots

                availability.extend(available_slots)
            current_date += timezone.timedelta(days=1)

        # Convert availability slots to isoformat for response
        formatted_availability = [
            {
                "start": slot[0].isoformat(),
                "end": slot[1].isoformat()
            }
            for slot in availability
        ]

        return Response(formatted_availability)


class FreeBusyView(APIView):
    """
    API view for checking free/busy status of users within a given date range.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')
        user_ids = request.data.get('user_ids', [])

        if not start_date_str or not end_date_str:
            return Response({'error': 'start_date and end_date are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            start_date = datetime.fromisoformat(start_date_str)
            if timezone.is_naive(start_date):
                start_date = timezone.make_aware(start_date, timezone.utc)
            end_date = datetime.fromisoformat(end_date_str)
            if timezone.is_naive(end_date):
                end_date = timezone.make_aware(end_date, timezone.utc)
        except ValueError:
            return Response({'error': 'Invalid date format, must be ISO 8601.'}, status=status.HTTP_400_BAD_REQUEST)

        user_events = {}
        for user_id in user_ids:
            # Assuming you want the events of the specified user_id, not just the request user's events.
            # If it's intended to fetch the request user's events only, remove user_id filtering.
            events = Event.objects.filter(
                Q(created_by_id=user_id) | Q(shared_with__id=user_id),
                start_time__lt=end_date,
                end_time__gt=start_date
            )
            user_events[user_id] = events

        common_free_time = find_common_free_time(user_events, start_date, end_date)
        # Convert free times to isoformat for response
        formatted_free_time = [
            {
                "start": ft[0].isoformat(),
                "end": ft[1].isoformat()
            } for ft in common_free_time
        ]
        return Response({'free_time': formatted_free_time})


class RecurringScheduleViewSet(viewsets.ModelViewSet):
    queryset = RecurringSchedule.objects.all()
    serializer_class = RecurringScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RecurringSchedule.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        # Create the initial event based on the recurring schedule
        schedule = serializer.instance
        event_data = {
            'title': schedule.title,
            'description': schedule.description,
            'start_time': timezone.make_aware(timezone.datetime.combine(schedule.start_date, schedule.start_time), timezone.utc),
            'end_time': timezone.make_aware(timezone.datetime.combine(schedule.start_date, schedule.end_time), timezone.utc),
            'location': schedule.location,
            'created_by': request.user,
            'recurring': True,
            'recurrence_rule': {
                'frequency': schedule.frequency,
                'interval': schedule.interval,
                'days_of_week': schedule.days_of_week,
            },
            'color': schedule.color,
            'recurring_schedule': schedule,
            'event_timezone': request.user.userprofile.timezone if request.user.userprofile else 'UTC'
        }
        Event.objects.create(**event_data)

        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_permissions(self):
        if self.action in ['update', 'destroy']:
            return [IsEventOwnerOrShared()]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def generate_events(self, request, pk=None):
        recurring_schedule = self.get_object()
        end_date_str = request.data.get('end_date')
        if not end_date_str:
            return Response({'error': 'End date is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            end_date = datetime.fromisoformat(end_date_str)
            if timezone.is_naive(end_date):
                end_date = timezone.make_aware(end_date, timezone.utc)
        except ValueError:
            return Response({'error': 'Invalid date format'}, status=status.HTTP_400_BAD_REQUEST)

        events = recurring_schedule.generate_events(end_date=end_date)
        # Ensure events are aware
        for event in events:
            if timezone.is_naive(event.start_time):
                tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                event.start_time = timezone.make_aware(event.start_time, tz)
            if timezone.is_naive(event.end_time):
                tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                event.end_time = timezone.make_aware(event.end_time, tz)

        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)
