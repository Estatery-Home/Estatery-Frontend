"""Shared calendar API (ScheduleEvent) for customer and admin apps."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import generics, permissions, serializers
from rest_framework.exceptions import ValidationError

from notifications.models import Notification
from notifications.services import create_notification
from users.serializers import UserSerializer

from .models import ScheduleEvent

User = get_user_model()
CALENDAR_NOTIFICATION = Notification.NotificationType.CALENDAR


def _can_invite_pair(actor: User, target: User) -> bool:
    if actor.pk == target.pk:
        return True
    if getattr(actor, "is_staff", False) or getattr(actor, "user_type", None) in ("admin", "owner"):
        return True
    if getattr(target, "is_staff", False) or getattr(target, "user_type", None) in ("admin", "owner"):
        return True
    return False


def notify_calendar_participants(event: ScheduleEvent, actor: User, *, created: bool) -> None:
    verb = "added" if created else "updated"
    recipient_ids = set(event.participants.values_list("id", flat=True))
    recipient_ids.add(event.created_by_id)
    recipient_ids.discard(actor.id)
    for rid in recipient_ids:
        ru = User.objects.filter(pk=rid).first()
        if not ru:
            continue
        create_notification(
            user=ru,
            notification_type=CALENDAR_NOTIFICATION,
            title=f"Calendar: {event.title}",
            body=(
                f"{actor.username} {verb} “{event.title}” "
                f"({timezone.localtime(event.starts_at).strftime('%Y-%m-%d %H:%M')})."
            ),
            action_href="/dashboard/calendar",
            action_label="Open calendar",
        )


class ScheduleEventSerializer(serializers.ModelSerializer):
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False,
        default=list,
    )
    participant_user_ids = serializers.SerializerMethodField(read_only=True)
    created_by_detail = UserSerializer(source="created_by", read_only=True)

    class Meta:
        model = ScheduleEvent
        fields = (
            "id",
            "title",
            "description",
            "starts_at",
            "ends_at",
            "created_by",
            "created_by_detail",
            "participant_ids",
            "participant_user_ids",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_by",
            "created_at",
            "updated_at",
            "created_by_detail",
            "participant_user_ids",
        )

    def get_participant_user_ids(self, obj: ScheduleEvent) -> list[int]:
        return list(obj.participants.values_list("id", flat=True))

    def validate(self, attrs):
        inst = self.instance
        starts = attrs.get("starts_at", getattr(inst, "starts_at", None) if inst else None)
        ends = attrs.get("ends_at", getattr(inst, "ends_at", None) if inst else None)
        if starts and ends and ends <= starts:
            raise ValidationError({"ends_at": "End time must be after start time."})

        pids = attrs.get("participant_ids")
        request = self.context.get("request")
        if pids is not None and request and request.user.is_authenticated:
            user = request.user
            for uid in pids:
                tgt = User.objects.filter(pk=uid).first()
                if not tgt:
                    raise ValidationError({"participant_ids": f"Unknown user id {uid}."})
                if not _can_invite_pair(user, tgt):
                    raise ValidationError(
                        {
                            "participant_ids": (
                                "You can only include yourself, staff, or listing owners "
                                "(admins may add any user)."
                            )
                        }
                    )
        return attrs

    def create(self, validated_data):
        pids = validated_data.pop("participant_ids", [])
        user = self.context["request"].user
        event = ScheduleEvent.objects.create(created_by=user, **validated_data)
        event.participants.add(user)
        for uid in pids:
            if uid != user.id:
                other = User.objects.filter(pk=uid).first()
                if other:
                    event.participants.add(other)
        return event

    def update(self, instance, validated_data):
        pids = validated_data.pop("participant_ids", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if pids is not None:
            instance.participants.clear()
            instance.participants.add(instance.created_by)
            for uid in pids:
                if uid != instance.created_by_id:
                    other = User.objects.filter(pk=uid).first()
                    if other:
                        instance.participants.add(other)
        return instance


class CanAccessScheduleEvent(permissions.BasePermission):
    def has_object_permission(self, request, view, obj: ScheduleEvent) -> bool:
        u = request.user
        if not u.is_authenticated:
            return False
        if getattr(u, "is_staff", False) or getattr(u, "user_type", None) == "admin":
            return True
        if obj.created_by_id == u.id:
            return True
        return obj.participants.filter(pk=u.id).exists()


class ScheduleEventListCreateView(generics.ListCreateAPIView):
    serializer_class = ScheduleEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        u = self.request.user
        qs = (
            ScheduleEvent.objects.select_related("created_by")
            .prefetch_related("participants")
            .order_by("starts_at")
        )
        start = self.request.query_params.get("start")
        end = self.request.query_params.get("end")
        if start:
            sd = parse_date(start)
            if sd:
                qs = qs.filter(ends_at__date__gte=sd)
        if end:
            ed = parse_date(end)
            if ed:
                qs = qs.filter(starts_at__date__lte=ed)
        if getattr(u, "is_staff", False) or getattr(u, "user_type", None) == "admin":
            return qs
        return qs.filter(Q(created_by=u) | Q(participants=u)).distinct()

    def perform_create(self, serializer):
        event = serializer.save()
        notify_calendar_participants(event, self.request.user, created=True)


class ScheduleEventDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ScheduleEventSerializer
    permission_classes = [permissions.IsAuthenticated, CanAccessScheduleEvent]

    def get_queryset(self):
        return ScheduleEvent.objects.select_related("created_by").prefetch_related("participants")

    def perform_update(self, serializer):
        event = serializer.save()
        notify_calendar_participants(event, self.request.user, created=False)

    def perform_destroy(self, instance):
        actor = self.request.user
        recipient_ids = set(instance.participants.values_list("id", flat=True))
        recipient_ids.add(instance.created_by_id)
        recipient_ids.discard(actor.id)
        title = instance.title
        super().perform_destroy(instance)
        for rid in recipient_ids:
            ru = User.objects.filter(pk=rid).first()
            if ru:
                create_notification(
                    user=ru,
                    notification_type=CALENDAR_NOTIFICATION,
                    title=f"Calendar: {title}",
                    body=f"{actor.username} removed “{title}”.",
                    action_href="/dashboard/calendar",
                    action_label="Open calendar",
                )
