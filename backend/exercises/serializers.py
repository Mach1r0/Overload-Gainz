from rest_framework import serializers
from .models import Exercise, ExerciseImage


class ExerciseImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseImage
        fields = ['id', 'image_path', 'order']


class ExerciseSerializer(serializers.ModelSerializer):
    images = ExerciseImageSerializer(many=True, read_only=True)
    primary_muscles_list = serializers.SerializerMethodField()
    secondary_muscles_list = serializers.SerializerMethodField()
    
    class Meta:
        model = Exercise
        fields = [
            'id',
            'name', 
            'description',
            'force',
            'level',
            'mechanic',
            'equipment',
            'category',
            'primary_muscles',
            'primary_muscles_list',
            'secondary_muscles',
            'secondary_muscles_list',
            'video_url',
            'image',
            'images',
            'created_at',
            'updated_at',
        ] 
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_primary_muscles_list(self, obj):
        if obj.primary_muscles:
            return [m.strip() for m in obj.primary_muscles.split(',')]
        return []
    
    def get_secondary_muscles_list(self, obj):
        if obj.secondary_muscles:
            return [m.strip() for m in obj.secondary_muscles.split(',')]
        return []
