from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q
import zoneinfo

from ..models import Tag, Event, Group, UserProfile
from ..serializers import TagSerializer, EventSerializer, GroupSerializer, UserProfileSerializer


class TagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling tag-related operations.
    Tags are associated with a user and can be used to categorize events.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        # Filter to only show tags created by the requesting user
        return Tag.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        # Associate the tag with the requesting user
        serializer.save(created_by=self.request.user)


class DashboardView(APIView):
    """
    API view for the user dashboard.
    Provides a summary of upcoming events, recent groups, 
    as well as counts of events and groups for the requesting user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        # Get upcoming events (either created by or shared with the user)
        upcoming_events = Event.objects.filter(
            Q(created_by=request.user) | Q(shared_with=request.user),
            start_time__gte=now
        ).order_by('start_time')[:5]

        # Ensure event times are aware
        for event in upcoming_events:
            if event.start_time and timezone.is_naive(event.start_time):
                tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                event.start_time = timezone.make_aware(event.start_time, tz)
            if event.end_time and timezone.is_naive(event.end_time):
                tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
                event.end_time = timezone.make_aware(event.end_time, tz)

        # Get recent groups the user is a member of
        recent_groups = Group.objects.filter(members=request.user).order_by('-created_at')[:5]

        return Response({
            "upcoming_events": EventSerializer(upcoming_events, many=True).data,
            "recent_groups": GroupSerializer(recent_groups, many=True).data,
            "event_count": Event.objects.filter(created_by=request.user).count(),
            "group_count": Group.objects.filter(members=request.user).count(),
        }, status=status.HTTP_200_OK)


class SettingsView(APIView):
    """
    API view for user settings.
    Allows retrieval and updating of user profile settings.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        profile = UserProfile.objects.get(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
