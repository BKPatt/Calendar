from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from rest_framework.views import APIView

from ..models import Group, CustomUser, Invitation, Availability, Event
from ..serializers import GroupSerializer, InvitationSerializer, EventSerializer
from ..group_management import GroupInvitationManager
from ..utils import find_common_free_time

class GroupPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 100

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    pagination_class = GroupPagination

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id', None)
        
        if user_id:
            try:
                user_id = int(user_id)
                user = get_object_or_404(CustomUser, pk=user_id)
            except ValueError:
                return Group.objects.none()
        else:
            user = self.request.user

        return Group.objects.filter(Q(members=user) | Q(is_public=True))
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_permissions(self):
        if self.action in ['update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        group = serializer.save(admin=self.request.user)
        group.members.add(self.request.user)
        group.save()

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        group = self.get_object()
        if group.is_public:
            group.members.add(request.user)
            return Response({'status': 'Joined group'})
        return Response({'status': 'Group is not public'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        group = self.get_object()
        group.members.remove(request.user)
        return Response({'status': 'Left group'})

    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        user = get_object_or_404(CustomUser, pk=user_id)
        GroupInvitationManager.send_invitation(group, user)
        return Response({'status': 'Invitation sent'})

    @action(detail=True, methods=['post'])
    def respond_invitation(self, request, pk=None):
        invitation_id = request.data.get('invitation_id')
        response = request.data.get('response')
        invitation = get_object_or_404(Invitation, pk=invitation_id)
        GroupInvitationManager.process_invitation_response(invitation, response)
        return Response({'status': 'Invitation response processed'})

class GroupScheduleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        if request.user not in group.members.all():
            return Response({"error": "Not a member of this group"}, status=status.HTTP_403_FORBIDDEN)

        start_date = request.query_params.get('start_date', timezone.now().date())
        end_date = request.query_params.get('end_date', start_date + timezone.timedelta(days=30))

        events = Event.objects.filter(
            group=group,
            start_time__date__gte=start_date,
            end_time__date__lte=end_date
        ).order_by('start_time')

        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)

    def find_common_availability(self, group, start_date, end_date):
        availabilities = Availability.objects.filter(
            user__in=group.members.all(),
            start_time__gte=start_date,
            end_time__lte=end_date
        )
        common_free_time = find_common_free_time(
            {member: availabilities.filter(user=member) for member in group.members.all()},
            start_date, end_date
        )
        return common_free_time


class GroupAvailabilityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        if request.user not in group.members.all():
            return Response({"error": "Not a member of this group"}, status=status.HTTP_403_FORBIDDEN)

        start_date = request.query_params.get('start_date', timezone.now().date())
        end_date = request.query_params.get('end_date', start_date + timezone.timedelta(days=30))

        availabilities = Availability.objects.filter(
            user__in=group.members.all(),
            start_time__gte=start_date,
            end_time__lte=end_date
        )

        detailed_availability = [
            {
                'user': availability.user.username,
                'start_time': availability.start_time,
                'end_time': availability.end_time,
                'is_available': availability.is_available,
                'note': availability.note
            }
            for availability in availabilities
        ]

        return Response({'availability': detailed_availability})


class GroupMembershipView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        action = request.data.get('action')
        user_id = request.data.get('user_id')
        if action not in ['add', 'remove']:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        if group.admin != request.user:
            return Response({"error": "Not authorized to modify group membership"}, status=status.HTTP_403_FORBIDDEN)
        user = get_object_or_404(CustomUser, id=user_id)
        if action == 'add':
            group.members.add(user)
        elif action == 'remove':
            group.members.remove(user)
        group.save()
        serializer = GroupSerializer(group)
        return Response(serializer.data)


class GroupListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_groups = Group.objects.filter(members=request.user)
        public_groups = Group.objects.filter(is_public=True).exclude(members=request.user)

        user_groups_serializer = GroupSerializer(user_groups, many=True)
        public_groups_serializer = GroupSerializer(public_groups, many=True)

        return Response({
            'data': {
                'count': len(user_groups_serializer.data) + len(public_groups_serializer.data),
                'results': user_groups_serializer.data + public_groups_serializer.data
            }
        }, status=status.HTTP_200_OK)


class GroupStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        members_count = group.members.count()
        events_count = Event.objects.filter(group=group).count()
        return Response({'members_count': members_count, 'events_count': events_count})


class GroupInvitationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, group_id, user_id):
        group = get_object_or_404(Group, id=group_id)
        user = get_object_or_404(CustomUser, id=user_id)
        GroupInvitationManager.send_invitation(group, user)
        return Response({'status': 'Invitation sent successfully'}, status=status.HTTP_200_OK)


class GroupInvitationResponseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, invitation_id):
        invitation = get_object_or_404(Invitation, id=invitation_id)
        response = request.data.get('response')
        GroupInvitationManager.process_invitation_response(invitation, response)
        return Response({'status': 'Invitation response processed'}, status=status.HTTP_200_OK)
