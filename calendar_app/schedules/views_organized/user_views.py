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
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """
        Update the logged-in user's profile.
        """
        profile = get_object_or_404(UserProfile, user=request.user)
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()

            # Convert any translation proxy objects to strings
            for field in serializer.data:
                if isinstance(serializer.data[field], Promise):
                    serializer.data[field] = str(serializer.data[field])
                    
            return Response({
                'data': serializer.data,
                'message': 'User profile updated successfully'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def preferences(self, request):
        """
        Get the current user's preferences.
        """
        preferences = UserPreferencesManager.get_user_preferences(request.user)
        return Response(preferences)


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
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request, user_id):
    user = get_object_or_404(CustomUser, id=user_id)
    
    try:
        user_profile = user.userprofile
    except UserProfile.DoesNotExist:
        return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = UserProfileSerializer(user_profile)
    
    for field in serializer.data:
        if isinstance(serializer.data[field], Promise):
            serializer.data[field] = str(serializer.data[field])

    return Response({
        'data': serializer.data,
        'message': 'User profile fetched successfully'
    })
    
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
        return Response(serializer.data)
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
        return Response(serializer.data)

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