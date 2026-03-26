"""
Ferramentas CrewAI que consultam os models Django para fornecer contexto aos agentes.
"""
import json
from typing import Type
from pydantic import BaseModel, Field
from crewai.tools import BaseTool


# ─── Schemas de input ────────────────────────────────────────────────────────

class StudentIdInput(BaseModel):
    student_id: int = Field(description='ID do aluno no banco de dados')


class ExerciseFilterInput(BaseModel):
    level: str = Field(default='', description='beginner | intermediate | expert')
    category: str = Field(default='', description='strength | cardio | stretching etc.')
    equipment: str = Field(default='', description='barbell | dumbbell | machine etc.')
    limit: int = Field(default=20, description='Máximo de exercícios a retornar')


class FoodFilterInput(BaseModel):
    category: str = Field(default='', description='PRN | VEG | FRT | GRN | DRY | FAT | OTH')
    min_protein: float = Field(default=0, description='Proteína mínima por 100g')
    limit: int = Field(default=30, description='Máximo de alimentos a retornar')


# ─── Ferramentas ─────────────────────────────────────────────────────────────

class GetStudentProfileTool(BaseTool):
    name: str = 'get_student_profile'
    description: str = (
        'Obtém o perfil completo de um aluno: dados pessoais, medidas corporais '
        'e último registro de progresso.'
    )
    args_schema: Type[BaseModel] = StudentIdInput

    def _run(self, student_id: int) -> str:
        from student.models import Student, ProgressLog
        try:
            student = Student.objects.select_related('user').get(id=student_id)
            progress = ProgressLog.objects.filter(student=student).order_by('-date').first()
            data = {
                'id': student.id,
                'name': student.user.get_full_name() or student.user.username,
                'email': student.user.email,
                'age': student.age,
                'latest_progress': None,
            }
            if progress:
                data['latest_progress'] = {
                    'current_weight': str(progress.current_weight) if progress.current_weight else None,
                    'goal_weight': str(progress.goal_weight) if progress.goal_weight else None,
                    'height': str(progress.height) if progress.height else None,
                    'imc': str(progress.imc) if progress.imc else None,
                    'body_fat': str(progress.body_fat_percentage) if progress.body_fat_percentage else None,
                    'date': str(progress.date),
                    'notes': progress.notes,
                }
            return json.dumps(data, ensure_ascii=False)
        except Student.DoesNotExist:
            return json.dumps({'error': f'Aluno {student_id} não encontrado.'})


class GetStudentProgressTool(BaseTool):
    name: str = 'get_student_progress'
    description: str = (
        'Obtém os últimos 10 registros de progresso de um aluno '
        '(peso, IMC, % de gordura) para análise de evolução.'
    )
    args_schema: Type[BaseModel] = StudentIdInput

    def _run(self, student_id: int) -> str:
        from student.models import Student, ProgressLog
        try:
            student = Student.objects.get(id=student_id)
            logs = list(
                ProgressLog.objects.filter(student=student)
                .order_by('-date')
                .values('date', 'current_weight', 'goal_weight', 'height', 'imc', 'body_fat_percentage', 'notes')[:10]
            )
            return json.dumps(
                [{k: str(v) if v is not None else None for k, v in log.items()} for log in logs],
                ensure_ascii=False,
            )
        except Student.DoesNotExist:
            return json.dumps({'error': f'Aluno {student_id} não encontrado.'})


