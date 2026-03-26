import logging
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from queue_management.models import StudentQueue
from queue_management.serializers import (
    StudentQueueSerializer,
    ManualAssignSerializer,
    ProcessQueueSerializer,
    AddToQueueSerializer,
)
from queue_management.tasks import process_student_queue, add_student_to_queue

logger = logging.getLogger(__name__)


@extend_schema(
    summary='Listar fila de alunos',
    description='Retorna os alunos na fila. Filtre por ?status=PENDING|ASSIGNED|FAILED.',
    tags=['queue'],
    responses={200: StudentQueueSerializer(many=True)},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def queue_list(request):
    status_filter = request.query_params.get('status')
    qs = StudentQueue.objects.select_related(
        'student__user', 'assigned_trainer__user', 'requested_trainer__user'
    )
    if status_filter:
        qs = qs.filter(status=status_filter.upper())
    return Response(StudentQueueSerializer(qs, many=True).data)


@extend_schema(
    summary='Estatísticas da fila',
    description='Contagens por status e total (cache 60s).',
    tags=['queue'],
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def queue_stats(request):
    stats = cache.get('og:queue:stats')
    if not stats:
        stats = {s: StudentQueue.objects.filter(status=s).count() for s, _ in StudentQueue.STATUS_CHOICES}
        stats['total'] = StudentQueue.objects.count()
        cache.set('og:queue:stats', stats, 60)
    return Response(stats)


@extend_schema(
    summary='Processar fila automaticamente',
    description=(
        'Dispara tarefa Celery que distribui alunos pendentes entre os professores. '
        'Usa round-robin balanceado por número de alunos ativos. '
        'Informe teacher_id para forçar um professor específico.'
    ),
    request=ProcessQueueSerializer,
    tags=['queue'],
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_queue(request):
    serializer = ProcessQueueSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    task = process_student_queue.delay(
        teacher_id=serializer.validated_data.get('teacher_id')
    )
    return Response(
        {'task_id': task.id, 'message': 'Fila sendo processada em background.'},
        status=status.HTTP_202_ACCEPTED,
    )


@extend_schema(
    summary='Atribuição manual',
    description='Atribui um aluno diretamente a um professor específico.',
    request=ManualAssignSerializer,
    tags=['queue'],
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manual_assign(request):
    serializer = ManualAssignSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    from teachers.models import Teacher, TeacherStudents
    from student.models import Student

    try:
        student = Student.objects.get(id=serializer.validated_data['student_id'])
        teacher = Teacher.objects.get(id=serializer.validated_data['teacher_id'])
    except (Student.DoesNotExist, Teacher.DoesNotExist) as e:
        return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    TeacherStudents.objects.get_or_create(
        teacher=teacher,
        student=student,
        defaults={'is_active': True},
    )

    entry, _ = StudentQueue.objects.get_or_create(student=student)
    entry.status = StudentQueue.STATUS_ASSIGNED
    entry.assigned_trainer = teacher
    entry.assigned_at = timezone.now()
    entry.save()

    return Response(StudentQueueSerializer(entry).data)


@extend_schema(
    summary='Adicionar aluno à fila',
    description='Adiciona manualmente um aluno à fila de distribuição.',
    request=AddToQueueSerializer,
    tags=['queue'],
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_queue(request):
    serializer = AddToQueueSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    task = add_student_to_queue.delay(**serializer.validated_data)
    return Response(
        {'task_id': task.id, 'message': 'Solicitação enviada para a fila.'},
        status=status.HTTP_202_ACCEPTED,
    )


@extend_schema(
    summary='Remover aluno da fila',
    description='Remove um aluno da fila de distribuição pelo student_id.',
    tags=['queue'],
)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_queue(request, student_id):
    try:
        entry = StudentQueue.objects.get(student__id=student_id)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except StudentQueue.DoesNotExist:
        return Response({'error': 'Aluno não está na fila.'}, status=status.HTTP_404_NOT_FOUND)
