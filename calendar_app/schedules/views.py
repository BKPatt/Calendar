from datetime import timedelta
from django.contrib.auth.models import User
from django.forms import ValidationError
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.http import HttpResponse
import csv
import uuid
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework.permissions import IsAuthenticated, AllowAny

from .eta_service import ETACalculator
from .external_calendar_sync import ExternalCalendarSync
from .group_management import GroupInvitationManager
from .notification_service import NotificationManager
from .user_preferences import UserPreferencesManager
from .permissions import CanEditGroup, CanShareEvent, IsEventOwnerOrShared

from .models import (
    EventCategory, UserProfile, Group, Event, Availability, WorkSchedule,
    Invitation, Notification, Tag, Attachment, UserDeviceToken, RecurringSchedule, EventReminder
)
from .serializers import (
    UserProfileSerializer, GroupSerializer, EventSerializer, AvailabilitySerializer, UserSerializer,
    WorkScheduleSerializer, InvitationSerializer, NotificationSerializer, TagSerializer,
    AttachmentSerializer, UserDeviceTokenSerializer, RecurringScheduleSerializer,
    EventCategorySerializer, EventReminderSerializer, CalendarViewSerializer,
    EventExportSerializer
)
from .tasks import send_event_reminder
from .utils import generate_ical, find_common_free_time
from rest_framework.authtoken.models import Token

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = get_object_or_404(UserProfile, user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """
        Update user preferences based on input data.
        """
        preferences = request.data
        user_profile = UserPreferencesManager.update_preferences(request.user, preferences)
        serializer = self.get_serializer(user_profile)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def preferences(self, request):
        """
        Get current user preferences.
        """
        preferences = UserPreferencesManager.get_user_preferences(request.user)
        return Response(preferences)

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def get_queryset(self):
        return Group.objects.filter(Q(members=self.request.user) | Q(is_public=True))

    def get_permissions(self):
        if self.action in ['update', 'destroy']:
            return [CanEditGroup()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        group = self.get_object()
        if group.is_public:
            group.members.add(request.user)
            return Response({'status': 'Joined group'})
        return Response({'status': 'Group is not public'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        group = self.get_object()
        group.members.remove(request.user)
        return Response({'status': 'Left group'})

    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        user = get_object_or_404(User, pk=user_id)
        GroupInvitationManager.send_invitation(group, user)
        return Response({'status': 'Invitation sent'})

    @action(detail=True, methods=['post'])
    def respond_invitation(self, request, pk=None):
        invitation_id = request.data.get('invitation_id')
        response = request.data.get('response')
        invitation = get_object_or_404(Invitation, pk=invitation_id)
        GroupInvitationManager.process_invitation_response(invitation, response)
        return Response({'status': 'Invitation response processed'})

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, IsEventOwnerOrShared, CanShareEvent]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['start_time', 'end_time', 'created_at']

    def get_permissions(self):
        if self.action == 'upcoming':
            return [AllowAny()]
        elif self.action in ['update', 'destroy']:
            return [IsEventOwnerOrShared()]
        return super().get_permissions()

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
        users = User.objects.filter(id__in=user_ids)
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
        end_date = now + timedelta(days=30)
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
            return [IsEventOwnerOrShared()]
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def generate_events(self, request, pk=None):
        recurring_schedule = self.get_object()
        end_date = request.data.get('end_date', recurring_schedule.end_date)
        events = recurring_schedule.generate_events(end_date=end_date)
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)

class EventCategoryViewSet(viewsets.ModelViewSet):
    queryset = EventCategory.objects.all()
    serializer_class = EventCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EventCategory.objects.filter(user=self.request.user)

class EventReminderViewSet(viewsets.ModelViewSet):
    queryset = EventReminder.objects.all()
    serializer_class = EventReminderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EventReminder.objects.filter(event__created_by=self.request.user)

class AvailabilityViewSet(viewsets.ModelViewSet):
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Availability.objects.filter(user=self.request.user)

class WorkScheduleViewSet(viewsets.ModelViewSet):
    queryset = WorkSchedule.objects.all()
    serializer_class = WorkScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkSchedule.objects.filter(user=self.request.user)

class WorkScheduleView(viewsets.ModelViewSet):
    queryset = WorkSchedule.objects.all()
    serializer_class = WorkScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkSchedule.objects.filter(user=self.request.user)

    def handle_schedule_exception(self, date):
        """
        Handle exceptions in the work schedule for a given date.
        """
        work_schedule = self.get_object()
        try:
            work_schedule.handle_exception(date)
            return Response({"status": "Schedule exception handled"}, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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

class PasswordResetView(APIView):
    def post(self, request):
        email = request.data.get('email')
        user = User.objects.get(email=email)
        reset_token = uuid.uuid4()
        user.profile.reset_token = reset_token
        user.profile.save()
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
        send_mail(
            'Password Reset',
            f'Click this link to reset your password: {reset_link}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        return Response({'message': 'Password reset email sent'})

class AuthView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class InvitationViewSet(viewsets.ModelViewSet):
    queryset = Invitation.objects.all()
    serializer_class = InvitationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Invitation.objects.filter(Q(sender=self.request.user) | Q(recipient=self.request.user))

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        invitation = self.get_object()
        if invitation.recipient != request.user:
            return Response({'status': 'not authorized'}, status=status.HTTP_403_FORBIDDEN)
        invitation.status = 'accepted'
        invitation.responded_at = timezone.now()
        invitation.save()
        if invitation.group:
            invitation.group.members.add(request.user)
        elif invitation.event:
            invitation.event.shared_with.add(request.user)
        return Response({'status': 'invitation accepted'})

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        invitation = self.get_object()
        if invitation.recipient != request.user:
            return Response({'status': 'not authorized'}, status=status.HTTP_403_FORBIDDEN)
        invitation.status = 'declined'
        invitation.responded_at = timezone.now()
        invitation.save()
        return Response({'status': 'invitation declined'})

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'Notification marked as read'})

    @action(detail=True, methods=['post'])
    def send_event_notification(self, request, pk=None):
        event = get_object_or_404(Event, pk=pk)
        NotificationManager.send_event_notification(event)
        return Response({'status': 'Event notification sent'})

    @action(detail=True, methods=['post'])
    def send_schedule_change_notification(self, request, pk=None):
        schedule = get_object_or_404(WorkSchedule, pk=pk)
        NotificationManager.send_schedule_change_notification(schedule)
        return Response({'status': 'Schedule change notification sent'})
    
class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Attachment.objects.filter(
            Q(uploaded_by=self.request.user) |
            Q(events__created_by=self.request.user) |
            Q(events__shared_with=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

class UserDeviceTokenViewSet(viewsets.ModelViewSet):
    queryset = UserDeviceToken.objects.all()
    serializer_class = UserDeviceTokenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserDeviceToken.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def register_device(self, request):
        token = request.data.get('token')
        device_type = request.data.get('device_type')
        if not token or not device_type:
            return Response({'error': 'Token and device type are required'}, status=status.HTTP_400_BAD_REQUEST)
        device, created = UserDeviceToken.objects.update_or_create(
            user=request.user,
            device_type=device_type,
            defaults={'token': token, 'is_active': True}
        )
        serializer = self.get_serializer(device)
        return Response(serializer.data)

class GroupMembershipView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id):
        group = Group.objects.get(id=group_id)
        action = request.data.get('action')
        user_id = request.data.get('user_id')
        if action not in ['add', 'remove']:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        if group.admin != request.user:
            return Response({"error": "Not authorized to modify group membership"}, status=status.HTTP_403_FORBIDDEN)
        user = User.objects.get(id=user_id)
        if action == 'add':
            group.members.add(user)
        elif action == 'remove':
            group.members.remove(user)
        group.save()
        serializer = GroupSerializer(group)
        return Response(serializer.data)

class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        upcoming_events = Event.objects.filter(
            Q(created_by=request.user) | Q(shared_with=request.user),
            start_time__gte=now
        ).order_by('start_time')[:5]
        recent_groups = Group.objects.filter(members=request.user).order_by('-created_at')[:5]
        return Response({
            "upcoming_events": EventSerializer(upcoming_events, many=True).data,
            "recent_groups": GroupSerializer(recent_groups, many=True).data,
            "event_count": Event.objects.filter(created_by=request.user).count(),
            "group_count": Group.objects.filter(members=request.user).count(),
        })

class SettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        profile = UserProfile.objects.get(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({"error": "Search query is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        events = Event.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query),
            Q(created_by=request.user) | Q(shared_with=request.user)
        )
        groups = Group.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query),
            members=request.user
        )
        users = User.objects.filter(
            Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)
        )
        
        return Response({
            "events": EventSerializer(events, many=True).data,
            "groups": GroupSerializer(groups, many=True).data,
            "users": UserSerializer(users, many=True).data
        })

class EventReminderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, event_id):
        event = Event.objects.get(id=event_id)
        if request.user != event.created_by and request.user not in event.shared_with.all():
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        reminder_time = request.data.get('reminder_time')
        if not reminder_time:
            return Response({'error': 'Reminder time is required'}, status=status.HTTP_400_BAD_REQUEST)
        reminder_datetime = timezone.now() + timezone.timedelta(minutes=int(reminder_time))
        send_event_reminder.apply_async((event.id,), eta=reminder_datetime)
        return Response({'message': 'Reminder set successfully'})

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
            return Response({
                'has_conflicts': True,
                'conflicting_events': [
                    {'id': event.id, 'title': event.title, 'start_time': event.start_time, 'end_time': event.end_time}
                    for event in conflicts
                ]
            })
        return Response({'has_conflicts': False})

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
    
class GroupAvailabilityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, group_id):
        group = Group.objects.get(id=group_id)
        if request.user not in group.members.all():
            return Response({"error": "Not a member of this group"}, status=status.HTTP_403_FORBIDDEN)
        
        start_date = request.query_params.get('start_date', timezone.now().date())
        end_date = request.query_params.get('end_date', start_date + timezone.timedelta(days=30))

        availabilities = Availability.objects.filter(
            user__in=group.members.all(),
            start_time__gte=start_date,
            end_time__lte=end_date
        )
        
        detailed_availability = [
            {
                'user': availability.user.username,
                'start_time': availability.start_time,
                'end_time': availability.end_time,
                'is_available': availability.is_available,
                'note': availability.note
            }
            for availability in availabilities
        ]

        return Response({'availability': detailed_availability})

class GroupScheduleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, group_id):
        group = Group.objects.get(id=group_id)
        if request.user not in group.members.all():
            return Response({"error": "Not a member of this group"}, status=status.HTTP_403_FORBIDDEN)

        start_date = request.query_params.get('start_date', timezone.now().date())
        end_date = request.query_params.get('end_date', start_date + timezone.timedelta(days=30))

        events = Event.objects.filter(
            group=group,
            start_time__date__gte=start_date,
            end_time__date__lte=end_date
        ).order_by('start_time')

        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)

    def find_common_availability(self, group, start_date, end_date):
        """
        Utility to find common availability for the group within the specified range.
        """
        availabilities = Availability.objects.filter(
            user__in=group.members.all(),
            start_time__gte=start_date,
            end_time__lte=end_date
        )
        common_free_time = find_common_free_time(
            {member: availabilities.filter(user=member) for member in group.members.all()},
            start_date, end_date
        )
        return common_free_time

class UserAvailabilityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get('start_date', timezone.now().date())
        end_date = request.query_params.get('end_date', start_date + timezone.timedelta(days=7))

        events = Event.objects.filter(
            Q(created_by=request.user) | Q(shared_with=request.user),
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

class ETAUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        event = Event.objects.get(id=event_id)

        if request.user not in event.shared_with.all() and request.user != event.created_by:
            return Response({"error": "Not authorized to update ETA for this event"}, status=403)

        ETACalculator.calculate_and_update_eta(event)
        serializer = EventSerializer(event)
        self.send_real_time_update(event)

        return Response(serializer.data, status=200)

    def send_real_time_update(self, event):
        """
        Broadcast the updated ETA to all users connected to the event's WebSocket channel.
        """
        channel_layer = get_channel_layer()
        group_name = f'event_{event.id}'

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'event.eta_update',
                'event_id': event.id,
                'eta': event.eta.isoformat(),
                'message': f"The ETA for event '{event.title}' has been updated."
            }
        )
        
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
        
        recurring_conflicts = RecurringSchedule.objects.filter(
            user=request.user,
            start_date__lte=end_time,
            end_date__gte=start_time
        )

        if conflicts.exists() or recurring_conflicts.exists():
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

