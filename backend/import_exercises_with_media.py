import os
import sys
import csv
import requests
import re
from pathlib import Path
from urllib.parse import urlparse

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.core.files import File
from django.core.files.temp import NamedTemporaryFile
from exercises.models import Exercise

CSV_FILE = '../exercises_data.csv'  
MEDIA_DIR = 'media/exercises/'  
CHUNK_SIZE = 8192  
TIMEOUT = 30  

def clean_filename(name):
    clean = re.sub(r'[\\/*?:"<>|]', "", name)
    clean = clean.strip().replace(" ", "_").replace("(", "").replace(")", "").lower()
    return clean

def get_extension_from_url(url):
    if not url or url == 'None':
        return None
    
    if '.mp4' in url:
        return '.mp4'
    elif '.jpg' in url or '.jpeg' in url:
        return '.jpg'
    elif '.png' in url:
        return '.png'
    elif '.gif' in url:
        return '.gif'
    elif '.webm' in url:
        return '.webm'
    return None

def download_media(url):
    """Download media file from URL and return temporary file"""
    try:
        print(f"   📥 Downloading from: {url}")
        response = requests.get(url, stream=True, timeout=TIMEOUT)
        
        if response.status_code == 200:
            # Create temporary file
            img_temp = NamedTemporaryFile(delete=True)
            
            # Download in chunks to avoid memory issues with large videos
            for chunk in response.iter_content(chunk_size=CHUNK_SIZE):
                img_temp.write(chunk)
            
            img_temp.flush()
            return img_temp
        else:
            print(f"   ❌ HTTP Error {response.status_code}")
            return None
            
    except requests.exceptions.Timeout:
        print(f"   ❌ Timeout error")
        return None
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Connection error: {e}")
        return None
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
        return None

def normalize_equipment(equipment):
    """Normalize equipment names to match model choices"""
    if not equipment or equipment == 'None':
        return 'body only'
    
    equipment = equipment.lower().strip()
    
    # Mapping from CSV values to model choices
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

def normalize_muscle(muscle):
    """Normalize muscle names to match model choices"""
    if not muscle or muscle == 'None':
        return None
    
    muscle = muscle.lower().strip()
    
    # Mapping from CSV values to model choices
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
        'cardio': 'abdominals',  # Default for cardio
        'full body': 'abdominals',  # Default for full body
        'abductors': 'abductors',
        'adductors': 'adductors',
    }
    
    return muscle_map.get(muscle, 'abdominals')

def parse_muscles(muscle_str):
    """Parse comma-separated muscle string"""
    if not muscle_str or muscle_str == 'None':
        return []
    
    muscles = [m.strip() for m in muscle_str.split(',')]
    return [normalize_muscle(m) for m in muscles if normalize_muscle(m)]

def import_exercises_from_csv():
    """Main function to import exercises with media from CSV"""
    
    csv_path = Path(__file__).parent / CSV_FILE
    
    if not csv_path.exists():
        print(f"❌ CSV file not found: {csv_path}")
        return
    
    print(f"📖 Reading exercises from: {csv_path}")
    print(f"{'='*70}")
    
    # Statistics
    stats = {
        'total': 0,
        'created': 0,
        'updated': 0,
        'skipped': 0,
        'media_downloaded': 0,
        'media_failed': 0,
    }
    
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
            
            print(f"\n{stats['total']}. Processing: {name}")
            
            # Skip if no valid source URL
            if not source_url or source_url == 'None':
                print(f"   ⏭️  No media URL - creating text-only entry")
            
            # Prepare muscle data
            primary_muscles = parse_muscles(primary_muscle)
            secondary_muscles = parse_muscles(secondary_muscle)
            
            if not primary_muscles:
                primary_muscles = ['abdominals']  # Default
            
            # Prepare exercise data
            exercise_data = {
                'name': name,
                'description': f'{name} - {equipment} exercise targeting {primary_muscle}',
                'equipment': normalize_equipment(equipment),
                'muscle_group': primary_muscles[0] if primary_muscles else 'abdominals',
                'primary_muscles': ','.join(primary_muscles),
                'secondary_muscles': ','.join(secondary_muscles) if secondary_muscles else '',
                'level': 'intermediate',  # Default level
                'category': 'strength',  # Default category
            }
            
            # Check if exercise already exists
            exercise, created = Exercise.objects.get_or_create(
                name=name,
                defaults=exercise_data
            )
            
            if created:
                stats['created'] += 1
                print(f"   ✅ Created new exercise")
            else:
                # Update existing exercise
                for key, value in exercise_data.items():
                    setattr(exercise, key, value)
                stats['updated'] += 1
                print(f"   🔄 Updated existing exercise")
            
            # Download and attach media if available
            if source_url and source_url != 'None':
                ext = get_extension_from_url(source_url)
                
                if ext:
                    filename = clean_filename(name) + ext
                    
                    # Download media
                    temp_file = download_media(source_url)
                    
                    if temp_file:
                        try:
                            if source_type == 'video' or ext == '.mp4':
                                exercise.video_url = source_url
                                print(f"   🎥 Video URL saved")
                            else:
                                # Save image to ImageField
                                exercise.image.save(filename, File(temp_file), save=False)
                                print(f"   🖼️  Image saved: {filename}")
                            
                            stats['media_downloaded'] += 1
                        except Exception as e:
                            print(f"   ❌ Error saving media: {e}")
                            stats['media_failed'] += 1
                        finally:
                            temp_file.close()
                    else:
                        stats['media_failed'] += 1
                else:
                    print(f"   ⚠️  Unknown file extension from URL")
                    stats['media_failed'] += 1
            
            # Save the exercise
            try:
                exercise.save()
            except Exception as e:
                print(f"   ❌ Error saving exercise: {e}")
                stats['skipped'] += 1
                continue
    
    # Print final statistics
    print(f"\n{'='*70}")
    print(f"📊 Import Complete!")
    print(f"{'='*70}")
    print(f"Total exercises processed: {stats['total']}")
    print(f"✅ Created: {stats['created']}")
    print(f"🔄 Updated: {stats['updated']}")
    print(f"⏭️  Skipped: {stats['skipped']}")
    print(f"📥 Media downloaded: {stats['media_downloaded']}")
    print(f"❌ Media failed: {stats['media_failed']}")
    print(f"{'='*70}")

if __name__ == '__main__':
    print("🏋️  Starting Exercise Import with Media Download...")
    print(f"{'='*70}\n")
    import_exercises_from_csv()
    print("\n✨ Done!")
