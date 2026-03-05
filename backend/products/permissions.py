from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller == request.user


class CanModifyProductByStatus(permissions.BasePermission):
    """
    Продавец может изменять/удалять товар только если статус:
    draft, rejected, archived.
    """

    ALLOWED_STATUSES = ['draft', 'rejected', 'archived']
    message = 'Нельзя изменить этот товар.'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if obj.status in self.ALLOWED_STATUSES:
            return True

        if obj.status == 'pending_review':
            self.message = 'Нельзя редактировать товар, пока он находится на модерации.'
            return False

        if obj.status == 'published':
            self.message = 'Нельзя редактировать опубликованный товар. Сначала снимите его с публикации.'
            return False

        self.message = 'Редактирование этого товара сейчас недоступно.'
        return False