class EventShareView(APIView):
    """
    API endpoint to share an event with a list of users.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        user_ids = request.data.get('user_ids', [])
        users = User.objects.filter(id__in=user_ids)
        event.shared_with.add(*users)
        return Response({'status': 'Event shared successfully'}, status=200)


class GroupInvitationView(APIView):
    """
    API endpoint to send a group invitation.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id, user_id):
        group = get_object_or_404(Group, id=group_id)
        user = get_object_or_404(User, id=user_id)
        GroupInvitationManager.send_invitation(group, user)
        return Response({'status': 'Invitation sent successfully'}, status=200)


class GroupInvitationResponseView(APIView):
    """
    API endpoint to handle group invitation responses.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, invitation_id):
        invitation = get_object_or_404(Invitation, id=invitation_id)
        response = request.data.get('response')
        GroupInvitationManager.process_invitation_response(invitation, response)
        return Response({'status': 'Invitation response processed'}, status=200)


class NotificationPreferencesView(APIView):
    """
    API endpoint to update and get notification preferences for a user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        preferences = UserPreferencesManager.get_user_preferences(request.user)
        return Response(preferences)

    def post(self, request):
        updated_preferences = UserPreferencesManager.update_preferences(request.user, request.data)
        return Response(updated_preferences)


class EmailVerificationView(APIView):
    """
    API endpoint for verifying email using a token.
    """
    def get(self, request, verification_token):
        try:
            profile = UserProfile.objects.get(verification_token=verification_token)
            profile.email_verified = True
            profile.verification_token = None
            profile.save()
            return Response({'status': 'Email verified successfully'}, status=200)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Invalid token'}, status=400)


