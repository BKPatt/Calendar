from datetime import timedelta
from django.utils import timezone
from .models import Event, RecurringSchedule

class RecurringEventGenerator:
    def __init__(self, recurring_schedule: RecurringSchedule):
        self.recurring_schedule = recurring_schedule

    def generate_events(self, end_date=None):
        """
        Generate recurring events based on the provided recurring schedule.
        Events will be generated until the end date or the schedule's end date.
        """
        events = []
        current_date = self.recurring_schedule.start_date
        end_date = end_date or self.recurring_schedule.end_date

        if not end_date:
            raise ValueError("An end date must be specified either in the recurring schedule or as an argument.")

        # Map frequency strings to corresponding timedelta intervals
        frequency_mapping = {
            'DAILY': timedelta(days=1),
            'WEEKLY': timedelta(weeks=self.recurring_schedule.interval),
            'MONTHLY': timedelta(days=30 * self.recurring_schedule.interval),  # Approximation for simplicity
            'YEARLY': timedelta(days=365 * self.recurring_schedule.interval)
        }

        while current_date <= end_date:
            # Create an event for the current recurrence
            start_time = timezone.datetime.combine(current_date, self.recurring_schedule.start_time)
            end_time = timezone.datetime.combine(current_date, self.recurring_schedule.end_time)

            event = Event(
                title=self.recurring_schedule.title,
                description=self.recurring_schedule.description,
                start_time=start_time,
                end_time=end_time,
                location=self.recurring_schedule.location,
                created_by=self.recurring_schedule.user,
                recurring=True,
                recurrence_rule={
                    'frequency': self.recurring_schedule.frequency,
                    'interval': self.recurring_schedule.interval,
                },
                recurring_schedule=self.recurring_schedule,
                group=None,
            )

            event.save()
            events.append(event)

            # Advance the current_date based on the frequency
            current_date += frequency_mapping.get(self.recurring_schedule.frequency, timedelta(days=1))

        return events
