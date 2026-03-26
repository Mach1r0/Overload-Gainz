from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from core.mixins import OwnedByUserMixin
from .models import WorkoutSession, ExerciseLog, SetLog
from .serializers import WorkoutSessionSerializer, ExerciseLogSerializer, SetLogSerializer


class WorkoutSessionViewSet(OwnedByUserMixin, viewsets.ModelViewSet):
    queryset = WorkoutSession.objects.all()  # basename hint para o router
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]


class ExerciseLogViewSet(viewsets.ModelViewSet):
    queryset = ExerciseLog.objects.all()  # basename hint para o router
    serializer_class = ExerciseLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExerciseLog.objects.filter(session__user=self.request.user)

    @action(detail=False, methods=['get'], url_path='exercise-pr')
    def exercise_pr(self, request):
        exercise_id = request.query_params.get('exercise_id')
        if not exercise_id:
            return Response({'error': 'exercise_id é obrigatório.'}, status=400)

        pr = (
            SetLog.objects
            .filter(
                exercise_log__session__user=request.user,
                exercise_log__exercise_id=exercise_id,
                set_type='WORK',
            )
            .order_by('-weight')
            .first()
        )

        if pr is None:
            return Response({'pr': None})

        return Response({
            'pr': {
                'weight': pr.weight,
                'repetitions': pr.repetitions,
                'set_type': pr.set_type,
                'set_number': pr.set_number,
            }
        })


class SetLogViewSet(viewsets.ModelViewSet):
    queryset = SetLog.objects.all()  # basename hint para o router
    serializer_class = SetLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SetLog.objects.filter(exercise_log__session__user=self.request.user)
