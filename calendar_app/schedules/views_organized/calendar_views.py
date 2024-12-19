from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.utils import timezone
from django.http import HttpResponse
import csv
from datetime import datetime
from django.core.exceptions import ValidationError
import zoneinfo

from ..models import Event
from ..serializers import CalendarViewSerializer, EventSerializer, EventExportSerializer
from ..utils import find_common_free_time, generate_ical
from ..external_calendar_sync import ExternalCalendarSync


class CalendarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CalendarViewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        view_type = serializer.validated_data['view_type']

        events = Event.objects.filter(
            Q(created_by=request.user) | Q(shared_with=request.user),
            start_time__date__gte=start_date,
            end_time__date__lte=end_date
        )

        if view_type == 'DAY':
            events = events.filter(start_time__date=start_date)
        elif view_type == 'WEEK':
            week_start = start_date - timezone.timedelta(days=start_date.weekday())
            week_end = week_start + timezone.timedelta(days=6)
            events = events.filter(start_time__date__range=[week_start, week_end])

        # Add awareness to the event datetimes if not already
        # This ensures that if events are naive, they are converted to the user's timezone or UTC as fallback
        for event in events:
            if timezone.is_naive(event.start_time):
                tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                event.start_time = timezone.make_aware(event.start_time, tz)
            if timezone.is_naive(event.end_time):
                tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                event.end_time = timezone.make_aware(event.end_time, tz)

        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FreeBusyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')
        user_ids = request.data.get('user_ids', [])

        if not start_date_str or not end_date_str:
            return Response({'error': 'start_date and end_date are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            start_date = datetime.fromisoformat(start_date_str)
            start_date = timezone.make_aware(start_date) if timezone.is_naive(start_date) else start_date
            end_date = datetime.fromisoformat(end_date_str)
            end_date = timezone.make_aware(end_date) if timezone.is_naive(end_date) else end_date
        except ValueError:
            return Response({'error': 'Invalid date format, must be ISO 8601.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user_ids:
            return Response({'error': 'At least one user_id must be provided'}, status=status.HTTP_400_BAD_REQUEST)

        user_events = {}
        for user_id in user_ids:
            events = Event.objects.filter(
                Q(created_by_id=user_id) | Q(shared_with__id=user_id),
                start_time__lt=end_date,
                end_time__gt=start_date
            )
            user_events[user_id] = events

        common_free_time = find_common_free_time(user_events, start_date, end_date)
        return Response({'free_time': common_free_time}, status=status.HTTP_200_OK)


class ImportExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        events = Event.objects.filter(created_by=request.user)
        export_format = request.query_params.get('format', 'json')

        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="events.csv"'
            writer = csv.writer(response)
            writer.writerow(['Title', 'Description', 'Start Time', 'End Time', 'Location'])
            for event in events:
                writer.writerow([event.title, event.description, event.start_time, event.end_time, event.location])
            return response
        elif export_format == 'ical':
            ical_content = generate_ical(events)
            response = HttpResponse(ical_content, content_type='text/calendar')
            response['Content-Disposition'] = 'attachment; filename="events.ics"'
            return response
        elif export_format == 'json':
            serializer = EventSerializer(events, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Unsupported format'}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        import_format = request.query_params.get('format', 'json')
        events_data = request.data.get('events', [])

        if import_format == 'json':
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
        else:
            return Response({'error': 'Unsupported format'}, status=status.HTTP_400_BAD_REQUEST)


class CalendarSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        service_type = request.data.get('service_type')
        token = request.data.get('token')

        if not service_type:
            return Response({'error': 'service_type is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not token:
            return Response({'error': 'token is required'}, status=status.HTTP_400_BAD_REQUEST)

        if service_type == 'google':
            try:
                synced_events = ExternalCalendarSync.sync_google_calendar(request.user, token)
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        elif service_type == 'outlook':
            try:
                synced_events = ExternalCalendarSync.sync_outlook_calendar(request.user, token)
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'Unsupported calendar service'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(synced_events, status=status.HTTP_200_OK)


class GoogleCalendarSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'token is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            events = ExternalCalendarSync.sync_google_calendar(request.user, token)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'synced_events': events}, status=status.HTTP_200_OK)


class OutlookCalendarSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'token is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            events = ExternalCalendarSync.sync_outlook_calendar(request.user, token)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'synced_events': events}, status=status.HTTP_200_OK)
