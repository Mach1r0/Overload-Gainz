from django.shortcuts import render
from training.models import Training, Program, Workout, WorkoutExercise, Folder
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import trainingSerializer, ProgramSerializer, WorkoutSerializer, WorkoutExerciseSerializer, FolderSerializer
from rest_framework import permissions
from .models import Training, Program, Workout, WorkoutExercise, Folder
from django.db.models import Count, Q
from teachers.models import Teacher


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
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def student_all_programs(self, request):
        try:
            teacher_param = request.query_params.get('teacher')
            student_id = request.query_params.get('student')
            
            if not teacher_param or not student_id:
                return Response({"error": "teacher and student parameters are required."}, status=400)
            
            teacher = Teacher.objects.filter(id=teacher_param).first()
            
            if not teacher:
                teacher = Teacher.objects.filter(user_id=teacher_param).first()
            
            if not teacher:
                return Response({"error": f"Teacher not found for parameter: {teacher_param}"}, status=404)
            
            teacher_id = teacher.id
            
            trainings = Training.objects.filter(
                teacher_id=teacher_id,
                student_id=student_id,
                is_active=True
            )
            
            if not trainings.exists():
                return Response({"error": f"No trainings found for student {student_id} and teacher {teacher_id}."}, status=404)
            
            program_ids = trainings.values_list('program_id', flat=True)
            programs = Program.objects.filter(id__in=program_ids)
            
            serializer = ProgramSerializer(programs, many=True)
            return Response(serializer.data, status=200)
        
        except Exception as e:
            return Response({"error": str(e)}, status=500)
          
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def saving_multiples_users_routine(self, request):
        try:
            routine_id = request.data.get('routine_id') or request.query_params.get('routine_id')
            student_ids = request.data.get('student_ids') or request.query_params.getlist('student_ids[]')
            teacher_id = request.data.get('teacher_id') or request.query_params.get('teacher_id')
            
            if not routine_id or not student_ids or not teacher_id:
                return Response({"error": "routine_id, student_ids, and teacher_id parameters are required."}, status=400)
            
            created_trainings = []
            for student_id in student_ids:
                training = Training.objects.create(
                    student_id=student_id,
                    teacher_id=teacher_id,
                    program_id=routine_id,
                    goal='GEN',  
                    name=f'Program {routine_id} for Student {student_id}',
                    description='Auto-generated training from routine assignment.'
                )
                created_trainings.append(training.id)
            
            return Response({"message": f"Created {len(created_trainings)} training(s).", "training_ids": created_trainings}, status=201)
    
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def assign_student_to_routine(self, request):
        try:
            routine_id = request.data.get('routine_id')
            student_id = request.data.get('student_id')
            
            if not routine_id or not student_id:
                return Response({"error": "routine_id and student_id are required."}, status=400)
            
            from teachers.models import Teacher
            teacher = Teacher.objects.filter(user=request.user).first()
            
            if not teacher:
                return Response({"error": "Teacher not found for current user."}, status=404)
            
            existing = Training.objects.filter(
                student_id=student_id,
                program_id=routine_id
            ).first()
            
            if existing:
                return Response({"error": "Student is already assigned to this program.", "training_id": existing.id}, status=400)
            
            program = Program.objects.filter(id=routine_id).first()
            program_name = program.name if program else f'Program {routine_id}'
            
            training = Training.objects.create(
                student_id=student_id,
                teacher_id=teacher.id,
                program_id=routine_id,
                goal='GEN',
                name=f'{program_name}',
                description='Training assigned from program.',
                is_active=True
            )
            
            return Response({
                "message": "Student assigned to routine successfully.",
                "training_id": training.id
            }, status=201)
        
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=['delete', 'get'], permission_classes=[permissions.IsAuthenticated])
    def remove_student_from_routine(self, request):
        student_id = request.query_params.get('student_id')
        routine_id = request.query_params.get('routine_id')
        
        if not student_id or not routine_id:
            return Response({"error": "student_id and routine_id parameters are required."}, status=400)
        
        trainings_deleted, _ = Training.objects.filter(
            student_id=student_id,
            program_id=routine_id
        ).delete()
        
        return Response({"message": f"Removed {trainings_deleted} training(s) for student {student_id} from routine {routine_id}."}, status=200)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def muscles_group_by_programs(self, request):
        try:
            program_id = self.request.query_params.get('program_id')
            
            if not program_id:
                return Response({"error": "program_id parameter is required."}, status=400)
            
            muscle_translation = {
                'abdominals': 'Abdominais',
                'abductors': 'Abdutores',
                'adductors': 'Adutores',
                'biceps': 'Bíceps',
                'calves': 'Panturrilhas',
                'chest': 'Peito',
                'forearms': 'Antebraços',
                'glutes': 'Glúteos',
                'hamstrings': 'Isquiotibiais',
                'lats': 'Dorsais',
                'lower_back': 'Lombar',
                'middle_back': 'Costas Superior',
                'neck': 'Pescoço',
                'quadriceps': 'Quadríceps',
                'shoulders': 'Ombros',
                'traps': 'Trapézio',
                'triceps': 'Tríceps',
                'Abdominals': 'Abdominais',
                'Abductors': 'Abdutores',
                'Adductors': 'Adutores',
                'Biceps': 'Bíceps',
                'Calves': 'Panturrilhas',
                'Chest': 'Peito',
                'Forearms': 'Antebraços',
                'Glutes': 'Glúteos',
                'Hamstrings': 'Isquiotibiais',
                'Lats': 'Dorsais',
                'Lower Back': 'Lombar',
                'Middle Back': 'Costas Superior',
                'Neck': 'Pescoço',
                'Quadriceps': 'Quadríceps',
                'Shoulders': 'Ombros',
                'Traps': 'Trapézio',
                'Triceps': 'Tríceps',
                'upper_back': 'Costas Superior',
                'Upper Back': 'Costas Superior',
                'full_body': 'Corpo Inteiro',
                'Full Body': 'Corpo Inteiro',
                'cardio': 'Cardio',
                'Cardio': 'Cardio',
            }
            
            training_programs = Training.objects.filter(
                is_active=True, 
                program_id=program_id
            ).prefetch_related(
                'workouts__workout_exercises__exercise'
            )
            
            muscle_counts = {}
            unmapped_muscles = set()  
            
            for training in training_programs:
                for workout in training.workouts.all():
                    for we in workout.workout_exercises.all():
                        exercise = we.exercise
                        
                        if exercise and exercise.primary_muscles:
                            for muscle in exercise.primary_muscles.split(','):
                                muscle_original = muscle.strip()
                                muscle_lower = muscle_original.lower()
                                
                                muscle_pt = muscle_translation.get(muscle_original) or \
                                           muscle_translation.get(muscle_lower, 'Outro')
                                
                                if muscle_pt == 'Outro' and muscle_original:
                                    unmapped_muscles.add(muscle_original)
                                
                                muscle_counts[muscle_pt] = muscle_counts.get(muscle_pt, 0) + we.sets
                        
                        if exercise and exercise.secondary_muscles:
                            for muscle in exercise.secondary_muscles.split(','):
                                muscle_original = muscle.strip()
                                muscle_lower = muscle_original.lower()
                                
                                muscle_pt = muscle_translation.get(muscle_original) or \
                                           muscle_translation.get(muscle_lower, 'Outro')
                                
                                if muscle_pt == 'Outro' and muscle_original:
                                    unmapped_muscles.add(muscle_original)
                                
                                muscle_counts[muscle_pt] = muscle_counts.get(muscle_pt, 0) + (we.sets * 0.5)
            
            result = {
                'muscle_distribution': muscle_counts,
                'total_sets': sum(muscle_counts.values()),
                'unmapped_muscles': list(unmapped_muscles) if unmapped_muscles else []  # Debug info
            }
            
            return Response(result, status=200)
        
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def duplicate(self, request, pk=None):
        try:
            original_program = self.get_object()
            
            new_program = Program.objects.create(
                name=f"{original_program.name} (Cópia)",
                description=original_program.description,
                teacher=original_program.teacher,
                goal=original_program.goal,
                category=original_program.category,
                is_active=True
            )
            
            trainings = Training.objects.filter(program=original_program)
            
            copied_workout_ids = set()
            for training in trainings:
                for workout in training.workouts.all():
                    if workout.id not in copied_workout_ids:
                        copied_workout_ids.add(workout.id)
                        
                        new_workout = Workout.objects.create(
                            name=workout.name,
                            description=workout.description,
                            order=workout.order
                        )
                        
                        for we in workout.workout_exercises.all():
                            WorkoutExercise.objects.create(
                                workout=new_workout,
                                exercise=we.exercise,
                                sets=we.sets,
                                reps=we.reps,
                                rest_time=we.rest_time,
                                order=we.order,
                                notes=we.notes
                            )
            
            serializer = ProgramSerializer(new_program)
            return Response(serializer.data, status=201)
        
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
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
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def all_students_rotine(self, request):
        try:
            routine_id = request.query_params.get('routine_id')
            if not routine_id:
                return Response({"error": "routine_id parameter is required."}, status=400)
            
            trainings = Training.objects.filter(
                program_id=routine_id
            ).select_related('student', 'student__user')
            
            result = []
            seen_students = set()
            
            for training in trainings:
                if training.student and training.student.id not in seen_students:
                    seen_students.add(training.student.id)
                    student_data = {
                        'id': training.student.id,
                        'first_name': training.student.user.first_name if training.student.user else '',
                        'last_name': training.student.user.last_name if training.student.user else '',
                    }
                    if training.student.user:
                        student_data['user'] = {
                            'username': training.student.user.username
                        }
                    result.append(student_data)

            return Response(result, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

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
    

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def change_program_folder(self, request):
        try:
            folder_id = request.query_params.get('folder_id')
            program_id = request.query_params.get('program_id')

            if not program_id or folder_id is None:
                return Response({"error": "program_id and folder_id parameters are required."}, status=400)
            
            program = Program.objects.filter(id=program_id).first()
            
            if not program:
                return Response({"error": f"Program with id {program_id} does not exist."}, status=404)
            
            if folder_id == 'null':
                program.folder = None
            else:
                folder = Folder.objects.filter(id=folder_id).first()
                if not folder:
                    return Response({"error": f"Folder with id {folder_id} does not exist."}, status=404)
                program.folder = folder
            
            program.save()
            
            return Response({"message": "Program folder updated successfully."}, status=200)
        
        except Exception as e:
            return Response({"error": str(e)}, status=500)


    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def programs_by_teacher(self, request):
        try:
            teacher_id = request.query_params.get('teacher')
            
            if not teacher_id:
                return Response({"error": "teacher parameter is required."}, status=400)
            
            folders = Folder.objects.filter(teacher_id=teacher_id).prefetch_related('programs')
            
            result = []
            for folder in folders:
                programs = folder.programs.filter(is_active=True)
                result.append({
                    'id': folder.id,
                    'name': folder.name,
                    'created_at': folder.created_at,
                    'programs': ProgramSerializer(programs, many=True).data
                })
            
            programs_without_folder = Program.objects.filter(
                teacher_id=teacher_id,
                folder__isnull=True,
                is_active=True
            )
            
            if programs_without_folder.exists():
                result.append({
                    'id': None,
                    'name': 'Sem Pasta',
                    'created_at': None,
                    'programs': ProgramSerializer(programs_without_folder, many=True).data
                })
            
            return Response(result, status=200)
        
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        