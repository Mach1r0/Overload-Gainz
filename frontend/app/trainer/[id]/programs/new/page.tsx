"use client"

import { use, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, Plus, MoreVertical, Check, Users, User } from "lucide-react"
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

interface Student {
  id: number
  student_name?: string
  user_data?: {
    username: string
    first_name: string
    last_name: string
  }
}

interface Folder {
  id: number
  name: string
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

export default function NewProgramPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: trainerId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentIdFromUrl = searchParams.get('studentId')
  const folderIdFromUrl = searchParams.get('folder')
  
  const [saving, setSaving] = useState(false)
  const [programTitle, setProgramTitle] = useState("Programa Sem Título")
  const [programDuration, setProgramDuration] = useState("unlimited")
  const [programNote, setProgramNote] = useState("")
  const [programGoal, setProgramGoal] = useState("GEN")
  const [routines, setRoutines] = useState<Routine[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [loadingStudent, setLoadingStudent] = useState(false)
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>(folderIdFromUrl || "none")
  const [loadingFolders, setLoadingFolders] = useState(false)

  // Load student info if studentId is provided
  useEffect(() => {
    const loadStudent = async () => {
      if (!studentIdFromUrl) return
      
      try {
        setLoadingStudent(true)
        const response = await apiClient.get(`/students/${studentIdFromUrl}/`)
        setSelectedStudent(response.data)
      } catch (error) {
        console.error('Error loading student:', error)
      } finally {
        setLoadingStudent(false)
      }
    }
    
    loadStudent()
  }, [studentIdFromUrl])

  // Load folders for folder selection
  useEffect(() => {
    const loadFolders = async () => {
      try {
        setLoadingFolders(true)
        const user = authApi.getUserFromStorage()
        if (!user) return

        const teacherResponse = await apiClient.get(`/trainer/teachers/?user=${user.id}`)
        const teacher = teacherResponse.data?.[0]
        if (!teacher) return

        const response = await apiClient.get(`/training/folders/?teacher=${teacher.id}`)
        setFolders(response.data || [])
      } catch (error) {
        console.error('Error loading folders:', error)
      } finally {
        setLoadingFolders(false)
      }
    }
    
    loadFolders()
  }, [])

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
    
    try {
      const user = authApi.getUserFromStorage()
      if (!user) {
        alert("Usuário não encontrado")
        return
      }

      const teacherResp = await apiClient.get(`/trainer/teachers/?user=${user.id}`)
      const teacher = teacherResp.data?.[0]
      if (!teacher?.id) {
        alert("Professor não encontrado")
        return
      }

      const programData = {
        name: programTitle,
        description: programNote,
        teacher: teacher.id,
        goal: programGoal,
        durantion: programDuration === 'unlimited' ? 0 : parseInt(programDuration),
        is_active: true,
        folder: selectedFolder && selectedFolder !== "none" ? parseInt(selectedFolder) : null
      }

      const programResponse = await apiClient.post('/training/programs/', programData)
      const program = programResponse.data
      console.log('Created program:', program)

      // If there's a student selected, create a Training linking student to program
      if (studentIdFromUrl) {
        const trainingData = {
          name: programTitle,
          description: programNote || `Programa ${programTitle}`,
          goal: programGoal,
          teacher: teacher.id,
          student: parseInt(studentIdFromUrl),
          program: program.id,
          is_active: true
        }

        const trainingResponse = await apiClient.post('/training/trainings/', trainingData)
        console.log('Created training:', trainingResponse.data)

        alert("Programa criado e vinculado ao aluno com sucesso!")
        router.push(`/trainer/${trainerId}/students/${studentIdFromUrl}`)
      } else {
        alert("Programa criado com sucesso!")
        router.push(`/trainer/${trainerId}/programs`)
      }
    } catch (error: any) {
      console.error("Error saving program:", error)
      const errorMsg = error.response?.data?.detail || 
                      JSON.stringify(error.response?.data) || 
                      error.message
      alert(`Erro ao salvar programa: ${errorMsg}`)
    } finally {
      setSaving(false)
    }
  }

  const muscleGroupCounts = getMuscleGroupCounts()

  const getStudentName = () => {
    if (!selectedStudent) return ''
    const userData = selectedStudent.user_data
    if (userData) {
      const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
      return fullName || userData.username
    }
    return selectedStudent.student_name || ''
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={studentIdFromUrl ? `/trainer/${trainerId}/students/${studentIdFromUrl}` : `/trainer/${trainerId}/programs`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <p className="text-sm text-muted-foreground">
                {studentIdFromUrl ? 'Voltar para o aluno' : 'Meus Programas'}
              </p>
              <h1 className="text-2xl font-bold">Novo Programa de Treino</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Check className="h-4 w-4" />
              Todas as alterações salvas
            </span>
            {!studentIdFromUrl && (
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Users className="h-4 w-4" />
                Atribuir Programa
              </Button>
            )}
          </div>
        </div>

        {/* Student Info Banner */}
        {selectedStudent && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Criando programa para</p>
                  <p className="font-medium">{getStudentName()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração do Programa</Label>
                  <Select value={programDuration} onValueChange={setProgramDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlimited">Ilimitado</SelectItem>
                      <SelectItem value="4">4 Semanas</SelectItem>
                      <SelectItem value="8">8 Semanas</SelectItem>
                      <SelectItem value="12">12 Semanas</SelectItem>
                      <SelectItem value="16">16 Semanas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">Objetivo</Label>
                  <Select value={programGoal} onValueChange={setProgramGoal}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HYP">Hipertrofia</SelectItem>
                      <SelectItem value="STR">Força</SelectItem>
                      <SelectItem value="WL">Perda de Peso</SelectItem>
                      <SelectItem value="END">Resistência</SelectItem>
                      <SelectItem value="GEN">Fitness Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="folder">Pasta</Label>
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma pasta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem Pasta</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id.toString()}>
                        {folder.name}
                      </SelectItem>
                    ))}
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
                <Button onClick={addRoutine} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Rotina
                </Button>
              </div>

              {routines.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">Nenhuma rotina adicionada ainda</p>
                    <Button onClick={addRoutine} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeira Rotina
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {routines.map((routine) => (
                    <Card key={routine.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Input
                              value={routine.name}
                              onChange={(e) => updateRoutineName(routine.id, e.target.value)}
                              className="font-semibold border-none px-0 focus-visible:ring-0 bg-transparent"
                            />
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
                                href={`/trainer/${trainerId}/programs/new/routine/${routine.id}`}
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
                                <Link href={`/trainer/${trainerId}/programs/new/routine/${routine.id}`}>Editar Exercícios</Link>
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
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Salvando..." : "Salvar Programa"}
              </Button>
              <Button variant="outline" asChild>
                <Link href={studentIdFromUrl ? `/trainer/${trainerId}/students/${studentIdFromUrl}` : `/trainer/${trainerId}/programs`}>
                  Cancelar
                </Link>
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
      </main>
    </div>
  )
}