class UserStatsView(APIView):
    """
    API endpoint to retrieve user-specific statistics.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        events_count = Event.objects.filter(created_by=request.user).count()
        groups_count = Group.objects.filter(members=request.user).count()
        return Response({'events_count': events_count, 'groups_count': groups_count})


class GroupStatsView(APIView):
    """
    API endpoint to retrieve statistics for a group.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        members_count = group.members.count()
        events_count = Event.objects.filter(group=group).count()
        return Response({'members_count': members_count, 'events_count': events_count})


class GoogleCalendarSyncView(APIView):
    """
    API endpoint to sync user's Google Calendar.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        events = ExternalCalendarSync.sync_google_calendar(request.user, token)
        return Response({'synced_events': events}, status=200)


class OutlookCalendarSyncView(APIView):
    """
    API endpoint to sync user's Outlook Calendar.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        events = ExternalCalendarSync.sync_outlook_calendar(request.user, token)
        return Response({'synced_events': events}, status=200)
    
class RegisterView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            UserProfile.objects.create(user=user)
            token, _ = Token.objects.get_or_create(user=user)
            response_data = {
                'data': {
                    'user': UserSerializer(user).data,
                    'token': token.key
                }
            }
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    permission_classes = []

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            response_data = {
                'data': {
                    'user': UserSerializer(user).data,
                    'token': token.key
                }
            }
            return Response(response_data)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
