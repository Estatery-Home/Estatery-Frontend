# Generated manually for Booking.tenant_payment_channel

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0008_bookingpayment_payment_method"),
    ]

    operations = [
        migrations.AddField(
            model_name="booking",
            name="tenant_payment_channel",
            field=models.CharField(
                choices=[
                    ("momo_card", "Mobile money or card (online checkout)"),
                    ("offline", "Bank transfer or cash (host confirms payment)"),
                ],
                default="offline",
                help_text="momo_card: online checkout; offline: bank/cash, host marks paid when received",
                max_length=20,
            ),
        ),
    ]
