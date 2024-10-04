import celery
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from matplotlib.dates import DAILY, MONTHLY, WEEKLY, YEARLY, rrule

from .utils import calculate_free_busy
from .models import Event, Notification, UserDeviceToken, RecurringSchedule, Group, UserProfile
from dateutil.rrule import rrulestr
from datetime import timedelta
import requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from O365 import Account
import polyline
import time

@celery.shared_task
def send_event_reminder(event_id):
    try:
        event = Event.objects.get(id=event_id)
        recipients = [event.created_by] + list(event.shared_with.all())

        for recipient in recipients:
            Notification.objects.create(
                recipient=recipient,
                notification_type='reminder',
                message=f"Reminder: {event.title} starts at {event.start_time.strftime('%I:%M %p')}."
            )

            if recipient.userprofile.email_notifications:
                send_mail(
                    f"Event Reminder: {event.title}",
                    f"Your event '{event.title}' starts at {event.start_time.strftime('%I:%M %p')}.",
                    settings.DEFAULT_FROM_EMAIL,
                    [recipient.email],
                    fail_silently=False,
                )

            if recipient.userprofile.push_notifications:
                device_tokens = UserDeviceToken.objects.filter(user=recipient, is_active=True)
                for device_token in device_tokens:
                    send_push_notification(device_token.token, "Event Reminder", f"Your event '{event.title}' starts soon.")

    except Event.DoesNotExist:
        print(f"Event with id {event_id} not found.")
        
def send_push_notification(token, title, body):
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

@celery.shared_task
def process_recurring_events():
    now = timezone.now()
    end_date = now + timezone.timedelta(days=30)
    recurring_schedules = RecurringSchedule.objects.filter(
        Q(end_date__isnull=True) | Q(end_date__gte=now)
    )

    for schedule in recurring_schedules:
        events = schedule.generate_events(end_date=end_date)
        print(f"Generated {len(events)} events for schedule: {schedule.title}")

@celery.shared_task
def cleanup_old_events():
    cutoff_date = timezone.now() - timezone.timedelta(days=90)
    old_events = Event.objects.filter(end_time__lt=cutoff_date)

    for event in old_events:
        event.is_archived = True
        event.save()

    print(f"Archived {old_events.count()} old events.")

@celery.shared_task
def update_group_availability():
    groups = Group.objects.all()

    for group in groups:
        members = group.members.all()
        start_date = timezone.now().date()
        end_date = start_date + timezone.timedelta(days=7)

        group_availability = {}

        for day in range((end_date - start_date).days + 1):
            current_date = start_date + timezone.timedelta(days=day)
            group_availability[current_date] = []

            for member in members:
                work_schedule = member.work_schedules.filter(day_of_week=current_date.weekday()).first()
                if work_schedule:
                    start_time = timezone.make_aware(timezone.datetime.combine(current_date, work_schedule.start_time))
                    end_time = timezone.make_aware(timezone.datetime.combine(current_date, work_schedule.end_time))
                    group_availability[current_date].append((start_time, end_time))

        for date, availabilities in group_availability.items():
            if availabilities:
                common_start = max(slot[0] for slot in availabilities)
                common_end = min(slot[1] for slot in availabilities)
                if common_start < common_end:
                    group_availability[date] = [(common_start, common_end)]
                else:
                    group_availability[date] = []

        group.availability = group_availability
        group.save()

@celery.shared_task
def send_weekly_summary():
    users = UserProfile.objects.filter(email_notifications=True)

    for user_profile in users:
        user = user_profile.user
        start_date = timezone.now().date()
        end_date = start_date + timezone.timedelta(days=7)

        upcoming_events = Event.objects.filter(
            Q(created_by=user) | Q(shared_with=user),
            start_time__date__range=[start_date, end_date]
        ).order_by('start_time')

        if upcoming_events:
            event_list = "\n".join([f"- {event.title} on {event.start_time.strftime('%Y-%m-%d %H:%M')}" for event in upcoming_events])

            send_mail(
                "Your Weekly Event Summary",
                f"Here are your upcoming events for the next week:\n\n{event_list}",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

@celery.shared_task
def sync_external_calendars():
    users = UserProfile.objects.filter(external_calendar_enabled=True)

    for user_profile in users:
        user = user_profile.user
        external_calendar_type = user_profile.external_calendar_type
        external_calendar_token = user_profile.external_calendar_token

        if external_calendar_type == 'google':
            sync_google_calendar(user, external_calendar_token)
        elif external_calendar_type == 'outlook':
            sync_outlook_calendar(user, external_calendar_token)

def sync_google_calendar(user, token):
    credentials = Credentials.from_authorized_user_file(token, ['https://www.googleapis.com/auth/calendar.readonly'])
    
    try:
        service = build('calendar', 'v3', credentials=credentials)
        
        now = timezone.now().isoformat()
        events_result = service.events().list(calendarId='primary', timeMin=now,
                                              maxResults=100, singleEvents=True,
                                              orderBy='startTime').execute()
        events = events_result.get('items', [])

        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            
            Event.objects.update_or_create(
                external_id=event['id'],
                created_by=user,
                defaults={
                    'title': event['summary'],
                    'description': event.get('description', ''),
                    'start_time': start,
                    'end_time': end,
                    'location': event.get('location', ''),
                }
            )

    except HttpError as error:
        print(f'An error occurred: {error}')

def sync_outlook_calendar(user, token):
    account = Account(credentials=(settings.OUTLOOK_CLIENT_ID, settings.OUTLOOK_CLIENT_SECRET))
    account.connection.refresh_token = token
    account.connection.refresh_token()
    
    schedule = account.schedule()
    calendar = schedule.get_default_calendar()
    q = calendar.new_query('start').greater_equal(timezone.now())
    events = calendar.get_events(query=q, include_recurring=True)

    for event in events:
        Event.objects.update_or_create(
            external_id=event.id,
            created_by=user,
            defaults={
                'title': event.subject,
                'description': event.body,
                'start_time': event.start,
                'end_time': event.end,
                'location': event.location.get('displayName', ''),
            }
        )

@celery.shared_task
def check_eta_updates():
    current_time = timezone.now()
    upcoming_events = Event.objects.filter(
        start_time__gt=current_time,
        start_time__lte=current_time + timedelta(hours=1)
    )
    
    for event in upcoming_events:
        for attendee in event.shared_with.all():
            if attendee.userprofile.location_sharing_enabled:
                eta = calculate_eta(attendee.userprofile.last_known_location, event.location)
                if eta:
                    event.eta = eta
                    event.save()
                    
                    for other_attendee in event.shared_with.exclude(id=attendee.id):
                        Notification.objects.create(
                            recipient=other_attendee,
                            notification_type='eta_update',
                            message=f"{attendee.get_full_name()} is estimated to arrive at {eta.strftime('%I:%M %p')} for '{event.title}'"
                        )

def calculate_eta(start_location, end_location):
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