from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q

from ..models import Tag, Event, Group, UserProfile
from ..serializers import TagSerializer, EventSerializer, GroupSerializer, UserProfileSerializer


class TagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling tag-related operations.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        return Tag.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DashboardView(APIView):
    """
    API view for the user dashboard.
    Provides a summary of upcoming events, recent groups, and event/group counts.
    """
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
    """
    API view for user settings.
    Allows retrieval and update of user profile settings.
    """
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
