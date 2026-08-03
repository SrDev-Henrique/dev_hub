from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    owner_field = "author"

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(obj, self.owner_field) == request.user
