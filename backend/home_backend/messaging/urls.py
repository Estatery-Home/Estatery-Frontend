from django.urls import path

from . import views

urlpatterns = [
    path("conversations/", views.ConversationListView.as_view(), name="message-conversations"),
    path("conversations/open/", views.OpenConversationView.as_view(), name="message-conversation-open"),
    path(
        "conversations/<int:conversation_id>/messages/",
        views.ConversationMessagesView.as_view(),
        name="message-conversation-messages",
    ),
]
