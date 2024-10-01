import requests
from django.utils import timezone
from .models import Event
from .utils import calculate_eta

class ETACalculator:
    def __init__(self, event: Event):
        self.event = event

    def calculate_and_update_eta(self):
        """
        Calculate the ETA for an event and update the event's ETA field.
        Uses the start and end locations of the user (if available) and updates the event's ETA.
        """
        start_location = self.event.created_by.userprofile.last_known_location
        end_location = self.event.location

        if not start_location or not end_location:
            raise ValueError("Both start and end locations are required to calculate ETA.")

        new_eta = calculate_eta(start_location, end_location)

        if new_eta:
            self.event.eta = new_eta
            self.event.save()
            return new_eta
        else:
            raise Exception("Failed to calculate ETA due to an issue with the external service or invalid data.")

    def get_current_eta(self):
        """
        Retrieve the current ETA without recalculating it.
        """
        return self.event.eta
