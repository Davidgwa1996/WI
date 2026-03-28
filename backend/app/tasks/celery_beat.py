from celery import Celery
from celery.schedules import crontab

app = Celery('tasks', broker='redis://localhost:6379/0')
app.conf.beat_schedule = {
    'update-projects-every-5-min': {
        'task': 'app.tasks.scraper_tasks.update_all_projects',
        'schedule': crontab(minute='*/5'),
    },
}