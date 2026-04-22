from django.contrib import admin

from .models import Notification, NotificationPreferences


@admin.register(NotificationPreferences)
class NotificationPreferencesAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "transaction_confirmation",
        "transaction_edited",
        "transaction_invoice",
        "transaction_cancelled",
        "transaction_refund",
        "payment_error",
        "updated_at",
    )
    raw_id_fields = ("user",)
    readonly_fields = ("updated_at",)
    search_fields = ("user__username", "user__email")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "notification_type", "related_conversation_id", "read_at", "created_at")
    list_filter = ("notification_type", "read_at")
    search_fields = ("title", "body", "user__username", "user__email")
    raw_id_fields = ("user",)
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"
