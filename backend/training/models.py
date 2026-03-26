from django.db import models

class Folder(models.Model):
   teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='folders')
   name = models.CharField(max_length=100)
   created_at = models.DateTimeField(auto_now_add=True)    
   def __str__(self):
        return self.name
    
class Program(models.Model):
    GOAL_CHOICES = [ 
        ('STR', 'Strength'),
        ('HYP', 'Hypertrophy'),
        ('END', 'Endurance'),
        ('WL', 'Weight Loss'),
        ('GEN', 'General Fitness'),
    ]
    
    name = models.CharField(max_length=100, help_text="Program name (e.g., ABC, Upper Lower)")
    description = models.TextField(blank=True, null=True)
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='programs')
    goal = models.CharField(max_length=5, choices=GOAL_CHOICES)
    folder = models.ForeignKey(Folder, on_delete=models.SET_NULL, related_name='programs', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    durantion = models.IntegerField(default=4, help_text="Duration of the program in weeks")
    
    def __str__(self):
        return f"{self.name} - {self.get_goal_display()}"

class Training(models.Model):
    GOAL_CHOICES = [ 
        ('STR', 'Strength'),
        ('HYP', 'Hypertrophy'),
        ('END', 'Endurance'),
        ('WL', 'Weight Loss'),
        ('GEN', 'General Fitness'),
    ]

    student = models.ForeignKey('student.Student', on_delete=models.CASCADE, related_name='StudentTraining')
    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='TeacherTraining')
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='trainings', null=True, blank=True, help_text="If part of a program, link to the program")
    goal = models.CharField(max_length=5, choices=GOAL_CHOICES)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

class Workout(models.Model):
    DAY_CHOICES = [
        (0, 'Sunday'),
        (1, 'Monday'),
        (2, 'Tuesday'),
        (3, 'Wednesday'),
        (4, 'Thursday'),
        (5, 'Friday'),
        (6, 'Saturday'),
    ]
    
    training_plan = models.ForeignKey(Training, on_delete=models.CASCADE, related_name='workouts')
    name = models.CharField(max_length=100)
    day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES)

class WorkoutExercise(models.Model):
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='workout_exercises')
    exercise = models.ForeignKey('exercises.Exercise', on_delete=models.CASCADE, related_name='exercise_workouts')
    sets = models.PositiveIntegerField()
    reps = models.PositiveIntegerField()
    min_reps = models.PositiveIntegerField(blank=True, null=True, help_text="Minimum reps for rep ranges")
    max_reps = models.PositiveIntegerField(blank=True, null=True, help_text="Maximum reps for rep ranges")
    rest_time = models.DurationField(help_text="Rest time between sets (e.g., 00:01:30 for 1 minute 30 seconds)")
    notes = models.TextField(blank=True, null=True)

