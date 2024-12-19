import logging
import celery
from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from django.core.mail import send_mail
from django.conf import settings
import requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from O365 import Account
from matplotlib.dates import DAILY, MONTHLY, WEEKLY, YEARLY, rrule
from dateutil.rrule import rrulestr

from .utils import calculate_free_busy
from .models import Event, Notification, UserDeviceToken, RecurringSchedule, Group, UserProfile

logger = logging.getLogger(__name__)

@celery.shared_task
def send_event_reminder(event_id):
    try:
        event = Event.objects.get(id=event_id)
        recipients = [event.created_by] + list(event.shared_with.all())

        message = f"Reminder: '{event.title}' starts at {event.start_time.strftime('%I:%M %p')}."
        for recipient in recipients:
            Notification.objects.create(
                recipient=recipient,
                notification_type='reminder',
                message=message
            )

            try:
                profile = recipient.userprofile
            except UserProfile.DoesNotExist:
                logger.warning(f"No UserProfile found for user {recipient.username} when sending event reminder.")
                continue

            # Send email if enabled
            if profile.email_notifications and recipient.email:
                try:
                    send_mail(
                        f"Event Reminder: {event.title}",
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [recipient.email],
                        fail_silently=False,
                    )
                    logger.info(f"Email reminder sent to {recipient.email} for event {event.id}")
                except Exception as e:
                    logger.error(f"Error sending email reminder to {recipient.email}: {e}")

            # Send push notification if enabled
            if profile.push_notifications:
                device_tokens = UserDeviceToken.objects.filter(user=recipient, is_active=True)
                for device_token in device_tokens:
                    if send_push_notification(device_token.token, "Event Reminder", message):
                        logger.info(f"Push notification sent to {recipient.username}'s device: {device_token.token}")
                    else:
                        logger.warning(f"Failed to send push notification to {recipient.username}'s device: {device_token.token}")

    except Event.DoesNotExist:
        logger.error(f"Event with id {event_id} not found.")

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
    if response.status_code != 200:
        logger.error(f"Push notification failed with status code {response.status_code}: {response.text}")
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
        logger.info(f"Generated {len(events)} events for schedule: {schedule.title} (ID: {schedule.id})")

@celery.shared_task
def cleanup_old_events():
    cutoff_date = timezone.now() - timezone.timedelta(days=90)
    old_events = Event.objects.filter(end_time__lt=cutoff_date, is_archived=False)

    archived_count = 0
    for event in old_events:
        event.is_archived = True
        event.save()
        archived_count += 1

    logger.info(f"Archived {archived_count} old events older than {cutoff_date}.")

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
            day_availabilities = []

            for member in members:
                work_schedule = member.work_schedules.filter(day_of_week=current_date.weekday()).first()
                if work_schedule:
                    start_time = timezone.make_aware(
                        timezone.datetime.combine(current_date, work_schedule.start_time), timezone.utc
                    )
                    end_time = timezone.make_aware(
                        timezone.datetime.combine(current_date, work_schedule.end_time), timezone.utc
                    )
                    day_availabilities.append((start_time, end_time))

            # Calculate common availability
            if day_availabilities:
                common_start = max(slot[0] for slot in day_availabilities)
                common_end = min(slot[1] for slot in day_availabilities)
                if common_start < common_end:
                    group_availability[current_date.isoformat()] = [(common_start.isoformat(), common_end.isoformat())]
                else:
                    group_availability[current_date.isoformat()] = []
            else:
                group_availability[current_date.isoformat()] = []

        # Assuming group.availability is a JSONField or similar
        group.availability = group_availability
        group.save()
        logger.info(f"Updated availability for group {group.id} ({group.name}).")

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

        if upcoming_events and user.email:
            event_list = "\n".join([f"- {event.title} on {event.start_time.strftime('%Y-%m-%d %H:%M')}" for event in upcoming_events])
            subject = "Your Weekly Event Summary"
            body = f"Here are your upcoming events for the next week:\n\n{event_list}"
            try:
                send_mail(
                    subject,
                    body,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
                logger.info(f"Weekly summary email sent to {user.email}")
            except Exception as e:
                logger.error(f"Failed to send weekly summary email to {user.email}: {e}")

@celery.shared_task
def sync_external_calendars():
    users = UserProfile.objects.filter(external_calendar_enabled=True)

    for user_profile in users:
        user = user_profile.user
        external_calendar_type = user_profile.external_calendar_type
        external_calendar_token = user_profile.external_calendar_token

        if not external_calendar_token:
            logger.warning(f"No external_calendar_token set for user {user.username}")
            continue

        if external_calendar_type == 'google':
            sync_google_calendar(user, external_calendar_token)
        elif external_calendar_type == 'outlook':
            sync_outlook_calendar(user, external_calendar_token)

def sync_google_calendar(user, token):
    credentials = Credentials.from_authorized_user_file(token, ['https://www.googleapis.com/auth/calendar.readonly'])

    try:
        service = build('calendar', 'v3', credentials=credentials)
        now_iso = timezone.now().isoformat()
        events_result = service.events().list(
            calendarId='primary', timeMin=now_iso,
            maxResults=100, singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])

        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))

            Event.objects.update_or_create(
                external_id=event['id'],
                created_by=user,
                defaults={
                    'title': event.get('summary', ''),
                    'description': event.get('description', ''),
                    'start_time': start,
                    'end_time': end,
                    'location': event.get('location', ''),
                }
            )

        logger.info(f"Synced {len(events)} Google events for user {user.username}.")

    except HttpError as error:
        logger.error(f'Google Calendar API error for user {user.username}: {error}')

