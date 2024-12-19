import logging
from datetime import timedelta
from django.utils import timezone
import zoneinfo
from .models import Event, RecurringSchedule

logger = logging.getLogger(__name__)

class RecurringEventGenerator:
    def __init__(self, recurring_schedule: RecurringSchedule):
        self.recurring_schedule = recurring_schedule

    def generate_events(self, end_date=None):
        """
        Generate recurring events based on the provided recurring schedule.
        Events will be generated until the end date or the schedule's end date.
        """
        if not self.recurring_schedule:
            logger.error("No recurring schedule provided.")
            raise ValueError("A recurring schedule is required to generate events.")

        end_date = end_date or self.recurring_schedule.end_date
        if not end_date:
            logger.error("No end date provided in either the schedule or arguments.")
            raise ValueError("An end date must be specified either in the recurring schedule or as an argument.")

        frequency_mapping = {
            'DAILY': timedelta(days=1),
            'WEEKLY': timedelta(weeks=self.recurring_schedule.interval),
            'MONTHLY': timedelta(days=30 * self.recurring_schedule.interval),
            'YEARLY': timedelta(days=365 * self.recurring_schedule.interval)
        }

        events = []
        current_date = self.recurring_schedule.start_date

        # Determine timezone
        event_tz = self.recurring_schedule.user.userprofile.timezone if hasattr(self.recurring_schedule.user, 'userprofile') else 'UTC'
        tz = zoneinfo.ZoneInfo(event_tz)

        while current_date <= end_date:
            start_dt = timezone.datetime.combine(current_date, self.recurring_schedule.start_time)
            end_dt = timezone.datetime.combine(current_date, self.recurring_schedule.end_time)

            # Make datetimes aware
            if timezone.is_naive(start_dt):
                start_dt = timezone.make_aware(start_dt, tz)
            if timezone.is_naive(end_dt):
                end_dt = timezone.make_aware(end_dt, tz)

            event = Event(
                title=self.recurring_schedule.title,
                description=self.recurring_schedule.description,
                start_time=start_dt,
                end_time=end_dt,
                location=self.recurring_schedule.location,
                created_by=self.recurring_schedule.user,
                recurring=True,
                recurrence_rule={
                    'frequency': self.recurring_schedule.frequency,
                    'interval': self.recurring_schedule.interval,
                    'days_of_week': self.recurring_schedule.days_of_week,
                },
                recurring_schedule=self.recurring_schedule,
                event_timezone=event_tz
            )

            try:
                event.save()
                events.append(event)
                logger.info(f"Created recurring event {event.id} for date {current_date}")
            except Exception as e:
                logger.error(f"Failed to create recurring event for date {current_date}: {e}")

            increment = frequency_mapping.get(self.recurring_schedule.frequency, timedelta(days=1))
            current_date += increment

        return events
