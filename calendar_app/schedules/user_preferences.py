from .models import UserProfile
from django.core.exceptions import ValidationError

class UserPreferencesManager:

    @staticmethod
    def update_preferences(user, preferences):
        """
        Update the user's preferences based on the provided dictionary of preferences.
        """
        if not user:
            raise ValidationError("A valid user is required.")

        try:
            user_profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            raise ValidationError("User profile not found.")

        # Update the user preferences with provided data
        for key, value in preferences.items():
            if hasattr(user_profile, key):
                setattr(user_profile, key, value)

        user_profile.save()

        return user_profile

    @staticmethod
    def get_user_preferences(user):
        """
        Retrieve the user's preferences.
        """
        if not user:
            raise ValidationError("A valid user is required.")

        try:
            user_profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            raise ValidationError("User profile not found.")

        # Create a dictionary of user preferences
        preferences = {
            "bio": user_profile.bio,
            "phone_number": user_profile.phone_number,
            "default_timezone": user_profile.default_timezone,
            "email_notifications": user_profile.email_notifications,
            "push_notifications": user_profile.push_notifications,
            "in_app_notifications": user_profile.in_app_notifications,
            "default_view": user_profile.default_view,
            "default_event_duration": user_profile.default_event_duration,
            "external_calendar_enabled": user_profile.external_calendar_enabled,
            "location_sharing_enabled": user_profile.location_sharing_enabled,
        }

        return preferences
