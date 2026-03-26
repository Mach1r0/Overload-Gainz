from django.db import models

class Exercise(models.Model):
    FORCE_CHOICES = [
        ('static', 'Static'),
        ('pull', 'Pull'),
        ('push', 'Push'),
    ]
    
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('expert', 'Expert'),
    ]
    
    MECHANIC_CHOICES = [
        ('isolation', 'Isolation'),
        ('compound', 'Compound'),
    ]
    
    EQUIPMENT_CHOICES = [
        ('medicine ball', 'Medicine Ball'),
        ('dumbbell', 'Dumbbell'),
        ('body only', 'Body Only'),
        ('bands', 'Bands'),
        ('kettlebells', 'Kettlebells'),
        ('foam roll', 'Foam Roll'),
        ('cable', 'Cable'),
        ('machine', 'Machine'),
        ('barbell', 'Barbell'),
        ('exercise ball', 'Exercise Ball'),
        ('e-z curl bar', 'E-Z Curl Bar'),
        ('other', 'Other'),
    ]
    
    CATEGORY_CHOICES = [
        ('powerlifting', 'Powerlifting'),
        ('strength', 'Strength'),
        ('stretching', 'Stretching'),
        ('cardio', 'Cardio'),
        ('olympic weightlifting', 'Olympic Weightlifting'),
        ('strongman', 'Strongman'),
        ('plyometrics', 'Plyometrics'),
    ]
    
    MUSCLE_CHOICES = [
        ('abdominals', 'Abdominals'),
        ('abductors', 'Abductors'),
        ('adductors', 'Adductors'),
        ('biceps', 'Biceps'),
        ('calves', 'Calves'),
        ('chest', 'Chest'),
        ('forearms', 'Forearms'),
        ('glutes', 'Glutes'),
        ('hamstrings', 'Hamstrings'),
        ('lats', 'Lats'),
        ('lower back', 'Lower Back'),
        ('middle back', 'Middle Back'),
        ('neck', 'Neck'),
        ('quadriceps', 'Quadriceps'),
        ('shoulders', 'Shoulders'),
        ('traps', 'Traps'),
        ('triceps', 'Triceps'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    
    force = models.CharField(max_length=20, choices=FORCE_CHOICES, blank=True, null=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    mechanic = models.CharField(max_length=20, choices=MECHANIC_CHOICES, blank=True, null=True)
    equipment = models.CharField(max_length=50, choices=EQUIPMENT_CHOICES, blank=True, null=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='strength')
    
    primary_muscles = models.CharField(max_length=255, default='general', help_text="Comma-separated list of primary muscles")
    secondary_muscles = models.CharField(max_length=255, blank=True, default='', help_text="Comma-separated list of secondary muscles")
    
    video_url = models.URLField(blank=True, null=True)
    image = models.ImageField(upload_to='exercises/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ExerciseImage(models.Model):
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='images')
    image_path = models.CharField(max_length=255)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.exercise.name} - Image {self.order}"
