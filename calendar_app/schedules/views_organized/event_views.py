from datetime import datetime, timedelta, timezone as dt_timezone
import logging
from django.forms import ValidationError
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.http import HttpResponse
import csv
from dateutil.rrule import rrule, WEEKLY, DAILY, MONTHLY, YEARLY, MO, TU, WE, TH, FR, SA, SU
import zoneinfo

from ..models import Event, EventReminder, RecurringSchedule, CustomUser
from ..serializers import EventSerializer, EventExportSerializer, RecurringScheduleSerializer
from ..tasks import send_event_reminder
from ..utils import generate_ical
from ..permissions import IsEventOwnerOrShared

logger = logging.getLogger(__name__)

class CustomPageNumberPagination(PageNumberPagination):
    page_size_query_param = 'page_size'
    max_page_size = 100

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated, IsEventOwnerOrShared]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['start_time', 'end_time', 'created_at']
    pagination_class = CustomPageNumberPagination

    def create(self, request, *args, **kwargs):
        try:
            data = request.data.copy()
            data['created_by'] = request.user.id
            start_str = data.get('start_time')
            end_str = data.get('end_time')
            event_tz = data.get('event_timezone', 'UTC')
            tz = zoneinfo.ZoneInfo(event_tz)
            if start_str:
                dt = datetime.fromisoformat(start_str)
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt, tz)
                data['start_time'] = dt.isoformat()
            if end_str:
                dt = datetime.fromisoformat(end_str)
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt, tz)
                data['end_time'] = dt.isoformat()
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            event = serializer.save(created_by=request.user)
            return Response({"data": serializer.data}, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating event: {str(e)}")
            return Response({'error': f'Event creation failed due to an error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        start_str = data.get('start_time')
        end_str = data.get('end_time')
        event_tz = data.get('event_timezone', instance.event_timezone if instance.event_timezone else 'UTC')
        tz = zoneinfo.ZoneInfo(event_tz)
        if start_str:
            dt = datetime.fromisoformat(start_str)
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, tz)
            data['start_time'] = dt.isoformat()
        if end_str:
            dt = datetime.fromisoformat(end_str)
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt, tz)
            data['end_time'] = dt.isoformat()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({"data": serializer.data})

    def get_permissions(self):
        if self.action == 'list':
            return [permissions.AllowAny()]
        elif self.action in ['update', 'destroy']:
            return [permissions.IsAuthenticated(), IsEventOwnerOrShared()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        user_id = request.query_params.get('user_id')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        if not user_id or not start_date_str or not end_date_str:
            return Response({'error': 'User ID, start_date, and end_date are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            start_dt = datetime.fromisoformat(start_date_str)
            if timezone.is_naive(start_dt):
                start_dt = timezone.make_aware(start_dt, dt_timezone.utc)
            end_dt = datetime.fromisoformat(end_date_str)
            if timezone.is_naive(end_dt):
                end_dt = timezone.make_aware(end_dt, dt_timezone.utc)
        except ValueError:
            return Response({'error': 'Invalid date format.'}, status=status.HTTP_400_BAD_REQUEST)
        events = Event.objects.filter(
            Q(created_by__id=user_id) | Q(shared_with__id=user_id),
            start_time__lte=end_dt,
            end_time__gte=start_dt
        ).order_by('start_time')
        for event in events:
            if timezone.is_naive(event.start_time):
                tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                event.start_time = timezone.make_aware(event.start_time, tz)
            if timezone.is_naive(event.end_time):
                tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                event.end_time = timezone.make_aware(event.end_time, tz)
        serializer = self.get_serializer(events, many=True)
        return Response({"data": serializer.data})

    def get_queryset(self):
        user = self.request.user
        start_date_str = self.request.query_params.get('start_date')
        end_date_str = self.request.query_params.get('end_date')
        queryset = Event.objects.filter(
            Q(created_by=user) |
            Q(shared_with=user) |
            Q(group__members=user)
        ).distinct()

        if start_date_str and end_date_str:
            try:
                start_dt = datetime.fromisoformat(start_date_str)
                if timezone.is_naive(start_dt):
                    start_dt = timezone.make_aware(start_dt, dt_timezone.utc)

                end_dt = datetime.fromisoformat(end_date_str)
                if timezone.is_naive(end_dt):
                    end_dt = timezone.make_aware(end_dt, dt_timezone.utc)

                end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

            except ValueError:
                raise ValidationError("Invalid date format. Use ISO format (YYYY-MM-DD).")

            non_recurring_events = queryset.filter(
                recurring=False,
                start_time__lt=end_dt,
                end_time__gt=start_dt
            )

            recurring_events = queryset.filter(recurring=True)
            recurring_event_instances = []
            for event in recurring_events:
                schedule = event.recurring_schedule
                if schedule:
                    rule = self.get_rrule(schedule, event.start_time)
                    event_duration = event.end_time - event.start_time

                    for occurrence in rule.between(start_dt, end_dt, inc=True):
                        tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                        if timezone.is_naive(occurrence):
                            occurrence = timezone.make_aware(occurrence, tz)
                        recurring_event_instances.append(Event(
                            id=event.id,
                            title=event.title,
                            description=event.description,
                            start_time=occurrence,
                            end_time=occurrence + event_duration,
                            location=event.location,
                            created_by=event.created_by,
                            group=event.group,
                            recurring=True,
                            recurrence_rule=event.recurrence_rule,
                            recurrence_end_date=event.recurrence_end_date,
                            color=event.color,
                            event_type=event.event_type,
                            is_all_day=event.is_all_day,
                            event_timezone=event.event_timezone
                        ))

            all_events = list(non_recurring_events) + recurring_event_instances
            all_events.sort(key=lambda x: x.start_time)
            return all_events

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated_response = self.get_paginated_response(serializer.data)
            # Wrap paginated results under "data"
            paginated_data = paginated_response.data
            if 'results' in paginated_data:
                paginated_data['data'] = paginated_data.pop('results')
            return Response(paginated_data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({"data": serializer.data})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if timezone.is_naive(instance.start_time):
            tz = zoneinfo.ZoneInfo(instance.event_timezone if instance.event_timezone else 'UTC')
            instance.start_time = timezone.make_aware(instance.start_time, tz)
        if timezone.is_naive(instance.end_time):
            tz = zoneinfo.ZoneInfo(instance.event_timezone if instance.event_timezone else 'UTC')
            instance.end_time = timezone.make_aware(instance.end_time, tz)
        serializer = self.get_serializer(instance)
        return Response({"data": serializer.data})

    def get_rrule(self, schedule, dtstart):
        frequency_map = {
            'DAILY': DAILY,
            'WEEKLY': WEEKLY,
            'MONTHLY': MONTHLY,
            'YEARLY': YEARLY
        }
        rule_params = {
            'freq': frequency_map[schedule.frequency],
            'dtstart': dtstart,
            'interval': schedule.interval,
            'until': schedule.end_date,
        }
        byweekday = self.get_byweekday(schedule.days_of_week)
        if byweekday:
            rule_params['byweekday'] = byweekday
        return rrule(**rule_params)

    def get_byweekday(self, days_of_week):
        days_map = {
            "Monday": MO,
            "Tuesday": TU,
            "Wednesday": WE,
            "Thursday": TH,
            "Friday": FR,
            "Saturday": SA,
            "Sunday": SU
        }
        if not days_of_week:
            return None
        days_list = days_of_week.split(',')
        return [days_map[day.strip()] for day in days_list if day.strip() in days_map]

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        try:
            user_id = request.query_params.get('user_id')
            if not user_id:
                return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
            user = get_object_or_404(CustomUser, id=user_id)
            now = timezone.now()
            end_date = now + timedelta(days=7)
            all_events = Event.objects.filter(
                Q(created_by=user) | Q(shared_with=user),
                Q(start_time__gte=now, start_time__lte=end_date) |
                Q(recurring=True, recurrence_end_date__gte=now) |
                Q(recurring=True, recurrence_end_date__isnull=True)
            )
            upcoming_events = []
            for event in all_events:
                if event.recurring:
                    schedule = event.recurring_schedule
                    if schedule:
                        rule = self.get_rrule(schedule, event.start_time)
                        event_duration = event.end_time - event.start_time
                        for occurrence in rule.between(now, end_date):
                            tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                            if timezone.is_naive(occurrence):
                                occurrence = timezone.make_aware(occurrence, tz)
                            upcoming_events.append(Event(
                                id=event.id,
                                title=event.title,
                                description=event.description,
                                start_time=occurrence,
                                end_time=occurrence + event_duration,
                                location=event.location,
                                created_by=event.created_by,
                                group=event.group,
                                recurring=True,
                                recurrence_rule=event.recurrence_rule,
                                recurrence_end_date=event.recurrence_end_date,
                                color=event.color,
                                event_type=event.event_type,
                                is_all_day=event.is_all_day,
                                event_timezone=event.event_timezone
                            ))
                else:
                    if timezone.is_naive(event.start_time):
                        tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                        event.start_time = timezone.make_aware(event.start_time, tz)
                    if timezone.is_naive(event.end_time):
                        tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                        event.end_time = timezone.make_aware(event.end_time, tz)
                    upcoming_events.append(event)

            upcoming_events.sort(key=lambda x: x.start_time)

            page = self.paginate_queryset(upcoming_events)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                paginated_response = self.get_paginated_response(serializer.data)
                paginated_data = paginated_response.data
                if 'results' in paginated_data:
                    paginated_data['data'] = paginated_data.pop('results')
                return Response(paginated_data)

            serializer = self.get_serializer(upcoming_events, many=True)
            return Response({"data": serializer.data})
        except Exception as e:
            logger.error(f"Error fetching upcoming events: {str(e)}")
            return Response({'error': 'Failed to fetch upcoming events.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def export(self, request):
        try:
            serializer = EventExportSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            event_ids = serializer.validated_data['event_ids']
            export_format = serializer.validated_data['export_format']
            events = Event.objects.filter(id__in=event_ids, created_by=request.user)
            if export_format == 'ICAL':
                ical_data = generate_ical(events)
                response = HttpResponse(ical_data, content_type='text/calendar')
                response['Content-Disposition'] = 'attachment; filename="events.ics"'
                return response
            elif export_format == 'CSV':
                response = HttpResponse(content_type='text/csv')
                response['Content-Disposition'] = 'attachment; filename="events.csv"'
                writer = csv.writer(response)
                writer.writerow(['Title', 'Description', 'Start Time', 'End Time'])
                for event in events:
                    if timezone.is_naive(event.start_time):
                        tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                        event.start_time = timezone.make_aware(event.start_time, tz)
                    if timezone.is_naive(event.end_time):
                        tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                        event.end_time = timezone.make_aware(event.end_time, tz)
                    writer.writerow([event.title, event.description, event.start_time, event.end_time])
                return response
            else:
                return Response({'error': 'Unsupported export format'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error exporting events: {str(e)}")
            return Response({'error': 'Event export failed.'}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        delete_series = request.query_params.get('delete_series', 'false').lower() == 'true'
        if (instance.recurring or instance.is_recurring or instance.recurring_schedule) and delete_series:
            recurring_schedule = instance.recurring_schedule
            if recurring_schedule:
                Event.objects.filter(recurring_schedule=recurring_schedule).delete()
                recurring_schedule.delete()
            else:
                instance.delete()
        else:
            instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class RecurringScheduleViewSet(viewsets.ModelViewSet):
    queryset = RecurringSchedule.objects.all()
    serializer_class = RecurringScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            return RecurringSchedule.objects.filter(user=self.request.user)
        except Exception as e:
            logger.error(f"Error getting RecurringSchedule queryset: {str(e)}")
            return RecurringSchedule.objects.none()

    @action(detail=True, methods=['post'])
    def generate_events(self, request, pk=None):
        try:
            recurring_schedule = self.get_object()
            end_date = request.data.get('end_date', recurring_schedule.end_date)
            events = recurring_schedule.generate_events(end_date=end_date)
            # ensure times are aware
            for event in events:
                if timezone.is_naive(event.start_time):
                    tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                    event.start_time = timezone.make_aware(event.start_time, tz)
                if timezone.is_naive(event.end_time):
                    tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                    event.end_time = timezone.make_aware(event.end_time, tz)
            serializer = EventSerializer(events, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error generating events for RecurringSchedule {pk}: {str(e)}")
            return Response({'error': 'Failed to generate events'}, status=status.HTTP_400_BAD_REQUEST)


class EventCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            data = request.data.copy()
            data['created_by'] = request.user.id

            # Ensure timezone awareness
            start_str = data.get('start_time')
            end_str = data.get('end_time')
            event_tz = data.get('event_timezone', 'UTC')
            tz = zoneinfo.ZoneInfo(event_tz)

            if start_str:
                dt = datetime.fromisoformat(start_str)
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt, tz)
                data['start_time'] = dt.isoformat()

            if end_str:
                dt = datetime.fromisoformat(end_str)
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt, tz)
                data['end_time'] = dt.isoformat()

            serializer = EventSerializer(data=data)
            if serializer.is_valid():
                event = serializer.save()
                return Response(EventSerializer(event).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating event: {str(e)}")
            return Response({'error': 'Event creation failed'}, status=status.HTTP_400_BAD_REQUEST)


class EventShareView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, event_id):
        try:
            event = get_object_or_404(Event, id=event_id)
            user_ids = request.data.get('user_ids', [])
            users = CustomUser.objects.filter(id__in=user_ids)
            event.shared_with.add(*users)
            return Response({'status': 'Event shared successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error sharing event {event_id}: {str(e)}")
            return Response({'error': 'Event sharing failed'}, status=status.HTTP_400_BAD_REQUEST)


class EventReminderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, event_id):
        try:
            event = get_object_or_404(Event, id=event_id)
            if request.user != event.created_by and request.user not in event.shared_with.all():
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            reminder_time = request.data.get('reminder_time')
            if not reminder_time:
                return Response({'error': 'Reminder time is required'}, status=status.HTTP_400_BAD_REQUEST)
            reminder_minutes = int(reminder_time)
            reminder_datetime = timezone.now() + timezone.timedelta(minutes=reminder_minutes)
            send_event_reminder.apply_async((event.id,), eta=reminder_datetime)
            return Response({'message': 'Reminder set successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error setting reminder for event {event_id}: {str(e)}")
            return Response({'error': 'Failed to set reminder'}, status=status.HTTP_400_BAD_REQUEST)


class BulkEventCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            events_data = request.data.get('events', [])
            created_events = []
            for event_data in events_data:
                event_data['created_by'] = request.user.id
                event_tz = event_data.get('event_timezone', 'UTC')
                tz = zoneinfo.ZoneInfo(event_tz)
                start_str = event_data.get('start_time')
                end_str = event_data.get('end_time')

                if start_str:
                    dt = datetime.fromisoformat(start_str)
                    if timezone.is_naive(dt):
                        dt = timezone.make_aware(dt, tz)
                    event_data['start_time'] = dt.isoformat()

                if end_str:
                    dt = datetime.fromisoformat(end_str)
                    if timezone.is_naive(dt):
                        dt = timezone.make_aware(dt, tz)
                    event_data['end_time'] = dt.isoformat()

                serializer = EventSerializer(data=event_data)
                if serializer.is_valid():
                    event = serializer.save()
                    created_events.append(event)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            return Response(EventSerializer(created_events, many=True).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating bulk events: {str(e)}")
            return Response({'error': 'Bulk event creation failed'}, status=status.HTTP_400_BAD_REQUEST)


class ConflictCheckView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            start_time_str = request.data.get('start_time')
            end_time_str = request.data.get('end_time')
            if not start_time_str or not end_time_str:
                return Response({'error': 'Both start_time and end_time are required'}, status=status.HTTP_400_BAD_REQUEST)

            # Ensure times are aware
            start_dt = datetime.fromisoformat(start_time_str)
            if timezone.is_naive(start_dt):
                start_dt = timezone.make_aware(start_dt, timezone.utc)
            end_dt = datetime.fromisoformat(end_time_str)
            if timezone.is_naive(end_dt):
                end_dt = timezone.make_aware(end_dt, timezone.utc)

            conflicts = Event.objects.filter(
                Q(created_by=request.user) | Q(shared_with=request.user),
                Q(start_time__lt=end_dt, end_time__gt=start_dt) |
                Q(start_time__lte=start_dt, end_time__gte=end_dt)
            )

            if conflicts.exists():
                conflicting_events = []
                for event in conflicts:
                    if timezone.is_naive(event.start_time):
                        tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                        event.start_time = timezone.make_aware(event.start_time, tz)
                    if timezone.is_naive(event.end_time):
                        tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                        event.end_time = timezone.make_aware(event.end_time, tz)
                    conflicting_events.append({
                        'id': event.id,
                        'title': event.title,
                        'start_time': event.start_time,
                        'end_time': event.end_time
                    })
                return Response({'has_conflicts': True, 'conflicting_events': conflicting_events})
            return Response({'has_conflicts': False})
        except Exception as e:
            logger.error(f"Error checking event conflicts: {str(e)}")
            return Response({'error': 'Conflict check failed'}, status=status.HTTP_400_BAD_REQUEST)
