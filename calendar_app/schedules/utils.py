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

def send_push_notification(token, title, body):
    """
    Send a push notification using Firebase Cloud Messaging (FCM).
    """
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
    return response.status_code == 200

def calculate_eta(start_location, end_location):
    """
    Calculate ETA using Google Maps Directions API.
    """
    api_key = settings.GOOGLE_MAPS_API_KEY
    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={start_location}&destination={end_location}&key={api_key}"
    
    response = requests.get(url)
    data = response.json()
    
    if data['status'] == 'OK':
        route = data['routes'][0]
        leg = route['legs'][0]
        duration = leg['duration']['value']
        eta = timezone.now() + timedelta(seconds=duration)
        return eta
    else:
        return None

def sync_google_calendar(user, token):
    """
    Sync events from Google Calendar.
    """
    credentials = Credentials.from_authorized_user_file(token, ['https://www.googleapis.com/auth/calendar.readonly'])
    
    try:
        service = build('calendar', 'v3', credentials=credentials)
        now = timezone.now().isoformat()
        events_result = service.events().list(calendarId='primary', timeMin=now,
                                              maxResults=100, singleEvents=True,
                                              orderBy='start_time').execute()
        events = events_result.get('items', [])

        synced_events = []
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            
            synced_event = {
                'external_id': event['id'],
                'title': event['summary'],
                'description': event.get('description', ''),
                'start_time': start,
                'end_time': end,
                'location': event.get('location', ''),
            }
            synced_events.append(synced_event)

        return synced_events

    except HttpError as error:
        print(f'An error occurred: {error}')
        return []

def sync_outlook_calendar(user, token):
    """
    Sync events from Outlook Calendar.
    """
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
            'external_id': event.id,
            'title': event.subject,
            'description': event.body,
            'start_time': event.start,
            'end_time': event.end,
            'location': event.location.get('displayName', ''),
        }
        synced_events.append(synced_event)

    return synced_events

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
    events = []

    for component in cal.walk():
        if component.name == "VEVENT":
            event = {
                'title': str(component.get('summary')),
                'description': str(component.get('description')),
                'start_time': component.get('dtstart').dt,
                'end_time': component.get('dtend').dt,
                'location': str(component.get('location')),
            }
            events.append(event)

    return events

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
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_timezone(user):
    """
    Get the user's timezone, defaulting to UTC if not set.
    """
    return pytz.timezone(user.userprofile.timezone) if user.userprofile.timezone else pytz.UTC

def localize_datetime(dt, timezone):
    """
    Localize a datetime object to the given timezone.
    """
    if dt.tzinfo is None:
        dt = pytz.UTC.localize(dt)
    return dt.astimezone(timezone)

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
    all_free_times = []
    for user, events in user_events.items():
        free_times, _ = calculate_free_busy(events, start_date, end_date)
        all_free_times.append(free_times)

    common_free_times = all_free_times[0]
    for free_times in all_free_times[1:]:
        common_free_times = merge_free_times(common_free_times, free_times)

    return common_free_times

def merge_free_times(times1, times2):
    """
    Merge two lists of free time slots.
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
    import colorsys

    colors = []
    for i in range(num_colors):
        hue = i / num_colors
        saturation = 0.5 + (i % 3) * 0.1
        value = 0.95
        rgb = colorsys.hsv_to_rgb(hue, saturation, value)
        colors.append('#{:02x}{:02x}{:02x}'.format(int(rgb[0]*255), int(rgb[1]*255), int(rgb[2]*255)))

    return colors

def parse_recurrence_rule(rrule_string):
    """
    Parse an iCal recurrence rule string into a more usable format.
    """
    from dateutil.rrule import rrulestr

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
        count=recurrence_info['count'],
        until=recurrence_info['until'],
        byweekday=recurrence_info['byday'],
        bymonth=recurrence_info['bymonth'],
        bymonthday=recurrence_info['bymonthday'],
    )

    return list(rule)[:limit]