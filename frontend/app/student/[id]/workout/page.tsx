"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react"
import Link from "next/link"
import { getTodayWorkoutSession } from "@/lib/api"

interface ExerciseSet {
  completed: boolean
  weight: string
  reps: string
  set_number?: number
}

interface Exercise {
  id: number
  name: string
  targetSets: number
  targetReps: string
  rest: number
  notes: string
  sets: ExerciseSet[]
}

interface WorkoutSession {
  id: number
  workout: {
    id: number
    name: string
    training_plan: number
  }
  exercise_logs: Array<{
    id: number
    exercise: {
      id: number
      name: string
      description?: string
      muscle_group: string
    }
    workout_exercise?: {
      sets: number
      reps: number
      rest_time?: string
      notes?: string
    }
    order: number
    set_logs: Array<{
      id: number
      set_number: number
      repetitions: number
      weight: number
      completed?: boolean
    }>
  }>
  status: string
  date: string
}

export default function WorkoutPage() {
  const params = useParams()
  const studentId = params.id as string
  const { user, isLoading: authLoading } = useAuth()
  
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWorkoutSession = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        const session = await getTodayWorkoutSession(user.id)
        
        if (session && session.exercise_logs) {
          setWorkoutSession(session)
          
          const transformedExercises: Exercise[] = session.exercise_logs.map((log: any) => {
            const targetSets = log.workout_exercise?.sets || 3
            const targetReps = log.workout_exercise?.reps || 12
            const restTime = log.workout_exercise?.rest_time || "00:01:30"
            
            // Parse rest time (format: HH:MM:SS or MM:SS)
            const restSeconds = restTime.split(':').reduce((acc: number, time: string) => (60 * acc) + parseInt(time), 0)
            
            // Create empty sets or use existing set logs
            const sets: ExerciseSet[] = Array.from({ length: targetSets }, (_, index) => {
              const existingSet = log.set_logs?.find((s: any) => s.set_number === index + 1)
              return {
                completed: existingSet?.completed || false,
                weight: existingSet?.weight?.toString() || "",
                reps: existingSet?.repetitions?.toString() || "",
                set_number: index + 1
              }
            })
            
            return {
              id: log.id,
              name: log.exercise.name,
              targetSets,
              targetReps: targetReps.toString(),
              rest: restSeconds,
              notes: log.workout_exercise?.notes || "",
              sets
            }
          })
          
          setExercises(transformedExercises)
        }
      } catch (error) {
        console.error('Error fetching workout session:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user?.id) {
      fetchWorkoutSession()
    }
  }, [user?.id, authLoading])

  const currentExercise = exercises.length > 0 ? exercises[currentExerciseIndex] : null
  const completedSets = currentExercise ? currentExercise.sets.filter((s) => s.completed).length : 0

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex].sets[setIndex].completed = !newExercises[exerciseIndex].sets[setIndex].completed
    setExercises(newExercises)

    if (newExercises[exerciseIndex].sets[setIndex].completed) {
      setRestTimer(newExercises[exerciseIndex].rest)
    }
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: "weight" | "reps", value: string) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex].sets[setIndex][field] = value
    setExercises(newExercises)
  }

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
      setRestTimer(null)
    }
  }

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1)
      setRestTimer(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Carregando treino...</div>
      </div>
    )
  }

  if (!workoutSession || exercises.length === 0 || !currentExercise) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/student/${studentId}/dashboard`}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Treino</h1>
            </div>
          </div>
        </header>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Nenhum treino programado para hoje</p>
            <p className="text-sm text-muted-foreground mt-2">Descanse ou entre em contato com seu treinador</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/student/${studentId}/dashboard`}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{workoutSession.workout.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Exercício {currentExerciseIndex + 1} de {exercises.length}
                </p>
              </div>
            </div>
            <Button>Finalizar Treino</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Rest Timer */}
        {restTimer !== null && restTimer > 0 && (
          <Card className="p-4 bg-primary/10 border-primary mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Tempo de Descanso</p>
                  <p className="text-sm text-muted-foreground">Próxima série em breve</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-primary">{restTimer}s</div>
            </div>
          </Card>
        )}

        {/* Current Exercise */}
        <Card className="p-6 bg-card border-border mb-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-foreground">{currentExercise.name}</h2>
              <Badge variant="secondary">
                {completedSets}/{currentExercise.targetSets}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {currentExercise.targetSets} séries × {currentExercise.targetReps} repetições • Descanso:{" "}
              {currentExercise.rest}s
            </p>
            {currentExercise.notes && (
              <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{currentExercise.notes}</p>
            )}
          </div>

          {/* Sets */}
          <div className="space-y-3">
            {currentExercise.sets.map((set, setIndex) => (
              <div
                key={setIndex}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  set.completed ? "bg-primary/5 border-primary" : "bg-muted/30 border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleSetComplete(currentExerciseIndex, setIndex)} className="flex-shrink-0">
                    {set.completed ? (
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    ) : (
                      <Circle className="h-8 w-8 text-muted-foreground" />
                    )}
                  </button>

                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Peso (kg)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={set.weight}
                        onChange={(e) => updateSet(currentExerciseIndex, setIndex, "weight", e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Repetições</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={set.reps}
                        onChange={(e) => updateSet(currentExerciseIndex, setIndex, "reps", e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <span className="text-lg font-bold text-foreground">Série {setIndex + 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={previousExercise}
            disabled={currentExerciseIndex === 0}
          >
            Anterior
          </Button>
          <Button className="flex-1" onClick={nextExercise} disabled={currentExerciseIndex === exercises.length - 1}>
            Próximo
          </Button>
        </div>

        {/* Exercise List */}
        <Card className="p-4 bg-card border-border mt-6">
          <h3 className="font-semibold text-foreground mb-3">Todos os Exercícios</h3>
          <div className="space-y-2">
            {exercises.map((exercise, index) => {
              const completed = exercise.sets.filter((s) => s.completed).length
              const total = exercise.sets.length
              return (
                <button
                  key={exercise.id}
                  onClick={() => setCurrentExerciseIndex(index)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    index === currentExerciseIndex
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted/30 border-2 border-transparent hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{exercise.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {completed}/{total} séries
                      </p>
                    </div>
                    {completed === total && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
