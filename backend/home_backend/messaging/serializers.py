from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Conversation, Message

User = get_user_model()


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)
    sender_username = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = Message
        fields = ("id", "conversation", "sender_id", "sender_username", "body", "created_at")
        read_only_fields = ("id", "conversation", "sender_id", "sender_username", "created_at")


class OtherUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "phone")


class ConversationListSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ("id", "other_user", "last_message", "updated_at")

    def get_other_user(self, obj):
        user = self.context["request"].user
        other = obj.other_user(user)
        if not other:
            return None
        return OtherUserSerializer(other).data

    def get_last_message(self, obj):
        m = obj.messages.order_by("-created_at").first()
        if not m:
            return None
        return {
            "body": m.body[:200] + ("…" if len(m.body) > 200 else ""),
            "created_at": m.created_at.isoformat(),
            "sender_id": m.sender_id,
        }


class OpenConversationSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    username = serializers.CharField(required=False, allow_blank=True, max_length=150, trim_whitespace=True)

    def validate(self, attrs):
        uid = attrs.get("user_id")
        has_id = uid is not None
        raw = attrs.get("username")
        uname = (raw or "").strip() if isinstance(raw, str) else ""
        attrs["username"] = uname

        if has_id and uname:
            raise serializers.ValidationError(
                {"detail": "Provide either user_id or username, not both."}
            )
        if not has_id and not uname:
            raise serializers.ValidationError(
                {"detail": "Either user_id or username is required."}
            )
        return attrs
