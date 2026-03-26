from django.urls import path
from queue_management import views

urlpatterns = [
    path('', views.queue_list, name='queue-list'),
    path('stats/', views.queue_stats, name='queue-stats'),
    path('process/', views.process_queue, name='queue-process'),
    path('assign/', views.manual_assign, name='queue-assign'),
    path('add/', views.add_to_queue, name='queue-add'),
    path('remove/<int:student_id>/', views.remove_from_queue, name='queue-remove'),
]
