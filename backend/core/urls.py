from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from videoLesson.views import VideoLessonViewSet
from exercises.views import ExerciseViewSet
from feedback.views import FeedbackViewSet
from student.views import StudentViewSet
from diet.views import FoodItemViewSet, DietPlanViewSet, MealViewSet

router = routers.DefaultRouter()
router.register(r'exercises', ExerciseViewSet, basename='exercise')
router.register(r'feedback', FeedbackViewSet, basename='feedback')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'food-items', FoodItemViewSet, basename='fooditem')
router.register(r'diet-plans', DietPlanViewSet, basename='dietplan')
router.register(r'meals', MealViewSet, basename='meal')
router.register(r'video-lessons', VideoLessonViewSet, basename='video-lesson')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),

    # Apps existentes
    path('api/analytics/', include('analytics.urls')),
    path('api/diet/', include('diet.urls')),
    path('api/training/', include('training.urls')),
    path('api/tracking/', include('tracking.urls')),
    path('api/auth/', include('users.urls')),
    path('api/trainer/', include('teachers.urls')),

    # JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Fila RabbitMQ
    path('api/queue/', include('queue_management.urls')),

    # Assistente IA (CrewAI)
    path('api/ai/', include('ai_assistant.urls')),

    # Swagger / OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
