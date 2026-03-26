"use client"

import { use, useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Save } from "lucide-react"
import Link from "next/link"
import { ExerciseCard } from "@/components/routine-editor/exercise-card"
import { ExerciseLibrarySidebar } from "@/components/routine-editor/exercise-library-sidebar"
import { ExerciseDetailsModal } from "@/components/exercise-details-modal"
import { authApi } from "@/lib/api/auth"
import { apiClient } from "@/lib/api/client"
import { getTeacherStudents } from "@/lib/api/teachers"
import { routinesApi } from "@/lib/api/routines"

interface ExerciseSeries {
  id: string
  reps: string
  repsMin?: string
  repsMax?: string
  rest: string
  useRepsRange?: boolean
  notes?: string
}

interface Exercise {
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

export default function NewWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: trainerId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentIdFromUrl = searchParams.get('studentId')

  // Workout info state
  const [workoutName, setWorkoutName] = useState("")
  const [workoutNote, setWorkoutNote] = useState("")
  const [category, setCategory] = useState("")
  
  // Students state
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentSearch, setStudentSearch] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    studentIdFromUrl ? [studentIdFromUrl] : []
  )

  // Programs state
  const [programs, setPrograms] = useState<any[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState<string>("")

  // Exercise editor state
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exerciseLibrary, setExerciseLibrary] = useState<any[]>([])
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState("")
  const [filterEquipment, setFilterEquipment] = useState("all")
  const [filterMuscle, setFilterMuscle] = useState("all")
  const [selectedExerciseSlotId, setSelectedExerciseSlotId] = useState<string | null>(null)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  
  // Modal state
  const [selectedExerciseForDetails, setSelectedExerciseForDetails] = useState<any>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const [saving, setSaving] = useState(false)
  const exerciseRefs = useRef<Record<string, HTMLElement>>({})

  // Load exercise library
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

  // Load students
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoadingStudents(true)
        const user = authApi.getUserFromStorage()
        if (!user) return
        
        // Get teacher ID first
        const teacherResp = await apiClient.get(`/trainer/teachers/?user=${user.id}`)
        const teacher = teacherResp.data?.[0]
        if (!teacher?.id) return
        
        const list = await getTeacherStudents(teacher.id)
        setStudents(list)
      } catch (e) {
        console.error("Error loading students:", e)
      } finally {
        setLoadingStudents(false)
      }
    }
    loadStudents()
  }, [])

  // Load programs
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setLoadingPrograms(true)
        const user = authApi.getUserFromStorage()
        if (!user) return
        const teacherResp = await apiClient.get(`/trainer/teachers/?user=${user.id}`)
        const teacher = teacherResp.data?.[0]
        if (!teacher?.id) return
        const resp = await apiClient.get(`/programs?teacher=${teacher.id}`)
        setPrograms(resp.data || [])
      } catch (e) {
        console.error("Error loading programs:", e)
      } finally {
        setLoadingPrograms(false)
      }
    }
    loadPrograms()
  }, [])

  // Exercise management functions
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

  const updateSeriesField = (exerciseId: string, seriesId: string, field: keyof ExerciseSeries, value: string) => {
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
                s.id === seriesId
                  ? { ...s, useRepsRange: !s.useRepsRange }
                  : s
              ),
            }
          : ex
      )
    )
  }

  const handleShowExerciseDetails = (exercise: any) => {
    setSelectedExerciseForDetails(exercise)
    setIsDetailsModalOpen(true)
  }

  // Summary functions
  const getTotalExercises = () => exercises.filter((ex) => ex.name.trim()).length
  const getTotalSets = () => exercises.reduce((acc, ex) => acc + ex.series.length, 0)

  // Filter students
  const filteredStudents = students.filter((s) => {
    const name = s.student_name || s.student?.user_data?.username || ""
    return name.toLowerCase().includes(studentSearch.toLowerCase())
  })

  // Save workout
  const handleSave = async () => {
    try {
      setSaving(true)

      // Validate required fields
      if (!workoutName.trim()) {
        alert("Por favor, preencha o nome do treino")
        return
      }

      if (!category) {
        alert("Por favor, selecione uma categoria")
        return
      }

      if (exercises.length === 0 || exercises.some(ex => !ex.name.trim())) {
        alert("Por favor, adicione pelo menos um exercício com nome")
        return
      }

      if (selectedStudentIds.length === 0) {
        alert("Por favor, selecione pelo menos um aluno")
        return
      }

      const user = authApi.getUserFromStorage()
      if (!user) {
        alert("Usuário não encontrado")
        return
      }

      // Get teacher ID
      const teacherResp = await apiClient.get(`/trainer/teachers/?user=${user.id}`)
      const teacher = teacherResp.data?.[0]
      if (!teacher?.id) {
        alert("Professor não encontrado")
        return
      }

      // Map category to goal choices
      const goalMap: Record<string, string> = {
        'hipertrofia': 'HYP',
        'emagrecimento': 'WL',
        'iniciante': 'GEN',
        'avancado': 'STR',
        'funcional': 'GEN'
      }

      // Create training for each selected student
      const trainingPromises = selectedStudentIds.map(async (studentId) => {
        // Create training
        const trainingData = {
          name: workoutName,
          description: workoutNote || "",
          goal: goalMap[category] || 'GEN',
          teacher: teacher.id,
          student: parseInt(studentId),
          program: selectedProgramId ? parseInt(selectedProgramId) : null,
          is_active: true
        }

        const trainingResponse = await apiClient.post('/training/', trainingData)
        const training = trainingResponse.data

        // Create workout for this training
        const workoutData = {
          training_plan: training.id,
          name: workoutName,
          day_of_week: "1"
        }

        const workoutResponse = await apiClient.post('/training/workouts/', workoutData)
        const workout = workoutResponse.data

        // Create workout exercises
        for (const ex of exercises) {
          let exerciseId = ex.exerciseId

          // If no exerciseId, try to find or create the exercise
          if (!exerciseId) {
            try {
              const searchResp = await apiClient.get(`/exercises/?search=${encodeURIComponent(ex.name)}`)
              if (searchResp.data.results?.length > 0) {
                exerciseId = searchResp.data.results[0].id
              } else if (searchResp.data.length > 0) {
                exerciseId = searchResp.data[0].id
              } else {
                // Create new exercise
                const newExercise = await apiClient.post('/exercises/', {
                  name: ex.name,
                  description: ex.notes || "",
                  muscle_group: ex.primaryMuscles?.[0] || "general"
                })
                exerciseId = newExercise.data.id
              }
            } catch (error) {
              console.error("Error finding/creating exercise:", error)
              continue
            }
          }

          // Create workout exercise
          const workoutExerciseData = {
            workout: workout.id,
            exercise: exerciseId,
            sets: ex.series.length,
            reps: ex.series[0]?.useRepsRange 
              ? `${ex.series[0].repsMin || 10}-${ex.series[0].repsMax || 12}`
              : (ex.series[0]?.reps || "12"),
            rest_time: `00:00:${(ex.series[0]?.rest || "60").padStart(2, '0')}`,
            notes: ex.notes || ""
          }
          await apiClient.post('/training/workout-exercises/', workoutExerciseData)
        }

        return training
      })

      await Promise.all(trainingPromises)

      alert("Treino salvo com sucesso!")
      
      if (studentIdFromUrl) {
        router.push(`/trainer/${trainerId}/students/${studentIdFromUrl}`)
      } else {
        router.push(`/trainer/${trainerId}/workouts`)
      }
    } catch (error: any) {
      console.error("Error saving workout:", error)
      const errorMsg = error.response?.data?.detail || 
                      JSON.stringify(error.response?.data) || 
                      error.message
      alert(`Erro ao salvar treino: ${errorMsg}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/trainer/${trainerId}/workouts`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <p className="text-sm text-muted-foreground">Criar Novo Treino</p>
              <h1 className="text-2xl font-bold">Novo Treino</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {getTotalExercises()} exercícios • {getTotalSets()} séries
            </span>
            <Button variant="outline" asChild>
              <Link href={`/trainer/${trainerId}/workouts`}>Cancelar</Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Treino"}
            </Button>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="px-6 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total de Exercícios</p>
            <p className="text-2xl font-semibold">{getTotalExercises()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total de Séries</p>
            <p className="text-2xl font-semibold">{getTotalSets()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Alunos Selecionados</p>
            <p className="text-2xl font-semibold">{selectedStudentIds.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Categoria</p>
            <p className="text-2xl font-semibold capitalize">{category || "-"}</p>
          </Card>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="px-6 pb-12 pt-6 space-y-6">
          {/* Workout Info Card */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workout-title" className="text-sm font-medium">Nome do Treino</Label>
                <Input
                  id="workout-title"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="Ex: Treino A - Peito e Tríceps"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="bg-muted/50">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                    <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                    <SelectItem value="funcional">Funcional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Programa (opcional)</Label>
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder={loadingPrograms ? "Carregando..." : "Selecione um programa"} />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workout-note" className="text-sm font-medium">Descrição</Label>
                <Textarea
                  id="workout-note"
                  value={workoutNote}
                  onChange={(e) => setWorkoutNote(e.target.value)}
                  placeholder="Adicione observações sobre o treino"
                  rows={2}
                  className="bg-muted/50 resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Students Selection Card */}
          <Card className="p-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Vincular a Alunos</Label>
              <Input
                placeholder="Pesquisar aluno pelo nome..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="bg-muted/50"
              />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-auto">
                {loadingStudents ? (
                  <p className="text-sm text-muted-foreground col-span-full">Carregando alunos...</p>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground col-span-full">Nenhum aluno encontrado</p>
                ) : (
                  filteredStudents.map((s) => {
                    const id = s.student_id?.toString() || s.student?.id?.toString()
                    const name = s.student_name || s.student?.user_data?.username
                    return (
                      <label 
                        key={id} 
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                          selectedStudentIds.includes(id) 
                            ? 'bg-primary/10 border border-primary/30' 
                            : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded"
                          checked={selectedStudentIds.includes(id)}
                          onChange={(e) =>
                            setSelectedStudentIds((prev) =>
                              e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)
                            )
                          }
                        />
                        <span className="text-sm truncate">{name}</span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          </Card>

          {/* Exercises Section */}
          <div className="space-y-4">
            {exercises.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Sem Exercícios</h3>
                  <p className="text-muted-foreground mb-4">
                    Adicione exercícios para criar o treino.
                  </p>
                  <Button onClick={addExercise}>Adicionar Exercício</Button>
                </div>
              </Card>
            ) : (
              <>
                {exercises.map((exercise, exerciseIndex) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    exerciseIndex={exerciseIndex}
                    exerciseLibrary={exerciseLibrary}
                    selectedExerciseSlotId={selectedExerciseSlotId}
                    showAutocomplete={showAutocomplete}
                    onUpdateName={updateExerciseName}
                    onUpdateNotes={updateExerciseNotes}
                    onRemove={removeExercise}
                    onSelectExercise={selectExistingExercise}
                    onAddSeries={addSeries}
                    onUpdateSeries={updateSeriesField}
                    onRemoveSeries={removeSeries}
                    onToggleRepsRange={toggleRepsRange}
                    onShowDetails={handleShowExerciseDetails}
                    onFocus={(id) => {
                      setSelectedExerciseSlotId(id)
                      setShowAutocomplete(true)
                    }}
                    onBlur={() => setShowAutocomplete(false)}
                    cardRef={(el) => {
                      if (el) exerciseRefs.current[exercise.id] = el
                    }}
                  />
                ))}

                <Button onClick={addExercise} variant="outline" className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Exercício
                </Button>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none sm:px-6">
              {saving ? "Salvando..." : "Salvar Treino"}
            </Button>
            <Button variant="outline" asChild className="flex-1 sm:flex-none sm:px-6">
              <Link href={`/trainer/${trainerId}/workouts`}>Cancelar</Link>
            </Button>
            <Button
              variant="secondary"
              className="flex items-center gap-2 sm:px-6"
              onClick={() => setIsLibraryOpen(true)}
            >
              Biblioteca
            </Button>
          </div>
        </div>
      </div>

      <ExerciseLibrarySidebar
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        exerciseLibrary={exerciseLibrary}
        selectedExerciseSlotId={selectedExerciseSlotId}
        searchQuery={exerciseSearch}
        onSearchChange={setExerciseSearch}
        filterEquipment={filterEquipment}
        onFilterEquipmentChange={setFilterEquipment}
        filterMuscle={filterMuscle}
        onFilterMuscleChange={setFilterMuscle}
        onSelectExercise={(libExercise) => {
          if (selectedExerciseSlotId) {
            selectExistingExercise(selectedExerciseSlotId, libExercise)
          }
        }}
      />

      <ExerciseDetailsModal
        exercise={selectedExerciseForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </div>
  )
}
