from channels.generic.websocket import AsyncWebsocketConsumer
import json

class EventConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.event_id = self.scope['url_route']['kwargs']['event_id']
        self.group_name = f'event_{self.event_id}'

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def event_eta_update(self, event):
        await self.send(text_data=json.dumps({
            'event_id': event['event_id'],
            'eta': event['eta'],
            'message': event['message']
        }))
