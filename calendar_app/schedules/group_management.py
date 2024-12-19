import logging
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

from .models import Group, Invitation
from .notification_service import NotificationManager

User = get_user_model()
logger = logging.getLogger(__name__)

class GroupInvitationManager:

    @staticmethod
    def send_invitation(group, user):
        """
        Send a group invitation to a user.
        Raises ValidationError if the invitation cannot be sent.
        """
        if not group or not user:
            logger.error("Group or user not provided when attempting to send an invitation.")
            raise ValidationError("Group and user are required to send an invitation.")

        if user in group.members.all():
            logger.warning(f"User {user.username} is already a member of group {group.name}.")
            raise ValidationError("User is already a member of the group.")

        invitation, created = Invitation.objects.get_or_create(
            sender=group.admin,
            recipient=user,
            group=group,
            invitation_type='group',
            defaults={'status': 'pending'}
        )

        if created:
            # Send a notification for the newly created invitation
            NotificationManager().send_event_notification(invitation)
            logger.info(f"Invitation created and notification sent for user {user.username} to join group {group.name}.")
            return invitation
        else:
            logger.warning(f"An invitation already exists for user {user.username} in group {group.name}.")
            raise ValidationError("An invitation already exists for this user.")

    @staticmethod
    def process_invitation_response(invitation, response):
        """
        Process the user's response to the group invitation (accept or decline).
        Raises ValidationError if the invitation or response is invalid.
        """
        if not invitation:
            logger.error("No invitation provided to process response.")
            raise ValidationError("Invalid invitation.")

        if response not in ['accepted', 'declined']:
            logger.error(f"Invalid response '{response}' provided for invitation {invitation.id}.")
            raise ValidationError("Invalid response. Must be 'accepted' or 'declined'.")

        if invitation.status != 'pending':
            logger.warning(f"Invitation {invitation.id} is no longer pending (current status: {invitation.status}).")
            raise ValidationError("Invitation is no longer pending.")

        invitation.status = response
        invitation.responded_at = timezone.now()
        invitation.save()

        group = invitation.group
        if response == 'accepted':
            group.members.add(invitation.recipient)
            group.save()

            NotificationManager().send_event_notification(
                invitation,
                f"User {invitation.recipient.username} accepted the invitation to join the group '{group.name}'."
            )
            logger.info(f"User {invitation.recipient.username} accepted the group invitation {invitation.id}.")
        else:
            NotificationManager().send_event_notification(
                invitation,
                f"User {invitation.recipient.username} declined the invitation to join the group '{group.name}'."
            )
            logger.info(f"User {invitation.recipient.username} declined the group invitation {invitation.id}.")

        return invitation
