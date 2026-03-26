"""
Fixtures compartilhadas para toda a suíte de testes.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


def _make_user(username, email, *, is_teacher=False, is_student=False):
    return User.objects.create_user(
        username=username,
        email=email,
        password='testpass123',
        is_teacher=is_teacher,
        is_student=is_student,
    )


# ─── Usuários ────────────────────────────────────────────────────────────────

@pytest.fixture
def teacher_user(db):
    from teachers.models import Teacher
    user = _make_user('teacher_a', 'teacher_a@test.com', is_teacher=True)
    Teacher.objects.create(user=user)
    return user


@pytest.fixture
def teacher_user_b(db):
    from teachers.models import Teacher
    user = _make_user('teacher_b', 'teacher_b@test.com', is_teacher=True)
    Teacher.objects.create(user=user)
    return user


@pytest.fixture
def student_user(db):
    from student.models import Student
    user = _make_user('student_a', 'student_a@test.com', is_student=True)
    Student.objects.create(user=user)
    return user


@pytest.fixture
def student_user_b(db):
    from student.models import Student
    user = _make_user('student_b', 'student_b@test.com', is_student=True)
    Student.objects.create(user=user)
    return user


# ─── Perfis (Student / Teacher objects) ─────────────────────────────────────

@pytest.fixture
def teacher_profile(teacher_user):
    from teachers.models import Teacher
    return Teacher.objects.get(user=teacher_user)


@pytest.fixture
def teacher_profile_b(teacher_user_b):
    from teachers.models import Teacher
    return Teacher.objects.get(user=teacher_user_b)


@pytest.fixture
def student_profile(student_user):
    from student.models import Student
    return Student.objects.get(user=student_user)


@pytest.fixture
def student_profile_b(student_user_b):
    from student.models import Student
    return Student.objects.get(user=student_user_b)


# ─── Clientes autenticados ───────────────────────────────────────────────────

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client_teacher(teacher_user):
    client = APIClient()
    client.force_authenticate(user=teacher_user)
    return client


@pytest.fixture
def auth_client_teacher_b(teacher_user_b):
    client = APIClient()
    client.force_authenticate(user=teacher_user_b)
    return client


@pytest.fixture
def auth_client_student(student_user):
    client = APIClient()
    client.force_authenticate(user=student_user)
    return client


@pytest.fixture
def auth_client_student_b(student_user_b):
    client = APIClient()
    client.force_authenticate(user=student_user_b)
    return client
