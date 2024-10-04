from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from matplotlib.dates import rrule

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='userprofile')
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True)
    default_timezone = models.CharField(max_length=50, default='UTC')
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    in_app_notifications = models.BooleanField(default=True)
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True, null=True)
    reset_token = models.CharField(max_length=100, blank=True, null=True)
    default_view = models.CharField(max_length=10, choices=(('DAY', 'Day'), ('WEEK', 'Week'), ('MONTH', 'Month')), default='WEEK')
    default_event_duration = models.DurationField(default=timezone.timedelta(hours=1))
    timezone = models.CharField(max_length=50, default='UTC')
    external_calendar_enabled = models.BooleanField(default=False)
    external_calendar_type = models.CharField(max_length=50, blank=True, null=True)
    external_calendar_token = models.CharField(max_length=255, blank=True, null=True)
    last_known_location = models.CharField(max_length=255, blank=True, null=True)
    location_sharing_enabled = models.BooleanField(default=False)
    work_schedule_preferences = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

class Group(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='calendar_groups', blank=True)
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='administered_groups')
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    default_event_color = models.CharField(max_length=7, default="#007bff")

    def calculate_group_availability(self, start_date, end_date):
        """
        Calculate group members' availability for a given time range.
        """
        group_availability = {}
        for member in self.members.all():
            availabilities = member.availabilities.filter(start_time__gte=start_date, end_time__lte=end_date)
            group_availability[member.username] = [
                {'start_time': a.start_time, 'end_time': a.end_time} for a in availabilities
            ]
        return group_availability

    def __str__(self):
        return self.name


class RecurringSchedule(models.Model):
    FREQUENCY_CHOICES = (
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('YEARLY', 'Yearly'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recurring_schedules')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES)
    interval = models.PositiveIntegerField(default=1)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    days_of_week = models.JSONField(default=list, blank=True)
    day_of_month = models.IntegerField(null=True, blank=True)
    month_of_year = models.IntegerField(null=True, blank=True)
    color = models.CharField(max_length=7, default="#007bff")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def generate_events(self, end_date=None, limit=10):
        events = []
        current_date = self.start_date
        end_date = end_date or self.end_date

        if not end_date:
            raise ValueError("An end date must be specified either in the recurring schedule or as an argument.")

        frequency_mapping = {
            'DAILY': timedelta(days=1),
            'WEEKLY': timedelta(weeks=self.interval),
            'MONTHLY': timedelta(days=30 * self.interval),
            'YEARLY': timedelta(days=365 * self.interval)
        }

        while current_date <= end_date and len(events) < limit:
            start_time = timezone.datetime.combine(current_date, self.start_time)
            end_time = timezone.datetime.combine(current_date, self.end_time)

            event = Event(
                title=self.title,
                description=self.description,
                start_time=start_time,
                end_time=end_time,
                location=self.location,
                created_by=self.user,
                recurring=True,
                recurrence_rule={
                    'frequency': self.frequency,
                    'interval': self.interval,
                },
                recurring_schedule=self,
            )

            event.save()
            events.append(event)

            current_date += frequency_mapping.get(self.frequency, timedelta(days=1))

        return events

    def clean(self):
        if self.frequency == 'WEEKLY' and not self.days_of_week:
            raise ValidationError("Days of week must be specified for weekly recurrence")
        if self.frequency == 'MONTHLY' and self.day_of_month is None:
            raise ValidationError("Day of month must be specified for monthly recurrence")
        if self.frequency == 'YEARLY' and (self.day_of_month is None or self.month_of_year is None):
            raise ValidationError("Day of month and month of year must be specified for yearly recurrence")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username}'s {self.get_frequency_display()} schedule: {self.title}"

class EventReminder(models.Model):
    REMINDER_TYPES = (
        ('email', 'Email'),
        ('push', 'Push Notification'),
        ('in_app', 'In-App Notification'),
    )

    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='reminders')
    reminder_time = models.DurationField(help_text="Time before the event to send the reminder.")
    reminder_type = models.CharField(max_length=20, choices=REMINDER_TYPES)

    def __str__(self):
        return f"Reminder for {self.event.title} - {self.get_reminder_type_display()}"

class EventCategory(models.Model):
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default="#007bff")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_categories')

    def __str__(self):
        return self.name


