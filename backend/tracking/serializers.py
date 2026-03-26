from rest_framework import serializers 
from .models import WorkoutSession, ExerciseLog, SetLog
from training.serializers import WorkoutExerciseSerializer
from exercises.serializers import ExerciseSerializer

class SetLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SetLog
        fields = ['id', 'exercise_log', 'set_number', 'repetitions', 'weight', 'rest_time', 'notes', 'is_pr', 'created_at']
        read_only_fields = ['created_at']

class ExerciseLogSerializer(serializers.ModelSerializer):
    workout_exercise = WorkoutExerciseSerializer(read_only=True)
    exercise = ExerciseSerializer(read_only=True)
    set_logs = SetLogSerializer(many=True, read_only=True)

    set_logs = SetLogSerializer(many=True, read_only=True)
    one_rep_max = serializers.SerializerMethodField()

    def get_one_rep_max(self, obj):
            if obj.set_logs.exists():
                set_log = obj.set_logs.first()
                return self.calculate_1rm(set_log.weight, set_log.repetitions)
            return None

    def calculate_1rm(self, weight, reps):
        if reps > 1:
            return weight * (1 + reps / 30.0)
        return weight
    
    class Meta:
        model = ExerciseLog
        fields = [
            'id',
            'session',
            'exercise',
            'workout_exercise',
            'order', 
            'notes',
            'set_logs',
            'created_at',
            'one_rep_max',
        ]
        read_only_fields = ['created_at']

class WorkoutSessionSerializer(serializers.ModelSerializer):
    exercise_logs = ExerciseLogSerializer(many=True, read_only=True)
    total_duration = serializers.SerializerMethodField()

    def get_total_duration(self, obj):
        if obj.started_at and obj.ended_at:
            return (obj.ended_at - obj.started_at).total_seconds() / 60.0
        return 0
    
    class Meta:
        model = WorkoutSession
        fields = ['id', 'user', 'workout', 'date', 'started_at', 'ended_at', 'status', 'notes', 'exercise_logs', 'created_at', 'total_duration']
        read_only_fields = ['created_at']

    

