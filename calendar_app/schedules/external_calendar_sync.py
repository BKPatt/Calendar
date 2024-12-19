import logging
from django.utils import timezone
import zoneinfo
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from O365 import Account
from .models import Event
from .utils import sync_google_calendar, sync_outlook_calendar

logger = logging.getLogger(__name__)

class ExternalCalendarSync:

    @staticmethod
    def sync_google_calendar(user):
        """
        Sync events from the user's Google Calendar and save them to the application.
        """
        if not user.userprofile.external_calendar_token:
            logger.error("User does not have a Google external_calendar_token.")
            return []

        # Define scopes required for read-only access to Google Calendar
        scopes = ['https://www.googleapis.com/auth/calendar.readonly']

        try:
            credentials = Credentials.from_authorized_user_file(user.userprofile.external_calendar_token, scopes=scopes)
        except Exception as e:
            logger.error(f"Error loading Google credentials: {e}")
            return []

        try:
            service = build('calendar', 'v3', credentials=credentials)
            external_events = sync_google_calendar(service)
        except Exception as e:
            logger.error(f"Error fetching events from Google Calendar: {e}")
            return []

        synced_events = []
        for event_data in external_events:
            start_time = event_data.get('start_time')
            end_time = event_data.get('end_time')
            event_tz = event_data.get('event_timezone', 'UTC')
            tz = zoneinfo.ZoneInfo(event_tz)
            
            # Ensure datetimes are aware
            if start_time and timezone.is_naive(start_time):
                start_time = timezone.make_aware(start_time, tz)
            if end_time and timezone.is_naive(end_time):
                end_time = timezone.make_aware(end_time, tz)

            try:
                synced_event, created = Event.objects.update_or_create(
                    external_id=event_data['external_id'],
                    defaults={
                        'title': event_data['title'],
                        'description': event_data['description'],
                        'start_time': start_time,
                        'end_time': end_time,
                        'location': event_data['location'],
                        'created_by': user,
                        'event_timezone': event_tz
                    }
                )
                synced_events.append(synced_event)
            except Exception as e:
                logger.error(f"Error saving synced Google event {event_data['external_id']}: {e}")

        return synced_events

    @staticmethod
    def sync_outlook_calendar(user):
        """
        Sync events from the user's Outlook Calendar and save them to the application.
        """
        if not (user.userprofile.external_calendar_token and 
                user.userprofile.outlook_client_id and 
                user.userprofile.outlook_client_secret):
            logger.error("User does not have valid Outlook credentials or token.")
            return []

        try:
            account = Account(
                credentials=(user.userprofile.outlook_client_id, user.userprofile.outlook_client_secret)
            )
            account.connection.refresh_token = user.userprofile.external_calendar_token
            account.connection.refresh_token()
        except Exception as e:
            logger.error(f"Error connecting to Outlook account: {e}")
            return []

        try:
            calendar = account.schedule().get_default_calendar()
            external_events = sync_outlook_calendar(calendar)
        except Exception as e:
            logger.error(f"Error fetching events from Outlook Calendar: {e}")
            return []

        synced_events = []
        for event_data in external_events:
            start_time = event_data.get('start_time')
            end_time = event_data.get('end_time')
            event_tz = event_data.get('event_timezone', 'UTC')
            tz = zoneinfo.ZoneInfo(event_tz)

            # Ensure datetimes are aware
            if start_time and timezone.is_naive(start_time):
                start_time = timezone.make_aware(start_time, tz)
            if end_time and timezone.is_naive(end_time):
                end_time = timezone.make_aware(end_time, tz)

            try:
                synced_event, created = Event.objects.update_or_create(
                    external_id=event_data['external_id'],
                    defaults={
                        'title': event_data['title'],
                        'description': event_data['description'],
                        'start_time': start_time,
                        'end_time': end_time,
                        'location': event_data['location'],
                        'created_by': user,
                        'event_timezone': event_tz
                    }
                )
                synced_events.append(synced_event)
            except Exception as e:
                logger.error(f"Error saving synced Outlook event {event_data['external_id']}: {e}")

        return synced_events
