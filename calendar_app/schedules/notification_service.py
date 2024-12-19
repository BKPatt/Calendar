import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import zoneinfo
from django.core.exceptions import ObjectDoesNotExist

from .models import UserDeviceToken, Notification
from .utils import send_push_notification

logger = logging.getLogger(__name__)

class NotificationManager:
    def __init__(self, event=None, schedule=None):
        self.event = event
        self.schedule = schedule

    def send_event_notification(self, custom_message=None):
        """
        Send a notification to all users associated with the event via email, in-app, and push notification.
        Optionally accepts a custom_message to override the default event reminder message.
        """
        if not self.event:
            logger.error("Event is required to send event notifications.")
            raise ValueError("Event is required to send notifications")

        users = self.event.shared_with.all()
        if not users:
            logger.info(f"No users to notify for event {self.event.id}")
            return

        # Ensure event times are aware
        if self.event.start_time and timezone.is_naive(self.event.start_time):
            tz = zoneinfo.ZoneInfo(self.event.event_timezone if self.event.event_timezone else 'UTC')
            self.event.start_time = timezone.make_aware(self.event.start_time, tz)

        message = custom_message or f"Reminder: Event '{self.event.title}' is starting at {self.event.start_time}."

        for user in users:
            Notification.objects.create(
                recipient=user,
                notification_type='reminder',
                message=message
            )

            # Safely attempt to access userprofile to avoid errors
            try:
                profile = user.userprofile
            except ObjectDoesNotExist:
                logger.warning(f"UserProfile does not exist for user {user.username}")
                continue

            if profile.email_notifications and user.email:
                try:
                    send_mail(
                        subject=f"Event Reminder: {self.event.title}",
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=False,
                    )
                    logger.info(f"Email notification sent to {user.email} for event {self.event.id}")
                except Exception as e:
                    logger.error(f"Failed to send email to {user.email}: {e}")

            if profile.push_notifications:
                device_tokens = UserDeviceToken.objects.filter(user=user, is_active=True)
                for token in device_tokens:
                    try:
                        send_push_notification(token.token, "Event Reminder", message)
                        logger.info(f"Push notification sent to {user.username}'s device {token.token}")
                    except Exception as e:
                        logger.error(f"Failed to send push notification to {user.username}: {e}")

    def send_schedule_change_notification(self):
        """
        Send a notification to all users associated with a recurring schedule when it is changed.
        """
        if not self.schedule:
            logger.error("Schedule is required to send schedule change notifications.")
            raise ValueError("Schedule is required to send schedule change notifications")

        # Attempting to find all users associated with the schedule's events
        # It's not always clear how users are associated with a recurring schedule.
        # Here, we assume users are associated via events created from that schedule.
        events = self.schedule.events.all()
        user_ids = set()

        for event in events:
            # Add created_by and shared_with users
            user_ids.add(event.created_by_id)
            user_ids.update(user.id for user in event.shared_with.all())

        if not user_ids:
            logger.info(f"No users to notify for schedule {self.schedule.id}")
            return

        message = f"Recurring schedule '{self.schedule.title}' has been updated."

        for user_id in user_ids:
            try:
                user = self.schedule.user.__class__.objects.get(id=user_id)
            except ObjectDoesNotExist:
                logger.warning(f"User with id {user_id} does not exist.")
                continue

            Notification.objects.create(
                recipient=user,
                notification_type='schedule_change',
                message=message
            )

            try:
                profile = user.userprofile
            except ObjectDoesNotExist:
                logger.warning(f"UserProfile does not exist for user {user.username}")
                continue

            if profile.email_notifications and user.email:
                try:
                    send_mail(
                        subject=f"Schedule Change Notification: {self.schedule.title}",
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=False,
                    )
                    logger.info(f"Email notification sent to {user.email} for schedule {self.schedule.id}")
                except Exception as e:
                    logger.error(f"Failed to send email to {user.email}: {e}")

            if profile.push_notifications:
                device_tokens = UserDeviceToken.objects.filter(user=user, is_active=True)
                for token in device_tokens:
                    try:
                        send_push_notification(token.token, "Schedule Change", message)
                        logger.info(f"Push notification sent to {user.username}'s device {token.token}")
                    except Exception as e:
                        logger.error(f"Failed to send push notification to {user.username}: {e}")
