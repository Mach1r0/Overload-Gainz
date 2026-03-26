from rest_framework import serializers
from queue_management.models import StudentQueue


class StudentQueueSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    assigned_trainer_name = serializers.SerializerMethodField()
    requested_trainer_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = StudentQueue
        fields = [
            'id', 'student', 'student_name', 'student_email',
            'status', 'status_display', 'priority',
            'requested_trainer', 'requested_trainer_name',
            'assigned_trainer', 'assigned_trainer_name',
            'notes', 'created_at', 'updated_at', 'assigned_at',
        ]
        read_only_fields = ['assigned_trainer', 'assigned_at', 'created_at', 'updated_at']

    def get_student_name(self, obj):
        return obj.student.user.get_full_name() or obj.student.user.username

    def get_student_email(self, obj):
        return obj.student.user.email

    def get_assigned_trainer_name(self, obj):
        if obj.assigned_trainer:
            return obj.assigned_trainer.user.get_full_name() or obj.assigned_trainer.user.username
        return None

    def get_requested_trainer_name(self, obj):
        if obj.requested_trainer:
            return obj.requested_trainer.user.get_full_name() or obj.requested_trainer.user.username
        return None


class ManualAssignSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    teacher_id = serializers.IntegerField()


class ProcessQueueSerializer(serializers.Serializer):
    teacher_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text='Opcional: direciona todos os pendentes para este professor específico.',
    )


class AddToQueueSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    priority = serializers.IntegerField(default=0, required=False)
    requested_trainer_id = serializers.IntegerField(required=False, allow_null=True)
