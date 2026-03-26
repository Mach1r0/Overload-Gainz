from django.db import models

class VideoLesson(models.Model):
    CATEGORY_CHOICES = [ 
        ('theory', 'Teoria'),
        ('technique', 'Técnica'),
        ('practice', 'Prática'),
        ('nutrition', 'Nutrição'),
        ('cutting', 'Cutting'),
        ('bulking', 'Bulking'),
        ('sports_nutrition', 'Nutrição Esportiva'),
        ('supplementation', 'Suplementação'),
        ('muscle_recovery', 'Recuperação Muscular'),
        ('stretching_mobility', 'Alongamento e Mobilidade'),
    ]

    teacher = models.ForeignKey('teachers.Teacher', on_delete=models.CASCADE, related_name='video_lessons')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    video_file = models.FileField(upload_to='video_lessons/', blank=True, null=True)
    url_youtube = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default='theory') 
    state = models.BooleanField(default=True, blank=True, null=True)
    for_all = models.BooleanField(default=False, blank=True, null=True)
    view_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.title