import { useState, useEffect, useRef } from "react"
import { routinesApi } from "@/lib/api/routines"
import { getWorkoutById, getWorkoutExercises } from "@/lib/api/training"

export interface ExerciseSeries {
  id: string
  reps: string
  repsMin?: string
  repsMax?: string
  rest?: string
  useRepsRange?: boolean
  notes?: string
}

export interface Exercise {
  id: string
  name: string
  notes?: string
  series: ExerciseSeries[]
  exerciseId?: number
  equipment?: string
  primaryMuscles?: string[]
  image?: string | null
  video_url?: string | null
}

export function useRoutineEditor(routineId: string, programId?: string) {
  const [routineTitle, setRoutineTitle] = useState("")
  const [routineNote, setRoutineNote] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exerciseLibrary, setExerciseLibrary] = useState<any[]>([])
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState("")
  const [filterEquipment, setFilterEquipment] = useState("all")
  const [filterMuscle, setFilterMuscle] = useState("all")
  const [selectedExerciseSlotId, setSelectedExerciseSlotId] = useState<string | null>(null)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [workoutId, setWorkoutId] = useState<number | null>(null)
  const [dayOfWeek, setDayOfWeek] = useState<number>(1)
  const [trainingPlanId, setTrainingPlanId] = useState<number | null>(null)

  const exerciseRefs = useRef<Record<string, HTMLElement>>({})

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const library = await routinesApi.fetchExerciseLibrary()
        setExerciseLibrary(library)
      } catch (error) {
        console.error("Error loading exercise library:", error)
      }
    }
    loadLibrary()
  }, [])

  useEffect(() => {
    const loadRoutine = async () => {
      if (routineId === "new") {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        let workoutIdToLoad: number | null = Number(routineId)
        if (!Number.isFinite(workoutIdToLoad) || Number.isNaN(workoutIdToLoad)) {
          const found = await routinesApi.findWorkoutByName(routineId)
          workoutIdToLoad = found?.id ?? null
        }

        if (!workoutIdToLoad) {
          throw new Error("Rotina não encontrada")
        }

        const workout = await getWorkoutById(workoutIdToLoad)

        setRoutineTitle(workout.name || "")
        setRoutineNote(workout.description || "")
        setWorkoutId(workout.id)
        setDayOfWeek(workout.day_of_week || 1)
        setTrainingPlanId(workout.training_plan)

        // Load workout exercises
        const workoutExercises = await getWorkoutExercises(workoutIdToLoad)

        // Transform exercises to editor format
        const transformedExercises: Exercise[] = workoutExercises.map((ex: any, idx: number) => {
          const numSets = parseInt(ex.sets) || 1
          const restSeconds = ex.rest_time
            ? typeof ex.rest_time === "string"
              ? parseInt(ex.rest_time.split(":").pop() || "60", 10)
              : ex.rest_time
            : 60

          const series: ExerciseSeries[] = Array.from({ length: numSets }, (_, i) => ({
            id: `${ex.id}-${i + 1}`,
            reps: ex.reps?.toString() || "12",
            rest: restSeconds.toString(),
            notes: ex.notes || undefined,
            useRepsRange: false,
          }))

          return {
            id: `exercise-${ex.id}-${idx}`,
            name: ex.exercise?.name || ex.name || "",
            notes: ex.notes || "",
            series,
            exerciseId: ex.exercise?.id,
            equipment: ex.exercise?.equipment,
            primaryMuscles: ex.exercise?.primary_muscles_list || [ex.exercise?.muscle_group].filter(Boolean),
          }
        })

        setExercises(transformedExercises)
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    loadRoutine()
  }, [routineId])

  const addExercise = () => {
    const newExercise: Exercise = {
      id: `exercise-${Date.now()}`,
      name: "",
      notes: "",
      series: [{ id: `series-${Date.now()}`, reps: "12", rest: "60", useRepsRange: false }],
    }
    setExercises([...exercises, newExercise])
  }

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter((ex) => ex.id !== exerciseId))
  }

  const updateExerciseName = (exerciseId: string, name: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, name, exerciseId: undefined } : ex
      )
    )
  }

  const updateExerciseNotes = (exerciseId: string, notes: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, notes } : ex
      )
    )
  }

  const selectExistingExercise = (exerciseId: string, libraryExercise: any) => {
    
    const shouldSetExerciseId = libraryExercise.id !== null && libraryExercise.id !== undefined
    
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              name: libraryExercise.name,
              exerciseId: shouldSetExerciseId ? libraryExercise.id : undefined,
              equipment: libraryExercise.equipment,
              primaryMuscles: libraryExercise.primaryMuscles || libraryExercise.primary_muscles_list,
              image: libraryExercise.image,
              video_url: libraryExercise.video_url,
            }
          : ex
      )
    )
    setShowAutocomplete(false)
  }

  const addSeries = (exerciseId: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              series: [
                ...ex.series,
                { id: `series-${Date.now()}`, reps: "12", rest: "60", useRepsRange: false },
              ],
            }
          : ex
      )
    )
  }

  const updateSeriesField = (exerciseId: string, seriesId: string, field: string, value: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              series: ex.series.map((s) =>
                s.id === seriesId ? { ...s, [field]: value } : s
              ),
            }
          : ex
      )
    )
  }

  const removeSeries = (exerciseId: string, seriesId: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, series: ex.series.filter((s) => s.id !== seriesId) }
          : ex
      )
    )
  }

  const toggleRepsRange = (exerciseId: string, seriesId: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              series: ex.series.map((s) =>
                s.id === seriesId ? { ...s, useRepsRange: !s.useRepsRange } : s
              ),
            }
          : ex
      )
    )
  }

  const getTotalExercises = () => exercises.length

  const getTotalSets = () => exercises.reduce((total, ex) => total + ex.series.length, 0)

  const saveRoutine = async () => {
    setSaving(true)
    try {

      // Save or update workout
      let savedWorkout
      if (workoutId) {
        savedWorkout = await routinesApi.updateRoutine(workoutId.toString(), {
          name: routineTitle,
          day_of_week: dayOfWeek,
          training_plan: trainingPlanId,
        })
      } else {
        // If creating new workout and no training plan exists, create one first
        let trainingId = trainingPlanId
        if (!trainingId && programId) {
          const training = await routinesApi.createTraining({
            name: routineTitle,
            description: routineNote,
            program: parseInt(programId),
            goal: 'GEN',
          })
          trainingId = training.id
          setTrainingPlanId(trainingId)
        }
        
        if (!trainingId) {
          throw new Error('Training plan is required to create a workout')
        }
        
        savedWorkout = await routinesApi.saveRoutine({
          name: routineTitle,
          day_of_week: dayOfWeek,
          training_plan: trainingId,
        })
        setWorkoutId(savedWorkout.id)
      }

      const existingExercises = await routinesApi.fetchWorkoutExercises(savedWorkout.id)
      for (const ex of existingExercises) {
        await routinesApi.deleteWorkoutExercise(ex.id)
      }

      for (const exercise of exercises) {
        let exerciseToUse = exercise.exerciseId

        if (!exerciseToUse && exercise.name) {
          const searchResults = await routinesApi.searchExercisesByName(exercise.name)
          const existing = searchResults.find((e: any) => e.name === exercise.name)

          if (existing) {
            exerciseToUse = existing.id
          } else {
            const newExercise = await routinesApi.createExercise({
              name: exercise.name,
              description: `Custom exercise: ${exercise.name}`,
              equipment: (exercise.equipment || "barbell").toLowerCase(),
              primary_muscles: (exercise.primaryMuscles?.[0] || "general").toLowerCase(),
              level: "beginner",
              category: "strength",
            })
            exerciseToUse = newExercise.id
            console.log('✨ Created new exercise:', exercise.name, 'ID:', exerciseToUse)
          }
        } else if (exerciseToUse) {
          console.log('✓ Using existing exerciseId:', exerciseToUse)
        }

        if (exerciseToUse) {
          const workoutExerciseData = {
            workout: savedWorkout.id,
            exercise: exerciseToUse,
            sets: exercise.series.length,
            reps: parseInt(exercise.series[0]?.reps || "12"),
            rest_time: `00:00:${exercise.series[0]?.rest?.padStart(2, "0") || "60"}`,
            notes: exercise.notes || "",
          }
          console.log('➕ Creating WorkoutExercise:', workoutExerciseData)
          await routinesApi.createWorkoutExercise(workoutExerciseData)
        } else {
          console.warn('⚠️ Skipping exercise without ID:', exercise.name)
        }
      }
      console.log('✨ All exercises saved successfully')

    } catch (error) {
      throw error
    } finally {
      setSaving(false)
    }
  }

  return {
    routineTitle,
    setRoutineTitle,
    routineNote,
    setRoutineNote,
    exercises,
    loading,
    saving,
    setSaving,
    exerciseLibrary,
    isLibraryOpen,
    setIsLibraryOpen,
    exerciseSearch,
    setExerciseSearch,
    filterEquipment,
    setFilterEquipment,
    filterMuscle,
    setFilterMuscle,
    selectedExerciseSlotId,
    setSelectedExerciseSlotId,
    showAutocomplete,
    setShowAutocomplete,
    exerciseRefs,
    addExercise,
    removeExercise,
    updateExerciseName,
    updateExerciseNotes,
    selectExistingExercise,
    addSeries,
    updateSeriesField,
    removeSeries,
    toggleRepsRange,
    getTotalExercises,
    getTotalSets,
    saveRoutine,
  }
}