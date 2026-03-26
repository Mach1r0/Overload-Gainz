from django.db import models


class StudentQueue(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_PROCESSING = 'PROCESSING'
    STATUS_ASSIGNED = 'ASSIGNED'
    STATUS_FAILED = 'FAILED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pendente'),
        (STATUS_PROCESSING, 'Processando'),
        (STATUS_ASSIGNED, 'Atribuído'),
        (STATUS_FAILED, 'Falhou'),
    ]

    student = models.OneToOneField(
        'student.Student',
        on_delete=models.CASCADE,
        related_name='queue_entry',
        verbose_name='Aluno',
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        verbose_name='Status',
    )
    priority = models.IntegerField(
        default=0,
        help_text='Maior valor = maior prioridade na fila',
        verbose_name='Prioridade',
    )
    requested_trainer = models.ForeignKey(
        'teachers.Teacher',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='queue_requests',
        verbose_name='Professor Solicitado',
    )
    assigned_trainer = models.ForeignKey(
        'teachers.Teacher',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='queue_assigned',
        verbose_name='Professor Atribuído',
    )
    notes = models.TextField(blank=True, verbose_name='Observações')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    assigned_at = models.DateTimeField(null=True, blank=True, verbose_name='Atribuído em')

    class Meta:
        ordering = ['-priority', 'created_at']
        verbose_name = 'Fila de Aluno'
        verbose_name_plural = 'Fila de Alunos'

    def __str__(self):
        return f"Fila: {self.student.user.username} — {self.get_status_display()}"
