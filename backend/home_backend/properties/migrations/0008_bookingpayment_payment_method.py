# Generated manually for BookingPayment.payment_method

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0007_merge_20260405_2100'),
    ]

    operations = [
        migrations.AddField(
            model_name='bookingpayment',
            name='payment_method',
            field=models.CharField(
                choices=[('bank', 'Bank transfer'), ('momo', 'Mobile money'), ('card', 'Card')],
                default='bank',
                help_text='How the tenant paid (set when marked paid)',
                max_length=20,
            ),
        ),
    ]
