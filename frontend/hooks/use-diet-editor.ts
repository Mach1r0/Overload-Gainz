import { useState, useEffect } from "react"
import { getDietPlan, updateDietPlan } from "@/lib/api/diets"
import { getTeacherStudents } from "@/lib/api/teachers"

interface Meal {
  id: string | number
  name: string
  time: string
  description?: string
  options_type?: string
  foods: Food[]
}

interface Food {
  id: string | number
  name: string
  quantity: string
  unit: string
  calories: string
  protein: string
  carbs: string
  fat: string
}

export function useDietEditor(dietId: string) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dietName, setDietName] = useState("")
  const [goal, setGoal] = useState<"BUK" | "CUT" | "MAINT">("MAINT")
  const [targetCalories, setTargetCalories] = useState("")
  const [initialTargetCalories, setInitialTargetCalories] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [meals, setMeals] = useState<Meal[]>([])
  const [studentId, setStudentId] = useState<number>(0)
  const [studentName, setStudentName] = useState<string>("")
  const [students, setStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  useEffect(() => {
    if (dietId) {
      fetchDiet()
    }
  }, [dietId])

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchDiet = async () => {
    try {
      setLoading(true)
      const diet = await getDietPlan(dietId)
      
      setDietName(diet.name)
      setGoal(diet.goal)
      const caloriesString = diet.target_calories?.toString() || ""
      setTargetCalories(caloriesString)
      setInitialTargetCalories(caloriesString)
      setDescription(diet.description || "")
      
      // Format dates for HTML date input (YYYY-MM-DD)
      if (diet.start_date) {
        const startDateObj = new Date(diet.start_date)
        setStartDate(startDateObj.toISOString().split('T')[0])
      }
      if (diet.end_date) {
        const endDateObj = new Date(diet.end_date)
        setEndDate(endDateObj.toISOString().split('T')[0])
      }
      
      setStudentId(diet.student?.id || diet.student)
      setStudentName(diet.student_name || `${diet.student?.first_name || ''} ${diet.student?.last_name || ''}`.trim())
      
      const transformedMeals = diet.meals?.map((meal: any) => ({
        id: meal.id,
        name: meal.name,
        time: meal.time,
        description: meal.description || "",
        options_type: meal.options_type || "other",
        foods: meal.food_items?.map((item: any) => ({
          id: item.id,
          name: item.food_item?.name || item.name || "",
          quantity: item.quantity?.toString() || "",
          unit: item.unit || "g",
          calories: item.food_item?.calories?.toString() || item.calories?.toString() || "",
          protein: item.food_item?.protein?.toString() || item.protein?.toString() || "",
          carbs: item.food_item?.carbs?.toString() || item.carbs?.toString() || "",
          fat: item.food_item?.fats?.toString() || item.fats?.toString() || "",
        })) || []
      })) || []
      
      setMeals(transformedMeals)
    } catch (error) {
      console.error('Error fetching diet:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)
      const studentsList = await getTeacherStudents()
      setStudents(studentsList)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const mealsData = meals.map((meal) => ({
        name: meal.name,
        time: meal.time,
        description: meal.description || "",
        options_type: meal.options_type || "other",
        foods: meal.foods.map((food) => ({
          name: food.name,
          quantity: parseFloat(food.quantity) || 0,
          unit: food.unit,
          calories: parseInt(food.calories) || 0,
          protein: parseFloat(food.protein) || 0,
          carbs: parseFloat(food.carbs) || 0,
          fat: parseFloat(food.fat) || 0,
        }))
      }))

      const dietData = {
        student_id: studentId,
        name: dietName,
        goal: goal,
        description: description,
        target_calories: targetCalories ? parseInt(targetCalories) : undefined,
        start_date: startDate,
        end_date: endDate,
        meals: mealsData
      }

      await updateDietPlan(dietId, dietData)
      return true
    } catch (error: any) {
      console.error('Error saving diet:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const addMeal = () => {
    const newMeal: Meal = {
      id: Date.now().toString(),
      name: "",
      time: "",
      options_type: "other",
      foods: [
        { id: Date.now().toString(), name: "", quantity: "", unit: "g", calories: "", protein: "", carbs: "", fat: "" },
      ],
    }
    setMeals([...meals, newMeal])
  }

  const removeMeal = (mealId: string | number) => {
    setMeals(meals.filter((m) => m.id !== mealId))
  }

  const updateMeal = (mealId: string | number, field: keyof Meal, value: string) => {
    setMeals(meals.map((m) => (m.id === mealId ? { ...m, [field]: value } : m)))
  }

  const addFood = (mealId: string | number) => {
    setMeals(
      meals.map((m) =>
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

  const removeFood = (mealId: string | number, foodId: string | number) => {
    setMeals(meals.map((m) => (m.id === mealId ? { ...m, foods: m.foods.filter((f) => f.id !== foodId) } : m)))
  }

  const updateFood = (mealId: string | number, foodId: string | number, field: keyof Food, value: string) => {
    setMeals(
      meals.map((m) =>
        m.id === mealId ? { ...m, foods: m.foods.map((f) => (f.id === foodId ? { ...f, [field]: value } : f)) } : m,
      ),
    )
  }

  const handleStudentChange = (newStudentUserId: string) => {
    const selectedStudent = students.find(s => s.student_user_id?.toString() === newStudentUserId)
    if (selectedStudent) {
      setStudentId(selectedStudent.student_id)
      setStudentName(selectedStudent.student_name)
    }
  }

  return {
    loading,
    saving,
    dietName,
    setDietName,
    goal,
    setGoal,
    targetCalories,
    setTargetCalories,
    initialTargetCalories,
    description,
    setDescription,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    meals,
    studentId,
    studentName,
    students,
    loadingStudents,
    handleSave,
    addMeal,
    removeMeal,
    updateMeal,
    addFood,
    removeFood,
    updateFood,
    handleStudentChange,
  }
}
