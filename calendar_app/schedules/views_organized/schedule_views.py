from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from rest_framework.decorators import action
from django.forms import ValidationError

from ..permissions import IsEventOwnerOrShared
from ..models import RecurringSchedule, WorkSchedule, Availability
from ..serializers import EventSerializer, RecurringScheduleSerializer, WorkScheduleSerializer, AvailabilitySerializer

def find_common_free_time(user_events, start_date, end_date):
    """
    Utility function to find common free time for multiple users.
    :param user_events: Dictionary with user_id as key and events as values
    :param start_date: The start date for checking availability
    :param end_date: The end date for checking availability
    :return: List of common free time slots
    """
    free_time_slots = []
    for user_id, events in user_events.items():
        for event in events:
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
        date = request.data.get('date')

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

    def get(self, request):
        start_date = request.query_params.get('start_date', timezone.now().date())
        end_date = request.query_params.get('end_date', start_date + timezone.timedelta(days=7))

        events = request.user.event_set.filter(
            start_time__date__gte=start_date,
            end_time__date__lte=end_date
        )

        work_schedules = WorkSchedule.objects.filter(
            user=request.user,
            day_of_week__in=[start_date.weekday(), end_date.weekday()]
        )

        availability = []
        current_date = start_date
        while current_date <= end_date:
            day_events = events.filter(start_time__date=current_date)
            day_schedule = work_schedules.filter(day_of_week=current_date.weekday()).first()

            if day_schedule:
                start_time = timezone.datetime.combine(current_date, day_schedule.start_time)
                end_time = timezone.datetime.combine(current_date, day_schedule.end_time)
                available_slots = [(start_time, end_time)]

                for event in day_events:
                    new_available_slots = []
                    for slot_start, slot_end in available_slots:
                        if event.start_time > slot_start:
                            new_available_slots.append((slot_start, min(slot_end, event.start_time)))
                        if event.end_time < slot_end:
                            new_available_slots.append((max(slot_start, event.end_time), slot_end))
                    available_slots = new_available_slots

                availability.extend(available_slots)
            current_date += timezone.timedelta(days=1)

        return Response(availability)


class FreeBusyView(APIView):
    """
    API view for checking free/busy status of users within a given date range.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        user_ids = request.data.get('user_ids', [])

        if not start_date or not end_date:
            return Response({'error': 'start_date and end_date are required'}, status=status.HTTP_400_BAD_REQUEST)

        start_date = timezone.datetime.fromisoformat(start_date)
        end_date = timezone.datetime.fromisoformat(end_date)

        user_events = {}
        for user_id in user_ids:
            events = request.user.event_set.filter(
                start_time__lt=end_date,
                end_time__gt=start_date
            )
            user_events[user_id] = events

        common_free_time = find_common_free_time(user_events, start_date, end_date)
        return Response({'free_time': common_free_time})

class RecurringScheduleViewSet(viewsets.ModelViewSet):
    queryset = RecurringSchedule.objects.all()
    serializer_class = RecurringScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RecurringSchedule.objects.filter(user=self.request.user)

    def get_permissions(self):
        if self.action in ['update', 'destroy']:
            return [IsEventOwnerOrShared()]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def generate_events(self, request, pk=None):
        recurring_schedule = self.get_object()
        end_date = request.data.get('end_date', recurring_schedule.end_date)
        events = recurring_schedule.generate_events(end_date=end_date)
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)
