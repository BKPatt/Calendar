from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from O365 import Account
from .models import Event
from .utils import sync_google_calendar, sync_outlook_calendar

class ExternalCalendarSync:
    
    @staticmethod
    def sync_google_calendar(user):
        """
        Sync events from the user's Google Calendar and save them to the application.
        """
        credentials = Credentials.from_authorized_user_file(user.userprofile.external_calendar_token, scopes=['https://www.googleapis.com/auth/calendar.readonly'])
        
        try:
            service = build('calendar', 'v3', credentials=credentials)
            events = sync_google_calendar(service)
            
            synced_events = []
            for event in events:
                synced_event, created = Event.objects.update_or_create(
                    external_id=event['external_id'],
                    defaults={
                        'title': event['title'],
                        'description': event['description'],
                        'start_time': event['start_time'],
                        'end_time': event['end_time'],
                        'location': event['location'],
                        'created_by': user
                    }
                )
                synced_events.append(synced_event)

            return synced_events
        
        except Exception as e:
            print(f"Error syncing Google Calendar: {e}")
            return []

    @staticmethod
    def sync_outlook_calendar(user):
        """
        Sync events from the user's Outlook Calendar and save them to the application.
        """
        account = Account(credentials=(user.userprofile.outlook_client_id, user.userprofile.outlook_client_secret))
        account.connection.refresh_token = user.userprofile.external_calendar_token
        account.connection.refresh_token()
        
        calendar = account.schedule().get_default_calendar()
        events = sync_outlook_calendar(calendar)
        
        synced_events = []
        for event in events:
            synced_event, created = Event.objects.update_or_create(
                external_id=event['external_id'],
                defaults={
                    'title': event['title'],
                    'description': event['description'],
                    'start_time': event['start_time'],
                    'end_time': event['end_time'],
                    'location': event['location'],
                    'created_by': user
                }
            )
            synced_events.append(synced_event)

        return synced_events
