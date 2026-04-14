from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import (
    MarkAllReadOutSerializer,
    NotificationSerializer,
    UnreadCountSerializer,
)
from .services import mark_all_read_for_user


class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


@extend_schema(
    tags=["Notifications"],
    summary="List notifications",
    description=(
        "Paginated notifications for the authenticated user. Response includes "
        "`unread_count` (total unread, not just this page)."
    ),
    responses={200: NotificationSerializer(many=True)},
)
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        unread_count = Notification.objects.filter(
            user=request.user, read_at__isnull=True
        ).count()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            response.data["unread_count"] = unread_count
            return response
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {
                "count": queryset.count(),
                "unread_count": unread_count,
                "results": serializer.data,
            }
        )


@extend_schema(
    tags=["Notifications"],
    summary="Unread notification count",
    description="Lightweight poll endpoint for badge counts.",
    responses={200: UnreadCountSerializer},
)
class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        n = Notification.objects.filter(
            user=request.user, read_at__isnull=True
        ).count()
        return Response({"unread_count": n})


@extend_schema(
    tags=["Notifications"],
    summary="Notification detail",
    responses={200: NotificationSerializer, 404: OpenApiResponse(description="Not found")},
)
class NotificationDetailView(generics.RetrieveAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


@extend_schema(
    tags=["Notifications"],
    summary="Mark notification as read",
    request=None,
    responses={200: NotificationSerializer, 404: OpenApiResponse(description="Not found")},
)
class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            n = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if n.read_at is None:
            n.read_at = timezone.now()
            n.save(update_fields=["read_at"])
        serializer = NotificationSerializer(n)
        return Response(serializer.data)


@extend_schema(
    tags=["Notifications"],
    summary="Mark all notifications as read",
    request=None,
    responses={200: MarkAllReadOutSerializer},
)
class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = mark_all_read_for_user(request.user)
        unread = Notification.objects.filter(
            user=request.user, read_at__isnull=True
        ).count()
        return Response({"updated": updated, "unread_count": unread})
