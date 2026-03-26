import logging
import os

from celery import Celery
from celery.signals import task_failure, task_retry, task_success

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('overload_gainz')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

logger = logging.getLogger('celery.task')


@task_success.connect
def on_task_success(sender=None, result=None, **kwargs):
    logger.info('[Celery] task=%s status=SUCCESS result=%r', sender.name, result)


@task_failure.connect
def on_task_failure(sender=None, task_id=None, exception=None, traceback=None, **kwargs):
    logger.error(
        '[Celery] task=%s task_id=%s status=FAILURE exception=%r',
        sender.name, task_id, exception,
    )


@task_retry.connect
def on_task_retry(sender=None, reason=None, **kwargs):
    logger.warning('[Celery] task=%s status=RETRY reason=%r', sender.name, reason)
