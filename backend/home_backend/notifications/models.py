from django.conf import settings
from django.db import models


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        AGENT = "agent", "Agent"
        PROPERTY_ALERT = "property_alert", "Property alert"
        EXPIRED = "expired", "Expired"

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
