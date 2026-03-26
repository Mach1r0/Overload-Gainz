"""
Django Management Command to import exercises with media from CSV
Usage: python manage.py import_exercises_csv
Options:
  --csv PATH        Path to CSV file (default: exercises_data.csv)
  --skip-media      Skip downloading media files
  --update          Update existing exercises
"""

import csv
import requests
import re
from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.files import File
from django.core.files.temp import NamedTemporaryFile
from exercises.models import Exercise


class Command(BaseCommand):
    help = 'Import exercises with media downloads from exercises_data.csv'
    
    # Configuration
    CSV_FILE = 'exercises_data.csv'
    CHUNK_SIZE = 8192
    TIMEOUT = 30
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--csv',
            type=str,
            default=None,
            help='Path to CSV file (default: exercises_data.csv in project root)',
        )
        parser.add_argument(
            '--skip-media',
            action='store_true',
            help='Skip downloading media files',
        )
        parser.add_argument(
            '--update',
            action='store_true',
            help='Update existing exercises (default: skip)',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🏋️  Starting Exercise Import from CSV...'))
        self.stdout.write('=' * 70)
        
        # Get CSV path
        csv_path = options.get('csv')
        if not csv_path:
            # Try to find in project root (parent of backend)
            csv_path = Path(__file__).parent.parent.parent.parent.parent / self.CSV_FILE
        else:
            csv_path = Path(csv_path)
        
        if not csv_path.exists():
            self.stdout.write(self.style.ERROR(f'❌ CSV file not found: {csv_path}'))
            return
        
        self.stdout.write(f'📖 Reading from: {csv_path}\n')
        
        skip_media = options.get('skip_media', False)
        update_existing = options.get('update', False)
        
        # Statistics
        stats = {
            'total': 0,
            'created': 0,
            'updated': 0,
            'skipped': 0,
            'media_downloaded': 0,
            'media_failed': 0,
        }
        
        # Read and process CSV
        with open(csv_path, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                stats['total'] += 1
                
                name = row['name'].strip()
                equipment = row['equipment']
                primary_muscle = row['primary_muscle']
                secondary_muscle = row['secondary_muscle']
                source_url = row['source']
                source_type = row['sourceType']
                
                self.stdout.write(f'\n{stats["total"]}. {name}')
                
                # Prepare muscle data
                primary_muscles = self.parse_muscles(primary_muscle)
                secondary_muscles = self.parse_muscles(secondary_muscle)
                
                if not primary_muscles:
                    primary_muscles = ['abdominals']
                
                # Prepare exercise data
                exercise_data = {
                    'name': name,
                    'description': f'{name} - {equipment} exercise targeting {primary_muscle}',
                    'equipment': self.normalize_equipment(equipment),
                    'muscle_group': primary_muscles[0],
                    'primary_muscles': ','.join(primary_muscles),
                    'secondary_muscles': ','.join(secondary_muscles) if secondary_muscles else '',
                    'level': 'intermediate',
                    'category': 'strength',
                }
                
                # Check if exists
                try:
                    exercise = Exercise.objects.get(name=name)
                    
                    if update_existing:
                        for key, value in exercise_data.items():
                            setattr(exercise, key, value)
                        stats['updated'] += 1
                        self.stdout.write(self.style.WARNING('   🔄 Updated'))
                    else:
                        stats['skipped'] += 1
                        self.stdout.write(self.style.WARNING('   ⏭️  Already exists (use --update to override)'))
                        continue
                        
                except Exercise.DoesNotExist:
                    exercise = Exercise(**exercise_data)
                    stats['created'] += 1
                    self.stdout.write(self.style.SUCCESS('   ✅ Created'))
                
                # Handle media download
                if not skip_media and source_url and source_url != 'None':
                    success = self.download_and_attach_media(
                        exercise, name, source_url, source_type
                    )
                    if success:
                        stats['media_downloaded'] += 1
                    else:
                        stats['media_failed'] += 1
                
                # Save exercise
                try:
                    exercise.save()
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'   ❌ Error saving: {e}'))
                    stats['skipped'] += 1
        
        # Print statistics
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write(self.style.SUCCESS('📊 Import Complete!'))
        self.stdout.write('=' * 70)
        self.stdout.write(f'Total processed: {stats["total"]}')
        self.stdout.write(self.style.SUCCESS(f'✅ Created: {stats["created"]}'))
        self.stdout.write(self.style.WARNING(f'🔄 Updated: {stats["updated"]}'))
        self.stdout.write(f'⏭️  Skipped: {stats["skipped"]}')
        self.stdout.write(f'📥 Media downloaded: {stats["media_downloaded"]}')
        self.stdout.write(self.style.ERROR(f'❌ Media failed: {stats["media_failed"]}'))
        self.stdout.write('=' * 70)
    
    def download_and_attach_media(self, exercise, name, url, source_type):
        """Download and attach media to exercise"""
        ext = self.get_extension_from_url(url)
        
        if not ext:
            self.stdout.write('   ⚠️  Unknown extension')
            return False
        
        filename = self.clean_filename(name) + ext
        
        try:
            self.stdout.write(f'   📥 Downloading...')
            response = requests.get(url, stream=True, timeout=self.TIMEOUT)
            
            if response.status_code != 200:
                self.stdout.write(self.style.ERROR(f'   ❌ HTTP {response.status_code}'))
                return False
            
            temp_file = NamedTemporaryFile(delete=True)
            
            for chunk in response.iter_content(chunk_size=self.CHUNK_SIZE):
                temp_file.write(chunk)
            
            temp_file.flush()
            
            if source_type == 'video' or ext == '.mp4':
                exercise.video_url = url
                self.stdout.write('   🎥 Video URL saved')
            else:
                exercise.image.save(filename, File(temp_file), save=False)
                self.stdout.write(f'   🖼️  Image: {filename}')
            
            temp_file.close()
            return True
            
        except requests.exceptions.Timeout:
            self.stdout.write(self.style.ERROR('   ❌ Timeout'))
            return False
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   ❌ Error: {e}'))
            return False
    
    @staticmethod
    def clean_filename(name):
        """Clean name for filename"""
        clean = re.sub(r'[\\/*?:"<>|]', "", name)
        clean = clean.strip().replace(" ", "_").replace("(", "").replace(")", "").lower()
        return clean
    
    @staticmethod
    def get_extension_from_url(url):
        """Get file extension from URL"""
        if not url or url == 'None':
            return None
        
        extensions = {'.mp4': '.mp4', '.jpg': '.jpg', '.jpeg': '.jpg', 
                     '.png': '.png', '.gif': '.gif', '.webm': '.webm'}
        
        for ext_check, ext_return in extensions.items():
            if ext_check in url:
                return ext_return
        return None
    
    @staticmethod
    def normalize_equipment(equipment):
        """Normalize equipment to model choices"""
        if not equipment or equipment == 'None':
            return 'body only'
        
        equipment = equipment.lower().strip()
        
        equipment_map = {
            'barbell': 'barbell',
            'dumbbell': 'dumbbell',
            'machine': 'machine',
            'resistance band': 'bands',
            'band': 'bands',
            'kettlebell': 'kettlebells',
            'suspension': 'cable',
            'cable': 'cable',
            'other': 'other',
            'plate': 'other',
            'none': 'body only',
        }
        
        return equipment_map.get(equipment, 'other')
    
    @staticmethod
    def normalize_muscle(muscle):
        """Normalize muscle to model choices"""
        if not muscle or muscle == 'None':
            return None
        
        muscle = muscle.lower().strip()
        
        muscle_map = {
            'biceps': 'biceps',
            'triceps': 'triceps',
            'chest': 'chest',
            'back': 'middle back',
            'upper back': 'middle back',
            'lats': 'lats',
            'shoulders': 'shoulders',
            'quadriceps': 'quadriceps',
            'quads': 'quadriceps',
            'hamstrings': 'hamstrings',
            'glutes': 'glutes',
            'calves': 'calves',
            'abdominals': 'abdominals',
            'abs': 'abdominals',
            'core': 'abdominals',
            'forearms': 'forearms',
            'lower back': 'lower back',
            'traps': 'traps',
            'neck': 'neck',
            'cardio': 'abdominals',
            'full body': 'abdominals',
            'abductors': 'abductors',
            'adductors': 'adductors',
        }
        
        return muscle_map.get(muscle, 'abdominals')
    
    @staticmethod
    def parse_muscles(muscle_str):
        """Parse comma-separated muscles"""
        if not muscle_str or muscle_str == 'None':
            return []
        
        muscles = [m.strip() for m in muscle_str.split(',')]
        normalized = [Command.normalize_muscle(m) for m in muscles]
        return [m for m in normalized if m]
