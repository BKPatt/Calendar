from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views_organized.user_views import UserProfileViewSet, UserStatsView, UserDeviceTokenViewSet, ETAUpdateView
from .views_organized.group_views import GroupViewSet, GroupStatsView, GroupMembershipView, GroupInvitationView, GroupInvitationResponseView, GroupListView, GroupAvailabilityView, GroupScheduleView
from .views_organized.event_views import EventViewSet, EventShareView, EventCreateView, EventReminderView, BulkEventCreateView, ConflictCheckView
from .views_organized.schedule_views import WorkScheduleViewSet, RecurringScheduleViewSet, AvailabilityViewSet, UserAvailabilityView
from .views_organized.notification_views import NotificationViewSet, NotificationPreferencesView
from .views_organized.search_views import SearchView
from .views_organized.auth_views import AuthView, PasswordResetView, EmailVerificationView, RegisterView, LoginView, LogoutView, current_user, verify_token, CustomTokenRefreshView
from .views_organized.calendar_views import CalendarSyncView, GoogleCalendarSyncView, OutlookCalendarSyncView, ImportExportView
from .views_organized.invitation_views import InvitationViewSet
from .views_organized.attachent_views import AttachmentViewSet
from .views_organized.user_settings import TagViewSet, DashboardView, SettingsView
from .views_organized.user_views import get_user_profile

router = DefaultRouter()
router.register(r'user-profiles', UserProfileViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'events', EventViewSet)
router.register(r'availabilities', AvailabilityViewSet)
router.register(r'work-schedules', WorkScheduleViewSet)
router.register(r'invitations', InvitationViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'tags', TagViewSet)
router.register(r'attachments', AttachmentViewSet)
router.register(r'user-device-tokens', UserDeviceTokenViewSet)
router.register(r'recurring-schedules', RecurringScheduleViewSet)

urlpatterns = [
    path('', include(router.urls)),

    # Views for handling schedules and groups
    path('group-schedule/<int:group_id>/', GroupScheduleView.as_view(), name='group-schedule'),
    path('user-availability/', UserAvailabilityView.as_view(), name='user-availability'),

    # Event and ETA related paths
    path('event-share/<int:event_id>/', EventShareView.as_view(), name='event-share'),
    path('eta-update/<int:event_id>/', ETAUpdateView.as_view(), name='eta-update'),

    # Group-related paths (including invitations and management)
    path('group-membership/<int:group_id>/', GroupMembershipView.as_view(), name='group-membership'),
    path('group-invitation/<int:group_id>/<int:user_id>/', GroupInvitationView.as_view(), name='group-invitation'),
    path('group-invitation-response/<int:invitation_id>/', GroupInvitationResponseView.as_view(), name='group-invitation-response'),

    # Calendar Sync and search-related paths
    path('calendar-sync/', CalendarSyncView.as_view(), name='calendar-sync'),
    path('search/', SearchView.as_view(), name='search'),

    # Dashboard and settings
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('settings/', SettingsView.as_view(), name='settings'),
    path('notification-preferences/', NotificationPreferencesView.as_view(), name='notification-preferences'),

    # Authentication and user account management
    path('auth/', AuthView.as_view(), name='auth'),
    path('password-reset/', PasswordResetView.as_view(), name='password-reset'),
    path('email-verification/<str:verification_token>/', EmailVerificationView.as_view(), name='email-verification'),

    # Statistics and reminders
    path('user-stats/', UserStatsView.as_view(), name='user-stats'),
    path('group-stats/<int:group_id>/', GroupStatsView.as_view(), name='group-stats'),
    path('event-reminder/<int:event_id>/', EventReminderView.as_view(), name='event-reminder'),

    # Schedule and conflict checking
    path('conflict-check/', ConflictCheckView.as_view(), name='conflict-check'),
    path('bulk-event-create/', BulkEventCreateView.as_view(), name='bulk-event-create'),
    path('import-export/', ImportExportView.as_view(), name='import-export'),

    # Group availability and scheduling
    path('group-availability/<int:group_id>/', GroupAvailabilityView.as_view(), name='group-availability'),

    # Calendar sync paths
    path('sync-google-calendar/', GoogleCalendarSyncView.as_view(), name='sync-google-calendar'),
    path('sync-outlook-calendar/', OutlookCalendarSyncView.as_view(), name='sync-outlook-calendar'),
    
    # Auth paths
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/verify-token/', verify_token, name='verify_token'),
    path('auth/user/', current_user, name='current_user'),
    path('auth/token/refresh/', CustomTokenRefreshView.as_view(), name='token'),
    
    # Protected paths that require authentication
    path('events/create/', EventCreateView.as_view(), name='event-create'),
    path('groups/', GroupListView.as_view(), name='group-list'),
    
    path('users/<int:user_id>/', get_user_profile, name='user_profile'),
]
