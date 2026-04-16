from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_alter_customuser_id"),
        ("users", "0002_otp_challenge"),
    ]

    operations = []
