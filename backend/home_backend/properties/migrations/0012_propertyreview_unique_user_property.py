from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0011_scheduleevent'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='propertyreview',
            constraint=models.UniqueConstraint(
                fields=('user', 'property'),
                name='uniq_propertyreview_user_property',
            ),
        ),
    ]

