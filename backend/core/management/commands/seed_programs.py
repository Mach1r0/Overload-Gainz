"""
Management command to seed workout programs
Usage: python manage.py seed_programs
"""

from django.core.management.base import BaseCommand
from datetime import timedelta
from teachers.models import Teacher
from exercises.models import Exercise
from training.models import Program, Training, Workout, WorkoutExercise
from student.models import Student


class Command(BaseCommand):
    help = 'Seeds the database with workout programs and associated trainings'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🌱 Starting program seeding...\n'))

        # Create programs
        programs = self.create_programs()
        
        # Create trainings linked to programs
        trainings = self.create_program_trainings(programs)
        
        self.stdout.write(self.style.SUCCESS('\n✨ Program seeding completed!'))
        self.stdout.write(f'📋 Created {len(programs)} programs')
        self.stdout.write(f'🏋️  Created {len(trainings)} training plans')

    def create_programs(self):
        """Create workout programs"""
        self.stdout.write('📋 Creating workout programs...')
        
        teachers = list(Teacher.objects.all())
        if not teachers:
            self.stdout.write(self.style.WARNING('⚠️  No teachers found. Run seed_database.py first.'))
            return []
        
        programs_data = [
            {
                'name': 'Programa ABC - Hipertrofia',
                'description': 'Programa de 3 dias focado em hipertrofia muscular. Dividido em Push-Pull-Legs.',
                'teacher': teachers[0],
                'goal': 'HYP',
            },
            {
                'name': 'Programa Upper Lower',
                'description': 'Programa de 4 dias alternando treinos de membros superiores e inferiores.',
                'teacher': teachers[0],
                'goal': 'STR',
            },
            {
                'name': 'Programa Full Body - Iniciante',
                'description': 'Treino de corpo inteiro 3x por semana, ideal para iniciantes.',
                'teacher': teachers[0] if len(teachers) == 1 else teachers[1],
                'goal': 'GEN',
            },
            {
                'name': 'Programa Emagrecimento',
                'description': 'Combinação de treino de força e cardio para perda de peso sustentável.',
                'teacher': teachers[0] if len(teachers) == 1 else teachers[1],
                'goal': 'WL',
            },
            {
                'name': 'Programa PPL - Avançado',
                'description': 'Push-Pull-Legs 6x por semana para atletas avançados.',
                'teacher': teachers[0],
                'goal': 'HYP',
            },
        ]
        
        programs = []
        for data in programs_data:
            program, created = Program.objects.get_or_create(
                name=data['name'],
                teacher=data['teacher'],
                defaults=data
            )
            programs.append(program)
            if created:
                self.stdout.write(f'  ✓ Created: {program.name}')
        
        return programs

    def create_program_trainings(self, programs):
        """Create training plans linked to programs for students"""
        self.stdout.write('🏋️  Creating training plans...')
        
        students = list(Student.objects.all())
        if not students:
            self.stdout.write(self.style.WARNING('⚠️  No students found. Skipping training creation.'))
            return []
        
        exercises = list(Exercise.objects.all())
        if not exercises:
            self.stdout.write(self.style.WARNING('⚠️  No exercises found. Skipping training creation.'))
            return []
        
        trainings = []
        
        # Assign programs to students
        program_assignments = [
            (0, 0, 'ABC - Hipertrofia', 'HYP'),  # Student 0 -> Program 0
            (1, 3, 'Emagrecimento', 'WL'),        # Student 1 -> Program 3
            (2, 2, 'Full Body', 'GEN'),           # Student 2 -> Program 2
        ]
        
        for student_idx, program_idx, name_suffix, goal in program_assignments:
            if student_idx >= len(students) or program_idx >= len(programs):
                continue
            
            student = students[student_idx]
            program = programs[program_idx]
            
            training, created = Training.objects.get_or_create(
                student=student,
                program=program,
                name=f'{name_suffix} - {student.user.first_name}',
                defaults={
                    'teacher': program.teacher,
                    'goal': goal,
                    'description': f'Treino baseado no {program.name}',
                    'is_active': True,
                }
            )
            
            if created:
                # Create workouts for this training
                self.create_workouts_for_training(training, program, exercises)
                trainings.append(training)
                self.stdout.write(f'  ✓ Created training for {student.user.first_name}: {training.name}')
        
        return trainings

    def create_workouts_for_training(self, training, program, exercises):
        """Create workouts based on program type"""
        
        if 'ABC' in program.name or 'PPL' in program.name:
            self.create_abc_workouts(training, exercises)
        elif 'Upper Lower' in program.name:
            self.create_upper_lower_workouts(training, exercises)
        elif 'Full Body' in program.name:
            self.create_full_body_workouts(training, exercises)
        elif 'Emagrecimento' in program.name:
            self.create_weight_loss_workouts(training, exercises)

    def create_abc_workouts(self, training, exercises):
        """Create ABC split workouts"""
        
        # Workout A - Chest and Triceps
        workout_a = Workout.objects.create(
            training_plan=training,
            name='Treino A - Peito e Tríceps',
            day_of_week='1'
        )
        
        chest_ex = [e for e in exercises if e.muscle_group == 'Peito'][:3]
        triceps_ex = [e for e in exercises if e.muscle_group == 'Tríceps'][:2]
        
        for ex in chest_ex:
            WorkoutExercise.objects.create(
                workout=workout_a, exercise=ex, sets=4, reps=12,
                rest_time=timedelta(seconds=90)
            )
        for ex in triceps_ex:
            WorkoutExercise.objects.create(
                workout=workout_a, exercise=ex, sets=3, reps=15,
                rest_time=timedelta(seconds=60)
            )
        
        # Workout B - Back and Biceps
        workout_b = Workout.objects.create(
            training_plan=training,
            name='Treino B - Costas e Bíceps',
            day_of_week='3'
        )
        
        back_ex = [e for e in exercises if e.muscle_group == 'Costas'][:3]
        biceps_ex = [e for e in exercises if e.muscle_group == 'Bíceps'][:2]
        
        for ex in back_ex:
            WorkoutExercise.objects.create(
                workout=workout_b, exercise=ex, sets=4, reps=10,
                rest_time=timedelta(seconds=90)
            )
        for ex in biceps_ex:
            WorkoutExercise.objects.create(
                workout=workout_b, exercise=ex, sets=3, reps=12,
                rest_time=timedelta(seconds=60)
            )
        
        # Workout C - Legs and Shoulders
        workout_c = Workout.objects.create(
            training_plan=training,
            name='Treino C - Pernas e Ombros',
            day_of_week='5'
        )
        
        leg_ex = [e for e in exercises if e.muscle_group == 'Pernas'][:4]
        shoulder_ex = [e for e in exercises if e.muscle_group == 'Ombros'][:2]
        
        for ex in leg_ex:
            WorkoutExercise.objects.create(
                workout=workout_c, exercise=ex, sets=4, reps=12,
                rest_time=timedelta(seconds=120)
            )
        for ex in shoulder_ex:
            WorkoutExercise.objects.create(
                workout=workout_c, exercise=ex, sets=3, reps=15,
                rest_time=timedelta(seconds=60)
            )

    def create_upper_lower_workouts(self, training, exercises):
        """Create Upper/Lower split workouts"""
        
        # Upper A
        upper_a = Workout.objects.create(
            training_plan=training, name='Treino Upper A', day_of_week='1'
        )
        upper_ex_a = [e for e in exercises if e.muscle_group in ['Peito', 'Ombros', 'Tríceps']][:5]
        for ex in upper_ex_a:
            WorkoutExercise.objects.create(
                workout=upper_a, exercise=ex, sets=4, reps=8,
                rest_time=timedelta(seconds=120)
            )
        
        # Lower A
        lower_a = Workout.objects.create(
            training_plan=training, name='Treino Lower A', day_of_week='2'
        )
        lower_ex = [e for e in exercises if e.muscle_group == 'Pernas'][:5]
        for ex in lower_ex:
            WorkoutExercise.objects.create(
                workout=lower_a, exercise=ex, sets=4, reps=10,
                rest_time=timedelta(seconds=120)
            )
        
        # Upper B
        upper_b = Workout.objects.create(
            training_plan=training, name='Treino Upper B', day_of_week='4'
        )
        upper_ex_b = [e for e in exercises if e.muscle_group in ['Costas', 'Bíceps']][:5]
        for ex in upper_ex_b:
            WorkoutExercise.objects.create(
                workout=upper_b, exercise=ex, sets=4, reps=8,
                rest_time=timedelta(seconds=120)
            )
        
        # Lower B
        lower_b = Workout.objects.create(
            training_plan=training, name='Treino Lower B', day_of_week='5'
        )
        for ex in lower_ex[:4]:
            WorkoutExercise.objects.create(
                workout=lower_b, exercise=ex, sets=3, reps=12,
                rest_time=timedelta(seconds=90)
            )

    def create_full_body_workouts(self, training, exercises):
        """Create Full Body workouts"""
        
        days = [(1, 'Segunda'), (3, 'Quarta'), (5, 'Sexta')]
        
        for day_num, day_name in days:
            workout = Workout.objects.create(
                training_plan=training,
                name=f'Treino Full Body - {day_name}',
                day_of_week=str(day_num)
            )
            
            # Mix of muscle groups
            muscle_groups = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Abdômen']
            for mg in muscle_groups:
                ex_list = [e for e in exercises if e.muscle_group == mg]
                if ex_list:
                    WorkoutExercise.objects.create(
                        workout=workout, exercise=ex_list[0], sets=3, reps=12,
                        rest_time=timedelta(seconds=60)
                    )

    def create_weight_loss_workouts(self, training, exercises):
        """Create weight loss circuit-style workouts"""
        
        days = [(1, 'A'), (3, 'B'), (5, 'C')]
        
        for day_num, day_name in days:
            workout = Workout.objects.create(
                training_plan=training,
                name=f'Circuito {day_name}',
                day_of_week=str(day_num)
            )
            
            # Higher reps, shorter rest for weight loss
            selected_ex = exercises[:6]
            for ex in selected_ex:
                WorkoutExercise.objects.create(
                    workout=workout, exercise=ex, sets=3, reps=15,
                    rest_time=timedelta(seconds=45),
                    notes='Circuito - executar com intensidade moderada'
                )
