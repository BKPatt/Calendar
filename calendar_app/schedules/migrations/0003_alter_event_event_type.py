# Generated by Django 5.0.1 on 2024-10-02 21:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("schedules", "0002_event_is_all_day"),
    ]

    operations = [
        migrations.AlterField(
            model_name="event",
            name="event_type",
            field=models.CharField(
                choices=[
                    ("meeting", "Meeting"),
                    ("appointment", "Appointment"),
                    ("reminder", "Reminder"),
                    ("work", "Work"),
                    ("other", "Other"),
                ],
                default="other",
                max_length=20,
            ),
        ),
    ]
