from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from ..models import Event, Group, CustomUser
from ..serializers import EventSerializer, GroupSerializer, UserSerializer


class SearchView(APIView):
    """
    API view to search for events, groups, and users.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Handles the search query across events, groups, and users.
        """
        query = request.query_params.get('q', '')
        if not query:
            return Response({"error": "Search query is required"}, status=400)

        events = Event.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query),
            Q(created_by=request.user) | Q(shared_with=request.user)
        )

        groups = Group.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query),
            Q(members=request.user)
        )

        users = CustomUser.objects.filter(
            Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)
        )

        return Response({
            "events": EventSerializer(events, many=True).data,
            "groups": GroupSerializer(groups, many=True).data,
            "users": UserSerializer(users, many=True).data
        })