class Event(models.Model):
    EVENT_TYPES = (
        ('meeting', 'Meeting'),
        ('appointment', 'Appointment'),
        ('reminder', 'Reminder'),
        ('work', 'Work'),
        ('other', 'Other'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=200, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_events', null=False)
    shared_with = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='shared_events', blank=True)
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    recurring = models.BooleanField(default=False)
    recurrence_rule = models.JSONField(null=True, blank=True)
    color = models.CharField(max_length=7, default="#007bff")
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='other')
    eta = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    recurring_schedule = models.ForeignKey(RecurringSchedule, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    category = models.ForeignKey(EventCategory, on_delete=models.SET_NULL, null=True, blank=True)
    is_archived = models.BooleanField(default=False)
    is_all_day = models.BooleanField(default=False)
    is_recurring = models.BooleanField(default=False)
    recurrence_rule = models.JSONField(null=True, blank=True)
    recurrence_end_date = models.DateTimeField(null=True, blank=True)

    def update_eta(self, new_eta):
        if new_eta <= self.start_time:
            self.eta = new_eta
            self.save()

            for user in self.shared_with.all():
                Notification.objects.create(
                    recipient=user,
                    notification_type='eta_update',
                    message=f"The ETA for event '{self.title}' has been updated to {new_eta.strftime('%I:%M %p')}."
                )
        else:
            raise ValidationError("ETA cannot be after the event start time.")

    def generate_recurring_events(self, end_date):
        if not self.is_recurring or not self.recurrence_rule:
            return []

        events = []
        current_date = self.start_time
        rule = rrule.rrulestr(self.recurrence_rule)

        while current_date <= end_date:
            if self.recurrence_end_date and current_date > self.recurrence_end_date:
                break

            new_event = Event(
                title=self.title,
                description=self.description,
                start_time=current_date,
                end_time=current_date + (self.end_time - self.start_time),
                location=self.location,
                created_by=self.created_by,
                group=self.group,
                is_recurring=False
            )
            events.append(new_event)

            current_date = rule.after(current_date, inc=False)

        return events

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Availability(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='availabilities')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_available = models.BooleanField(default=True)
    note = models.TextField(blank=True)

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username}'s availability from {self.start_time} to {self.end_time}"


class WorkSchedule(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='work_schedules')
    day_of_week = models.IntegerField(choices=[(i, day) for i, day in enumerate(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])])
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_recurring = models.BooleanField(default=True)
    effective_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)

    def handle_exception(self, date):
        """
        Handle exception for a particular date (e.g., changes in availability).
        """
        if date < self.effective_date or (self.end_date and date > self.end_date):
            raise ValidationError("Date is outside the effective range for this schedule.")

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time")
        if self.end_date and self.effective_date > self.end_date:
            raise ValidationError("End date must be after effective date")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username}'s work schedule on {self.get_day_of_week_display()}"


class Invitation(models.Model):
    INVITATION_TYPES = (
        ('group', 'Group Invitation'),
        ('event', 'Event Invitation'),
    )
    INVITATION_STATUS = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    )

    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_invitations')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_invitations')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, null=True, blank=True)
    invitation_type = models.CharField(max_length=10, choices=INVITATION_TYPES)
    status = models.CharField(max_length=10, choices=INVITATION_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    def clean(self):
        if self.group is None and self.event is None:
            raise ValidationError("Invitation must be for either a group or an event")
        if self.group is not None and self.event is not None:
            raise ValidationError("Invitation cannot be for both a group and an event")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"Invitation from {self.sender.username} to {self.recipient.username}"


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('invitation', 'Invitation'),
        ('reminder', 'Reminder'),
        ('update', 'Update'),
        ('other', 'Other'),
    )

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.message[:50]}..."


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default="#000000")

    def __str__(self):
        return self.name


class Attachment(models.Model):
    file = models.FileField(upload_to='attachments/')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attachments')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attachment for {self.event.title} by {self.uploaded_by.username}"


class UserDeviceToken(models.Model):
    DEVICE_TYPES = (
        ('ios', 'iOS'),
        ('android', 'Android'),
        ('web', 'Web'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='device_tokens')
    token = models.CharField(max_length=255)
    device_type = models.CharField(max_length=10, choices=DEVICE_TYPES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s {self.get_device_type_display()} device"
