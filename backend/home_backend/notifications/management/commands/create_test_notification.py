"""
Create one unread in-app notification so the admin/customer bell badge can be verified.

Usage (from backend/home_backend):
  python manage.py create_test_notification --username YOUR_USER
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from notifications.models import Notification


class Command(BaseCommand):
    help = "Create one unread Notification row for testing the notification bell."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            type=str,
            required=True,
            help="Username of the user who should receive the notification.",
        )

    def handle(self, *args, **options):
        username = options["username"].strip()
        User = get_user_model()
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist as exc:
            raise CommandError(f"No user with username={username!r}") from exc

        n = Notification.objects.create(
            user=user,
            notification_type=Notification.NotificationType.AGENT,
            title="Test notification",
            body="If you see this, the notifications API and bell are wired correctly.",
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Created unread notification id={n.id} for user {user.username!r}."
            )
        )
