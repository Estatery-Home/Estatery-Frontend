from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "notification_type", "read_at", "created_at")
    list_filter = ("notification_type", "read_at")
    search_fields = ("title", "body", "user__username", "user__email")
    raw_id_fields = ("user",)
    readonly_fields = ("created_at",)
