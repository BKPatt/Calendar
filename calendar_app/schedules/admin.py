from django.contrib import admin
from .models import (
    UserProfile, Group, Event, Availability, WorkSchedule,
    Invitation, Notification, Tag, Attachment, UserDeviceToken,
    RecurringSchedule, EventCategory, EventReminder
)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'default_timezone', 'default_view', 'default_event_duration')
    search_fields = ('user__username', 'user__email', 'phone_number')
    list_filter = ('default_timezone', 'default_view')
    raw_id_fields = ('user',)


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'admin', 'is_public', 'created_at', 'default_event_color')
    list_filter = ('is_public', 'created_at')
    search_fields = ('name', 'description', 'admin__username')
    raw_id_fields = ('admin', 'members')


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'start_time', 'end_time', 'event_type', 'category', 'recurring_schedule')
    list_filter = ('event_type', 'start_time', 'end_time', 'category', 'recurring_schedule')
    search_fields = ('title', 'description', 'created_by__username')
    raw_id_fields = ('created_by', 'shared_with', 'group', 'category', 'recurring_schedule')
    date_hierarchy = 'start_time'
    ordering = ('start_time',)


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ('user', 'start_time', 'end_time', 'is_available')
    list_filter = ('is_available', 'start_time', 'end_time')
    search_fields = ('user__username',)
    raw_id_fields = ('user',)


@admin.register(WorkSchedule)
class WorkScheduleAdmin(admin.ModelAdmin):
    list_display = ('user', 'day_of_week', 'start_time', 'end_time', 'is_recurring')
    list_filter = ('day_of_week', 'is_recurring')
    search_fields = ('user__username',)
    raw_id_fields = ('user',)


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'invitation_type', 'status', 'created_at')
    list_filter = ('invitation_type', 'status', 'created_at')
    search_fields = ('sender__username', 'recipient__username')
    raw_id_fields = ('sender', 'recipient', 'group', 'event')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('recipient__username', 'message')
    raw_id_fields = ('recipient',)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'color')
    search_fields = ('name',)


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ('file', 'uploaded_by', 'event', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('uploaded_by__username', 'event__title')
    raw_id_fields = ('uploaded_by', 'event')


@admin.register(UserDeviceToken)
class UserDeviceTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'device_type', 'is_active', 'last_used')
    list_filter = ('device_type', 'is_active', 'last_used')
    search_fields = ('user__username',)
    raw_id_fields = ('user',)


@admin.register(RecurringSchedule)
class RecurringScheduleAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'frequency', 'interval', 'start_date', 'end_date', 'is_active')
    list_filter = ('frequency', 'is_active', 'start_date', 'end_date')
    search_fields = ('user__username', 'title')
    raw_id_fields = ('user',)


@admin.register(EventCategory)
class EventCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'user')
    search_fields = ('name', 'user__username')
    raw_id_fields = ('user',)


@admin.register(EventReminder)
class EventReminderAdmin(admin.ModelAdmin):
    list_display = ('event', 'reminder_time', 'reminder_type')
    list_filter = ('reminder_type',)
    search_fields = ('event__title',)
    raw_id_fields = ('event',)
