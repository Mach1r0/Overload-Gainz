from django.urls import path
from ai_assistant import views

urlpatterns = [
    path('analyze/', views.full_analysis, name='ai-full-analysis'),
    path('analyze/training/', views.training_analysis, name='ai-training-analysis'),
    path('analyze/nutrition/', views.nutrition_analysis, name='ai-nutrition-analysis'),
    path('status/<str:task_id>/', views.task_status, name='ai-task-status'),
]
