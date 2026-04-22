from django.contrib import admin
from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ("sender", "body", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user_a", "user_b", "updated_at")
    search_fields = ("user_a__username", "user_a__email", "user_b__username", "user_b__email")
    raw_id_fields = ("user_a", "user_b")
    date_hierarchy = "updated_at"
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "created_at", "body_preview")
    list_filter = ("created_at",)
    search_fields = ("body", "sender__username", "sender__email")
    raw_id_fields = ("conversation", "sender")
    date_hierarchy = "created_at"

    @admin.display(description="Body")
    def body_preview(self, obj):
        return (obj.body[:60] + "…") if len(obj.body) > 60 else obj.body
