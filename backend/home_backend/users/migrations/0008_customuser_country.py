from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0007_merge_0003_otp_challenge_0006_customuser_social_urls"),
    ]

    operations = [
        migrations.AddField(
            model_name="customuser",
            name="country",
            field=models.CharField(blank=True, default="Ghana", max_length=100),
        ),
    ]
