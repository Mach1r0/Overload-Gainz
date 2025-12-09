"""
Database Seeding Script for Overload Gainz
Run this script to populate the database with sample data
Usage: python manage.py shell < seed_database.py
Or: python seed_database.py (if running as management command)
"""

import os
import django
from datetime import datetime, timedelta, time
from django.utils import timezone
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from student.models import Student, ProgressLog, PhotosStudent
from teachers.models import Teacher, ScheduleTeacher, ScheduleException, Appointment, TeacherStudents
from exercises.models import Exercise
from training.models import Training, Workout, WorkoutExercise, Program
from tracking.models import WorkoutSession, ExerciseLog, SetLog
from diet.models import FoodItem, DietPlan, Meal, MealFoodItem, MealRegistration
from analytics.models import PersonalRecord, BodyMeasurement, ProgressPhoto

def clear_database():
    """Clear all data from database (use with caution!)"""
    print("🗑️  Clearing database...")
    
    # Clear in reverse order of dependencies
    SetLog.objects.all().delete()
    ExerciseLog.objects.all().delete()
    WorkoutSession.objects.all().delete()
    MealRegistration.objects.all().delete()
    MealFoodItem.objects.all().delete()
    Meal.objects.all().delete()
    DietPlan.objects.all().delete()
    FoodItem.objects.all().delete()
    WorkoutExercise.objects.all().delete()
    Workout.objects.all().delete()
    Training.objects.all().delete()
    Program.objects.all().delete()
    PersonalRecord.objects.all().delete()
    BodyMeasurement.objects.all().delete()
    ProgressPhoto.objects.all().delete()
    ProgressLog.objects.all().delete()
    PhotosStudent.objects.all().delete()
    Appointment.objects.all().delete()
    ScheduleException.objects.all().delete()
    ScheduleTeacher.objects.all().delete()
    Student.objects.all().delete()
    Teacher.objects.all().delete()
    User.objects.all().delete()
    
    print("✅ Database cleared!")

def create_users():
    """Create sample users (teachers and students)"""
    print("👥 Creating users...")
    
    users = []
    
    # Create Teachers
    teacher1 = User.objects.create_user(
        username='carlos_trainer',
        email='carlos@heavygains.com',
        password='password123',
        first_name='Carlos',
        last_name='Silva',
        is_teacher=True
    )
    Teacher.objects.create(
        user=teacher1,
        feedback_score=4.8,
        bio='Personal trainer especializado em hipertrofia e perda de peso',
        specialties='Hipertrofia, Emagrecimento, Funcional',
        phone_number='+55 11 98765-4321',
        CREF='123456-G/SP'
    )
    users.append(teacher1)
    
    teacher2 = User.objects.create_user(
        username='ana_fitness',
        email='ana@heavygains.com',
        password='password123',
        first_name='Ana',
        last_name='Costa',
        is_teacher=True
    )
    Teacher.objects.create(
        user=teacher2,
        feedback_score=4.9,
        bio='Especialista em treino funcional e reabilitação',
        specialties='Funcional, Reabilitação, Mobilidade',
        phone_number='+55 11 98765-1234',
        CREF='654321-G/SP'
    )
    users.append(teacher2)
    
    # Create Students
    student1 = User.objects.create_user(
        username='joao_aluno',
        email='joao@example.com',
        password='password123',
        first_name='João',
        last_name='Oliveira',
        is_student=True
    )
    Student.objects.create(
        user=student1,
        age=25,
        phone_number='+55 11 91234-5678'
    )
    users.append(student1)
    
    student2 = User.objects.create_user(
        username='maria_fitness',
        email='maria@example.com',
        password='password123',
        first_name='Maria',
        last_name='Santos',
        is_student=True
    )
    Student.objects.create(
        user=student2,
        age=28,
        phone_number='+55 11 91234-8765'
    )
    users.append(student2)
    
    student3 = User.objects.create_user(
        username='pedro_gains',
        email='pedro@example.com',
        password='password123',
        first_name='Pedro',
        last_name='Almeida',
        is_student=True
    )
    Student.objects.create(
        user=student3,
        age=22,
        phone_number='+55 11 99876-5432'
    )
    users.append(student3)
    
    print(f"✅ Created {len(users)} users (2 teachers, 3 students)")
    return users


