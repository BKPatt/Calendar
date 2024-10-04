from rest_framework import viewsets, permissions
from django.db.models import Q
from ..models import Attachment, Event
from ..serializers import AttachmentSerializer

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Attachment.objects.filter(
            Q(uploaded_by=self.request.user) |
            Q(events__created_by=self.request.user) |
            Q(events__shared_with=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
