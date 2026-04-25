from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller == request.user


class CanModifyProductByStatus(permissions.BasePermission):
    """
    Продавец может изменять товар в любом статусе.
    """

    message = 'Нельзя изменить этот товар.'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return True