def create_teacher_students():
    """Link students to teachers so trainer dashboards have data"""
    print("🤝 Linking teachers and students...")

    teachers = list(Teacher.objects.all())
    students = list(Student.objects.all())

    links = []

    if teachers:
        primary = teachers[0]
        for student in students[:2]:
            link, _ = TeacherStudents.objects.get_or_create(teacher=primary, student=student)
            links.append(link)

    if len(teachers) > 1:
        secondary = teachers[1]
        for student in students[2:]:
            link, _ = TeacherStudents.objects.get_or_create(teacher=secondary, student=student)
            links.append(link)

    print(f"✅ Linked {len(links)} teacher-student pairs")
    return links


def create_teacher_schedules():
    """Create teacher schedules"""
    print("📅 Creating teacher schedules...")
    
    teachers = Teacher.objects.all()
    
    for teacher in teachers:
        # Monday to Friday: 6am-10am and 6pm-10pm
        for day in range(5):  # 0-4 (Monday to Friday)
            ScheduleTeacher.objects.create(
                teacher=teacher,
                day_of_week=day,
                start_time=time(6, 0),
                end_time=time(10, 0),
                is_available=True
            )
            ScheduleTeacher.objects.create(
                teacher=teacher,
                day_of_week=day,
                start_time=time(18, 0),
                end_time=time(22, 0),
                is_available=True
            )
        
        # Saturday: 8am-12pm
        ScheduleTeacher.objects.create(
            teacher=teacher,
            day_of_week=5,
            start_time=time(8, 0),
            end_time=time(12, 0),
            is_available=True
        )
    
    print("✅ Created teacher schedules")

def create_exercises():
    """Create sample exercises"""
    print("💪 Creating exercises...")
    
    exercises_data = [
        # Chest
        {'name': 'Supino Reto', 'description': 'Exercício composto para peito', 'muscle_group': 'Peito'},
        {'name': 'Supino Inclinado', 'description': 'Foca na parte superior do peito', 'muscle_group': 'Peito'},
        {'name': 'Crucifixo', 'description': 'Isolamento de peito', 'muscle_group': 'Peito'},
        {'name': 'Flexão', 'description': 'Exercício com peso corporal', 'muscle_group': 'Peito'},
        
        # Back
        {'name': 'Barra Fixa', 'description': 'Exercício composto para costas', 'muscle_group': 'Costas'},
        {'name': 'Remada Curvada', 'description': 'Desenvolvimento das costas', 'muscle_group': 'Costas'},
        {'name': 'Remada Cavalinho', 'description': 'Remada com apoio', 'muscle_group': 'Costas'},
        {'name': 'Pulldown', 'description': 'Puxada frontal', 'muscle_group': 'Costas'},
        
        # Legs
        {'name': 'Agachamento Livre', 'description': 'Rei dos exercícios', 'muscle_group': 'Pernas'},
        {'name': 'Leg Press', 'description': 'Desenvolvimento de pernas', 'muscle_group': 'Pernas'},
        {'name': 'Cadeira Extensora', 'description': 'Isolamento de quadríceps', 'muscle_group': 'Pernas'},
        {'name': 'Mesa Flexora', 'description': 'Isolamento de posterior', 'muscle_group': 'Pernas'},
        {'name': 'Agachamento Búlgaro', 'description': 'Unilateral para pernas', 'muscle_group': 'Pernas'},
        
        # Shoulders
        {'name': 'Desenvolvimento Militar', 'description': 'Exercício composto para ombros', 'muscle_group': 'Ombros'},
        {'name': 'Elevação Lateral', 'description': 'Isolamento de ombro medial', 'muscle_group': 'Ombros'},
        {'name': 'Elevação Frontal', 'description': 'Isolamento de ombro anterior', 'muscle_group': 'Ombros'},
        
        # Arms
        {'name': 'Rosca Direta', 'description': 'Exercício para bíceps', 'muscle_group': 'Bíceps'},
        {'name': 'Rosca Martelo', 'description': 'Variação de rosca', 'muscle_group': 'Bíceps'},
        {'name': 'Tríceps Pulley', 'description': 'Isolamento de tríceps', 'muscle_group': 'Tríceps'},
        {'name': 'Tríceps Testa', 'description': 'Exercício para tríceps', 'muscle_group': 'Tríceps'},
        
        # Core
        {'name': 'Abdominal Crunch', 'description': 'Exercício básico de core', 'muscle_group': 'Abdômen'},
        {'name': 'Prancha', 'description': 'Isometria de core', 'muscle_group': 'Abdômen'},
        {'name': 'Abdominal Bicicleta', 'description': 'Trabalha oblíquos', 'muscle_group': 'Abdômen'},
    ]
    
    exercises = []
    for ex_data in exercises_data:
        exercise = Exercise.objects.create(**ex_data)
        exercises.append(exercise)
    
    print(f"✅ Created {len(exercises)} exercises")
    return exercises

