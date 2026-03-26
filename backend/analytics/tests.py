"""
Fase 1 — RED: segurança e isolamento de dados em analytics.
Estes testes FALHAM antes das correções nas views.
"""
import pytest
from analytics.models import BodyMeasurement, ProgressPhoto, PersonalRecord

BODY_URL = '/api/analytics/body-measurements/'
PHOTO_URL = '/api/analytics/progress-photos/'
PR_URL = '/api/analytics/personal-records/'


@pytest.mark.django_db
class TestBodyMeasurementSecurity:

    def test_unauthenticated_rejected(self, api_client):
        assert api_client.get(BODY_URL).status_code == 401

    def test_user_sees_only_own_measurements(self, auth_client_student, student_user, student_user_b):
        BodyMeasurement.objects.create(user=student_user, date='2024-01-01', weight_kg=80.0)
        BodyMeasurement.objects.create(user=student_user_b, date='2024-01-01', weight_kg=70.0)

        response = auth_client_student.get(BODY_URL)
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_user_param_ignored_returns_only_own(self, auth_client_student, student_user, student_user_b):
        """?user=<outro_id> não deve expor dados de outro usuário."""
        BodyMeasurement.objects.create(user=student_user_b, date='2024-01-01', weight_kg=70.0)

        response = auth_client_student.get(f'{BODY_URL}?user={student_user_b.id}')
        assert response.status_code == 200
        assert len(response.data) == 0

    def test_cannot_read_other_user_detail(self, auth_client_student, student_user_b):
        m = BodyMeasurement.objects.create(user=student_user_b, date='2024-01-01', weight_kg=70.0)
        assert auth_client_student.get(f'{BODY_URL}{m.id}/').status_code == 404


@pytest.mark.django_db
class TestProgressPhotoSecurity:

    def test_unauthenticated_rejected(self, api_client):
        assert api_client.get(PHOTO_URL).status_code == 401

    def test_user_sees_only_own_photos(self, auth_client_student, student_user, student_user_b):
        ProgressPhoto.objects.create(user=student_user, photo_type='FRONT', image='a.jpg')
        ProgressPhoto.objects.create(user=student_user_b, photo_type='FRONT', image='b.jpg')

        response = auth_client_student.get(PHOTO_URL)
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_user_param_ignored(self, auth_client_student, student_user, student_user_b):
        ProgressPhoto.objects.create(user=student_user_b, photo_type='FRONT', image='b.jpg')

        response = auth_client_student.get(f'{PHOTO_URL}?user={student_user_b.id}')
        assert response.status_code == 200
        assert len(response.data) == 0

    def test_cannot_read_other_user_photo_detail(self, auth_client_student, student_user_b):
        p = ProgressPhoto.objects.create(user=student_user_b, photo_type='BACK', image='b.jpg')
        assert auth_client_student.get(f'{PHOTO_URL}{p.id}/').status_code == 404


@pytest.mark.django_db
class TestPersonalRecordSecurity:

    def test_unauthenticated_rejected(self, api_client):
        assert api_client.get(PR_URL).status_code == 401

    def test_user_sees_only_own_prs(self, auth_client_student, student_user, student_user_b):
        from exercises.models import Exercise
        ex = Exercise.objects.create(name='Squat', level='beginner', category='strength')
        PersonalRecord.objects.create(user=student_user, exercise=ex, record_type='1RM', weight_kg=100.0, reps=1, achieved_at='2024-01-01')
        PersonalRecord.objects.create(user=student_user_b, exercise=ex, record_type='1RM', weight_kg=120.0, reps=1, achieved_at='2024-01-01')

        response = auth_client_student.get(PR_URL)
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_cannot_read_other_user_pr_detail(self, auth_client_student, student_user_b):
        from exercises.models import Exercise
        ex = Exercise.objects.create(name='Bench', level='beginner', category='strength')
        pr = PersonalRecord.objects.create(user=student_user_b, exercise=ex, record_type='1RM', weight_kg=120.0, reps=1, achieved_at='2024-01-01')
        assert auth_client_student.get(f'{PR_URL}{pr.id}/').status_code == 404
