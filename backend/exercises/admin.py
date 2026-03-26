from django.contrib import admin
from .models import Exercise, ExerciseImage


class ExerciseImageInline(admin.TabularInline):
    model = ExerciseImage
    extra = 0
    fields = ['image_path', 'order']


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'category', 'equipment', 'primary_muscles', 'created_at']
    list_filter = ['level', 'category', 'equipment', 'force', 'mechanic', 'created_at']
    search_fields = ['name', 'description', 'primary_muscles', 'secondary_muscles']
    inlines = [ExerciseImageInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description')
        }),
        ('Classification', {
            'fields': ('level', 'category', 'force', 'mechanic', 'equipment')
        }),
        ('Muscles', {
            'fields': ('primary_muscles', 'secondary_muscles')
        }),
        ('Media', {
            'fields': ('video_url', 'image')
        }),
    )


@admin.register(ExerciseImage)
class ExerciseImageAdmin(admin.ModelAdmin):
    list_display = ['exercise', 'image_path', 'order']
    list_filter = ['exercise__primary_muscles']
    search_fields = ['exercise__name']
