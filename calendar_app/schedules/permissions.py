from rest_framework import permissions
from .models import Group, Event

class IsEventOwnerOrShared(permissions.BasePermission):
    """
    Custom permission to allow only the owner of the event or users with whom the event is shared to access it.
    """

    def has_object_permission(self, request, view, obj):
        # Allow access if the event is created by the user or shared with the user
        if isinstance(obj, Event):
            return obj.created_by == request.user or request.user in obj.shared_with.all()
        return False


class IsGroupMember(permissions.BasePermission):
    """
    Custom permission to allow only members of a group to view group schedules and events.
    """

    def has_object_permission(self, request, view, obj):
        # Only group members can view or access group schedules and events
        if isinstance(obj, Group):
            return request.user in obj.members.all()
        elif hasattr(obj, 'group'):  # Check if the object has a group and the user is a member of it
            return obj.group and request.user in obj.group.members.all()
        return False


class CanShareEvent(permissions.BasePermission):
    """
    Custom permission to allow only event owners to share their events with other users.
    """

    def has_object_permission(self, request, view, obj):
        # Only event creators can share events
        if isinstance(obj, Event):
            return obj.created_by == request.user
        return False


class CanEditGroup(permissions.BasePermission):
    """
    Custom permission to allow only group admins to edit the group details or membership.
    """

    def has_object_permission(self, request, view, obj):
        # Only group admin can modify group details or membership
        if isinstance(obj, Group):
            return obj.admin == request.user
        return False


class CanViewGroupEvents(permissions.BasePermission):
    """
    Custom permission to allow group members to view events within the group.
    """

    def has_permission(self, request, view):
        # Check if the user is a member of the group based on the group_id from the URL
        group_id = view.kwargs.get('group_id')
        if group_id:
            group = Group.objects.filter(id=group_id).first()
            return group and request.user in group.members.all()
        return False


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """
    The request is authenticated as a user, or is a read-only request.
    """

    def has_permission(self, request, view):
        # Allow read-only permissions for safe methods (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are allowed only to authenticated users
        return request.user and request.user.is_authenticated
