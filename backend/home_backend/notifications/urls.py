from django.urls import path

from . import views

urlpatterns = [
    path(
        "preferences/",
        views.NotificationPreferencesView.as_view(),
        name="notification-preferences",
    ),
    path("", views.NotificationListView.as_view(), name="notification-list"),
    path(
        "unread-count/",
        views.UnreadCountView.as_view(),
        name="notification-unread-count",
    ),
    path(
        "mark-all-read/",
        views.NotificationMarkAllReadView.as_view(),
        name="notification-mark-all-read",
    ),
    path(
        "clear-all/",
        views.NotificationClearAllView.as_view(),
        name="notification-clear-all",
    ),
    path("<int:pk>/", views.NotificationDetailView.as_view(), name="notification-detail"),
    path(
        "<int:pk>/read/",
        views.NotificationMarkReadView.as_view(),
        name="notification-mark-read",
    ),
]
