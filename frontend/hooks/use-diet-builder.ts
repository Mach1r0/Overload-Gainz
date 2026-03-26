"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authApi } from "@/lib/api/auth"
import { fetchTeacherStudents } from "@/lib/api/trainer-students"
import { createDietPlan } from "@/lib/api/diets"
import { useToast } from "@/hooks/use-toast"

export interface Meal {
  id: string
  name: string
  time: string
  type: string
  foods: Food[]
}

export interface Food {
  id: string
  name: string
  quantity: string
  unit: string
  calories: string
  protein: string
  carbs: string
  fat: string
}

export interface DietStudent {
  id: number
  student_id: number
  student_name: string
  student_user_id: number
  is_active: boolean
}

const mapCategoryToGoal = (category: string): "BUK" | "CUT" | "MAINT" => {
  const mapping: Record<string, "BUK" | "CUT" | "MAINT"> = {
    hipertrofia: "BUK",
    emagrecimento: "CUT",
    manutencao: "MAINT",
    lowcarb: "CUT",
    vegetariana: "MAINT",
  }
  return mapping[category] || "MAINT"
}

const mapUnit = (unit: string): string => {
  const mapping: Record<string, string> = { 
    g: "g",
    ml: "ml",
    un: "unit",
    col: "cup",
    xic: "cup",
  }
  return mapping[unit] || unit
}

export function useDietBuilder() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [userId, setUserId] = useState<string | null>(null)
  const [dietName, setDietName] = useState("")
  const [category, setCategory] = useState("")
  const [targetCalories, setTargetCalories] = useState("")
  const [description, setDescription] = useState("")
  const [studentId, setStudentId] = useState("")
  const [students, setStudents] = useState<DietStudent[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [saving, setSaving] = useState(false)
  const [meals, setMeals] = useState<Meal[]>([
    {
      id: "1",
      name: "Café da Manhã",
      time: "07:00",
      type: "breakfast",
      foods: [
        { id: "1", name: "", quantity: "", unit: "g", calories: "", protein: "", carbs: "", fat: "" },
      ],
    },
  ])

  // Load current user
  useEffect(() => {
    const user = authApi.getUserFromStorage()
    if (user) {
      setUserId(user.id.toString())
    }
  }, [])

  // Apply preset student from URL
  useEffect(() => {
    const preset = searchParams?.get("student")
    if (preset) {
      setStudentId(preset)
    }
  }, [searchParams])

  // Fetch students for the authenticated teacher
  useEffect(() => {
    const fetchStudents = async () => {
      if (!userId) return

      try {
        setLoadingStudents(true)
        const studentsData = await fetchTeacherStudents()
        setStudents(studentsData)
        const presetStudentId = searchParams?.get("student")
        if (presetStudentId) {
          const match = studentsData.find((s) => String(s.student_id) === String(presetStudentId))
          if (match) setStudentId(String(match.student_user_id))
        }
      } catch (error) {
        console.error("Error fetching students:", error)
        toast({
          title: "Erro ao carregar alunos",
          description: "Não foi possível carregar a lista de alunos",
          variant: "destructive",
        })
      } finally {
        setLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [userId, toast, searchParams])

  const addMeal = () => {
    const newMeal: Meal = {
      id: Date.now().toString(),
      name: "",
      time: "",
      type: "other",
      foods: [
        {
          id: Date.now().toString(),
          name: "",
          quantity: "",
          unit: "g",
          calories: "",
          protein: "",
          carbs: "",
          fat: "",
        },
      ],
    }
    setMeals((prev) => [...prev, newMeal])
  }

  const removeMeal = (mealId: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== mealId))
  }

  const updateMeal = (mealId: string, field: keyof Meal, value: string) => {
    setMeals((prev) => prev.map((m) => (m.id === mealId ? { ...m, [field]: value } : m)))
  }

  const addFood = (mealId: string) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId
          ? {
              ...m,
              foods: [
                ...m.foods,
                {
                  id: Date.now().toString(),
                  name: "",
                  quantity: "",
                  unit: "g",
                  calories: "",
                  protein: "",
                  carbs: "",
                  fat: "",
                },
              ],
            }
          : m,
      ),
    )
  }

  const removeFood = (mealId: string, foodId: string) => {
    setMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, foods: m.foods.filter((f) => f.id !== foodId) } : m)),
    )
  }

  const updateFood = (mealId: string, foodId: string, field: keyof Food, value: string) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId
          ? { ...m, foods: m.foods.map((f) => (f.id === foodId ? { ...f, [field]: value } : f)) }
          : m,
      ),
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      if (!dietName.trim()) {
        toast({ title: "Erro", description: "Nome da dieta é obrigatório", variant: "destructive" })
        setSaving(false)
        return
      }

      if (!category) {
        toast({ title: "Erro", description: "Selecione uma categoria", variant: "destructive" })
        setSaving(false)
        return
      }

      if (!studentId) {
        toast({ title: "Erro", description: "Selecione um aluno", variant: "destructive" })
        setSaving(false)
        return
      }

      const today = new Date()
      const startDate = today.toISOString().split("T")[0]
      const endDate = new Date(today.setMonth(today.getMonth() + 3)).toISOString().split("T")[0]

      const dietData = {
        student_id: parseInt(studentId, 10),
        name: dietName,
        goal: mapCategoryToGoal(category),
        description: description || undefined,
        target_calories: targetCalories ? parseInt(targetCalories, 10) : undefined,
        start_date: startDate,
        end_date: endDate,
        meals: meals
          .filter((meal) => meal.name.trim() && meal.time)
          .map((meal) => ({
            name: meal.name,
            time: `${meal.time}:00`,
            description: meal.name,
            options_type: meal.type || "other",
            foods: meal.foods
              .filter((food) => food.name.trim() && food.quantity)
              .map((food) => ({
                name: food.name,
                quantity: parseFloat(food.quantity) || 0,
                unit: mapUnit(food.unit),
                calories: parseInt(food.calories || "0", 10),
                protein: parseFloat(food.protein) || 0,
                carbs: parseFloat(food.carbs) || 0,
                fat: parseFloat(food.fat) || 0,
              })),
          })),
      }

      await createDietPlan(dietData)

      toast({ title: "Sucesso!", description: "Dieta criada com sucesso" })

      const fromStudent = searchParams?.get("student")
      const redirectTo = fromStudent ? `/trainer/${userId}/students/${fromStudent}` : `/trainer/${userId}/diets`
      router.push(redirectTo)
    } catch (error: any) {
      console.error("Error saving diet:", error)
      toast({
        title: "Erro ao salvar dieta",
        description: error.response?.data?.detail || error.response?.data?.message || error.message || "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return {
    // ids
    userId,
    // form state
    dietName,
    setDietName,
    category,
    setCategory,
    targetCalories,
    setTargetCalories,
    description,
    setDescription,
    studentId,
    setStudentId,
    students,
    loadingStudents,
    // meals state
    meals,
    addMeal,
    removeMeal,
    updateMeal,
    addFood,
    removeFood,
    updateFood,
    // status
    saving,
    handleSave,
  }
}
