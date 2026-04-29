from django.db import migrations, models


def backfill_times_booked(apps, schema_editor):
    Property = apps.get_model('properties', 'Property')
    Booking = apps.get_model('properties', 'Booking')
    for prop in Property.objects.all().only('id'):
        count = Booking.objects.filter(
            rented_property_id=prop.id,
            status__in=['confirmed', 'active', 'completed'],
        ).count()
        Property.objects.filter(pk=prop.id).update(times_booked=count)


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0012_propertyreview_unique_user_property'),
    ]

    operations = [
        migrations.AlterField(
            model_name='property',
            name='area',
            field=models.IntegerField(blank=True, null=True, verbose_name='Area (sqm)'),
        ),
        migrations.AddField(
            model_name='property',
            name='property_condition',
            field=models.CharField(
                choices=[
                    ('newly_built', 'Newly Built'),
                    ('fairly_used', 'Fairly Used'),
                    ('used', 'Used'),
                ],
                default='fairly_used',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='property',
            name='has_prepaid_meter',
            field=models.BooleanField(default=False, verbose_name='Prepaid meter'),
        ),
        migrations.AddField(
            model_name='property',
            name='has_postpaid_meter',
            field=models.BooleanField(default=False, verbose_name='Postpaid meter'),
        ),
        migrations.AddField(
            model_name='property',
            name='has_24h_electricity',
            field=models.BooleanField(default=False, verbose_name='24-hour electricity'),
        ),
        migrations.AddField(
            model_name='property',
            name='has_kitchen_cabinets',
            field=models.BooleanField(default=False, verbose_name='Kitchen cabinets'),
        ),
        migrations.AddField(
            model_name='property',
            name='has_dining_area',
            field=models.BooleanField(default=False, verbose_name='Dining area'),
        ),
        migrations.AddField(
            model_name='property',
            name='custom_facilities',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='property',
            name='times_booked',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.RunPython(backfill_times_booked, migrations.RunPython.noop),
    ]
