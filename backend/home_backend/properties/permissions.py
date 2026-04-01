from rest_framework import permissions


class IsAdminUserType(permissions.BasePermission):
    """Allow staff or users with user_type == admin."""

    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if getattr(u, "is_staff", False):
            return True
        return getattr(u, "user_type", None) == "admin"
