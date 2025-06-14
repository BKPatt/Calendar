from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
import zoneinfo

from ..models import Notification, Event, WorkSchedule
from ..serializers import NotificationSerializer
from ..notification_service import NotificationManager
from ..permissions import IsEventOwnerOrShared

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for handling notifications for the user.
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Get notifications specific to the current user.
        """
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Marks a specific notification as read.
        """
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'Notification marked as read'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """
        Marks all unread notifications for the current user as read.
        """
        notifications = Notification.objects.filter(recipient=request.user, is_read=False)
        notifications.update(is_read=True)
        return Response({'status': 'All notifications marked as read'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def send_event_notification(self, request, pk=None):
        """
        Sends a notification related to a specific event.
        """
        event = get_object_or_404(Event, pk=pk)
        # Ensure event times are aware
        if event.start_time and timezone.is_naive(event.start_time):
            tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
            event.start_time = timezone.make_aware(event.start_time, tz)
        if event.end_time and timezone.is_naive(event.end_time):
            tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
            event.end_time = timezone.make_aware(event.end_time, tz)
        NotificationManager.send_event_notification(event)
        return Response({'status': 'Event notification sent'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def send_schedule_change_notification(self, request, pk=None):
        """
        Sends a notification when there is a change in the work schedule.
        """
        schedule = get_object_or_404(WorkSchedule, pk=pk)
        # Ensure no naive times in WorkSchedule if time fields are involved
        # (WorkSchedule uses TimeFields which are not naive datetimes, so no conversion needed)
        # But we can still handle effective_date and end_date as needed if they're used
        # Typically date fields are date-only, not naive datetimes.
        
        NotificationManager.send_schedule_change_notification(schedule)
        return Response({'status': 'Schedule change notification sent'}, status=status.HTTP_200_OK)


class NotificationPreferencesView(APIView):
    """
    API view for handling notification preferences.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Retrieves the current user's notification preferences.
        """
        preferences = NotificationManager.get_user_preferences(request.user)
        return Response(preferences)

    def post(self, request):
        """
        Updates the current user's notification preferences.
        """
        try:
            updated_preferences = NotificationManager.update_preferences(request.user, request.data)
            return Response(updated_preferences)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
