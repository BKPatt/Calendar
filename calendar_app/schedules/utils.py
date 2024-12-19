import logging
from matplotlib.dates import DAILY, MONTHLY, WEEKLY, YEARLY, rrule
import requests
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
import pytz
from icalendar import Calendar, Event as CalendarEvent
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from O365 import Account
import jwt
import colorsys
from dateutil.rrule import rrulestr

logger = logging.getLogger(__name__)

def send_push_notification(token, title, body):
    """
    Send a push notification using Firebase Cloud Messaging (FCM).
    """
    if not settings.FCM_SERVER_KEY:
        logger.error("FCM_SERVER_KEY is not set. Cannot send push notification.")
        return False

    url = "https://fcm.googleapis.com/fcm/send"
    headers = {
        "Authorization": f"key={settings.FCM_SERVER_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "to": token,
        "notification": {
            "title": title,
            "body": body
        }
    }
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code != 200:
        logger.error(f"Failed to send push notification. Status: {response.status_code}, Response: {response.text}")
    return response.status_code == 200

def calculate_eta(start_location, end_location):
    """
    Calculate ETA using Google Maps Directions API.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        logger.error("GOOGLE_MAPS_API_KEY is not set. Cannot calculate ETA.")
        return None

    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={start_location}&destination={end_location}&key={settings.GOOGLE_MAPS_API_KEY}"
    response = requests.get(url)
    data = response.json()

    if data.get('status') == 'OK':
        try:
            route = data['routes'][0]
            leg = route['legs'][0]
            duration = leg['duration']['value']
            eta = timezone.now() + timedelta(seconds=duration)
            return eta
        except (IndexError, KeyError) as e:
            logger.error(f"Error parsing Google Maps response: {e}")
            return None
    else:
        logger.warning(f"Google Maps Directions API returned status: {data.get('status')}, response: {data}")
        return None

def sync_google_calendar(user, token):
    """
    Sync events from Google Calendar.
    Returns a list of dictionary events.
    """
    if not token:
        logger.error(f"No token provided for Google Calendar sync for user {user.username}.")
        return []

    credentials = Credentials.from_authorized_user_file(token, ['https://www.googleapis.com/auth/calendar.readonly'])
    try:
        service = build('calendar', 'v3', credentials=credentials)
        now = timezone.now().isoformat()
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            maxResults=100,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])

        synced_events = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            synced_event = {
                'external_id': event['id'],
                'title': event.get('summary', ''),
                'description': event.get('description', ''),
                'start_time': start,
                'end_time': end,
                'location': event.get('location', ''),
            }
            synced_events.append(synced_event)
        logger.info(f"Synced {len(synced_events)} Google events for user {user.username}.")
        return synced_events

    except HttpError as error:
        logger.error(f'Google Calendar API error for user {user.username}: {error}')
        return []

def sync_outlook_calendar(user, token):
    """
    Sync events from Outlook Calendar.
    Returns a list of dictionary events.
    """
    if not (settings.OUTLOOK_CLIENT_ID and settings.OUTLOOK_CLIENT_SECRET):
        logger.error("Outlook client credentials not set in settings.")
        return []

    try:
        account = Account(credentials=(settings.OUTLOOK_CLIENT_ID, settings.OUTLOOK_CLIENT_SECRET))
        account.connection.refresh_token = token
        account.connection.refresh_token()

        schedule = account.schedule()
        calendar = schedule.get_default_calendar()
        q = calendar.new_query('start').greater_equal(timezone.now())
        events = calendar.get_events(query=q, include_recurring=True)

        synced_events = []
        for event in events:
            synced_event = {
                'external_id': event.object_id,
                'title': event.subject or '',
                'description': event.body or '',
                'start_time': event.start,
                'end_time': event.end,
                'location': event.location.get('displayName', '') if event.location else '',
            }
            synced_events.append(synced_event)

        logger.info(f"Synced {len(synced_events)} Outlook events for user {user.username}.")
        return synced_events
    except Exception as e:
        logger.error(f"Outlook Calendar sync error for user {user.username}: {e}")
        return []

def generate_ical(events):
    """
    Generate an iCal file from a list of events.
    """
    cal = Calendar()
    cal.add('prodid', '-//Calendar App//mxm.dk//')
    cal.add('version', '2.0')

    for event in events:
        cal_event = CalendarEvent()
        cal_event.add('summary', event.title)
        cal_event.add('dtstart', event.start_time)
        cal_event.add('dtend', event.end_time)
        cal_event.add('description', event.description)
        cal_event.add('location', event.location)
        cal.add_component(cal_event)

    return cal.to_ical()

def parse_ical(ical_string):
    """
    Parse an iCal file and return a list of event dictionaries.
    """
    cal = Calendar.from_ical(ical_string)
    parsed_events = []

    for component in cal.walk():
        if component.name == "VEVENT":
            parsed_events.append({
                'title': str(component.get('summary', '')),
                'description': str(component.get('description', '')),
                'start_time': component.get('dtstart').dt,
                'end_time': component.get('dtend').dt,
                'location': str(component.get('location', '')),
            })

    logger.info(f"Parsed {len(parsed_events)} events from iCal data.")
    return parsed_events

def generate_jwt_token(user):
    """
    Generate a JWT token for user authentication.
    """
    payload = {
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

def verify_jwt_token(token):
    """
    Verify a JWT token and return the user ID if valid.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token has expired.")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Invalid JWT token.")
        return None

