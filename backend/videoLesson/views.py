from django.db.models import F
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from teachers.models import Teacher
from .models import VideoLesson
from .serializers import VideoLessonSerializer


class VideoLessonViewSet(viewsets.ModelViewSet):
    queryset = VideoLesson.objects.all()
    serializer_class = VideoLessonSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'category']
    ordering_fields = ['created_at', 'updated_at', 'title', 'view_count']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        try:
            teacher = Teacher.objects.get(user=self.request.user)
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Apenas professores podem criar video aulas.')
        serializer.save(teacher=teacher)

    def perform_update(self, serializer):
        try:
            teacher = Teacher.objects.get(user=self.request.user)
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Apenas professores podem editar video aulas.')

        # Apenas o dono do vídeo pode editar
        if serializer.instance.teacher != teacher:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Você não tem permissão para editar este vídeo.')

        serializer.save()

    @action(detail=True, methods=['post'], url_path='increment-view')
    def increment_view(self, request, pk=None):
        """Incrementa o contador de visualizações de forma atômica."""
        lesson = self.get_object()
        VideoLesson.objects.filter(pk=lesson.pk).update(view_count=F('view_count') + 1)
        lesson.refresh_from_db(fields=['view_count'])
        return Response({'view_count': lesson.view_count})
