from .models import UserDeviceToken, Notification
from django.core.mail import send_mail
from django.conf import settings
from .utils import send_push_notification

class NotificationManager:
    def __init__(self, event=None, schedule=None):
        self.event = event
        self.schedule = schedule

    def send_event_notification(self):
        """
        Send a notification to all users associated with the event via email, in-app, and push notification.
        """
        if not self.event:
            raise ValueError("Event is required to send notifications")

        users = self.event.shared_with.all()
        if not users:
            return

        message = f"Reminder: Event '{self.event.title}' is starting at {self.event.start_time}."

        for user in users:
            Notification.objects.create(
                recipient=user,
                notification_type='reminder',
                message=message
            )

            if user.userprofile.email_notifications:
                send_mail(
                    f"Event Reminder: {self.event.title}",
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )

            if user.userprofile.push_notifications:
                device_tokens = UserDeviceToken.objects.filter(user=user, is_active=True)
                for token in device_tokens:
                    send_push_notification(token.token, "Event Reminder", message)

    def send_schedule_change_notification(self):
        """
        Send a notification to all users involved in a recurring schedule when the schedule is changed.
        """
        if not self.schedule:
            raise ValueError("Schedule is required to send schedule change notifications")

        users = self.schedule.user.shared_events.all()
        if not users:
            return

        message = f"Recurring schedule '{self.schedule.title}' has been updated."

        for user in users:
            Notification.objects.create(
                recipient=user,
                notification_type='schedule_change',
                message=message
            )

            if user.userprofile.email_notifications:
                send_mail(
                    f"Schedule Change Notification: {self.schedule.title}",
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )

            if user.userprofile.push_notifications:
                device_tokens = UserDeviceToken.objects.filter(user=user, is_active=True)
                for token in device_tokens:
                    send_push_notification(token.token, "Schedule Change", message)