def get_user_timezone(user):
    """
    Get the user's timezone, defaulting to UTC if not set.
    """
    tz_name = getattr(user.userprofile, 'timezone', 'UTC')
    try:
        return pytz.timezone(tz_name)
    except Exception as e:
        logger.error(f"Error parsing timezone '{tz_name}': {e}")
        return pytz.UTC

def localize_datetime(dt, tz):
    """
    Localize a datetime object to the given timezone.
    """
    if dt.tzinfo is None:
        dt = pytz.UTC.localize(dt)
    return dt.astimezone(tz)

def calculate_free_busy(events, start_date, end_date):
    """
    Calculate free/busy times based on a list of events.
    """
    busy_times = []
    for event in events:
        if event.start_time < end_date and event.end_time > start_date:
            busy_times.append((max(event.start_time, start_date), min(event.end_time, end_date)))

    busy_times.sort(key=lambda x: x[0])

    free_times = []
    current_time = start_date
    for busy_start, busy_end in busy_times:
        if current_time < busy_start:
            free_times.append((current_time, busy_start))
        current_time = max(current_time, busy_end)

    if current_time < end_date:
        free_times.append((current_time, end_date))

    return free_times, busy_times

def find_common_free_time(user_events, start_date, end_date):
    """
    Find common free time slots for multiple users.
    """
    if not user_events:
        return []

    all_free_times = []
    for user, events in user_events.items():
        free_times, _ = calculate_free_busy(events, start_date, end_date)
        all_free_times.append(free_times)

    common_free_times = all_free_times[0]
    for free_times in all_free_times[1:]:
        common_free_times = merge_free_times(common_free_times, free_times)

    logger.info(f"Found {len(common_free_times)} common free time slots between {len(user_events)} users.")
    return common_free_times

def merge_free_times(times1, times2):
    """
    Merge two lists of free time slots and return their intersection.
    """
    result = []
    i, j = 0, 0
    while i < len(times1) and j < len(times2):
        start = max(times1[i][0], times2[j][0])
        end = min(times1[i][1], times2[j][1])
        if start < end:
            result.append((start, end))
        if times1[i][1] < times2[j][1]:
            i += 1
        else:
            j += 1
    return result

def generate_color_palette(num_colors):
    """
    Generate a color palette for event categorization.
    """
    colors = []
    for i in range(num_colors):
        hue = i / num_colors
        saturation = 0.5 + (i % 3) * 0.1
        value = 0.95
        rgb = colorsys.hsv_to_rgb(hue, saturation, value)
        colors.append('#{:02x}{:02x}{:02x}'.format(int(rgb[0]*255), int(rgb[1]*255), int(rgb[2]*255)))

    logger.info(f"Generated a palette of {num_colors} colors.")
    return colors

def parse_recurrence_rule(rrule_string):
    """
    Parse an iCal recurrence rule string into a more usable format.
    """
    rule = rrulestr(rrule_string)

    recurrence_info = {
        'frequency': rule._freq,
        'interval': rule._interval,
        'count': rule._count,
        'until': rule._until,
        'byday': rule._byday,
        'bymonth': rule._bymonth,
        'bymonthday': rule._bymonthday,
    }

    return recurrence_info

def generate_recurrence_dates(start_date, recurrence_info, limit=10):
    """
    Generate the next occurrence dates based on a recurrence rule.
    """
    freq_map = {
        0: YEARLY,
        1: MONTHLY,
        2: WEEKLY,
        3: DAILY,
    }

    rule = rrule(
        freq=freq_map[recurrence_info['frequency']],
        interval=recurrence_info['interval'],
        dtstart=start_date,
        count=recurrence_info.get('count'),
        until=recurrence_info.get('until'),
        byweekday=recurrence_info.get('byday'),
        bymonth=recurrence_info.get('bymonth'),
        bymonthday=recurrence_info.get('bymonthday'),
    )

    dates = list(rule)[:limit]
    logger.info(f"Generated {len(dates)} recurrence dates starting from {start_date} with info {recurrence_info}.")
    return dates
