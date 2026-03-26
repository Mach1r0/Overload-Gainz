from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import UserSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('create',):
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        # Usuários só vêem a si mesmos (exceto staff)
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(pk=self.request.user.pk)

    def create(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Usuário criado com sucesso.'}, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        picture = self.request.FILES.get('profile_picture')
        serializer.save(profile_picture=picture) if picture else serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        return Response(self.get_serializer(request.user).data)


class LoginViewSet(viewsets.ViewSet):
    authentication_classes = []
    permission_classes = [AllowAny]

    def create(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Username e password são obrigatórios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({'error': 'Credenciais inválidas.'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        user_type = 'teacher' if getattr(user, 'is_teacher', False) else (
            'student' if getattr(user, 'is_student', False) else None
        )

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_teacher': getattr(user, 'is_teacher', False),
                'is_student': getattr(user, 'is_student', False),
                'profile_picture': user.profile_picture.url if user.profile_picture else None,
            },
            'user_type': user_type,
        })


# ─── Password Reset ──────────────────────────────────────────────────────────

class PasswordResetRequestView(APIView):
    """POST /api/auth/password-reset/ — solicita link de recuperação."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'email é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            # Em produção, enviar email aqui (ex: send_mail / Celery task)
            return Response({
                'message': 'Se o email existir, você receberá as instruções.',
                'uid': uid,
                'token': token,  # expor apenas em DEBUG — remover em produção
            })
        except User.DoesNotExist:
            # Não revelar se o email existe
            return Response({'message': 'Se o email existir, você receberá as instruções.'})


class PasswordResetConfirmView(APIView):
    """POST /api/auth/password-reset/confirm/ — confirma com uid/token e define nova senha."""
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not all([uid, token, new_password]):
            return Response(
                {'error': 'uid, token e new_password são obrigatórios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
        except (ValueError, TypeError, User.DoesNotExist):
            return Response({'error': 'Link inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Token inválido ou expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Senha alterada com sucesso.'})