def create_food_items():
    """Create sample food items"""
    print("🍎 Creating food items...")
    
    foods_data = [
        # Proteins
        {'name': 'Peito de Frango', 'calories': 165, 'protein': 31, 'carbs': 0, 'fats': 3.6, 'category': 'PRN'},
        {'name': 'Ovo (unidade)', 'calories': 155, 'protein': 13, 'carbs': 1.1, 'fats': 11, 'category': 'PRN'},
        {'name': 'Tilápia', 'calories': 96, 'protein': 20, 'carbs': 0, 'fats': 1.7, 'category': 'PRN'},
        {'name': 'Patinho Moído', 'calories': 140, 'protein': 20, 'carbs': 0, 'fats': 6, 'category': 'PRN'},
        {'name': 'Whey Protein', 'calories': 120, 'protein': 24, 'carbs': 3, 'fats': 1.5, 'category': 'PRN'},
        
        # Carbs
        {'name': 'Arroz Branco', 'calories': 130, 'protein': 2.7, 'carbs': 28, 'fats': 0.3, 'category': 'GRN'},
        {'name': 'Batata Doce', 'calories': 86, 'protein': 1.6, 'carbs': 20, 'fats': 0.1, 'category': 'GRN'},
        {'name': 'Aveia', 'calories': 389, 'protein': 17, 'carbs': 66, 'fats': 7, 'category': 'GRN'},
        {'name': 'Pão Integral', 'calories': 247, 'protein': 13, 'carbs': 41, 'fats': 3.4, 'category': 'GRN'},
        {'name': 'Macarrão Integral', 'calories': 124, 'protein': 5, 'carbs': 26, 'fats': 0.5, 'category': 'GRN'},
        
        # Vegetables
        {'name': 'Brócolis', 'calories': 34, 'protein': 2.8, 'carbs': 7, 'fats': 0.4, 'category': 'VEG'},
        {'name': 'Alface', 'calories': 15, 'protein': 1.4, 'carbs': 2.9, 'fats': 0.2, 'category': 'VEG'},
        {'name': 'Tomate', 'calories': 18, 'protein': 0.9, 'carbs': 3.9, 'fats': 0.2, 'category': 'VEG'},
        {'name': 'Cenoura', 'calories': 41, 'protein': 0.9, 'carbs': 10, 'fats': 0.2, 'category': 'VEG'},
        
        # Fruits
        {'name': 'Banana', 'calories': 89, 'protein': 1.1, 'carbs': 23, 'fats': 0.3, 'category': 'FRT'},
        {'name': 'Maçã', 'calories': 52, 'protein': 0.3, 'carbs': 14, 'fats': 0.2, 'category': 'FRT'},
        {'name': 'Mamão', 'calories': 43, 'protein': 0.5, 'carbs': 11, 'fats': 0.3, 'category': 'FRT'},
        
        # Fats
        {'name': 'Azeite de Oliva', 'calories': 884, 'protein': 0, 'carbs': 0, 'fats': 100, 'category': 'FAT'},
        {'name': 'Amendoim', 'calories': 567, 'protein': 26, 'carbs': 16, 'fats': 49, 'category': 'FAT'},
        {'name': 'Abacate', 'calories': 160, 'protein': 2, 'carbs': 9, 'fats': 15, 'category': 'FAT'},
        
        # Dairy
        {'name': 'Leite Desnatado', 'calories': 34, 'protein': 3.4, 'carbs': 5, 'fats': 0.1, 'category': 'DRY'},
        {'name': 'Queijo Cottage', 'calories': 98, 'protein': 11, 'carbs': 3.4, 'fats': 4.3, 'category': 'DRY'},
        {'name': 'Iogurte Grego Natural', 'calories': 59, 'protein': 10, 'carbs': 3.6, 'fats': 0.4, 'category': 'DRY'},
    ]
    
    foods = []
    for food_data in foods_data:
        food = FoodItem.objects.create(**food_data)
        foods.append(food)
    
    print(f"✅ Created {len(foods)} food items")
    return foods

