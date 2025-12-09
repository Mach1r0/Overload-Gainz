"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { NavHeader } from "@/components/nav-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, Plus, MoreVertical, Check, Users } from "lucide-react"
import { AddRoutineModal } from "@/components/add-routine-modal"
import Link from "next/link"
import { apiClient } from "@/lib/api/client"
import { authApi } from "@/lib/api/auth"

interface Exercise {
  id: number
  name: string
  sets: number
  muscleGroup: string
}

interface Routine {
  id: number
  name: string
  exercises: Exercise[]
}

const muscleGroups = [
  "Abdominais",
  "Abdutores",
  "Adutores",
  "Bíceps",
  "Panturrilhas",
  "Cardio",
  "Peito",
  "Antebraços",
  "Corpo Inteiro",
  "Glúteos",
  "Isquiotibiais",
  "Dorsais",
  "Lombar",
  "Pescoço",
  "Outro",
  "Quadríceps",
  "Ombros",
  "Trapézio",
  "Tríceps",
  "Costas Superior",
]

export default function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string; programId: string }>
}) {
  const { id, programId } = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [programTitle, setProgramTitle] = useState("")
  const [programDuration, setProgramDuration] = useState("unlimited")
  const [programNote, setProgramNote] = useState("")
  const [routines, setRoutines] = useState<Routine[]>([])
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false)

  useEffect(() => {
    const fetchProgramData = async () => {
      try {
        const user = authApi.getUserFromStorage()
        if (!user) {
          setLoading(false)
          return
        }

        const programResponse = await apiClient.get(`/programs/${programId}/`)
        const program = programResponse.data

        setProgramTitle(program.name)
        setProgramNote(program.description || "")
        setProgramDuration("unlimited")

        // Extract routines from trainings
        const routinesMap = new Map<
          string,
          { id: number; name: string; exercises: any[] }
        >()

        if (program.trainings && program.trainings.length > 0) {
          program.trainings.forEach((training: any) => {
            if (training.workouts) {
              training.workouts.forEach((workout: any) => {
                if (!routinesMap.has(workout.name)) {
                  const exercises =
                    workout.exercises?.map((ex: any) => ({
                      id: ex.id,
                      name: ex.name || "",
                      sets: ex.sets || 1,
                      muscleGroup: ex.exercise?.muscle_group || "Outro",
                    })) || []

                  routinesMap.set(workout.name, {
                    id: workout.id,
                    name: workout.name,
                    exercises,
                  })
                }
              })
            }
          })
        }

        setRoutines(Array.from(routinesMap.values()))
        setLoading(false)
      } catch (error) {
        console.error("Erro ao carregar dados do programa:", error)
        setLoading(false)
      }
    }

    fetchProgramData()
  }, [programId])

  const addRoutine = () => {
    const newRoutine: Routine = {
      id: Date.now(),
      name: "Rotina Sem Título",
      exercises: [],
    }
    setRoutines([...routines, newRoutine])
  }

  const updateRoutineName = (routineId: number, name: string) => {
    setRoutines(routines.map((r) => (r.id === routineId ? { ...r, name } : r)))
  }

  const deleteRoutine = (routineId: number) => {
    setRoutines(routines.filter((r) => r.id !== routineId))
  }

  const duplicateRoutine = (routine: Routine) => {
    const newRoutine: Routine = {
      ...routine,
      id: Date.now(),
      name: `${routine.name} (cópia)`,
      exercises: routine.exercises.map((e) => ({ ...e, id: Date.now() + e.id })),
    }
    setRoutines([...routines, newRoutine])
  }

  const getTotalExercises = () => {
    return routines.reduce((acc, r) => acc + r.exercises.length, 0)
  }

  const getTotalSets = () => {
    return routines.reduce((acc, r) => acc + r.exercises.reduce((a, e) => a + e.sets, 0), 0)
  }

  const getMuscleGroupCounts = () => {
    const counts: Record<string, number> = {}
    muscleGroups.forEach((mg) => (counts[mg] = 0))

    routines.forEach((r) => {
      r.exercises.forEach((e) => {
        if (counts[e.muscleGroup] !== undefined) {
          counts[e.muscleGroup] += e.sets
        }
      })
    })

    return counts
  }

  const handleSave = async () => {
    setSaving(true)
    // TODO: Save to API
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
    router.push(`/trainer/${id}/programs`)
  }

  const handleImportRoutines = (importedRoutines: any[]) => {
    const newRoutines = importedRoutines.map((r) => ({
      id: Date.now() + Math.random() * 1000,
      name: `${r.name} (cópia)`,
      exercises: r.exercises.map((e: any) => ({ ...e, id: Date.now() + e.id })),
    }))
    setRoutines([...routines, ...newRoutines])
  }

  const muscleGroupCounts = getMuscleGroupCounts()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 text-center">Carregando programa...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/trainer/${id}/programs`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <p className="text-sm text-muted-foreground">Meus Programas</p>
              <h1 className="text-2xl font-bold">Editar Modelo de Programa</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Check className="h-4 w-4" />
              Todas as alterações salvas
            </span>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Users className="h-4 w-4" />
              Atribuir Programa
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Programa de Treino</Label>
                <Input
                  id="title"
                  value={programTitle}
                  onChange={(e) => setProgramTitle(e.target.value)}
                  placeholder="Digite o título do programa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração do Programa</Label>
                <Select value={programDuration} onValueChange={setProgramDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">Ilimitado</SelectItem>
                    <SelectItem value="4-weeks">4 Semanas</SelectItem>
                    <SelectItem value="8-weeks">8 Semanas</SelectItem>
                    <SelectItem value="12-weeks">12 Semanas</SelectItem>
                    <SelectItem value="16-weeks">16 Semanas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Nota do Programa</Label>
                <Textarea
                  id="note"
                  value={programNote}
                  onChange={(e) => setProgramNote(e.target.value)}
                  placeholder="Adicione uma breve descrição do programa"
                  rows={3}
                />
              </div>
            </div>

            {/* Routines Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Rotinas</h2>
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">{routines.length}</span>
                </div>
                <Button onClick={() => setIsRoutineModalOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Rotina
                </Button>
              </div>

              <div className="space-y-3">
                {routines.map((routine) => (
                  <Card key={routine.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link href={`/trainer/${id}/programs/${programId}/routine/${encodeURIComponent(routine.name)}`}>
                            <Input
                              value={routine.name}
                              onChange={(e) => {
                                e.preventDefault()
                                updateRoutineName(routine.id, e.target.value)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold border-none px-0 focus-visible:ring-0 bg-transparent cursor-pointer hover:text-primary transition-colors"
                            />
                          </Link>
                          {routine.exercises.length > 0 ? (
                            <div className="mt-2 space-y-1">
                              {routine.exercises.map((exercise) => (
                                <p key={exercise.id} className="text-sm text-muted-foreground">
                                  {exercise.sets}x {exercise.name}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <Link
                              href={`/trainer/${id}/programs/${programId}/routine/${encodeURIComponent(routine.name)}`}
                              className="text-sm text-primary hover:underline mt-2 inline-block"
                            >
                              + Adicionar exercícios
                            </Link>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/trainer/${id}/programs/${programId}/routine/${encodeURIComponent(routine.name)}`}>Editar Exercícios</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateRoutine(routine)}>Duplicar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteRoutine(routine.id)}>
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Salvando..." : "Salvar Programa"}
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/trainer/${id}/programs`}>Cancelar</Link>
              </Button>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Resumo</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total de Exercícios</span>
                    <span className="font-medium">{getTotalExercises()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total de Séries</span>
                    <span className="font-medium">{getTotalSets()}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Distribuição Muscular</h4>
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center text-muted-foreground text-sm">
                      <svg
                        viewBox="0 0 200 200"
                        className="w-32 h-32 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      >
                        <polygon
                          points="100,20 170,60 170,140 100,180 30,140 30,60"
                          className="fill-primary/10 stroke-primary"
                        />
                        <text x="100" y="15" textAnchor="middle" className="text-xs fill-current">
                          Core
                        </text>
                        <text x="175" y="55" textAnchor="start" className="text-xs fill-current">
                          Ombros
                        </text>
                        <text x="175" y="145" textAnchor="start" className="text-xs fill-current">
                          Braços
                        </text>
                        <text x="100" y="195" textAnchor="middle" className="text-xs fill-current">
                          Pernas
                        </text>
                        <text x="25" y="145" textAnchor="end" className="text-xs fill-current">
                          Costas
                        </text>
                        <text x="25" y="55" textAnchor="end" className="text-xs fill-current">
                          Peito
                        </text>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Séries por Grupo Muscular</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {muscleGroups.map((group) => (
                      <div key={group} className="flex items-center justify-between text-sm">
                        <span className={muscleGroupCounts[group] > 0 ? "text-primary" : "text-muted-foreground"}>
                          {group}
                        </span>
                        <span
                          className={
                            muscleGroupCounts[group] > 0 ? "text-primary font-medium" : "text-muted-foreground"
                          }
                        >
                          {muscleGroupCounts[group]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <AddRoutineModal
          open={isRoutineModalOpen}
          onOpenChange={setIsRoutineModalOpen}
          onCreateNew={addRoutine}
          onImportRoutines={handleImportRoutines}
          existingRoutines={routines}
        />
      </main>
    </div>
  )
}
