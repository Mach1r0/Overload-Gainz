from teachers.models import Teacher
from .models import VideoLesson
from rest_framework import serializers

class VideoLessonSerializer(serializers.ModelSerializer):
    teacher = serializers.PrimaryKeyRelatedField(read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)

    class Meta:
        model = VideoLesson
        fields = [
            'id',
            'teacher',
            'teacher_name',
            'title',
            'description',
            'video_file',
            'url_youtube',
            'created_at',
            'updated_at',
            'category',
            'state',
            'for_all',
            'view_count',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'teacher_name', 'teacher', 'view_count']