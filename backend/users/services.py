from .models import UserNotification, UserPreference


def create_notification(user, kind, title, message='', link='', preference_field=None):
    if not user:
        return None

    preferences, _ = UserPreference.objects.get_or_create(user=user)
    if preference_field and not getattr(preferences, preference_field, True):
        return None

    return UserNotification.objects.create(
        user=user,
        kind=kind,
        title=title,
        message=message,
        link=link,
    )
