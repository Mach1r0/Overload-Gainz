from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import trainingSerializer, ProgramSerializer, WorkoutSerializer, WorkoutExerciseSerializer, FolderSerializer
from rest_framework import permissions
from .models import Training, Program, Workout, WorkoutExercise, Folder
from django.db.models import Count, Q

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Program.objects.filter(is_active=True)
        teacher_id = self.request.query_params.get('teacher')
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        return queryset

class TrainingViewSet(viewsets.ModelViewSet):
    queryset = Training.objects.all()
    serializer_class = trainingSerializer
    permission_classes = [permissions.IsAuthenticated]
    Program = ProgramSerializer
    def get_queryset(self):
        queryset = Training.objects.all()
        student_id = self.request.query_params.get('student', None)
        teacher_id = self.request.query_params.get('teacher', None)
        is_active = self.request.query_params.get('is_active', None)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def grouped_by_name(self, request):
        teacher_id = request.query_params.get('teacher')
        
        if teacher_id:
            trainings = Training.objects.filter(teacher_id=teacher_id, is_active=True)
        else:
            trainings = Training.objects.filter(is_active=True)
        
        grouped_data = {}
        
        for training in trainings:
            name = training.name
            if ' - ' in name:
                base_name = name.split(' - ')[-1].strip()
            else:
                base_name = name
            
            if base_name not in grouped_data:
                grouped_data[base_name] = {
                    'id': training.id,
                    'name': base_name,  
                    'full_name': training.name,  
                    'description': training.description,
                    'goal': training.goal,
                    'category': training.get_goal_display(),
                    'program_name': training.program.name if training.program else None,
                    'student_count': 0,
                    'student_ids': [],
                    'training_ids': [],
                    'workouts': [],
                    'is_active': training.is_active,
                    'start_date': training.start_date,
                    'end_date': training.end_date,
                }
            
            grouped_data[base_name]['student_count'] += 1
            grouped_data[base_name]['student_ids'].append(training.student.id if training.student else None)
            grouped_data[base_name]['training_ids'].append(training.id)
            
            if not grouped_data[base_name]['workouts'] and training.workouts.exists():
                workouts_data = []
                for workout in training.workouts.all():
                    exercises = []
                    for we in workout.workout_exercises.all():
                        exercises.append({
                            'id': we.id,
                            'name': we.exercise.name if we.exercise else '',
                            'sets': we.sets,
                            'reps': we.reps,
                            'rest_time': str(we.rest_time) if we.rest_time else '',
                            'notes': we.notes,
                        })
                    workouts_data.append({
                        'id': workout.id,
                        'name': workout.name,
                        'day_of_week': workout.day_of_week,
                        'exercises': exercises,
                    })
                grouped_data[base_name]['workouts'] = workouts_data
        
        result = []
        for name, data in grouped_data.items():
            total_exercises = sum(len(w['exercises']) for w in data['workouts'])
            data['exercises'] = total_exercises
            data['students'] = data['student_count']  
            result.append(data)
        
        return Response(result)

class WorkoutViewSet(viewsets.ModelViewSet):
    queryset = Workout.objects.all()
    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Workout.objects.all()
        training_id = self.request.query_params.get('training_plan')
        if training_id:
            queryset = queryset.filter(training_plan_id=training_id)
        return queryset

class WorkoutExerciseViewSet(viewsets.ModelViewSet):
    queryset = WorkoutExercise.objects.all()
    serializer_class = WorkoutExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = WorkoutExercise.objects.all()
        workout_id = self.request.query_params.get('workout')
        if workout_id:
            queryset = queryset.filter(workout_id=workout_id)
        return queryset

class FolderViewSet(viewsets.ModelViewSet):
    queryset = Folder.objects.all()
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Folder.objects.all()