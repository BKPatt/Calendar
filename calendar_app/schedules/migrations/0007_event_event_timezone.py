# Generated by Django 5.1.1 on 2024-12-16 15:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("schedules", "0006_alter_event_event_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="event_timezone",
            field=models.CharField(default="UTC", max_length=50),
        ),
    ]
