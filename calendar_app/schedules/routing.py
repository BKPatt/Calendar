from django.urls import re_path
from .consumers import EventConsumer

# Define WebSocket URL patterns for event-based real-time updates
websocket_urlpatterns = [
    # Route to handle WebSocket connections for event updates (e.g., ETA updates)
    re_path(r'ws/event/(?P<event_id>\d+)/$', EventConsumer.as_asgi()),
]
