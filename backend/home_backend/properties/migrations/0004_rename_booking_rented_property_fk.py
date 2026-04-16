# Align legacy SQLite column rented_property_id with Booking.property_rented
# (Django expects property_rented_id).

from django.db import migrations


def forwards(apps, schema_editor):
    connection = schema_editor.connection
    if connection.vendor != "sqlite":
        return
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(properties_booking)")
        cols = {row[1] for row in cursor.fetchall()}
        if "rented_property_id" in cols and "property_rented_id" not in cols:
            cursor.execute(
                "ALTER TABLE properties_booking RENAME COLUMN rented_property_id TO property_rented_id"
            )


def backwards(apps, schema_editor):
    connection = schema_editor.connection
    if connection.vendor != "sqlite":
        return
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(properties_booking)")
        cols = {row[1] for row in cursor.fetchall()}
        if "property_rented_id" in cols and "rented_property_id" not in cols:
            cursor.execute(
                "ALTER TABLE properties_booking RENAME COLUMN property_rented_id TO rented_property_id"
            )


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0003_property_listing_type"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
