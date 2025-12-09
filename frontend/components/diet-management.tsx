"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Target, Edit, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DietForm } from "@/components/diet-form"
import { DietDetails } from "@/components/diet-details"
import Link from "next/link"
import { authApi } from "@/lib/api/auth"
import { getStudentDietPlans } from "@/lib/api/diets"

interface DietPlan {
  id: number
  name: string
  goal: "BUK" | "CUT" | "MAINT"
  start_date: string
  end_date: string
  is_active: boolean
  meals_count: number
}

const goalLabels = {
  BUK: "Bulking",
  CUT: "Cutting",
  MAINT: "Manutenção",
}

const goalColors = {
  BUK: "bg-green-100 text-green-800",
  CUT: "bg-red-100 text-red-800",
  MAINT: "bg-blue-100 text-blue-800",
}

export function DietManagement({ studentId, userId }: { studentId: string; userId: string }) {
  const [diets, setDiets] = useState<DietPlan[]>([])
const [loading, setLoading] = useState(true)
  const [selectedDiet, setSelectedDiet] = useState<DietPlan | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const user = authApi.getUserFromStorage()

  useEffect(() => {
    const fetchDiets = async () => {
      try {
        setLoading(true)
        const dietsData = await getStudentDietPlans(userId)
        const dietsWithCount = dietsData.map((diet: any) => ({
          ...diet,
          meals_count: diet.meals?.length || 0,
        }))
        setDiets(dietsWithCount)
      } catch (error) {
        console.error('Error fetching diets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDiets()
  }, [userId])

  const handleEdit = (diet: DietPlan) => {
    setSelectedDiet(diet)
    setIsEditOpen(true)
  }

  const handleView = (diet: DietPlan) => {
    setSelectedDiet(diet)
    setIsViewOpen(true)
  }

  if (loading) {
    return <div className="text-center py-8">Carregando dietas...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planos de Dieta</h2>
          <p className="text-muted-foreground">Gerencie as dietas do aluno</p>
        </div>
        {user && (
          <Button asChild className="flex items-center gap-2">
            <Link href={`/trainer/${user.id}/diets/new?student=${studentId}`}>
              <Plus className="h-4 w-4" />
              Nova Dieta
            </Link>
          </Button>
        )}
      </div>

      {diets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma dieta criada ainda</p>
            <Button onClick={() => setIsCreateOpen(true)}>Criar Primeira Dieta</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {diets.map((diet) => (
            <Card key={diet.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{diet.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge className={goalColors[diet.goal]}>{goalLabels[diet.goal]}</Badge>
                      {diet.is_active && <Badge variant="default">Ativa</Badge>}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(diet.start_date).toLocaleDateString("pt-BR")} -{" "}
                      {new Date(diet.end_date).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>{diet.meals_count} refeições</span>
                </div>

                <div className="flex gap-2">
                  {user && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        asChild
                      >
                        <Link href={`/trainer/${user.id}/diets/${diet.id}?student=${studentId}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        asChild
                      >
                        <Link href={`/trainer/${user.id}/diets/${diet.id}/edit?student=${studentId}`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Dieta</DialogTitle>
          </DialogHeader>
          {selectedDiet && (
            <DietForm studentId={studentId} diet={selectedDiet} onSuccess={() => setIsEditOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Dieta</DialogTitle>
          </DialogHeader>
          {selectedDiet && <DietDetails dietId={selectedDiet.id} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
