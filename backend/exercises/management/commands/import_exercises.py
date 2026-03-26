import json
import os
from django.core.management.base import BaseCommand
from exercises.models import Exercise, ExerciseImage


class Command(BaseCommand):
    help = 'Import exercises from the free-exercise-db JSON file'

    def handle(self, *args, **options):
        # Path to the JSON file
        json_path = os.path.join(os.path.dirname(__file__), '../../../exercises.json')
        
        self.stdout.write('Loading exercises from JSON...')
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                exercises_data = json.load(f)
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File not found: {json_path}'))
            return
        
        self.stdout.write(f'Found {len(exercises_data)} exercises to import')
        
        created_count = 0
        updated_count = 0
        
        for exercise_data in exercises_data:
            # Extract data from JSON
            name = exercise_data.get('name', '')
            
            # Build description from instructions
            instructions = exercise_data.get('instructions', [])
            description = '\n'.join(instructions) if instructions else 'No description available'
            
            # Get primary and secondary muscles
            primary_muscles = exercise_data.get('primaryMuscles', [])
            secondary_muscles = exercise_data.get('secondaryMuscles', [])
            primary_muscles_str = ', '.join(primary_muscles) if primary_muscles else 'general'
            secondary_muscles_str = ', '.join(secondary_muscles) if secondary_muscles else ''
            muscle_group = primary_muscles[0] if primary_muscles else 'general'
            
            # Get other schema fields
            force = exercise_data.get('force')
            level = exercise_data.get('level', 'beginner')
            mechanic = exercise_data.get('mechanic')
            equipment = exercise_data.get('equipment')
            category = exercise_data.get('category', 'strength')
            
            # Check if exercise already exists
            existing_exercises = Exercise.objects.filter(name=name)
            
            if existing_exercises.count() > 1:
                # If there are duplicates, delete all but the first one
                self.stdout.write(self.style.WARNING(f'Found {existing_exercises.count()} duplicates for "{name}", cleaning up...'))
                for duplicate in existing_exercises[1:]:
                    duplicate.delete()
            
            exercise, created = Exercise.objects.update_or_create(
                name=name,
                defaults={
                    'description': description,
                    'muscle_group': muscle_group,
                    'primary_muscles': primary_muscles_str,
                    'secondary_muscles': secondary_muscles_str,
                    'force': force,
                    'level': level,
                    'mechanic': mechanic,
                    'equipment': equipment,
                    'category': category,
                }
            )
            
            images = exercise_data.get('images', [])
            if images:
                ExerciseImage.objects.filter(exercise=exercise).delete()
                
                for idx, image_path in enumerate(images):
                    ExerciseImage.objects.create(
                        exercise=exercise,
                        image_path=f'exercises/{image_path}',
                        order=idx
                    )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
            
            if (created_count + updated_count) % 100 == 0:
                self.stdout.write(f'Processed {created_count + updated_count} exercises...')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully imported exercises!\n'
                f'Created: {created_count}\n'
                f'Updated: {updated_count}\n'
                f'Total: {created_count + updated_count}'
            )
        )
