from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import LoginViewSet, UserViewSet, PasswordResetRequestView, PasswordResetConfirmView
from student.views import StudentViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', LoginViewSet.as_view({'post': 'create'}), name='login'),
    path('register-student/', StudentViewSet.as_view({'post': 'create'}), name='register-student'),
    path('register-teacher/', UserViewSet.as_view({'post': 'create'}), name='register-teacher'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]
urlpatterns += router.urls
