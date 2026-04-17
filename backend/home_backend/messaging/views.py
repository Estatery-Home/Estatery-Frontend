from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import Notification
from notifications.services import create_notification

from .models import Conversation, Message
from .serializers import (
    ConversationListSerializer,
    MessageSerializer,
    OpenConversationSerializer,
)

User = get_user_model()


class ConversationListView(generics.ListAPIView):
    """List conversations for the current user (most recently updated first)."""

    serializer_class = ConversationListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(Q(user_a=user) | Q(user_b=user)).order_by("-updated_at")


class OpenConversationView(APIView):
    """
    POST { "user_id": <int> } — get or create a 1:1 conversation with that user.
    Returns conversation id and other_user (for opening the thread in the UI).
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = OpenConversationSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        other = get_object_or_404(User, pk=ser.validated_data["user_id"])
        if other.pk == request.user.pk:
            return Response(
                {"detail": "Cannot start a conversation with yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        conv = Conversation.get_or_create_for_pair(request.user, other)
        data = ConversationListSerializer(conv, context={"request": request}).data
        return Response({"conversation": data}, status=status.HTTP_200_OK)


class ConversationMessagesView(APIView):
    """GET list messages / POST new message in a conversation."""

    permission_classes = [permissions.IsAuthenticated]

    def get_conversation(self, conversation_id):
        conv = get_object_or_404(Conversation, pk=conversation_id)
        if not conv.includes_user(self.request.user):
            return None
        return conv

    def get(self, request, conversation_id):
        conv = self.get_conversation(conversation_id)
        if not conv:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        qs = conv.messages.select_related("sender").order_by("created_at")
        return Response(MessageSerializer(qs, many=True).data)

    def post(self, request, conversation_id):
        conv = self.get_conversation(conversation_id)
        if not conv:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        body = (request.data.get("body") or "").strip()
        if not body:
            return Response({"detail": "Message body is required."}, status=status.HTTP_400_BAD_REQUEST)
        msg = Message.objects.create(conversation=conv, sender=request.user, body=body)
        conv.save(update_fields=["updated_at"])

        recipient = conv.other_user(request.user)
        if recipient is not None:
            preview = body[:500] + ("…" if len(body) > 500 else "")
            create_notification(
                user=recipient,
                notification_type=Notification.NotificationType.MESSAGE,
                title=f"New message from {request.user.get_username()}",
                body=preview,
                action_href=f"/dashboard/messages?conversationId={conv.id}",
                action_label="Open messages",
            )

        return Response(
            {
                "message": "Sent.",
                "message_obj": MessageSerializer(msg).data,
            },
            status=status.HTTP_201_CREATED,
        )
