"""
Fase 2 — RED: auth + fluxo de recuperação de senha.
"""
import pytest

LOGIN_URL = '/api/auth/login/'
RESET_URL = '/api/auth/password-reset/'
CONFIRM_URL = '/api/auth/password-reset/confirm/'


@pytest.mark.django_db
class TestLogin:

    def test_login_with_valid_credentials(self, api_client, teacher_user):
        response = api_client.post(LOGIN_URL, {'username': 'teacher_a', 'password': 'testpass123'})
        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['user_type'] == 'teacher'

    def test_login_returns_student_type(self, api_client, student_user):
        response = api_client.post(LOGIN_URL, {'username': 'student_a', 'password': 'testpass123'})
        assert response.status_code == 200
        assert response.data['user_type'] == 'student'

    def test_login_with_wrong_password(self, api_client, teacher_user):
        response = api_client.post(LOGIN_URL, {'username': 'teacher_a', 'password': 'wrongpass'})
        assert response.status_code == 401

    def test_login_missing_fields(self, api_client):
        assert api_client.post(LOGIN_URL, {'username': 'x'}).status_code == 400


@pytest.mark.django_db
class TestPasswordReset:
    """Fluxo completo de recuperação de senha via uid/token."""

    def test_reset_request_returns_200_for_existing_email(self, api_client, teacher_user):
        response = api_client.post(RESET_URL, {'email': 'teacher_a@test.com'})
        assert response.status_code == 200

    def test_reset_request_returns_200_for_unknown_email(self, api_client):
        """Não revelar se email existe ou não."""
        response = api_client.post(RESET_URL, {'email': 'naoexiste@test.com'})
        assert response.status_code == 200

    def test_reset_request_missing_email(self, api_client):
        assert api_client.post(RESET_URL, {}).status_code == 400

    def test_confirm_with_valid_token_changes_password(self, api_client, teacher_user):
        # Passo 1: solicitar reset
        resp = api_client.post(RESET_URL, {'email': 'teacher_a@test.com'})
        assert resp.status_code == 200
        uid = resp.data['uid']
        token = resp.data['token']

        # Passo 2: confirmar com nova senha
        resp2 = api_client.post(CONFIRM_URL, {
            'uid': uid,
            'token': token,
            'new_password': 'novasenha456',
        })
        assert resp2.status_code == 200

        # Passo 3: login com nova senha funciona
        resp3 = api_client.post(LOGIN_URL, {'username': 'teacher_a', 'password': 'novasenha456'})
        assert resp3.status_code == 200

    def test_confirm_with_invalid_token_rejected(self, api_client, teacher_user):
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode
        uid = urlsafe_base64_encode(force_bytes(teacher_user.pk))

        response = api_client.post(CONFIRM_URL, {
            'uid': uid,
            'token': 'invalid-token',
            'new_password': 'qualquercoisa',
        })
        assert response.status_code == 400

    def test_confirm_missing_fields(self, api_client):
        assert api_client.post(CONFIRM_URL, {'uid': 'x'}).status_code == 400
