from django.conf import settings
from django.db import models


class NotificationPreferences(models.Model):
    """
    Email/push-style toggles for transaction-related alerts (Settings → Notifications).
    Matches admin UI keys via API snake_case field names.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
    )
    transaction_confirmation = models.BooleanField(default=True)
    transaction_edited = models.BooleanField(default=False)
    transaction_invoice = models.BooleanField(default=True)
    transaction_cancelled = models.BooleanField(default=True)
    transaction_refund = models.BooleanField(default=True)
    payment_error = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Notification preferences"

    def __str__(self):
        return f"NotificationPreferences({self.user_id})"


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        AGENT = "agent", "Agent"
        PROPERTY_ALERT = "property_alert", "Property alert"
        EXPIRED = "expired", "Expired"
        MESSAGE = "message", "Message"
        CALENDAR = "calendar", "Calendar"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    notification_type = models.CharField(
        max_length=32,
        choices=NotificationType.choices,
        db_index=True,
    )
    related_conversation_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        db_index=True,
        help_text="For message-type alerts: conversation id; cleared when recipient opens the thread.",
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True, db_index=True)
    action_href = models.CharField(max_length=500, blank=True)
    action_label = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "read_at"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.user_id})"