def create_programs():
    """Create sample workout programs"""
    print("📋 Creating workout programs...")
    
    teachers = Teacher.objects.all()
    
    programs = []
    
    # Program 1 - ABC Hypertrophy
    program1 = Program.objects.create(
        name='Programa ABC - Hipertrofia',
        description='Programa de 3 dias focado em hipertrofia muscular. Dividido em Push-Pull-Legs.',
        teacher=teachers[0],
        goal='HYP',
        is_active=True
    )
    programs.append(program1)
    
    # Program 2 - Upper Lower
    program2 = Program.objects.create(
        name='Programa Upper Lower',
        description='Programa de 4 dias alternando treinos de membros superiores e inferiores.',
        teacher=teachers[0],
        goal='STR',
        is_active=True
    )
    programs.append(program2)
    
    # Program 3 - Full Body
    program3 = Program.objects.create(
        name='Programa Full Body - Iniciante',
        description='Treino de corpo inteiro 3x por semana, ideal para iniciantes.',
        teacher=teachers[1],
        goal='GEN',
        is_active=True
    )
    programs.append(program3)
    
    # Program 4 - Weight Loss
    program4 = Program.objects.create(
        name='Programa Emagrecimento',
        description='Combinação de treino de força e cardio para perda de peso sustentável.',
        teacher=teachers[1],
        goal='WL',
        is_active=True
    )
    programs.append(program4)
    
    # Program 5 - Push Pull Legs
    program5 = Program.objects.create(
        name='Programa PPL - Avançado',
        description='Push-Pull-Legs 6x por semana para atletas avançados.',
        teacher=teachers[0],
        goal='HYP',
        is_active=True
    )
    programs.append(program5)
    
    print(f"✅ Created {len(programs)} programs")
    return programs

