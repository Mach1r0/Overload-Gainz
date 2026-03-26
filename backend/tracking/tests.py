"""
Fase 1 — RED: segurança do tracking + exercise_pr como action válida.
"""
import pytest
from tracking.models import WorkoutSession, ExerciseLog, SetLog

SESSION_URL = '/api/tracking/workout-sessions/'
PR_URL = '/api/tracking/exercise-logs/exercise-pr/'


def _make_training_with_workout(student_profile, teacher_profile):
    from training.models import Training, Workout
    training = Training.objects.create(
        student=student_profile,
        teacher=teacher_profile,
        name='T',
        goal='HYP',
        start_date='2024-01-01',
    )
    workout = Workout.objects.create(training_plan=training, name='Day 1', day_of_week=0)
    return training, workout


@pytest.mark.django_db
class TestWorkoutSessionSecurity:

    def test_unauthenticated_rejected(self, api_client):
        assert api_client.get(SESSION_URL).status_code == 401

    def test_user_sees_only_own_sessions(
        self, auth_client_student, student_user, student_profile,
        student_profile_b, teacher_profile
    ):
        _, workout_a = _make_training_with_workout(student_profile, teacher_profile)
        _, workout_b = _make_training_with_workout(student_profile_b, teacher_profile)
        WorkoutSession.objects.create(user=student_user, workout=workout_a, date='2024-01-10', status='CMP')
        WorkoutSession.objects.create(user=student_profile_b.user, workout=workout_b, date='2024-01-10', status='CMP')

        response = auth_client_student.get(SESSION_URL)
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_cannot_read_other_user_session_detail(
        self, auth_client_student, student_profile_b, teacher_profile
    ):
        _, workout_b = _make_training_with_workout(student_profile_b, teacher_profile)
        session = WorkoutSession.objects.create(
            user=student_profile_b.user, workout=workout_b, date='2024-01-10', status='CMP'
        )
        assert auth_client_student.get(f'{SESSION_URL}{session.id}/').status_code == 404


@pytest.mark.django_db
class TestExercisePRAction:
    """exercise_pr deve ser uma action HTTP válida, não um método inacessível."""

    def test_unauthenticated_rejected(self, api_client):
        assert api_client.get(PR_URL).status_code == 401

    def test_returns_none_pr_for_unknown_exercise(self, auth_client_student):
        response = auth_client_student.get(f'{PR_URL}?exercise_id=99999')
        assert response.status_code == 200
        assert response.data['pr'] is None

    def test_requires_exercise_id_param(self, auth_client_student):
        assert auth_client_student.get(PR_URL).status_code == 400

    def test_returns_pr_for_own_exercise(
        self, auth_client_student, student_user, student_profile, teacher_profile
    ):
        from datetime import timedelta
        from exercises.models import Exercise
        from training.models import WorkoutExercise
        ex = Exercise.objects.create(name='Deadlift', level='intermediate', category='strength')
        _, workout = _make_training_with_workout(student_profile, teacher_profile)
        we = WorkoutExercise.objects.create(workout=workout, exercise=ex, sets=3, reps=5, rest_time=timedelta(minutes=1))
        session = WorkoutSession.objects.create(user=student_user, workout=workout, date='2024-01-15', status='CMP')
        elog = ExerciseLog.objects.create(session=session, exercise=ex, workout_exercise=we, order=1)
        SetLog.objects.create(exercise_log=elog, set_number=1, repetitions=5, weight=150.0, set_type='WORK')

        response = auth_client_student.get(f'{PR_URL}?exercise_id={ex.id}')
        assert response.status_code == 200
        assert response.data['pr'] is not None
        assert float(response.data['pr']['weight']) == 150.0

    def test_does_not_return_other_users_pr(
        self, auth_client_student, student_profile_b, teacher_profile
    ):
        from datetime import timedelta
        from exercises.models import Exercise
        from training.models import WorkoutExercise
        ex = Exercise.objects.create(name='Press', level='beginner', category='strength')
        _, workout_b = _make_training_with_workout(student_profile_b, teacher_profile)
        we = WorkoutExercise.objects.create(workout=workout_b, exercise=ex, sets=3, reps=10, rest_time=timedelta(minutes=1))
        session = WorkoutSession.objects.create(
            user=student_profile_b.user, workout=workout_b, date='2024-01-15', status='CMP'
        )
        elog = ExerciseLog.objects.create(session=session, exercise=ex, workout_exercise=we, order=1)
        SetLog.objects.create(exercise_log=elog, set_number=1, repetitions=10, weight=80.0, set_type='WORK')

        response = auth_client_student.get(f'{PR_URL}?exercise_id={ex.id}')
        assert response.status_code == 200
        assert response.data['pr'] is None
