from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Event, Group, UserProfile, Availability, WorkSchedule, Invitation, Notification


# Serializer for the User model
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


# Serializer for the UserProfile model
class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ['user', 'default_timezone', 'work_schedule', 'bio']


# Serializer for the Group model
class GroupSerializer(serializers.ModelSerializer):
    admin = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'members', 'admin', 'created_at']


# Serializer for the Event model
class EventSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    shared_with = UserSerializer(many=True, read_only=True)
    group = GroupSerializer(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'location', 'start_time', 'end_time',
            'created_by', 'group', 'recurring', 'recurrence_rule', 'shared_with',
            'eta', 'created_at', 'updated_at'
        ]


# Serializer for the Availability model
class AvailabilitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    event = EventSerializer(read_only=True)

    class Meta:
        model = Availability
        fields = ['id', 'user', 'event', 'is_available', 'date_checked']


# Serializer for the WorkSchedule model
class WorkScheduleSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = WorkSchedule
        fields = ['id', 'user', 'day_of_week', 'start_time', 'end_time', 'is_recurring']


# Serializer for the Invitation model
class InvitationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer()

    class Meta:
        model = Invitation
        fields = ['id', 'sender', 'recipient', 'group', 'event', 'message', 'accepted', 'created_at', 'responded_at']


# Serializer for the Notification model
class NotificationSerializer(serializers.ModelSerializer):
    recipient = UserSerializer(read_only=True)
    group = GroupSerializer(read_only=True)
    event = EventSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'event', 'group', 'message', 'is_read', 'created_at']
