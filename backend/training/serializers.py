from rest_framework import serializers
from .models import Training, Workout, WorkoutExercise, Program, Folder
from exercises.serializers import ExerciseSerializer

class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(read_only=True)
    
    class Meta:
        model = WorkoutExercise
        fields = ['id', 'workout', 'exercise', 'sets', 'reps', 'rest_time', 'notes']

class WorkoutSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(source='workout_exercises', many=True, read_only=True)
    
    class Meta:
        model = Workout
        fields = ['id', 'training_plan', 'name', 'day_of_week', 'exercises']

class trainingSerializer(serializers.ModelSerializer):
    workouts = WorkoutSerializer(many=True, read_only=True)
    student_name = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    category = serializers.CharField(source='get_goal_display', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Training
        fields = [ 
            'id',
            'student',
            'student_name',
            'teacher',
            'teacher_name',
            'program',
            'program_name',
            'goal',
            'category',
            'name', 
            'description', 
            'start_date', 
            'end_date', 
            'is_active',
            'workouts'
        ]
        read_only_fields = ['id', 'start_date', 'end_date']
    
    def get_student_name(self, obj):
        if obj.student and obj.student.user:
            return f"{obj.student.user.first_name} {obj.student.user.last_name}".strip() or obj.student.user.username
        return None
    
    def get_teacher_name(self, obj):
        if obj.teacher and obj.teacher.user:
            return f"{obj.teacher.user.first_name} {obj.teacher.user.last_name}".strip() or obj.teacher.user.username
        return None

class ProgramSerializer(serializers.ModelSerializer):
    trainings = trainingSerializer(many=True, read_only=True)
    category = serializers.CharField(source='get_goal_display', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Program
        fields = [
            'id',
            'name',
            'description',
            'teacher',
            'teacher_name',
            'goal',
            'category',
            'created_at',
            'updated_at',
            'is_active',
            'trainings'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_teacher_name(self, obj):
        if obj.teacher and obj.teacher.user:
            return f"{obj.teacher.user.first_name} {obj.teacher.user.last_name}".strip() or obj.teacher.user.username
        return None

class FolderSerializer(serializers.ModelSerializer):
    programs = ProgramSerializer(many=True, read_only=True)
    class Meta:
        model = Folder
        fields = ['id', 'name', 'programs']
        read_only_fields = ['id']