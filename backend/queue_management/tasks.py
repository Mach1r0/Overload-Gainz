import logging
from celery import shared_task
from django.db import models as django_models
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_student_queue(self, teacher_id=None):
    """
    Processa alunos pendentes na fila e os distribui entre os professores disponíveis.

    Lógica:
    - Se teacher_id informado: todos os pendentes vão para este professor.
    - Caso contrário: round-robin priorizando professores com menos alunos ativos.
    - Se o aluno solicitou um professor específico, esse é respeitado.
    """
    from queue_management.models import StudentQueue
    from teachers.models import Teacher, TeacherStudents

    pending = StudentQueue.objects.filter(
        status=StudentQueue.STATUS_PENDING
    ).select_related('student__user', 'requested_trainer__user')

    if not pending.exists():
        logger.info('[Queue] Nenhum aluno pendente.')
        return {'assigned': 0, 'failed': 0, 'skipped': 0}

    if teacher_id:
        trainers = list(Teacher.objects.filter(id=teacher_id))
    else:
        trainers = list(
            Teacher.objects.annotate(
                active_count=django_models.Count(
                    'students',
                    filter=django_models.Q(students__is_active=True),
                )
            ).order_by('active_count')
        )

    if not trainers:
        logger.warning('[Queue] Nenhum professor disponível.')
        return {'assigned': 0, 'failed': 0, 'skipped': pending.count()}

    assigned = failed = 0
    trainer_index = 0

    for entry in pending:
        try:
            entry.status = StudentQueue.STATUS_PROCESSING
            entry.save(update_fields=['status', 'updated_at'])

            if entry.requested_trainer and not teacher_id:
                trainer = entry.requested_trainer
            else:
                trainer = trainers[trainer_index % len(trainers)]
                trainer_index += 1

            TeacherStudents.objects.get_or_create(
                teacher=trainer,
                student=entry.student,
                defaults={'is_active': True},
            )

            entry.status = StudentQueue.STATUS_ASSIGNED
            entry.assigned_trainer = trainer
            entry.assigned_at = timezone.now()
            entry.save(update_fields=['status', 'assigned_trainer', 'assigned_at', 'updated_at'])
            assigned += 1

            logger.info(f'[Queue] {entry.student.user.username} → {trainer.user.username}')

        except Exception as exc:
            logger.error(f'[Queue] Falha ao distribuir {entry.student}: {exc}')
            entry.status = StudentQueue.STATUS_FAILED
            entry.save(update_fields=['status', 'updated_at'])
            failed += 1
            raise self.retry(exc=exc)

    logger.info(f'[Queue] Processamento concluído — atribuídos: {assigned}, falhas: {failed}')
    return {'assigned': assigned, 'failed': failed, 'skipped': 0}


@shared_task
def add_student_to_queue(student_id: int, priority: int = 0, requested_trainer_id: int = None):
    """Adiciona um aluno à fila de distribuição."""
    from queue_management.models import StudentQueue
    from student.models import Student

    try:
        student = Student.objects.get(id=student_id)
    except Student.DoesNotExist:
        logger.error(f'[Queue] Aluno {student_id} não encontrado.')
        return {'error': 'Aluno não encontrado.'}

    entry, created = StudentQueue.objects.get_or_create(
        student=student,
        defaults={'priority': priority, 'status': StudentQueue.STATUS_PENDING},
    )

    # Re-enfileira se já estava atribuído (pedido de reatribuição)
    if not created and entry.status == StudentQueue.STATUS_ASSIGNED:
        entry.status = StudentQueue.STATUS_PENDING
        entry.assigned_trainer = None
        entry.assigned_at = None
        entry.priority = priority
        entry.save()
        created = True

    if requested_trainer_id:
        from teachers.models import Teacher
        try:
            trainer = Teacher.objects.get(id=requested_trainer_id)
            entry.requested_trainer = trainer
            entry.save(update_fields=['requested_trainer', 'updated_at'])
        except Teacher.DoesNotExist:
            pass

    return {'created': created, 'queue_id': entry.id}
