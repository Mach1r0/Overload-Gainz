"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Dumbbell, Edit, User } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import Link from "next/link"

interface Training {
  id: number
  name: string
  goal: "STR" | "HYP" | "END" | "WL" | "GEN"
  description: string
  start_date: string
  end_date: string
  is_active: boolean
  program_name?: string
  workouts: Array<{
    id: number
    name: string
    day_of_week: string
    exercises: any[]
  }>
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
  WL: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  GEN: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
}

const dayOfWeekLabels: Record<string, string> = {
  '0': 'Domingo',
  '1': 'Segunda',
  '2': 'Terça',
  '3': 'Quarta',
  '4': 'Quinta',
  '5': 'Sexta',
  '6': 'Sábado',
}

export default function ProgramDetailPage() {
  const params = useParams()
  const router = useRouter()
  const trainerId = params.id as string
  const programId = params.programId as string
  
  const [training, setTraining] = useState<Training | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get(`/training/trainings/${programId}/`)
        console.log('Training details:', response.data)
        setTraining(response.data)
      } catch (error: any) {
        console.error('Error fetching training:', error)
        setError(error.response?.data?.error || 'Erro ao carregar detalhes do programa')
      } finally {
        setLoading(false)
      }
    }

    if (programId) {
      fetchTraining()
    }
  }, [programId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-8">Carregando...</div>
        </main>
      </div>
    )
  }

  if (error || !training) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">{error || 'Programa não encontrado'}</p>
              <Button onClick={() => router.back()} className="mt-4">
                Voltar
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button asChild>
              <Link href={`/trainer/${trainerId}/programs/${programId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Programa
              </Link>
            </Button>
          </div>

          {/* Program Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">{training.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 flex-wrap mt-3">
                    <Badge className={goalColors[training.goal]}>
                      {goalLabels[training.goal]}
                    </Badge>
                    {training.is_active && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                    )}
                    {training.program_name && (
                      <Badge variant="outline">
                        Programa: {training.program_name}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {training.description && (
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-muted-foreground">{training.description}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Início: {new Date(training.start_date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  <span>{training.workouts?.length || 0} treino(s)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workouts */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Treinos</h2>
            {training.workouts && training.workouts.length > 0 ? (
              <div className="grid gap-4">
                {training.workouts.map((workout) => (
                  <Card key={workout.id}>
                    <CardHeader>
                      <CardTitle className="text-xl">{workout.name}</CardTitle>
                      <CardDescription>
                        {dayOfWeekLabels[workout.day_of_week] || workout.day_of_week}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {workout.exercises && workout.exercises.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">{workout.exercises.length} exercício(s)</p>
                          <div className="space-y-2">
                            {workout.exercises.map((exercise: any, idx: number) => (
                              <div
                                key={exercise.id || idx}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{exercise.exercise?.name || exercise.name || 'Exercício'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {exercise.sets} séries × {exercise.reps} repetições
                                  </p>
                                  {exercise.notes && (
                                    <p className="text-sm text-muted-foreground italic mt-1">
                                      {exercise.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Nenhum exercício adicionado</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum treino criado para este programa</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
