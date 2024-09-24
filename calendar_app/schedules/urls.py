from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EventViewSet, GroupViewSet, UserProfileViewSet, AvailabilityViewSet,
    WorkScheduleViewSet, InvitationViewSet, NotificationViewSet
)

# Create a router and register viewsets with it
router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'availabilities', AvailabilityViewSet)
router.register(r'work-schedules', WorkScheduleViewSet)
router.register(r'invitations', InvitationViewSet)
router.register(r'notifications', NotificationViewSet)

# Include the router-generated URLs
urlpatterns = [
    path('', include(router.urls)),
]
