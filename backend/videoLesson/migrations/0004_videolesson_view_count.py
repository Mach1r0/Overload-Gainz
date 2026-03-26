from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('videoLesson', '0003_alter_videolesson_category'),
    ]

    operations = [
        migrations.AddField(
            model_name='videolesson',
            name='view_count',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
