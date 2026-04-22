"""
One-time conversion of existing property images to WebP.

Usage (from backend/home_backend):
  python manage.py backfill_property_images_webp
"""

from django.core.management.base import BaseCommand

from properties.models import PropertyImage


class Command(BaseCommand):
    help = "Convert existing non-WebP PropertyImage files to WebP."

    def handle(self, *args, **options):
        total = 0
        converted = 0
        skipped = 0
        failed = 0

        rows = PropertyImage.objects.all().only("id", "image")
        for row in rows.iterator():
            total += 1
            name = (row.image.name or "").lower()
            if not name or name.endswith(".webp"):
                skipped += 1
                continue
            before_name = row.image.name
            try:
                row.save()
                after_name = row.image.name
                if after_name and after_name.lower().endswith(".webp") and after_name != before_name:
                    converted += 1
                else:
                    skipped += 1
            except Exception:
                failed += 1

        self.stdout.write(
            self.style.SUCCESS(
                (
                    "Backfill complete. "
                    f"Total={total}, Converted={converted}, Skipped={skipped}, Failed={failed}"
                )
            )
        )

