from django.conf import settings
from django.db import models
from django.utils import timezone


class Conversation(models.Model):
    user_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations_as_a",
    )
    user_b = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations_as_b",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user_a", "user_b"], name="unique_conversation_pair"),
            models.CheckConstraint(
                condition=models.Q(user_a_id__lt=models.F("user_b_id")),
                name="conversation_users_ordered",
            ),
        ]
        ordering = ["-updated_at"]

    @classmethod
    def get_or_create_for_pair(cls, u1, u2):
        if u1.pk == u2.pk:
            raise ValueError("Cannot create conversation with self")
        a, b = (u1, u2) if u1.pk < u2.pk else (u2, u1)
        conv, _ = cls.objects.get_or_create(user_a=a, user_b=b)
        return conv

    def other_user(self, request_user):
        if request_user.pk == self.user_a_id:
            return self.user_b
        if request_user.pk == self.user_b_id:
            return self.user_a
        return None

    def includes_user(self, user):
        return user.pk in (self.user_a_id, self.user_b_id)


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    body = models.TextField()
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["created_at"]
