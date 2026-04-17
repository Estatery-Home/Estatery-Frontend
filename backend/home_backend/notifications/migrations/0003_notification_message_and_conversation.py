# Generated manually for message alerts + thread read tracking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0002_notificationpreferences"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="notification_type",
            field=models.CharField(
                choices=[
                    ("agent", "Agent"),
                    ("property_alert", "Property alert"),
                    ("expired", "Expired"),
                    ("message", "Message"),
                ],
                db_index=True,
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name="notification",
            name="related_conversation_id",
            field=models.PositiveIntegerField(blank=True, db_index=True, null=True),
        ),
    ]
