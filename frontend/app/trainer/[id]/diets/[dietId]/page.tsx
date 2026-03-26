"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Users, Calendar, Target, ChevronDown, ChevronUp, Coffee, Utensils, Moon, Apple, Cookie } from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { authApi } from "@/lib/api/auth"
import { getDietPlan } from "@/lib/api/diets"

const goalLabels = {
  BUK: "Bulking",
  CUT: "Cutting",
  MAINT: "Manutenção",
}

const goalColors = {
  BUK: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CUT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  MAINT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
}

const mealTypeLabels: Record<string, string> = {
  breakfast: "Café da Manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
  cheat: "Refeição Livre",
  other: "Outro",
}

const mealTypeIcons: Record<string, any> = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: Moon,
  snack: Apple,
  cheat: Cookie,
  other: Utensils,
}

const mealTypeColors: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
  lunch: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200",
  dinner: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200",
  snack: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200",
  cheat: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200",
}

const optionStyles = [
  {
    container: "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700",
    badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-700",
  },
  {
    container: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-700",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700",
  },
  {
    container: "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-700",
    badge: "bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100 border-green-200 dark:border-green-700",
  },
  {
    container: "bg-pink-50 dark:bg-pink-900/10 border-pink-200 dark:border-pink-700",
    badge: "bg-pink-100 dark:bg-pink-900/40 text-pink-900 dark:text-pink-100 border-pink-200 dark:border-pink-700",
  },
]

export default function DietDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const dietId = params?.dietId as string
  const userId = params?.id as string
  const studentId = searchParams.get('student')
  
  const [loading, setLoading] = useState(true)
  const [diet, setDiet] = useState<any>(null)
  const [expandedMeals, setExpandedMeals] = useState<Record<number, boolean>>({})

  const toggleMeal = (mealId: number) => {
    setExpandedMeals(prev => ({
      ...prev,
      [mealId]: !prev[mealId]
    }))
  }

  useEffect(() => {
    if (dietId) {
      fetchDiet()
    }
  }, [dietId])

  const fetchDiet = async () => {
    try {
      setLoading(true)
      const dietData = await getDietPlan(dietId)
      console.log('Diet data:', dietData)
      setDiet(dietData)
    } catch (error) {
      console.error('Error fetching diet:', error)
      alert('Erro ao carregar dieta')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Carregando dieta...</div>
      </div>
    )
  }

  if (!diet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Dieta não encontrada</div>
      </div>
    )
  }

  const totalCalories = diet.meals?.reduce((total: number, meal: any) => {
    const mealCalories = meal.food_items?.reduce((mealTotal: number, item: any) => {
      return mealTotal + (item.food_item?.calories || 0) * (item.quantity / 100)
    }, 0) || 0
    return total + mealCalories
  }, 0) || 0
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href={studentId ? `/trainer/${userId}/students/${studentId}` : `/trainer/${userId}/diets`}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">{diet.name}</h1>
                  <Badge className={goalColors[diet.goal as keyof typeof goalColors]}>
                    {goalLabels[diet.goal as keyof typeof goalLabels]}
                  </Badge>
                  {diet.is_active && <Badge>Ativa</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {diet.student?.first_name} {diet.student?.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={`/trainer/${userId}/diets/${dietId}/edit${studentId ? `?student=${studentId}` : ''}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </Button>
              <Button variant="outline">
                <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Link href={`/trainer/${userId}/students/${diet.student?.id}`}>
          <Card className="p-6 bg-card border-border mb-6 hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Aluno (clique para ver perfil)</p>
                <p className="text-xl font-bold text-foreground">
                  {diet.student?.first_name} {diet.student?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">@{diet.student?.username}</p>
              </div>
            </div>
          </Card>
        </Link>

        <Card className="p-6 bg-card border-border mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Informações Gerais</h2>
          
          {diet.description && (
            <p className="text-muted-foreground mb-4">{diet.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {diet.target_calories || totalCalories.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">kcal/dia</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {new Date(diet.start_date).toLocaleDateString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">Data de início</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {new Date(diet.end_date).toLocaleDateString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">Data de termino</p>
              </div>
            </div>


            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{diet.meals?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Refeições</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Meals grouped by type */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Refeições</h2>
          
          {Object.entries(
            diet.meals?.reduce((groups: Record<string, any[]>, meal: any) => {
              const type = meal.options_type || 'other'
              if (!groups[type]) groups[type] = []
              groups[type].push(meal)
              return groups
            }, {}) || {}
          ).map(([mealType, meals]: [string, any[]]) => {
            const isExpanded = expandedMeals[mealType] ?? true
            const MealIcon = mealTypeIcons[mealType]
            const totalCalories = meals.reduce((total, meal) => {
              return total + (meal.food_items?.reduce((mealTotal: number, item: any) => {
                return mealTotal + ((item.food_item?.calories || 0) * (item.quantity / 100))
              }, 0) || 0)
            }, 0)
            
            return (
              <Card key={mealType} className="overflow-hidden bg-card border-border">
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleMeal(mealType as any)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${mealTypeColors[mealType].split(' ').slice(0, 2).join(' ')}`}>
                        <MealIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{mealTypeLabels[mealType]}</h3>
                          <Badge variant="outline" className={mealTypeColors[mealType]}>
                            {meals.length} {meals.length === 1 ? 'opção' : 'opções'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {totalCalories.toFixed(0)} kcal (total)
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
                    {meals.map((meal, optionIndex) => {
                      const optionStyle = optionStyles[optionIndex % optionStyles.length]
                      const mealCalories = meal.food_items?.reduce((total: number, item: any) => {
                        return total + ((item.food_item?.calories || 0) * (item.quantity / 100))
                      }, 0) || 0
                      
                      return (
                        <div key={meal.id} className={`border rounded-lg p-4 ${optionStyle.container}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-foreground">{meal.name}</h4>
                                <Badge variant="secondary" className={`text-xs border ${optionStyle.badge}`}>
                                  Opção {optionIndex + 1}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {meal.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {mealCalories.toFixed(0)} kcal
                                </span>
                                <span>{meal.food_items?.length || 0} alimentos</span>
                              </div>
                              {meal.description && (
                                <p className="text-sm text-muted-foreground italic mt-2">{meal.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            {meal.food_items?.map((item: any) => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                <div>
                                  <p className="font-medium text-foreground">{item.food_item?.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.quantity}{item.unit}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-foreground">
                                    {((item.food_item?.calories || 0) * (item.quantity / 100)).toFixed(0)} kcal
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    P: {((item.food_item?.protein || 0) * (item.quantity / 100)).toFixed(1)}g • 
                                    C: {((item.food_item?.carbs || 0) * (item.quantity / 100)).toFixed(1)}g • 
                                    G: {((item.food_item?.fats || 0) * (item.quantity / 100)).toFixed(1)}g
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