class GetStudentWorkoutTool(BaseTool):
    name: str = 'get_student_workout'
    description: str = (
        'Obtém o plano de treino ativo de um aluno com todos os exercícios, '
        'séries, repetições e tempos de descanso.'
    )
    args_schema: Type[BaseModel] = StudentIdInput

    def _run(self, student_id: int) -> str:
        from training.models import Training
        from student.models import Student
        try:
            student = Student.objects.get(id=student_id)
            training = (
                Training.objects.filter(student=student.user, is_active=True)
                .prefetch_related('workouts__exercises__exercise')
                .first()
            )
            if not training:
                return json.dumps({'message': 'Nenhum treino ativo encontrado.'})

            workouts = []
            for workout in training.workouts.all():
                exercises = [
                    {
                        'exercise': we.exercise.name,
                        'sets': we.sets,
                        'reps': we.reps,
                        'min_reps': we.min_reps,
                        'max_reps': we.max_reps,
                        'rest_time': str(we.rest_time) if we.rest_time else None,
                        'notes': we.notes,
                    }
                    for we in workout.exercises.select_related('exercise').all()
                ]
                workouts.append({'name': workout.name, 'day_of_week': workout.day_of_week, 'exercises': exercises})

            return json.dumps({
                'training_name': training.name,
                'goal': training.goal,
                'start_date': str(training.start_date),
                'workouts': workouts,
            }, ensure_ascii=False)
        except Student.DoesNotExist:
            return json.dumps({'error': f'Aluno {student_id} não encontrado.'})


class GetStudentDietTool(BaseTool):
    name: str = 'get_student_diet'
    description: str = (
        'Obtém o plano alimentar ativo de um aluno com refeições, '
        'alimentos e valores nutricionais estimados.'
    )
    args_schema: Type[BaseModel] = StudentIdInput

    def _run(self, student_id: int) -> str:
        from diet.models import DietPlan
        from student.models import Student
        try:
            student = Student.objects.get(id=student_id)
            diet = (
                DietPlan.objects.filter(student=student.user, is_active=True)
                .prefetch_related('meals__mealfooditem_set__food_item')
                .first()
            )
            if not diet:
                return json.dumps({'message': 'Nenhuma dieta ativa encontrada.'})

            meals = []
            for meal in diet.meals.all():
                foods = [
                    {
                        'food': mfi.food_item.name,
                        'quantity': str(mfi.quantity),
                        'unit': mfi.unit,
                        'calories': round(float(mfi.food_item.calories) * float(mfi.quantity) / 100, 1)
                        if mfi.food_item.calories else None,
                        'protein_g': round(float(mfi.food_item.protein) * float(mfi.quantity) / 100, 1)
                        if mfi.food_item.protein else None,
                    }
                    for mfi in meal.mealfooditem_set.select_related('food_item').all()
                ]
                meals.append({
                    'name': meal.name,
                    'time': str(meal.time) if meal.time else None,
                    'type': meal.options_type,
                    'total_calories': meal.total_calories,
                    'foods': foods,
                })

            return json.dumps({
                'diet_name': diet.name,
                'goal': diet.goal,
                'target_calories': diet.target_calories,
                'meals': meals,
            }, ensure_ascii=False)
        except Student.DoesNotExist:
            return json.dumps({'error': f'Aluno {student_id} não encontrado.'})


class GetExercisesTool(BaseTool):
    name: str = 'get_exercises'
    description: str = 'Obtém exercícios do catálogo filtrável por nível, categoria e equipamento.'
    args_schema: Type[BaseModel] = ExerciseFilterInput

    def _run(self, level: str = '', category: str = '', equipment: str = '', limit: int = 20) -> str:
        from exercises.models import Exercise
        qs = Exercise.objects.all()
        if level:
            qs = qs.filter(level=level)
        if category:
            qs = qs.filter(category__icontains=category)
        if equipment:
            qs = qs.filter(equipment__icontains=equipment)
        return json.dumps(
            list(qs.values('id', 'name', 'force', 'level', 'mechanic', 'equipment', 'category',
                           'primary_muscles', 'secondary_muscles')[:limit]),
            ensure_ascii=False,
        )


class GetFoodItemsTool(BaseTool):
    name: str = 'get_food_items'
    description: str = 'Obtém alimentos do banco nutricional filtrável por categoria e proteína mínima.'
    args_schema: Type[BaseModel] = FoodFilterInput

    def _run(self, category: str = '', min_protein: float = 0, limit: int = 30) -> str:
        from diet.models import FoodItem
        qs = FoodItem.objects.all()
        if category:
            qs = qs.filter(category=category)
        if min_protein:
            qs = qs.filter(protein__gte=min_protein)
        return json.dumps(
            list(qs.values('id', 'name', 'calories', 'protein', 'carbs', 'fats', 'category')[:limit]),
            ensure_ascii=False,
        )
