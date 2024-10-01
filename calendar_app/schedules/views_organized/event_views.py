from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.http import HttpResponse
import csv

from ..models import Event, RecurringSchedule, CustomUser
from ..serializers import EventSerializer, EventExportSerializer, RecurringScheduleSerializer
from ..tasks import send_event_reminder
from ..utils import generate_ical


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['start_time', 'end_time', 'created_at']

    def get_permissions(self):
        if self.action == 'upcoming':
            return [permissions.AllowAny()]
        elif self.action in ['update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.action == 'upcoming':
            return Event.objects.all()
        return Event.objects.filter(
            Q(created_by=self.request.user) |
            Q(shared_with=self.request.user) |
            Q(group__members=self.request.user)
        ).distinct()

    def create(self, request, *args, **kwargs):
        data = request.data
        if data.get('recurring'):
            recurring_schedule = RecurringSchedule.objects.create(
                user=request.user,
                title=data['title'],
                start_time=data['start_time'],
                end_time=data['end_time'],
                frequency=data['recurrence_rule']['frequency'],
                days_of_week=data['recurrence_rule'].get('days_of_week', []),
                day_of_month=data['recurrence_rule'].get('day_of_month'),
                month_of_year=data['recurrence_rule'].get('month_of_year'),
                interval=data['recurrence_rule'].get('interval', 1),
                start_date=data['recurrence_rule']['start_date'],
                end_date=data['recurrence_rule'].get('end_date')
            )
            data['recurring_schedule'] = recurring_schedule.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        event = self.get_object()
        user_ids = request.data.get('user_ids', [])
        users = CustomUser.objects.filter(id__in=user_ids)
        event.shared_with.add(*users)
        return Response({'status': 'Event shared'})

    @action(detail=True, methods=['post'])
    def set_eta(self, request, pk=None):
        event = self.get_object()
        eta = request.data.get('eta')
        if eta:
            event.update_eta(eta)
            return Response({'status': 'ETA set'})
        return Response({'status': 'Invalid ETA'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def export(self, request):
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
                writer.writerow([event.title, event.description, event.start_time, event.end_time])
            return response

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        now = timezone.now()
        end_date = now + timezone.timedelta(days=30)
        upcoming_events = Event.objects.filter(
            start_time__gte=now,
            start_time__lte=end_date,
            group__isnull=False,
            is_archived=False
        ).order_by('start_time')

        page = self.paginate_queryset(upcoming_events)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(upcoming_events, many=True)
        return Response(serializer.data)


class RecurringScheduleViewSet(viewsets.ModelViewSet):
    queryset = RecurringSchedule.objects.all()
    serializer_class = RecurringScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RecurringSchedule.objects.filter(user=self.request.user)

    def get_permissions(self):
        if self.action in ['update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def generate_events(self, request, pk=None):
        recurring_schedule = self.get_object()
        end_date = request.data.get('end_date', recurring_schedule.end_date)
        events = recurring_schedule.generate_events(end_date=end_date)
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)


class EventCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data.copy()
        data['created_by'] = request.user.id

        serializer = EventSerializer(data=data)
        if serializer.is_valid():
            event = serializer.save()
            return Response(EventSerializer(event).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventShareView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        user_ids = request.data.get('user_ids', [])
        users = CustomUser.objects.filter(id__in=user_ids)
        event.shared_with.add(*users)
        return Response({'status': 'Event shared successfully'}, status=200)


class EventReminderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        if request.user != event.created_by and request.user not in event.shared_with.all():
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        reminder_time = request.data.get('reminder_time')
        if not reminder_time:
            return Response({'error': 'Reminder time is required'}, status=status.HTTP_400_BAD_REQUEST)
        reminder_datetime = timezone.now() + timezone.timedelta(minutes=int(reminder_time))
        send_event_reminder.apply_async((event.id,), eta=reminder_datetime)
        return Response({'message': 'Reminder set successfully'}, status=200)


class BulkEventCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        events_data = request.data.get('events', [])
        created_events = []
        for event_data in events_data:
            event_data['created_by'] = request.user.id
            serializer = EventSerializer(data=event_data)
            if serializer.is_valid():
                event = serializer.save()
                created_events.append(event)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(EventSerializer(created_events, many=True).data, status=status.HTTP_201_CREATED)


class ConflictCheckView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        if not start_time or not end_time:
            return Response({'error': 'Both start_time and end_time are required'}, status=status.HTTP_400_BAD_REQUEST)
        conflicts = Event.objects.filter(
            Q(created_by=request.user) | Q(shared_with=request.user),
            Q(start_time__lt=end_time, end_time__gt=start_time) |
            Q(start_time__lte=start_time, end_time__gte=end_time)
        )
        if conflicts.exists():
            conflicting_events = [
                {
                    'id': event.id,
                    'title': event.title,
                    'start_time': event.start_time,
                    'end_time': event.end_time
                }
                for event in conflicts
            ]
            return Response({'has_conflicts': True, 'conflicting_events': conflicting_events})
        return Response({'has_conflicts': False})
