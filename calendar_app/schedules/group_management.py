from .models import Group, Invitation
from django.utils import timezone
from django.core.exceptions import ValidationError
from .notification_service import NotificationManager
from django.contrib.auth import get_user_model

User = get_user_model()

class GroupInvitationManager:

    @staticmethod
    def send_invitation(group, user):
        """
        Send a group invitation to a user.
        """
        if not group or not user:
            raise ValidationError("Group and user are required to send an invitation.")

        if user in group.members.all():
            raise ValidationError("User is already a member of the group.")

        invitation, created = Invitation.objects.get_or_create(
            sender=group.admin,
            recipient=user,
            group=group,
            invitation_type='group',
            status='pending'
        )

        if created:
            NotificationManager().send_event_notification(invitation)
            return invitation
        else:
            raise ValidationError("An invitation already exists for this user.")

    @staticmethod
    def process_invitation_response(invitation, response):
        """
        Process the user's response to the group invitation (accept or decline).
        """
        if not invitation:
            raise ValidationError("Invalid invitation.")
        
        if response not in ['accepted', 'declined']:
            raise ValidationError("Invalid response. Must be 'accepted' or 'declined'.")

        if invitation.status != 'pending':
            raise ValidationError("Invitation is no longer pending.")

        invitation.status = response
        invitation.responded_at = timezone.now()
        invitation.save()

        if response == 'accepted':
            group = invitation.group
            group.members.add(invitation.recipient)
            group.save()

            NotificationManager().send_event_notification(
                invitation, f"User {invitation.recipient.username} accepted the invitation to join the group."
            )
        else:
            NotificationManager().send_event_notification(
                invitation, f"User {invitation.recipient.username} declined the invitation."
            )

        return invitation
