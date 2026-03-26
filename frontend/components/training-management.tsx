"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Edit, Eye, Dumbbell, ChevronDown, ChevronUp } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import Link from "next/link"

interface Workout {
  id: number
  name: string
  day_of_week: string
  exercises: any[]
}

interface Training {
  id: number
  name: string
  goal: "STR" | "HYP" | "END" | "WL" | "GEN"
  description: string
  start_date: string
  end_date: string
  is_active: boolean
  workouts: Workout[]
  program?: number
  program_name?: string
}

const goalLabels = {
  STR: "Força",
  HYP: "Hipertrofia",
  END: "Resistência",
  WL: "Perda de Peso",
  GEN: "Fitness Geral",
}

const goalColors = {
  STR: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  HYP: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  END: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  WL: "bg-orange-100 text-orange-800 dark:bg-orange-900 deark:text-orange-200",
  GEN: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
}

export function TrainingManagement({ studentId, userId }: { studentId: string; userId: string }) {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedTrainingId, setExpandedTrainingId] = useState<number | null>(null)
  const [trainerId, setTrainerId] = useState<string>("")

  useEffect(() => {
    // Extract trainer ID from URL
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/')
      const trainerIndex = pathParts.indexOf('trainer')
      if (trainerIndex !== -1 && pathParts[trainerIndex + 1]) {
        setTrainerId(pathParts[trainerIndex + 1])
      }
    }
  }, [])

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        setLoading(true)
        
        if (!trainerId) {
          console.log('Waiting for trainerId...')
          return
        }
        
        // Debug: Check if token is available
        const token = localStorage.getItem('access_token')
        console.log('🔑 Token available:', !!token)
        if (!token) {
          console.error('❌ No access token found. User needs to login.')
          setError('Você precisa fazer login para ver os programas. Por favor, faça logout e login novamente.')
          setTrainings([])
          setLoading(false)
          return
        }
        
        console.log('📡 Fetching programs for teacher:', trainerId, 'student:', studentId)
        
        // Use the endpoint that returns programs with all trainings and workouts included
        const response = await apiClient.get(`/training/programs/student_all_programs/?teacher=${trainerId}&student=${studentId}`)
        console.log('✅ Programs response for student', studentId, ':', response.data)
        
        // Handle both paginated and direct array responses
        const programsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.results || [])
        
        console.log('Programs data array:', programsData)
        
        // Flatten all trainings from all programs into a single array
        const allTrainings: Training[] = []
        
        programsData.forEach((program: any) => {
          if (program.trainings && Array.isArray(program.trainings)) {
            program.trainings.forEach((training: any) => {
              console.log('Training data:', training)
              console.log('  - Training ID:', training.id)
              console.log('  - Program ID:', training.program)
              allTrainings.push({
                id: training.id,
                name: training.name,
                goal: training.goal,
                description: training.description,
                start_date: training.start_date,
                end_date: training.end_date,
                is_active: training.is_active,
                workouts: training.workouts || [],
                program: training.program,
                program_name: training.program_name
              })
            })
          }
        })
        
        console.log('Final trainings:', allTrainings)
        setTrainings(allTrainings)
        setError(null)
      } catch (error: any) {
        console.error('❌ Error fetching programs:', error)
        console.error('Error response:', error.response?.data)
        console.error('Error status:', error.response?.status)
        
        // Set user-friendly error message
        if (error.response?.status === 401) {
          setError('Você precisa fazer login novamente. Por favor, faça logout e login.')
        } else if (error.response?.status === 404) {
          setError('Endpoint não encontrado. Verifique se o servidor está rodando.')
        } else {
          setError(`Erro ao carregar programas: ${error.message}`)
        }
        
        // Return empty array on error instead of keeping loading state
        setTrainings([])
      } finally {
        setLoading(false)
      }
    }

    if (studentId && trainerId) {
      fetchTrainings()
    }
  }, [studentId, trainerId])

  const toggleExpanded = (trainingId: number) => {
    setExpandedTrainingId(expandedTrainingId === trainingId ? null : trainingId)
  }

  if (loading) {
    return <div className="text-center py-8">Carregando treinos...</div>
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-destructive">
              <p className="text-lg font-medium">Erro ao carregar programas</p>
              <p className="text-muted-foreground mt-2">{error}</p>
            </div>
            {error.includes('login') ? (
              <Button onClick={() => window.location.href = '/auth/login'}>
                Ir para Login
              </Button>
            ) : (
              <Button onClick={() => window.location.reload()}>
                Tentar Novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Programas de Treino</h2>
          <p className="text-muted-foreground">Gerencie os programas e rotinas do aluno</p>
        </div>
        {trainerId && (
          <Button asChild>
            <Link href={`/trainer/${trainerId}/programs/new?studentId=${studentId}`}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Programa
            </Link>
          </Button>
        )}
      </div>

      {/* Trainings List */}
      {trainings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Dumbbell className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Nenhum programa criado ainda</p>
                <p className="text-muted-foreground">Crie um programa de treino para este aluno</p>
              </div>
              {trainerId && (
                <Button asChild>
                  <Link href={`/trainer/${trainerId}/programs/new?studentId=${studentId}`}>
                    Criar Primeiro Programa
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {trainings.map((training) => (
            <Card key={training.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{training.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 flex-wrap">
                      <Badge className={goalColors[training.goal]}>{goalLabels[training.goal]}</Badge>
                      {training.is_active && <Badge variant="default">Ativo</Badge>}
                      {training.program_name && (
                        <Badge variant="outline">Programa: {training.program_name}</Badge>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(training.id)}
                  >
                    {expandedTrainingId === training.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {training.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{training.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Início: {new Date(training.start_date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dumbbell className="h-4 w-4" />
                    <span>{training.workouts?.length || 0} rotina(s)</span>
                  </div>
                </div>

                {/* Expanded Workouts Section */}
                {expandedTrainingId === training.id && (
                  <div className="border-t pt-4 mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Rotinas de Treino</h4>
                      {trainerId && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/trainer/${trainerId}/programs/${training.program || 'new'}/routine/new?trainingId=${training.id}&studentId=${studentId}`}>
                            <Plus className="h-3 w-3 mr-1" />
                            Nova Rotina
                          </Link>
                        </Button>
                      )}
                    </div>
                    
                    {training.workouts && training.workouts.length > 0 ? (
                      <div className="grid gap-2">
                        {training.workouts.map((workout) => (
                          <div
                            key={workout.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-sm">{workout.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {workout.exercises?.length || 0} exercícios
                              </p>
                            </div>
                            {trainerId && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/trainer/${trainerId}/programs/${training.program || training.id}/routine/${workout.id}`}>
                                  <Edit className="h-3 w-3 mr-1" />
                                  Editar
                                </Link>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma rotina criada para este programa
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    asChild
                    disabled={!training.program}
                  >
                    <Link href={`/trainer/${trainerId}/programs/${training.program || training.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    asChild
                    disabled={!training.program}
                  >
                    <Link href={`/trainer/${trainerId}/programs/${training.program || training.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