def create_training_plans():
    """Create sample training plans with workouts linked to programs"""
    print("🏋️ Creating training plans...")
    
    students = Student.objects.all()
    teachers = Teacher.objects.all()
    exercises = list(Exercise.objects.all())
    programs = Program.objects.all()
    
    trainings = []
    
    # Training for student 1 - ABC Hypertrophy Program
    student1 = students[0]
    teacher1 = teachers[0]
    program1 = programs[0]  # ABC Hypertrophy
    
    training1 = Training.objects.create(
        student=student1,
        teacher=teacher1,
        program=program1,
        goal='HYP',
        name='ABC - Hipertrofia',
        description='Treino dividido em 3 dias focado em hipertrofia muscular',
        is_active=True
    )
    trainings.append(training1)
    
    # Workout A - Peito e Tríceps
    workout_a = Workout.objects.create(
        training_plan=training1,
        name='Treino A - Peito e Tríceps',
        day_of_week='1'  # Monday
    )
    
    chest_exercises = Exercise.objects.filter(muscle_group='Peito')[:3]
    triceps_exercises = Exercise.objects.filter(muscle_group='Tríceps')[:2]
    
    for idx, exercise in enumerate(chest_exercises):
        WorkoutExercise.objects.create(
            workout=workout_a,
            exercise=exercise,
            sets=4,
            reps=12,
            rest_time=timedelta(seconds=90)
        )
    
    for exercise in triceps_exercises:
        WorkoutExercise.objects.create(
            workout=workout_a,
            exercise=exercise,
            sets=3,
            reps=15,
            rest_time=timedelta(seconds=60)
        )
    
    # Workout B - Costas e Bíceps
    workout_b = Workout.objects.create(
        training_plan=training1,
        name='Treino B - Costas e Bíceps',
        day_of_week='3'  # Wednesday
    )
    
    back_exercises = Exercise.objects.filter(muscle_group='Costas')[:3]
    biceps_exercises = Exercise.objects.filter(muscle_group='Bíceps')[:2]
    
    for exercise in back_exercises:
        WorkoutExercise.objects.create(
            workout=workout_b,
            exercise=exercise,
            sets=4,
            reps=10,
            rest_time=timedelta(seconds=90)
        )
    
    for exercise in biceps_exercises:
        WorkoutExercise.objects.create(
            workout=workout_b,
            exercise=exercise,
            sets=3,
            reps=12,
            rest_time=timedelta(seconds=60)
        )
    
    # Workout C - Pernas e Ombros
    workout_c = Workout.objects.create(
        training_plan=training1,
        name='Treino C - Pernas e Ombros',
        day_of_week='5'  # Friday
    )
    
    leg_exercises = Exercise.objects.filter(muscle_group='Pernas')[:4]
    shoulder_exercises = Exercise.objects.filter(muscle_group='Ombros')[:2]
    
    for exercise in leg_exercises:
        WorkoutExercise.objects.create(
            workout=workout_c,
            exercise=exercise,
            sets=4,
            reps=12,
            rest_time=timedelta(seconds=120)
        )
    
    for exercise in shoulder_exercises:
        WorkoutExercise.objects.create(
            workout=workout_c,
            exercise=exercise,
            sets=3,
            reps=15,
            rest_time=timedelta(seconds=60)
        )
    
    # Training for student 2 - Weight Loss Program
    student2 = students[1]
    program4 = programs[3]  # Weight Loss
    
    training2 = Training.objects.create(
        student=student2,
        teacher=teacher1,
        program=program4,
        goal='WL',
        name='Emagrecimento - Full Body',
        description='Treino full body 3x por semana focado em emagrecimento',
        is_active=True
    )
    trainings.append(training2)
    
    # Training for student 3 - Full Body Beginner
    if len(students) > 2:
        student3 = students[2]
        program3 = programs[2]  # Full Body Beginner
        
        training3 = Training.objects.create(
            student=student3,
            teacher=teachers[1],
            program=program3,
            goal='GEN',
            name='Full Body - Iniciante',
            description='Treino de corpo inteiro para iniciantes',
            is_active=True
        )
        trainings.append(training3)
        
        # Create Full Body workouts
        for day_num, day_name in [(1, 'Segunda'), (3, 'Quarta'), (5, 'Sexta')]:
            workout = Workout.objects.create(
                training_plan=training3,
                name=f'Treino Full Body - {day_name}',
                day_of_week=str(day_num)
            )
            
            # Mix of all muscle groups
            selected_exercises = [
                Exercise.objects.filter(muscle_group='Peito').first(),
                Exercise.objects.filter(muscle_group='Costas').first(),
                Exercise.objects.filter(muscle_group='Pernas').first(),
                Exercise.objects.filter(muscle_group='Ombros').first(),
                Exercise.objects.filter(muscle_group='Abdômen').first(),
            ]
            
            for exercise in selected_exercises:
                if exercise:
                    WorkoutExercise.objects.create(
                        workout=workout,
                        exercise=exercise,
                        sets=3,
                        reps=12,
                        rest_time=timedelta(seconds=60)
                    )
    
    # Training for student 4 - Upper Lower Program
    if len(students) > 3:
        student4 = students[3]
        program2 = programs[1]  # Upper Lower
        
        training4 = Training.objects.create(
            student=student4,
            teacher=teacher1,
            program=program2,
            goal='STR',
            name='Upper Lower - Força',
            description='Treino upper/lower focado em força',
            is_active=True
        )
        trainings.append(training4)
        
        # Upper Body Workout 1
        upper1 = Workout.objects.create(
            training_plan=training4,
            name='Treino Upper A',
            day_of_week='1'  # Monday
        )
        
        upper_exercises1 = list(Exercise.objects.filter(muscle_group__in=['Peito', 'Ombros', 'Tríceps'])[:5])
        for exercise in upper_exercises1:
            WorkoutExercise.objects.create(
                workout=upper1,
                exercise=exercise,
                sets=4,
                reps=8,
                rest_time=timedelta(seconds=120)
            )
        
        # Lower Body Workout 1
        lower1 = Workout.objects.create(
            training_plan=training4,
            name='Treino Lower A',
            day_of_week='2'  # Tuesday
        )
        
        lower_exercises = list(Exercise.objects.filter(muscle_group='Pernas')[:5])
        for exercise in lower_exercises:
            WorkoutExercise.objects.create(
                workout=lower1,
                exercise=exercise,
                sets=4,
                reps=10,
                rest_time=timedelta(seconds=120)
            )
        
        # Upper Body Workout 2
        upper2 = Workout.objects.create(
            training_plan=training4,
            name='Treino Upper B',
            day_of_week='4'  # Thursday
        )
        
        upper_exercises2 = list(Exercise.objects.filter(muscle_group__in=['Costas', 'Bíceps'])[:5])
        for exercise in upper_exercises2:
            WorkoutExercise.objects.create(
                workout=upper2,
                exercise=exercise,
                sets=4,
                reps=8,
                rest_time=timedelta(seconds=120)
            )
        
        # Lower Body Workout 2
        lower2 = Workout.objects.create(
            training_plan=training4,
            name='Treino Lower B',
            day_of_week='5'  # Friday
        )
        
        for exercise in lower_exercises[:4]:
            WorkoutExercise.objects.create(
                workout=lower2,
                exercise=exercise,
                sets=3,
                reps=12,
                rest_time=timedelta(seconds=90)
            )
    
    print(f"✅ Created {len(trainings)} training plans with workouts")
    return trainings
    
    # Create 3 full body workouts for weight loss
    for day in [1, 3, 5]:  # Monday, Wednesday, Friday
        workout = Workout.objects.create(
            training_plan=training2,
            name=f'Treino Full Body - Dia {day}',
            day_of_week=str(day)
        )
        
        # Mix of exercises from different muscle groups
        selected_exercises = [
            Exercise.objects.filter(muscle_group='Pernas').first(),
            Exercise.objects.filter(muscle_group='Peito').first(),
            Exercise.objects.filter(muscle_group='Costas').first(),
            Exercise.objects.filter(muscle_group='Ombros').first(),
            Exercise.objects.filter(muscle_group='Abdômen').first(),
        ]
        
        for exercise in selected_exercises:
            if exercise:
                WorkoutExercise.objects.create(
                    workout=workout,
                    exercise=exercise,
                    sets=3,
                    reps=15,
                    rest_time=timedelta(seconds=45)
                )
    
    print(f"✅ Created {len(trainings)} training plans with workouts")
    return trainings