def sync_outlook_calendar(user, token):
    try:
        account = Account(credentials=(settings.OUTLOOK_CLIENT_ID, settings.OUTLOOK_CLIENT_SECRET))
        account.connection.refresh_token = token
        account.connection.refresh_token()

        schedule = account.schedule()
        calendar = schedule.get_default_calendar()
        q = calendar.new_query('start').greater_equal(timezone.now())
        events = calendar.get_events(query=q, include_recurring=True)

        synced_count = 0
        for event in events:
            Event.objects.update_or_create(
                external_id=event.object_id,
                created_by=user,
                defaults={
                    'title': event.subject,
                    'description': event.body,
                    'start_time': event.start,
                    'end_time': event.end,
                    'location': event.location.get('displayName', '') if event.location else '',
                }
            )
            synced_count += 1

        logger.info(f"Synced {synced_count} Outlook events for user {user.username}.")
    except Exception as e:
        logger.error(f"Outlook Calendar sync error for user {user.username}: {e}")

@celery.shared_task
def check_eta_updates():
    current_time = timezone.now()
    upcoming_events = Event.objects.filter(
        start_time__gt=current_time,
        start_time__lte=current_time + timedelta(hours=1)
    )

    for event in upcoming_events:
        for attendee in event.shared_with.all():
            try:
                profile = attendee.userprofile
            except UserProfile.DoesNotExist:
                logger.warning(f"No UserProfile found for user {attendee.username} when checking ETA updates.")
                continue

            if profile.location_sharing_enabled and profile.last_known_location and event.location:
                eta = calculate_eta(profile.last_known_location, event.location)
                if eta:
                    event.eta = eta
                    event.save(update_fields=['eta'])

                    message = f"{attendee.get_full_name() or attendee.username} is estimated to arrive at {eta.strftime('%I:%M %p')} for '{event.title}'"
                    for other_attendee in event.shared_with.exclude(id=attendee.id):
                        Notification.objects.create(
                            recipient=other_attendee,
                            notification_type='eta_update',
                            message=message
                        )
                    logger.info(f"ETA update notification sent for event {event.id} to shared users.")

def calculate_eta(start_location, end_location):
    api_key = settings.GOOGLE_MAPS_API_KEY
    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={start_location}&destination={end_location}&key={api_key}"

    response = requests.get(url)
    data = response.json()

    if data.get('status') == 'OK':
        route = data['routes'][0]
        leg = route['legs'][0]
        duration = leg['duration']['value']
        eta = timezone.now() + timedelta(seconds=duration)
        return eta
    else:
        logger.warning(f"Failed to calculate ETA from {start_location} to {end_location}. API response: {data}")
        return None

def find_common_free_time(user_events, start_date, end_date):
    """
    Find common free time slots for multiple users.
    """
    all_free_times = []
    for user, events in user_events.items():
        free_times, _ = calculate_free_busy(events, start_date, end_date)
        all_free_times.append(free_times)

    if not all_free_times:
        return []

    common_free_times = all_free_times[0]
    for free_times in all_free_times[1:]:
        common_free_times = merge_free_times(common_free_times, free_times)

    return common_free_times

def merge_free_times(times1, times2):
    """
    Merge two lists of free time slots and return the intersection.
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
    This is a placeholder function; actual recurrence logic may differ.
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
