"""Create in-app notifications for use from signals or other apps."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Notification

User = get_user_model()


def create_notification(
    *,
    user: User,
    notification_type: str,
    title: str,
    body: str,
    action_href: str = "",
    action_label: str = "",
) -> Notification:
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        body=body,
        action_href=action_href or "",
        action_label=action_label or "",
    )


def mark_all_read_for_user(user: User) -> int:
    """Set read_at for all unread notifications. Returns number updated."""
    qs = Notification.objects.filter(user=user, read_at__isnull=True)
    now = timezone.now()
    count = qs.update(read_at=now)
    return count
