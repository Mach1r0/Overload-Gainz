from rest_framework import serializers


class AnalysisRequestSerializer(serializers.Serializer):
    student_id = serializers.IntegerField(help_text='ID do aluno')
    async_mode = serializers.BooleanField(
        default=True,
        required=False,
        help_text='True = executa em background e retorna task_id; False = aguarda o resultado.',
    )


class TaskStatusSerializer(serializers.Serializer):
    task_id = serializers.CharField()
    status = serializers.CharField()
    result = serializers.JSONField(required=False, allow_null=True)
    error = serializers.CharField(required=False)
