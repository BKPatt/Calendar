from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q

from ..models import Invitation, Group, CustomUser
from ..serializers import InvitationSerializer
from ..group_management import GroupInvitationManager


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
            return Response({'status': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        invitation.status = 'accepted'
        invitation.responded_at = timezone.now()
        invitation.save()

        if invitation.group:
            invitation.group.members.add(request.user)
        elif invitation.event:
            invitation.event.shared_with.add(request.user)

        return Response({'status': 'Invitation accepted'})

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        invitation = self.get_object()
        if invitation.recipient != request.user:
            return Response({'status': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        invitation.status = 'declined'
        invitation.responded_at = timezone.now()
        invitation.save()
        return Response({'status': 'Invitation declined'})


class GroupInvitationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id, user_id):
        group = get_object_or_404(Group, id=group_id)
        user = get_object_or_404(CustomUser, id=user_id)
        GroupInvitationManager.send_invitation(group, user)
        return Response({'status': 'Invitation sent successfully'}, status=status.HTTP_200_OK)


class GroupInvitationResponseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, invitation_id):
        invitation = get_object_or_404(Invitation, id=invitation_id)
        response = request.data.get('response')
        GroupInvitationManager.process_invitation_response(invitation, response)
        return Response({'status': 'Invitation response processed'}, status=status.HTTP_200_OK)
