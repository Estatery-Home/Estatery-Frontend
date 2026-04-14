from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Single notification for list/detail — matches admin UI shape."""

    type = serializers.CharField(source="notification_type", read_only=True)
    unread = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = (
            "id",
            "type",
            "title",
            "body",
            "unread",
            "time",
            "created_at",
            "action_href",
            "action_label",
        )
        read_only_fields = fields

    def get_unread(self, obj: Notification) -> bool:
        return obj.read_at is None

    def get_time(self, obj: Notification) -> str:
        from django.utils.timesince import timesince

        return f"{timesince(obj.created_at)} ago"


class UnreadCountSerializer(serializers.Serializer):
    unread_count = serializers.IntegerField(min_value=0)


class MarkAllReadOutSerializer(serializers.Serializer):
    updated = serializers.IntegerField()
    unread_count = serializers.IntegerField()
