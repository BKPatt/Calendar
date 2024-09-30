from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'user-profiles', views.UserProfileViewSet)
router.register(r'groups', views.GroupViewSet)
router.register(r'events', views.EventViewSet)
router.register(r'availabilities', views.AvailabilityViewSet)
router.register(r'work-schedules', views.WorkScheduleViewSet)
router.register(r'invitations', views.InvitationViewSet)
router.register(r'notifications', views.NotificationViewSet)
router.register(r'tags', views.TagViewSet)
router.register(r'attachments', views.AttachmentViewSet)
router.register(r'user-device-tokens', views.UserDeviceTokenViewSet)
router.register(r'recurring-schedules', views.RecurringScheduleViewSet)

urlpatterns = [
    path('', include(router.urls)),

    # Views for handling schedules and groups
    path('group-schedule/<int:group_id>/', views.GroupScheduleView.as_view(), name='group-schedule'),
    path('user-availability/', views.UserAvailabilityView.as_view(), name='user-availability'),

    # Event and ETA related paths
    path('event-share/<int:event_id>/', views.EventShareView.as_view(), name='event-share'),
    path('eta-update/<int:event_id>/', views.ETAUpdateView.as_view(), name='eta-update'),

    # Group-related paths (including invitations and management)
    path('group-membership/<int:group_id>/', views.GroupMembershipView.as_view(), name='group-membership'),
    path('group-invitation/<int:group_id>/<int:user_id>/', views.GroupInvitationView.as_view(), name='group-invitation'),
    path('group-invitation-response/<int:invitation_id>/', views.GroupInvitationResponseView.as_view(), name='group-invitation-response'),

    # Calendar Sync and search-related paths
    path('calendar-sync/', views.CalendarSyncView.as_view(), name='calendar-sync'),
    path('search/', views.SearchView.as_view(), name='search'),

    # Dashboard and settings
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('settings/', views.SettingsView.as_view(), name='settings'),
    path('notification-preferences/', views.NotificationPreferencesView.as_view(), name='notification-preferences'),

    # Authentication and user account management
    path('auth/', views.AuthView.as_view(), name='auth'),
    path('password-reset/', views.PasswordResetView.as_view(), name='password-reset'),
    path('email-verification/<str:verification_token>/', views.EmailVerificationView.as_view(), name='email-verification'),

    # Statistics and reminders
    path('user-stats/', views.UserStatsView.as_view(), name='user-stats'),
    path('group-stats/<int:group_id>/', views.GroupStatsView.as_view(), name='group-stats'),
    path('event-reminder/<int:event_id>/', views.EventReminderView.as_view(), name='event-reminder'),

    # Schedule and conflict checking
    path('conflict-check/', views.ConflictCheckView.as_view(), name='conflict-check'),
    path('bulk-event-create/', views.BulkEventCreateView.as_view(), name='bulk-event-create'),
    path('import-export/', views.ImportExportView.as_view(), name='import-export'),

    # Group availability and scheduling
    path('group-availability/<int:group_id>/', views.GroupAvailabilityView.as_view(), name='group-availability'),

    # Calendar sync paths
    path('sync-google-calendar/', views.GoogleCalendarSyncView.as_view(), name='sync-google-calendar'),
    path('sync-outlook-calendar/', views.OutlookCalendarSyncView.as_view(), name='sync-outlook-calendar'),
    
    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/verify-token/', views.verify_token, name='verify_token'),
    path('auth/user/', views.current_user, name='current_user'),
    
    # Protected paths that require authentication
    path('events/create/', views.EventCreateView.as_view(), name='event-create'),
    path('groups/', views.GroupListView.as_view(), name='group-list'),
    
    path('users/<int:user_id>/', views.get_user_profile, name='user_profile'),
]
