from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Q

from ..models import Event, Group, CustomUser
from ..serializers import EventSerializer, GroupSerializer, UserSerializer


class SearchView(APIView):
    """
    API view to search for events, groups, and users.
    Allows an authenticated user to search their own events (created or shared),
    groups they are a member of, and all users by username, first name, or last name.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({"error": "Search query is required"}, status=status.HTTP_400_BAD_REQUEST)

        events = Event.objects.filter(
            (Q(title__icontains=query) | Q(description__icontains=query)) &
            (Q(created_by=request.user) | Q(shared_with=request.user))
        ).distinct()

        groups = Group.objects.filter(
            (Q(name__icontains=query) | Q(description__icontains=query)) &
            Q(members=request.user)
        ).distinct()

        users = CustomUser.objects.filter(
            Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)
        ).distinct()

        return Response({
            "events": EventSerializer(events, many=True).data,
            "groups": GroupSerializer(groups, many=True).data,
            "users": UserSerializer(users, many=True).data
        }, status=status.HTTP_200_OK)
