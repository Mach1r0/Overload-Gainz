from django.shortcuts import render
from .models import Exercise
from .serializers import ExerciseSerializer
from rest_framework import permissions
from rest_framework import viewsets

class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    