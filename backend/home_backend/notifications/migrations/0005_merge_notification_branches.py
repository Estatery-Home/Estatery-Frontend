# Merge duplicate heads from 0002: 0003_alter_notification_notification_type vs
# 0003_notification_message_and_conversation -> 0004 chain.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0003_alter_notification_notification_type"),
        ("notifications", "0004_alter_notification_related_conversation_id"),
    ]

    operations = []
