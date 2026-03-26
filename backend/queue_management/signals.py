from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='student.Student')
def add_new_student_to_queue(sender, instance, created, **kwargs):
    """Adiciona automaticamente novos alunos à fila de distribuição."""
    if created:
        from queue_management.models import StudentQueue
        StudentQueue.objects.get_or_create(
            student=instance,
            defaults={'status': StudentQueue.STATUS_PENDING, 'priority': 0},
        )
