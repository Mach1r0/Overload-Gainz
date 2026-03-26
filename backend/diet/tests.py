"""
Fase 1 — RED: isolamento de dados em diet plans.
"""
import pytest
from diet.models import DietPlan

DIET_URL = '/api/diet-plans/'

# Helper para criar DietPlan sem repetição
def make_diet(teacher, student, name, goal='BUK'):
    return DietPlan.objects.create(
        teacher=teacher,
        student=student,
        name=name,
        goal=goal,
        start_date='2024-01-01',
        end_date='2024-12-31',
    )


@pytest.mark.django_db
class TestDietPlanSecurity:

    def test_unauthenticated_rejected(self, api_client):
        assert api_client.get(DIET_URL).status_code == 401

    def test_teacher_sees_only_own_plans(self, auth_client_teacher, teacher_user, teacher_user_b, student_user):
        make_diet(teacher_user, student_user, 'Plano A')
        make_diet(teacher_user_b, student_user, 'Plano B')

        response = auth_client_teacher.get(DIET_URL)
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Plano A'

    def test_student_sees_only_own_plans(self, auth_client_student, student_user, student_user_b, teacher_user):
        make_diet(teacher_user, student_user, 'Plano Meu', 'MAINT')
        make_diet(teacher_user, student_user_b, 'Plano Outro', 'BUK')

        response = auth_client_student.get(DIET_URL)
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_teacher_param_ignored(self, auth_client_student, student_user, teacher_user, teacher_user_b):
        """?teacher= não deve expor dietas de outro professor."""
        make_diet(teacher_user_b, student_user, 'Outro Teacher', 'CUT')

        response = auth_client_student.get(f'{DIET_URL}?teacher={teacher_user_b.id}')
        assert response.status_code == 200
        # Retorna apenas os planos onde student_user é aluno
        for plan in response.data:
            student_id = plan['student']['id'] if isinstance(plan['student'], dict) else plan['student']
            assert student_id == student_user.id

    def test_student_param_ignored(self, auth_client_teacher, teacher_user, student_user, student_user_b):
        """?student= não deve expor dietas de outro aluno."""
        make_diet(teacher_user, student_user_b, 'Plano B', 'BUK')

        response = auth_client_teacher.get(f'{DIET_URL}?student={student_user_b.id}')
        assert response.status_code == 200
        # Professor só vê os seus próprios planos
        for plan in response.data:
            teacher_id = plan['teacher']['id'] if isinstance(plan['teacher'], dict) else plan['teacher']
            assert teacher_id == teacher_user.id
