from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework.permissions import IsAuthenticated
from django.utils.functional import Promise
from django.utils import timezone
import zoneinfo

from ..models import UserDeviceToken, UserProfile, CustomUser, Event
from ..serializers import EventSerializer, UserDeviceTokenSerializer, UserProfileSerializer, UserSerializer
from ..user_preferences import UserPreferencesManager
from ..eta_service import ETACalculator

class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling user profile operations.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get the profile of the current logged-in user.
        """
        profile = get_object_or_404(UserProfile, user=request.user)
        serializer = self.get_serializer(profile)
        data = dict(serializer.data)

        # Convert any translation proxy objects to strings
        for field in data:
            if isinstance(data[field], Promise):
                data[field] = str(data[field])

        return Response(data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """
        Update the logged-in user's profile.
        """
        profile = get_object_or_404(UserProfile, user=request.user)
        serializer = self.get_serializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            data = dict(serializer.data)
            # Convert any translation proxy objects to strings
            for field in data:
                if isinstance(data[field], Promise):
                    data[field] = str(data[field])

            return Response({
                'data': data,
                'message': 'User profile updated successfully'
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def preferences(self, request):
        """
        Get the current user's preferences.
        """
        preferences = UserPreferencesManager.get_user_preferences(request.user)
        return Response(preferences, status=status.HTTP_200_OK)


class UserStatsView(APIView):
    """
    API view to retrieve user-specific statistics.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Get user-specific stats like number of events and groups.
        """
        events_count = request.user.event_set.count()
        groups_count = request.user.group_set.count()
        return Response({
            'events_count': events_count,
            'groups_count': groups_count
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request, user_id):
    user = get_object_or_404(CustomUser, id=user_id)
    try:
        user_profile = user.userprofile
    except UserProfile.DoesNotExist:
        return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = UserProfileSerializer(user_profile)
    data = dict(serializer.data)
    for field in data:
        if isinstance(data[field], Promise):
            data[field] = str(data[field])

    return Response({
        'data': data,
        'message': 'User profile fetched successfully'
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_profile(request, user_id):
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.user.id != int(user_id):
        return Response({"error": "You don't have permission to update this profile"}, status=status.HTTP_403_FORBIDDEN)

    profile, created = UserProfile.objects.get_or_create(user=user)
    serializer = UserProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        data = dict(serializer.data)
        for field in data:
            if isinstance(data[field], Promise):
                data[field] = str(data[field])
        return Response(data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        return Response(serializer.data, status=status.HTTP_200_OK)


class ETAUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)

        if request.user not in event.shared_with.all() and request.user != event.created_by:
            return Response({"error": "Not authorized to update ETA for this event"}, status=status.HTTP_403_FORBIDDEN)

        # Ensure event times are aware
        if event.start_time and timezone.is_naive(event.start_time):
            tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
            event.start_time = timezone.make_aware(event.start_time, tz)
        if event.end_time and timezone.is_naive(event.end_time):
            tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
            event.end_time = timezone.make_aware(event.end_time, tz)

        ETACalculator.calculate_and_update_eta(event)
        serializer = EventSerializer(event)
        self.send_real_time_update(event)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def send_real_time_update(self, event):
        """
        Broadcast the updated ETA to all users connected to the event's WebSocket channel.
        """
        if event.eta and timezone.is_naive(event.eta):
            tz = zoneinfo.ZoneInfo(event.event_timezone if event.event_timezone else 'UTC')
            event.eta = timezone.make_aware(event.eta, tz)
            event.save()

        channel_layer = get_channel_layer()
        group_name = f'event_{event.id}'

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'event.eta_update',
                'event_id': event.id,
                'eta': event.eta.isoformat() if event.eta else None,
                'message': f"The ETA for event '{event.title}' has been updated."
            }
        )