def create_workout_sessions():
    """Create workout session logs"""
    print("📊 Creating workout sessions...")
    
    students = Student.objects.all()
    today = timezone.now().date()
    
    sessions = []
    
    # Create sessions for the last 6 weeks
    for student in students[:2]:  # First 2 students
        training = Training.objects.filter(student=student).first()
        if not training:
            continue
        
        workouts = Workout.objects.filter(training_plan=training)
        
        for week in range(6):
            for workout in workouts:
                date = today - timedelta(weeks=week, days=int(workout.day_of_week))
                
                session = WorkoutSession.objects.create(
                    user=student.user,
                    workout=workout,
                    date=date,
                    status='CMP',
                    started_at=timezone.make_aware(datetime.combine(date, time(7, 0))),
                    ended_at=timezone.make_aware(datetime.combine(date, time(8, 30)))
                )
                sessions.append(session)
                
                # Add exercise logs
                workout_exercises = WorkoutExercise.objects.filter(workout=workout)
                for idx, we in enumerate(workout_exercises):
                    exercise_log = ExerciseLog.objects.create(
                        session=session,
                        exercise=we.exercise,
                        workout_exercise=we,
                        order=idx
                    )
                    
                    # Add set logs
                    for set_num in range(1, we.sets + 1):
                        SetLog.objects.create(
                            exercise_log=exercise_log,
                            set_number=set_num,
                            repetitions=we.reps,
                            weight=50.0 + (week * 2.5),  # Progressive overload
                            rest_time=we.rest_time,
                            set_type='WORK'
                        )
    
    # Create today's session as "Planned"
    for student in students[:2]:
        training = Training.objects.filter(student=student).first()
        if training:
            workout = Workout.objects.filter(training_plan=training).first()
            if workout:
                session = WorkoutSession.objects.create(
                    user=student.user,
                    workout=workout,
                    date=today,
                    status='PLN'
                )
                sessions.append(session)
    
    print(f"✅ Created {len(sessions)} workout sessions")
    return sessions

