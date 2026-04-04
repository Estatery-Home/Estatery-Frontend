# Align SQLite column with Booking.rented_property (expects rented_property_id).

from django.db import migrations


def forwards(apps, schema_editor):
    if schema_editor.connection.vendor != "sqlite":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(properties_booking)")
        cols = {row[1] for row in cursor.fetchall()}
        if "property_rented_id" in cols and "rented_property_id" not in cols:
            cursor.execute(
                "ALTER TABLE properties_booking RENAME COLUMN property_rented_id TO rented_property_id"
            )


def backwards(apps, schema_editor):
    if schema_editor.connection.vendor != "sqlite":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(properties_booking)")
        cols = {row[1] for row in cursor.fetchall()}
        if "rented_property_id" in cols and "property_rented_id" not in cols:
            cursor.execute(
                "ALTER TABLE properties_booking RENAME COLUMN rented_property_id TO property_rented_id"
            )


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0005_merge_20260328_2258"),
        ("properties", "0004_rename_booking_rented_property_fk"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
