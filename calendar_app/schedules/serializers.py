from rest_framework import serializers
from django.contrib.auth.models import User

from .eta_service import ETACalculator
from .group_management import GroupInvitationManager
from .user_preferences import UserPreferencesManager
from .models import (
    CustomUser, UserProfile, Group, Event, Availability, WorkSchedule,
    Invitation, Notification, Tag, Attachment, UserDeviceToken,
    RecurringSchedule, EventCategory, EventReminder
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'

    def update_preferences(self, user, preferences):
        """
        Call UserPreferencesManager to update the user preferences.
        """
        return UserPreferencesManager.update_preferences(user, preferences)

    def get_preferences(self, user):
        """
        Call UserPreferencesManager to get the user preferences.
        """
        return UserPreferencesManager.get_user_preferences(user)

class GroupSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'members', 'admin', 'is_public', 'created_at', 'updated_at', 'default_event_color']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def send_invitation(self, group, user):
        """
        Call the GroupInvitationManager to send an invitation to a user.
        """
        GroupInvitationManager.send_invitation(group, user)

    def process_invitation_response(self, invitation, response):
        """
        Call the GroupInvitationManager to process invitation response.
        """
        GroupInvitationManager.process_invitation_response(invitation, response)
        
class EventCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EventCategory
        fields = ['id', 'name', 'color', 'user']
        read_only_fields = ['id']

class EventReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventReminder
        fields = ['id', 'event', 'reminder_time', 'reminder_type']
        read_only_fields = ['id']

class RecurringScheduleSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = RecurringSchedule
        fields = [
            'id', 'user', 'title', 'description', 'location', 'start_time', 'end_time',
            'frequency', 'interval', 'start_date', 'end_date', 'days_of_week',
            'day_of_month', 'month_of_year', 'color', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """
        Custom validation to ensure that certain fields are correctly set based on the frequency.
        """
        frequency = data.get('frequency')
        if frequency == 'WEEKLY' and not data.get('days_of_week'):
            raise serializers.ValidationError("Days of the week must be provided for weekly recurrence.")
        if frequency == 'MONTHLY' and data.get('day_of_month') is None:
            raise serializers.ValidationError("Day of the month must be provided for monthly recurrence.")
        if frequency == 'YEARLY' and (data.get('day_of_month') is None or data.get('month_of_year') is None):
            raise serializers.ValidationError("Both the day of the month and month of the year must be provided for yearly recurrence.")
        
        return data

class EventSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')
    shared_with = serializers.SlugRelatedField(
        many=True, slug_field='username', queryset=UserProfile.objects.all()
    )
    reminders = EventReminderSerializer(many=True, required=False)
    recurring_schedule = RecurringScheduleSerializer(required=False)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'start_time', 'end_time', 'location', 'created_by',
            'shared_with', 'recurring', 'recurrence_rule', 'color', 'event_type', 'eta',
            'created_at', 'updated_at', 'category', 'reminders', 'recurring_schedule'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        reminders_data = validated_data.pop('reminders', [])
        recurring_schedule_data = validated_data.pop('recurring_schedule', None)
        event = Event.objects.create(**validated_data)

        if recurring_schedule_data:
            recurring_schedule = RecurringSchedule.objects.create(**recurring_schedule_data, user=event.created_by)
            event.recurring_schedule = recurring_schedule

        for reminder_data in reminders_data:
            EventReminder.objects.create(event=event, **reminder_data)

        ETACalculator.calculate_and_update_eta(event)

        event.save()
        return event

    def update(self, instance, validated_data):
        reminders_data = validated_data.pop('reminders', [])
        recurring_schedule_data = validated_data.pop('recurring_schedule', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.reminders.all().delete()
        for reminder_data in reminders_data:
            EventReminder.objects.create(event=instance, **reminder_data)

        if recurring_schedule_data:
            if instance.recurring_schedule:
                for attr, value in recurring_schedule_data.items():
                    setattr(instance.recurring_schedule, attr, value)
                instance.recurring_schedule.save()
            else:
                recurring_schedule = RecurringSchedule.objects.create(**recurring_schedule_data, user=instance.created_by)
                instance.recurring_schedule = recurring_schedule

        ETACalculator.calculate_and_update_eta(instance)

        instance.save()
        return instance

class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ['id', 'user', 'start_time', 'end_time', 'is_available', 'note']
        read_only_fields = ['id']

class WorkScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkSchedule
        fields = ['id', 'user', 'day_of_week', 'start_time', 'end_time', 'is_recurring', 'effective_date', 'end_date']
        read_only_fields = ['id']

class InvitationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)

    class Meta:
        model = Invitation
        fields = ['id', 'sender', 'recipient', 'group', 'event', 'invitation_type', 'status', 'created_at', 'responded_at']
        read_only_fields = ['id', 'created_at', 'responded_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'notification_type', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']
        read_only_fields = ['id']

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'file', 'uploaded_by', 'event', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

class UserDeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDeviceToken
        fields = ['id', 'user', 'token', 'device_type', 'is_active', 'created_at', 'last_used']
        read_only_fields = ['id', 'created_at', 'last_used']

class CalendarViewSerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    view_type = serializers.ChoiceField(choices=['DAY', 'WEEK', 'MONTH'])

class EventExportSerializer(serializers.Serializer):
    event_ids = serializers.ListField(child=serializers.IntegerField())
    export_format = serializers.ChoiceField(choices=['ICAL', 'CSV'])

class EventImportSerializer(serializers.Serializer):
    import_file = serializers.FileField()
    import_format = serializers.ChoiceField(choices=['ICAL', 'CSV'])