def create_diet_plans():
    """Create diet plans with meals"""
    print("🍽️ Creating diet plans...")
    
    students = Student.objects.all()
    teachers = Teacher.objects.all()
    foods = list(FoodItem.objects.all())
    
    diet_plans = []
    
    for idx, student in enumerate(students[:2]):  # First 2 students
        teacher = teachers[idx % len(teachers)]
        
        # Create diet plan
        diet_plan = DietPlan.objects.create(
            student=student.user,
            teacher=teacher.user,
            name=f'Dieta {student.user.first_name}',
            goal='CUT' if idx == 0 else 'BUK',
            start_date=timezone.now().date() - timedelta(days=30),
            end_date=timezone.now().date() + timedelta(days=60),
            is_active=True
        )
        diet_plans.append(diet_plan)
        
        # Breakfast
        breakfast = Meal.objects.create(
            diet_plan=diet_plan,
            name='Café da Manhã',
            time=time(7, 0),
            description='Primeira refeição do dia'
        )
        
        # Add food items to breakfast
        oats = FoodItem.objects.filter(name='Aveia').first()
        banana = FoodItem.objects.filter(name='Banana').first()
        eggs = FoodItem.objects.filter(name='Ovo (unidade)').first()
        
        if oats:
            MealFoodItem.objects.create(meal=breakfast, food_item=oats, quantity=50, unit='g')
        if banana:
            MealFoodItem.objects.create(meal=breakfast, food_item=banana, quantity=100, unit='g')
        if eggs:
            MealFoodItem.objects.create(meal=breakfast, food_item=eggs, quantity=100, unit='g')
        
        # Lunch
        lunch = Meal.objects.create(
            diet_plan=diet_plan,
            name='Almoço',
            time=time(12, 0),
            description='Refeição principal'
        )
        
        chicken = FoodItem.objects.filter(name='Peito de Frango').first()
        rice = FoodItem.objects.filter(name='Arroz Branco').first()
        broccoli = FoodItem.objects.filter(name='Brócolis').first()
        
        if chicken:
            MealFoodItem.objects.create(meal=lunch, food_item=chicken, quantity=150, unit='g')
        if rice:
            MealFoodItem.objects.create(meal=lunch, food_item=rice, quantity=100, unit='g')
        if broccoli:
            MealFoodItem.objects.create(meal=lunch, food_item=broccoli, quantity=100, unit='g')
        
        # Snack
        snack = Meal.objects.create(
            diet_plan=diet_plan,
            name='Lanche da Tarde',
            time=time(15, 30),
            description='Lanche intermediário'
        )
        
        whey = FoodItem.objects.filter(name='Whey Protein').first()
        apple = FoodItem.objects.filter(name='Maçã').first()
        
        if whey:
            MealFoodItem.objects.create(meal=snack, food_item=whey, quantity=30, unit='g')
        if apple:
            MealFoodItem.objects.create(meal=snack, food_item=apple, quantity=100, unit='g')
        
        # Dinner
        dinner = Meal.objects.create(
            diet_plan=diet_plan,
            name='Jantar',
            time=time(19, 0),
            description='Última refeição do dia'
        )
        
        fish = FoodItem.objects.filter(name='Tilápia').first()
        sweet_potato = FoodItem.objects.filter(name='Batata Doce').first()
        salad = FoodItem.objects.filter(name='Alface').first()
        
        if fish:
            MealFoodItem.objects.create(meal=dinner, food_item=fish, quantity=150, unit='g')
        if sweet_potato:
            MealFoodItem.objects.create(meal=dinner, food_item=sweet_potato, quantity=150, unit='g')
        if salad:
            MealFoodItem.objects.create(meal=dinner, food_item=salad, quantity=50, unit='g')
    
    print(f"✅ Created {len(diet_plans)} diet plans with meals")
    return diet_plans

