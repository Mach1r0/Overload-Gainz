import { useState, useRef, useEffect } from "react"
import { routinesApi, ExerciseLibraryItem } from "@/lib/api/routines"

export interface ExerciseSeries {
  id: string
  reps: string
  repsMin?: string
  repsMax?: string
  useRepsRange?: boolean
  rest: string
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
}

export function useRoutineEditor(routineId: string) {
  const [routineTitle, setRoutineTitle] = useState("")
  const [routineNote, setRoutineNote] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibraryItem[]>([])
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState("")
  const [filterEquipment, setFilterEquipment] = useState("")
  const [filterMuscle, setFilterMuscle] = useState("")
  const [selectedExerciseSlotId, setSelectedExerciseSlotId] = useState<string | null>(null)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  
  const exerciseRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const library = await routinesApi.fetchExerciseLibrary()
        setExerciseLibrary(library)

        if (routineId !== "new") {
          // const routine = await routinesApi.fetchRoutine(routineId)
          // TODO: Load routine data and populate form
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [routineId])

  const addExercise = () => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: "",
      series: [{ id: `${Date.now().toString()}-1`, reps: "12", rest: "60", useRepsRange: false }],
    }
    setExercises([...exercises, newExercise])
  }

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id))
  }

  const updateExerciseName = (id: string, value: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === id
          ? { ...ex, name: value, exerciseId: undefined, equipment: undefined, primaryMuscles: undefined }
          : ex
      )
    )
  }

  const updateExerciseNotes = (id: string, value: string) => {
    setExercises(exercises.map((ex) => (ex.id === id ? { ...ex, notes: value } : ex)))
  }

  const selectExistingExercise = (libraryExercise: ExerciseLibraryItem) => {
    if (!selectedExerciseSlotId) return
    const primaryMuscles = libraryExercise.primary_muscles_list || 
                          libraryExercise.primaryMuscles || 
                          [libraryExercise.muscle_group].filter(Boolean)
    setExercises(
      exercises.map((ex) =>
        ex.id === selectedExerciseSlotId
          ? {
              ...ex,
              name: libraryExercise.name,
              exerciseId: typeof libraryExercise.id === 'number' ? libraryExercise.id : undefined,
              equipment: libraryExercise.equipment,
              primaryMuscles: primaryMuscles,
            }
          : ex
      )
    )
    setShowAutocomplete(false)
    setIsLibraryOpen(false)
    
    // Scroll to the selected exercise
    setTimeout(() => {
      const exerciseElement = exerciseRefs.current[selectedExerciseSlotId]
      if (exerciseElement) {
        exerciseElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 100)
  }

  const addSeries = (exerciseId: string) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex
        return {
          ...ex,
          series: [...ex.series, { id: `${exerciseId}-${ex.series.length + 1}`, reps: "12", rest: "60", useRepsRange: false }],
        }
      })
    )
  }

  const updateSeriesField = (
    exerciseId: string,
    seriesId: string,
    field: keyof ExerciseSeries,
    value: string
  ) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex
        return {
          ...ex,
          series: ex.series.map((s) => (s.id === seriesId ? { ...s, [field]: value } : s)),
        }
      })
    )
  }

  const removeSeries = (exerciseId: string, seriesId: string) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex
        return { ...ex, series: ex.series.filter((s) => s.id !== seriesId) }
      })
    )
  }

  const toggleRepsRange = (exerciseId: string, seriesId: string) => {
    setExercises(
      exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex
        return {
          ...ex,
          series: ex.series.map((s) => {
            if (s.id !== seriesId) return s
            const isCurrentlyUsingRange = s.useRepsRange
            if (isCurrentlyUsingRange) {
              return { ...s, useRepsRange: false, reps: s.repsMin || "12" }
            } else {
              return { ...s, useRepsRange: true, repsMin: s.reps || "10", repsMax: s.reps || "12" }
            }
          }),
        }
      })
    )
  }

  const getTotalExercises = () => exercises.length
  const getTotalSets = () => exercises.reduce((acc, ex) => acc + ex.series.length, 0)

  return {
    // State
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
    
    // Actions
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
  }
}
