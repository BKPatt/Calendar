from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.utils import timezone
from django.http import HttpResponse
import csv

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

        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)


class FreeBusyView(APIView):
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
            events = Event.objects.filter(
                Q(created_by_id=user_id) | Q(shared_with__id=user_id),
                start_time__lt=end_date,
                end_time__gt=start_date
            )
            user_events[user_id] = events

        common_free_time = find_common_free_time(user_events, start_date, end_date)
        return Response({'free_time': common_free_time})


class ImportExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        events = Event.objects.filter(created_by=request.user)
        format = request.query_params.get('format', 'json')
        if format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="events.csv"'
            writer = csv.writer(response)
            writer.writerow(['Title', 'Description', 'Start Time', 'End Time', 'Location'])
            for event in events:
                writer.writerow([event.title, event.description, event.start_time, event.end_time, event.location])
            return response
        elif format == 'json':
            serializer = EventSerializer(events, many=True)
            return Response(serializer.data)
        else:
            return Response({'error': 'Unsupported format'}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        format = request.query_params.get('format', 'json')
        events_data = request.data.get('events', [])
        if format == 'json':
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

        if service_type == 'google':
            synced_events = ExternalCalendarSync.sync_google_calendar(request.user, token)
        elif service_type == 'outlook':
            synced_events = ExternalCalendarSync.sync_outlook_calendar(request.user, token)
        else:
            return Response({'error': 'Unsupported calendar service'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(synced_events)


class GoogleCalendarSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        events = ExternalCalendarSync.sync_google_calendar(request.user, token)
        return Response({'synced_events': events}, status=status.HTTP_200_OK)


class OutlookCalendarSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        events = ExternalCalendarSync.sync_outlook_calendar(request.user, token)
        return Response({'synced_events': events}, status=status.HTTP_200_OK)
