from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

# UserProfile extends User model to store additional user data
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    default_timezone = models.CharField(max_length=50, default='UTC')
    work_schedule = models.JSONField(null=True, blank=True)  # To store recurring work schedules as JSON data
    bio = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.user.username

# Group model to organize users into groups that can share events
class Group(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    members = models.ManyToManyField(User, related_name='groups')
    created_at = models.DateTimeField(auto_now_add=True)
    admin = models.ForeignKey(User, related_name='admin_groups', on_delete=models.CASCADE)

    def __str__(self):
        return self.name

# Event model to represent a single event on the calendar
class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True, related_name='events')
    
    recurring = models.BooleanField(default=False)  # True if this event repeats
    recurrence_rule = models.JSONField(null=True, blank=True)  # Recurrence rules as JSON (e.g., weekly, monthly)

    # A list of users with whom the event is shared
    shared_with = models.ManyToManyField(User, related_name="shared_events", blank=True)

    # ETA of the user for the event, stored as a duration
    eta = models.DurationField(null=True, blank=True)

    # Timestamps for the event
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.start_time} to {self.end_time}"

    @property
    def is_past(self):
        """Returns True if the event has already passed"""
        return self.end_time < timezone.now()

# Availability model to track when a user is free based on events
class Availability(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="availabilities")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="availabilities")
    is_available = models.BooleanField(default=False)
    date_checked = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s availability for {self.event.title}"

# Model for repeating work schedules
class WorkSchedule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="work_schedules")
    day_of_week = models.IntegerField()  # 0 for Monday, 6 for Sunday
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_recurring = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username}'s work schedule on {self.get_day_display()}"

    def get_day_display(self):
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return days[self.day_of_week]

# Invitation model for inviting users to events or groups
class Invitation(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_invitations")
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_invitations")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True, related_name="group_invitations")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, null=True, blank=True, related_name="event_invitations")
    message = models.TextField(null=True, blank=True)
    accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        if self.group:
            return f"Invitation to {self.recipient.username} for Group: {self.group.name}"
        elif self.event:
            return f"Invitation to {self.recipient.username} for Event: {self.event.title}"
        return "Invitation"

# Notification model to track notifications for group or event changes
class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, null=True, blank=True, related_name="event_notifications")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True, related_name="group_notifications")
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.message}"
