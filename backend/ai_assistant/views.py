import logging
from celery.result import AsyncResult
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from ai_assistant.serializers import AnalysisRequestSerializer, TaskStatusSerializer
from ai_assistant.tasks import (
    run_full_analysis_task,
    run_training_analysis_task,
    run_nutrition_analysis_task,
)

logger = logging.getLogger(__name__)


def _check_openai_key():
    from django.conf import settings
    return bool(settings.OPENAI_API_KEY)


def _run_analysis(request, task_fn, crew_fn_path: str, label: str):
    serializer = AnalysisRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    if not _check_openai_key():
        return Response(
            {'error': 'OPENAI_API_KEY não configurada. Defina a variável de ambiente.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    student_id = serializer.validated_data['student_id']
    async_mode = serializer.validated_data.get('async_mode', True)

    if async_mode:
        task = task_fn.delay(student_id)
        return Response(
            {
                'task_id': task.id,
                'status': 'PENDING',
                'message': f'{label} iniciada. Consulte /api/ai/status/{task.id}/ para o resultado.',
            },
            status=status.HTTP_202_ACCEPTED,
        )

    # Execução síncrona (para desenvolvimento / testes)
    try:
        module_path, fn_name = crew_fn_path.rsplit('.', 1)
        import importlib
        module = importlib.import_module(module_path)
        crew_fn = getattr(module, fn_name)
        result = crew_fn(student_id)
        return Response({'status': 'SUCCESS', 'result': result})
    except Exception as exc:
        logger.error(f'[AI] Erro na análise síncrona: {exc}')
        return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary='Análise completa do aluno',
    description=(
        'Executa a crew completa (analista + coach + nutricionista + coordenador) '
        'para gerar um plano de ação personalizado. '
        'async_mode=true retorna imediatamente com task_id.'
    ),
    request=AnalysisRequestSerializer,
    tags=['ai'],
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def full_analysis(request):
    return _run_analysis(request, run_full_analysis_task, 'ai_assistant.crew.run_full_analysis', 'Análise completa')


@extend_schema(
    summary='Análise de treino',
    description='Agente Personal Trainer recomenda ajustes no programa de treino.',
    request=AnalysisRequestSerializer,
    tags=['ai'],
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def training_analysis(request):
    return _run_analysis(request, run_training_analysis_task, 'ai_assistant.crew.run_training_analysis', 'Análise de treino')


@extend_schema(
    summary='Análise nutricional',
    description='Agente Nutricionista recomenda ajustes na dieta.',
    request=AnalysisRequestSerializer,
    tags=['ai'],
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def nutrition_analysis(request):
    return _run_analysis(request, run_nutrition_analysis_task, 'ai_assistant.crew.run_nutrition_analysis', 'Análise nutricional')


@extend_schema(
    summary='Status de tarefa IA',
    description='Consulta o resultado de uma análise assíncrona pelo task_id.',
    responses={200: TaskStatusSerializer},
    tags=['ai'],
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_status(request, task_id):
    result = AsyncResult(task_id)
    data = {'task_id': task_id, 'status': result.status, 'result': None}
    if result.successful():
        data['result'] = result.result
    elif result.failed():
        data['error'] = str(result.result)
    return Response(data)
