from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProgramViewSet, TrainingViewSet, WorkoutViewSet, WorkoutExerciseViewSet, FolderViewSet

router = DefaultRouter()
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'trainings', TrainingViewSet, basename='training')
router.register(r'workouts', WorkoutViewSet, basename='workout')
router.register(r'workout-exercises', WorkoutExerciseViewSet, basename='workout-exercise')
router.register(r'folders', FolderViewSet, basename='folder')

urlpatterns = [
    path('', include(router.urls)),
]