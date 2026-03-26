"""Tarefas Celery para execução assíncrona das Crews IA."""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, soft_time_limit=300, time_limit=360)
def run_full_analysis_task(self, student_id: int):
    from ai_assistant.crew import run_full_analysis
    try:
        result = run_full_analysis(student_id)
        logger.info(f'[AI] Análise completa do aluno {student_id} concluída.')
        return {'status': 'success', 'result': result}
    except Exception as exc:
        logger.error(f'[AI] Falha na análise completa do aluno {student_id}: {exc}')
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=2, soft_time_limit=180, time_limit=240)
def run_training_analysis_task(self, student_id: int):
    from ai_assistant.crew import run_training_analysis
    try:
        return {'status': 'success', 'result': run_training_analysis(student_id)}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=2, soft_time_limit=180, time_limit=240)
def run_nutrition_analysis_task(self, student_id: int):
    from ai_assistant.crew import run_nutrition_analysis
    try:
        return {'status': 'success', 'result': run_nutrition_analysis(student_id)}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)
