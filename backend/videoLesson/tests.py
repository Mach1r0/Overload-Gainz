"""
Fase 2 — RED: controle de acesso e action increment-view.
"""
import pytest

VIDEO_URL = '/api/video-lessons/'


@pytest.mark.django_db
class TestVideoLessonAccess:

    def test_unauthenticated_rejected(self, api_client):
        assert api_client.get(VIDEO_URL).status_code == 401

    def test_teacher_can_create_video(self, auth_client_teacher, teacher_user):
        from teachers.models import Teacher
        teacher = Teacher.objects.get(user=teacher_user)
        payload = {
            'title': 'Aula de Agachamento',
            'category': 'technique',
            'url_youtube': 'https://youtu.be/test',
        }
        response = auth_client_teacher.post(VIDEO_URL, payload)
        assert response.status_code == 201

    def test_student_cannot_create_video(self, auth_client_student):
        payload = {'title': 'Teste', 'category': 'theory'}
        response = auth_client_student.post(VIDEO_URL, payload)
        assert response.status_code in (400, 403)

    def test_teacher_cannot_update_other_teachers_video(
        self, auth_client_teacher, auth_client_teacher_b, teacher_user_b
    ):
        from videoLesson.models import VideoLesson
        from teachers.models import Teacher
        teacher_b = Teacher.objects.get(user=teacher_user_b)
        video = VideoLesson.objects.create(teacher=teacher_b, title='Video B', category='theory')

        response = auth_client_teacher.patch(f'{VIDEO_URL}{video.id}/', {'title': 'Hackeado'})
        assert response.status_code in (403, 404)


@pytest.mark.django_db
class TestIncrementView:
    """Action POST /api/video-lessons/{id}/increment-view/ deve existir."""

    def test_increment_view_increases_count(self, auth_client_student, teacher_user):
        from videoLesson.models import VideoLesson
        from teachers.models import Teacher
        teacher = Teacher.objects.get(user=teacher_user)
        video = VideoLesson.objects.create(teacher=teacher, title='Aula X', category='theory')

        url = f'{VIDEO_URL}{video.id}/increment-view/'
        response = auth_client_student.post(url)
        assert response.status_code == 200

        video.refresh_from_db()
        assert video.view_count == 1

    def test_multiple_increments_accumulate(self, auth_client_student, teacher_user):
        from videoLesson.models import VideoLesson
        from teachers.models import Teacher
        teacher = Teacher.objects.get(user=teacher_user)
        video = VideoLesson.objects.create(teacher=teacher, title='Aula Y', category='theory')

        url = f'{VIDEO_URL}{video.id}/increment-view/'
        auth_client_student.post(url)
        auth_client_student.post(url)
        auth_client_student.post(url)

        video.refresh_from_db()
        assert video.view_count == 3

    def test_unauthenticated_cannot_increment(self, api_client, teacher_user):
        from videoLesson.models import VideoLesson
        from teachers.models import Teacher
        teacher = Teacher.objects.get(user=teacher_user)
        video = VideoLesson.objects.create(teacher=teacher, title='Aula Z', category='theory')
        assert api_client.post(f'{VIDEO_URL}{video.id}/increment-view/').status_code == 401
