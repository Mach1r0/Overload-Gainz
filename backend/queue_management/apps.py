from django.apps import AppConfig


class QueueManagementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'queue_management'
    verbose_name = 'Gestão de Fila'

    def ready(self):
        import queue_management.signals  # noqa: F401
