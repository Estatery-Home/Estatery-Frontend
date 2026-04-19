"""Wishlist status-change notifications."""

from __future__ import annotations

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from notifications.models import Notification
from notifications.services import create_notification

from .models import Property, PropertyWishlist

STATUS_LABELS = {
    "available": "Available",
    "rented": "Rented",
    "maintenance": "Under maintenance",
}


@receiver(pre_save, sender=Property)
def property_stash_old_status_for_wishlist(sender, instance: Property, **kwargs):
    """Store DB status before save so post_save can detect listing status transitions."""
    if not instance.pk:
        instance._wishlist_prev_status = None
        return
    try:
        prev = Property.objects.only("status").get(pk=instance.pk)
        instance._wishlist_prev_status = prev.status
    except Property.DoesNotExist:
        instance._wishlist_prev_status = None


@receiver(post_save, sender=Property)
def property_notify_wishlist_on_status_change(sender, instance: Property, created: bool, **kwargs):
    if created:
        return
    old = getattr(instance, "_wishlist_prev_status", None)
    if old is None or old == instance.status:
        return

    new = instance.status
    old_label = STATUS_LABELS.get(old, old)
    new_label = STATUS_LABELS.get(new, new)
    title = f'Listing update: "{instance.title}"'
    body = f"This saved property is now {new_label} (was {old_label})."
    href = f"/properties/{instance.pk}"

    qs = (
        PropertyWishlist.objects.filter(property=instance)
        .select_related("user")
        .exclude(user_id=instance.owner_id)
    )
    for row in qs:
        create_notification(
            user=row.user,
            notification_type=Notification.NotificationType.PROPERTY_ALERT,
            title=title,
            body=body,
            action_href=href,
            action_label="View listing",
        )
