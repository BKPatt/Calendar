import logging
from rest_framework import permissions
from .models import Group, Event

logger = logging.getLogger(__name__)

class IsEventOwnerOrShared(permissions.BasePermission):
    """
    Custom permission to allow only the owner of the event or users with whom the event is shared to access it.
    """

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Event):
            if obj.created_by == request.user or request.user in obj.shared_with.all():
                return True
            logger.warning(f"User {request.user.username} is neither owner nor shared_with for event {obj.id}.")
        return False


class IsGroupMember(permissions.BasePermission):
    """
    Custom permission to allow only members of a group to view group schedules and events.
    """

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Group):
            is_member = request.user in obj.members.all()
            if not is_member:
                logger.warning(f"User {request.user.username} is not a member of group {obj.id}.")
            return is_member
        elif hasattr(obj, 'group') and obj.group:
            is_member = request.user in obj.group.members.all()
            if not is_member:
                logger.warning(f"User {request.user.username} is not a member of group {obj.group.id}.")
            return is_member
        return False


class CanShareEvent(permissions.BasePermission):
    """
    Custom permission to allow only event owners to share their events with other users.
    """

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Event):
            if obj.created_by == request.user:
                return True
            logger.warning(f"User {request.user.username} attempted to share event {obj.id} without ownership.")
        return False


class CanEditGroup(permissions.BasePermission):
    """
    Custom permission to allow only group admins to edit the group details or membership.
    """

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Group):
            if obj.admin == request.user:
                return True
            logger.warning(f"User {request.user.username} attempted to edit group {obj.id} without admin rights.")
        return False


class CanViewGroupEvents(permissions.BasePermission):
    """
    Custom permission to allow group members to view events within the group.
    """

    def has_permission(self, request, view):
        group_id = view.kwargs.get('group_id')
        if group_id:
            group = Group.objects.filter(id=group_id).first()
            if group and request.user in group.members.all():
                return True
            logger.warning(f"User {request.user.username} attempted to view events of group {group_id} without membership.")
        return False


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """
    The request is authenticated as a user, or is a read-only request.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user and request.user.is_authenticated:
            return True
        logger.warning("Unauthenticated user attempted a non-read-only request.")
        return False
