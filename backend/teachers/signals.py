from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from teachers.models import TeacherStudents, StudentEvaluation


@receiver(post_save, sender=TeacherStudents)
def create_student_evaluation(sender, instance, created, **kwargs):
    if created:
        StudentEvaluation.objects.create(teacher_student=instance)


@receiver(post_save, sender='diet.DietPlan')
def update_evaluation_on_diet_created(sender, instance, created, **kwargs):
    if created:
        try:
            from student.models import Student
            student = Student.objects.filter(user=instance.student).first()
            
            if student:
                teacher_student = TeacherStudents.objects.filter(
                    student=student,
                    is_active=True
                ).first()
                
                if teacher_student:
                    evaluation, _ = StudentEvaluation.objects.get_or_create(
                        teacher_student=teacher_student
                    )
                    evaluation.has_diet_plan = True
                    evaluation.diet_plan_date = timezone.now()
                    evaluation.save()
        except Exception as e:
            print(f"Error updating diet evaluation: {e}")


@receiver(post_save, sender='training.Training')
def update_evaluation_on_training_created(sender, instance, created, **kwargs):
    if created:
        try:
            teacher_student = TeacherStudents.objects.filter(
                student=instance.student,
                is_active=True
            ).first()
            
            if teacher_student:
                evaluation, _ = StudentEvaluation.objects.get_or_create(
                    teacher_student=teacher_student
                )
                evaluation.has_training_plan = True
                evaluation.training_plan_date = timezone.now()
                evaluation.save()
        except Exception as e:
            print(f"Error updating training evaluation: {e}")


@receiver(post_save, sender='feedback.Feedback')
def update_evaluation_on_feedback_created(sender, instance, created, **kwargs):
    if created:
        try:
            teacher_student = TeacherStudents.objects.filter(
                student=instance.student,
                is_active=True
            ).first()
            
            if teacher_student:
                evaluation, _ = StudentEvaluation.objects.get_or_create(
                    teacher_student=teacher_student
                )
                evaluation.has_progress_log = True
                evaluation.progress_log_date = timezone.now()
                evaluation.save()
        except Exception as e:
            print(f"Error updating feedback evaluation: {e}")


@receiver(post_save, sender='analytics.ProgressPhoto')
def update_evaluation_on_photo_uploaded(sender, instance, created, **kwargs):
    if created:
        try:
            from student.models import Student
            student = Student.objects.filter(user=instance.user).first()
            
            if student:
                teacher_student = TeacherStudents.objects.filter(
                    student=student,
                    is_active=True
                ).first()
                
                if teacher_student:
                    evaluation, _ = StudentEvaluation.objects.get_or_create(
                        teacher_student=teacher_student
                    )
                    evaluation.has_initial_photos = True
                    evaluation.initial_photos_date = timezone.now()
                    evaluation.save()
        except Exception as e:
            print(f"Error updating photo evaluation: {e}")


@receiver(post_save, sender='analytics.BodyMeasurement')
def update_evaluation_on_measurement_created(sender, instance, created, **kwargs):
    if created:
        try:
            from student.models import Student
            student = Student.objects.filter(user=instance.user).first()
            
            if student:
                teacher_student = TeacherStudents.objects.filter(
                    student=student,
                    is_active=True
                ).first()
                
                if teacher_student:
                    evaluation, _ = StudentEvaluation.objects.get_or_create(
                        teacher_student=teacher_student
                    )
                    evaluation.has_body_measurements = True
                    evaluation.body_measurements_date = timezone.now()
                    evaluation.save()
        except Exception as e:
            print(f"Error updating measurement evaluation: {e}")