def create_progress_logs():
    """Create progress logs for students"""
    print("📈 Creating progress logs...")
    
    students = Student.objects.all()
    today = timezone.now().date()
    
    logs = []
    
    for student in students[:2]:  # First 2 students
        start_weight = 85.0
        goal_weight = 75.0
        
        # Create weekly progress logs for last 6 weeks
        for week in range(6):
            date = today - timedelta(weeks=5-week)
            current_weight = start_weight - (week * 1.5)  # Losing 1.5kg per week
            
            log = ProgressLog.objects.create(
                student=student,
                date=date,
                start_weight=start_weight,
                current_weight=current_weight,
                goal_weight=goal_weight,
                imc=current_weight / (1.75 ** 2),  # Assuming height of 1.75m
                body_fat_percentage=20.0 - (week * 0.5),
                notes=f'Semana {week + 1} - Progresso consistente'
            )
            logs.append(log)
    
    print(f"✅ Created {len(logs)} progress logs")
    return logs

def create_body_measurements():
    """Create body measurement records"""
    print("📏 Creating body measurements...")
    
    students = Student.objects.all()
    today = timezone.now().date()
    
    measurements = []
    
    for student in students[:2]:
        # Create measurements for last 6 weeks
        for week in range(6):
            date = today - timedelta(weeks=5-week)
            
            measurement = BodyMeasurement.objects.create(
                user=student.user,
                date=date,
                weight_kg=85.0 - (week * 1.5),
                body_fat_percent=20.0 - (week * 0.5),
                muscle_mass_kg=65.0 + (week * 0.3),
                chest_cm=100.0 - (week * 0.5),
                waist_cm=85.0 - (week * 1.0),
                bicep_left_cm=35.0 + (week * 0.2),
                bicep_right_cm=35.0 + (week * 0.2),
                thigh_left_cm=55.0 - (week * 0.3),
                thigh_right_cm=55.0 - (week * 0.3),
                notes=f'Medição semana {week + 1}'
            )
            measurements.append(measurement)
    
    print(f"✅ Created {len(measurements)} body measurements")
    return measurements

def create_appointments():
    """Create sample appointments"""
    print("📆 Creating appointments...")
    
    students = Student.objects.all()
    teachers = Teacher.objects.all()
    today = timezone.now().date()
    
    appointments = []
    
    for i in range(5):
        date = today + timedelta(days=i)
        student = students[i % len(students)]
        teacher = teachers[i % len(teachers)]
        
        appointment = Appointment.objects.create(
            teacher=teacher,
            student=student,
            date=date,
            start_time=time(9, 0),
            end_time=time(10, 0),
            status='confirmed' if i < 3 else 'pending',
            notes='Consulta de acompanhamento'
        )
        appointments.append(appointment)
    
    print(f"✅ Created {len(appointments)} appointments")
    return appointments

def main():
    """Main seeding function"""
    print("🌱 Starting database seeding...\n")
    
    # Ask for confirmation before clearing
    response = input("⚠️  This will clear all existing data. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Seeding cancelled")
        return
    
    # Clear existing data
    clear_database()
    print()
    
    # Create data in order
    users = create_users()
    teacher_student_links = create_teacher_students()
    create_teacher_schedules()
    exercises = create_exercises()
    foods = create_food_items()
    programs = create_programs()
    trainings = create_training_plans()
    sessions = create_workout_sessions()
    diet_plans = create_diet_plans()
    progress_logs = create_progress_logs()
    measurements = create_body_measurements()
    appointments = create_appointments()
    
    print("\n" + "="*50)
    print("✨ Database seeding completed successfully!")
    print("="*50)
    print("\n📊 Summary:")
    print(f"   👥 Users: {len(users)}")
    print(f"   🤝 Teacher-Student Links: {len(teacher_student_links)}")
    print(f"   💪 Exercises: {len(exercises)}")
    print(f"   🍎 Food Items: {len(foods)}")
    print(f"   📋 Programs: {len(programs)}")
    print(f"   🏋️ Training Plans: {len(trainings)}")
    print(f"   📊 Workout Sessions: {len(sessions)}")
    print(f"   🍽️ Diet Plans: {len(diet_plans)}")
    print(f"   📈 Progress Logs: {len(progress_logs)}")
    print(f"   📏 Body Measurements: {len(measurements)}")
    print(f"   📆 Appointments: {len(appointments)}")
    print("\n🔑 Test Credentials:")
    print("   Teacher: carlos_trainer / password123")
    print("   Teacher: ana_fitness / password123")
    print("   Student: joao_aluno / password123")
    print("   Student: maria_fitness / password123")
    print("   Student: pedro_gains / password123")
    print()

if __name__ == '__main__':
    main()
