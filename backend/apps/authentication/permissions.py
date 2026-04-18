"""
Reusable DRF permission classes for role-based access control.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to admin users."""
    message = 'Admin access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsSupervisor(BasePermission):
    """Allow access to supervisors and admins."""
    message = 'Supervisor or admin access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('supervisor', 'admin')
        )


class IsStudentOrStaff(BasePermission):
    """Allow access to any authenticated user (student/staff, supervisor, admin)."""
    message = 'Authentication required.'

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
