from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from datetime import datetime
import zoneinfo

from ..models import Invitation, Group, CustomUser, Event
from ..serializers import InvitationSerializer

class InvitationViewSet(viewsets.ModelViewSet):
    queryset = Invitation.objects.all()
    serializer_class = InvitationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Invitation.objects.filter(Q(sender=self.request.user) | Q(recipient=self.request.user))

    def create(self, request, *args, **kwargs):
        invitation_type = request.data.get('invitation_type')
        recipient_id = request.data.get('recipient')
        group_id = request.data.get('group')
        event_id = request.data.get('event')

        if not recipient_id:
            return Response({'error': 'recipient is required'}, status=status.HTTP_400_BAD_REQUEST)

        recipient = get_object_or_404(CustomUser, id=recipient_id)

        if invitation_type == 'group':
            if not group_id:
                return Response({'error': 'group is required for group invitation'}, status=status.HTTP_400_BAD_REQUEST)
            group = get_object_or_404(Group, id=group_id)
            if request.user != group.admin:
                return Response({'error': 'Not authorized to invite to this group'}, status=status.HTTP_403_FORBIDDEN)
            invitation = Invitation.objects.create(
                sender=request.user,
                recipient=recipient,
                group=group,
                invitation_type='group'
            )
        elif invitation_type == 'event':
            if not event_id:
                return Response({'error': 'event is required for event invitation'}, status=status.HTTP_400_BAD_REQUEST)
            event = get_object_or_404(Event, id=event_id)
            if request.user != event.created_by:
                return Response({'error': 'Not authorized to invite to this event'}, status=status.HTTP_403_FORBIDDEN)
            invitation = Invitation.objects.create(
                sender=request.user,
                recipient=recipient,
                event=event,
                invitation_type='event'
            )
        else:
            return Response({'error': 'Invalid invitation type'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(invitation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        invitation = self.get_object()
        if invitation.recipient != request.user:
            return Response({'status': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        if invitation.status != 'pending':
            return Response({'status': 'Invitation already processed'}, status=status.HTTP_400_BAD_REQUEST)

        invitation.status = 'accepted'
        invitation.responded_at = timezone.now()
        invitation.save()

        if invitation.invitation_type == 'group' and invitation.group:
            invitation.group.members.add(request.user)
        elif invitation.invitation_type == 'event' and invitation.event:
            invitation.event.shared_with.add(request.user)

        return Response({'status': 'Invitation accepted'})

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        invitation = self.get_object()
        if invitation.recipient != request.user:
            return Response({'status': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        if invitation.status != 'pending':
            return Response({'status': 'Invitation already processed'}, status=status.HTTP_400_BAD_REQUEST)

        invitation.status = 'declined'
        invitation.responded_at = timezone.now()
        invitation.save()
        return Response({'status': 'Invitation declined'})


class GroupInvitationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id, user_id):
        group = get_object_or_404(Group, id=group_id)
        user = get_object_or_404(CustomUser, id=user_id)

        if request.user != group.admin:
            return Response({'status': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        invitation, created = Invitation.objects.get_or_create(
            sender=request.user,
            recipient=user,
            group=group,
            invitation_type='group',
            defaults={'status': 'pending'}
        )

        if not created:
            return Response({'status': 'Invitation already exists'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'status': 'Invitation sent successfully'}, status=status.HTTP_201_CREATED)


class EventInvitationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, event_id, user_id):
        event = get_object_or_404(Event, id=event_id)
        user = get_object_or_404(CustomUser, id=user_id)

        if request.user != event.created_by:
            return Response({'status': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        invitation, created = Invitation.objects.get_or_create(
            sender=request.user,
            recipient=user,
            event=event,
            invitation_type='event',
            defaults={'status': 'pending'}
        )

        if not created:
            return Response({'status': 'Invitation already exists'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'status': 'Invitation sent successfully'}, status=status.HTTP_201_CREATED)
