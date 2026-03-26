#!/usr/bin/env python
"""
Script para atualizar os músculos dos exercícios baseado no CSV exercises_data.csv
"""
import os
import sys
import django
import csv

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from exercises.models import Exercise

# Mapeamento de nomes de exercícios (PT -> EN ou similar)
# Alguns exercícios em português podem ter nomes diferentes no CSV
EXERCISE_NAME_MAPPING = {
    'Supino Reto': 'Bench Press (Barbell)',
    'Supino Inclinado': 'Incline Bench Press (Barbell)',
    'Crucifixo': 'Chest Fly (Dumbbell)',
    'Flexão': 'Push Up',
    'Barra Fixa': 'Pull Up',
    'Remada Curvada': 'Bent Over Row (Barbell)',
    'Remada Cavalinho': 'Bent Over Row (Dumbbell)',
    'Pulldown': 'Lat Pulldown (Cable)',
    'Agachamento Livre': 'Full Squat',
    'Leg Press': 'Leg Press (Machine)',
    'Rosca Direta': 'Bicep Curl (Barbell)',
    'Rosca Alternada': 'Bicep Curl (Dumbbell)',
    'Tríceps Corda': 'Triceps Pushdown (Cable)',
    'Tríceps Testa': 'Skull Crusher',
    'Desenvolvimento': 'Shoulder Press (Dumbbell)',
    'Elevação Lateral': 'Lateral Raise (Dumbbell)',
    'Elevação Frontal': 'Front Raise (Dumbbell)',
    'Stiff': 'Deadlift (Barbell)',
    'Levantamento Terra': 'Deadlift (Barbell)',
    'Cadeira Extensora': 'Leg Extension (Machine)',
    'Mesa Flexora': 'Leg Curl (Machine)',
    'Panturrilha': 'Calf Raise (Machine)',
    'Abdominal': 'Crunch',
    'Prancha': 'Plank',
}

def load_csv_data(csv_path):
    """Carrega dados do CSV"""
    exercises_data = {}
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row['name'].strip()
            exercises_data[name.lower()] = {
                'primary_muscle': row['primary_muscle'].strip() if row['primary_muscle'] != 'None' else '',
                'secondary_muscle': row['secondary_muscle'].strip() if row['secondary_muscle'] != 'None' else '',
                'equipment': row['equipment'].strip() if row['equipment'] != 'None' else '',
            }
    return exercises_data

def find_muscle_data(exercise_name, csv_data):
    """Encontra dados de músculo para um exercício"""
    # Primeiro tenta o nome original
    name_lower = exercise_name.lower()
    if name_lower in csv_data:
        return csv_data[name_lower]
    
    # Tenta o mapeamento PT -> EN
    if exercise_name in EXERCISE_NAME_MAPPING:
        mapped_name = EXERCISE_NAME_MAPPING[exercise_name].lower()
        if mapped_name in csv_data:
            return csv_data[mapped_name]
    
    # Tenta busca parcial
    for csv_name, data in csv_data.items():
        # Se o nome do banco contém parte do nome do CSV ou vice-versa
        if name_lower in csv_name or csv_name in name_lower:
            return data
        # Tenta só a primeira palavra
        first_word = name_lower.split()[0] if name_lower.split() else ''
        if first_word and first_word in csv_name:
            return data
    
    return None

def update_exercises():
    """Atualiza os músculos de todos os exercícios"""
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'exercises_data.csv')
    
    if not os.path.exists(csv_path):
        print(f"CSV não encontrado: {csv_path}")
        return
    
    csv_data = load_csv_data(csv_path)
    print(f"Carregados {len(csv_data)} exercícios do CSV")
    
    exercises = Exercise.objects.all()
    updated = 0
    not_found = []
    
    for exercise in exercises:
        muscle_data = find_muscle_data(exercise.name, csv_data)
        
        if muscle_data:
            old_primary = exercise.primary_muscles
            old_secondary = exercise.secondary_muscles
            
            exercise.primary_muscles = muscle_data['primary_muscle'] or 'general'
            exercise.secondary_muscles = muscle_data['secondary_muscle'] or ''
            exercise.save()
            
            if old_primary != exercise.primary_muscles or old_secondary != exercise.secondary_muscles:
                print(f"✅ {exercise.name}: {old_primary} -> {exercise.primary_muscles}")
                updated += 1
        else:
            not_found.append(exercise.name)
    
    print(f"\n{'='*50}")
    print(f"Atualizados: {updated} exercícios")
    print(f"Não encontrados: {len(not_found)} exercícios")
    
    if not_found:
        print("\nExercícios não encontrados no CSV:")
        for name in not_found[:20]:  # Mostra apenas os primeiros 20
            print(f"  - {name}")
        if len(not_found) > 20:
            print(f"  ... e mais {len(not_found) - 20}")

if __name__ == '__main__':
    update_exercises()
