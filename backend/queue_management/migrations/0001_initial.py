from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('student', '0007_progresslog_height'),
        ('teachers', '0006_studentevaluation'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudentQueue',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(
                    choices=[
                        ('PENDING', 'Pendente'),
                        ('PROCESSING', 'Processando'),
                        ('ASSIGNED', 'Atribuído'),
                        ('FAILED', 'Falhou'),
                    ],
                    default='PENDING',
                    max_length=20,
                    verbose_name='Status',
                )),
                ('priority', models.IntegerField(
                    default=0,
                    help_text='Maior valor = maior prioridade na fila',
                    verbose_name='Prioridade',
                )),
                ('notes', models.TextField(blank=True, verbose_name='Observações')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('assigned_at', models.DateTimeField(blank=True, null=True, verbose_name='Atribuído em')),
                ('student', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='queue_entry',
                    to='student.student',
                    verbose_name='Aluno',
                )),
                ('requested_trainer', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='queue_requests',
                    to='teachers.teacher',
                    verbose_name='Professor Solicitado',
                )),
                ('assigned_trainer', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='queue_assigned',
                    to='teachers.teacher',
                    verbose_name='Professor Atribuído',
                )),
            ],
            options={
                'verbose_name': 'Fila de Aluno',
                'verbose_name_plural': 'Fila de Alunos',
                'ordering': ['-priority', 'created_at'],
            },
        ),
    ]
