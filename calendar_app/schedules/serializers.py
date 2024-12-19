from datetime import datetime
import logging
from rest_framework import serializers
from django.core.exceptions import ValidationError
from django.utils import timezone
import zoneinfo

from django.contrib.auth.models import User
from .eta_service import ETACalculator
from .group_management import GroupInvitationManager
from .user_preferences import UserPreferencesManager
from .models import (
    CustomUser, UserProfile, Group, Event, Availability, WorkSchedule,
    Invitation, Notification, Tag, Attachment, UserDeviceToken,
    RecurringSchedule, EventCategory, EventReminder
)

logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        return CustomUser.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='user.first_name', required=False)
    lastName = serializers.CharField(source='user.last_name', required=False)
    email = serializers.EmailField(source='user.email', required=False)

    class Meta:
        model = UserProfile
        fields = [
            'firstName', 'lastName', 'email', 'bio', 'profilePicture', 'phoneNumber',
            'defaultTimezone', 'notificationPreferences', 'lastLoginPlatform', 'profileComplete'
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance

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
        fields = [
            'id', 'name', 'description', 'members', 'admin', 'is_public',
            'created_at', 'updated_at', 'default_event_color'
        ]
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
    class Meta:
        model = RecurringSchedule
        fields = [
            'id', 'title', 'description', 'location', 'start_time', 'end_time',
            'frequency', 'interval', 'start_date', 'end_date', 'days_of_week',
            'day_of_month', 'month_of_year', 'color', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """
        Custom validation to ensure that certain fields are correctly set based on the frequency.
        Also ensures start_time and end_time are present.
        """
        frequency = data.get('frequency')
        if 'start_time' not in data or 'end_time' not in data:
            raise serializers.ValidationError("Start time and end time are required.")

        if frequency == 'WEEKLY' and not data.get('days_of_week'):
            raise serializers.ValidationError("Days of the week must be provided for weekly recurrence.")
        if frequency == 'MONTHLY' and data.get('day_of_month') is None:
            raise serializers.ValidationError("Day of the month must be provided for monthly recurrence.")
        if frequency == 'YEARLY' and (data.get('day_of_month') is None or data.get('month_of_year') is None):
            raise serializers.ValidationError("Both the day of the month and month of the year must be provided for yearly recurrence.")

        return data


class EventSerializer(serializers.ModelSerializer):
    shared_with = UserSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    is_all_day = serializers.BooleanField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'start_time', 'end_time', 'location', 'created_by',
            'shared_with', 'recurring', 'recurrence_rule', 'color', 'event_type', 'eta',
            'created_at', 'updated_at', 'category', 'reminders', 'recurring_schedule', 'is_all_day',
            'is_recurring', 'recurrence_rule', 'recurrence_end_date'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        recurrence_rule = representation.get('recurrence_rule', {})
        if recurrence_rule and 'days_of_week' in recurrence_rule and isinstance(recurrence_rule['days_of_week'], str):

            recurrence_rule['days_of_week'] = [day.strip() for day in recurrence_rule['days_of_week'].split(',') if day.strip()]
            representation['recurrence_rule'] = recurrence_rule
        return representation

    def create(self, validated_data):
        reminders_data = validated_data.pop('reminders', [])
        recurrence_rule = validated_data.pop('recurrence_rule', None)
        event = Event.objects.create(**validated_data)

        if recurrence_rule:
            start_date_str = recurrence_rule.get('start_date')
            if start_date_str:
                start_date = datetime.fromisoformat(start_date_str).date()
            else:
                start_date = event.start_time.date()

            end_date = event.recurrence_end_date.date() if event.recurrence_end_date else None

            # Create the recurring schedule
            schedule = RecurringSchedule.objects.create(
                user=event.created_by,
                title=event.title,
                description=event.description,
                location=event.location,
                start_time=event.start_time.time(),
                end_time=event.end_time.time(),
                frequency=recurrence_rule.get('frequency'),
                interval=recurrence_rule.get('interval', 1),
                days_of_week=recurrence_rule.get('days_of_week', []),
                day_of_month=recurrence_rule.get('day_of_month'),
                month_of_year=recurrence_rule.get('month_of_year'),
                start_date=start_date,
                end_date=end_date,
                is_active=True
            )

            # Update the event to reflect recurring properties
            event.recurrence_rule = recurrence_rule
            event.recurring = True
            event.is_recurring = True
            event.recurring_schedule = schedule
            event.save()

        for reminder_data in reminders_data:
            EventReminder.objects.create(event=event, **reminder_data)

        return event


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
