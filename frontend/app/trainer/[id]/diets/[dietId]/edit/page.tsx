"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useDietEditor } from "@/hooks/use-diet-editor"
import { DietInfoForm } from "@/components/diet-info-form"
import { StudentInfoCard } from "@/components/student-info-card"
import { MealGroupEditor } from "@/components/meal-group-editor"

export default function EditDietPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dietId = params?.dietId as string
  const userId = params?.id as string
  const studentIdFromUrl = searchParams.get('student')

  const {
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
    studentName,
    studentId,
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
  } = useDietEditor(dietId)

  const onSave = async () => {
    try {
      await handleSave()
      alert('Dieta atualizada com sucesso!')
      if (studentIdFromUrl) {
        router.push(`/trainer/${userId}/students/${studentIdFromUrl}`)
      } else {
        router.push(`/trainer/${userId}/diets/${dietId}`)
      }
    } catch (error: any) {
      alert('Erro ao salvar dieta: ' + (error.response?.data?.detail || error.message))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Carregando dieta...</div>
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
                <Link href={studentIdFromUrl ? `/trainer/${userId}/students/${studentIdFromUrl}` : `/trainer/${userId}/diets/${dietId}`}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Editar Dieta</h1>
                <p className="text-sm text-muted-foreground">Atualize as informações da dieta</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={studentIdFromUrl ? `/trainer/${userId}/students/${studentIdFromUrl}` : `/trainer/${userId}/diets/${dietId}`}>Cancelar</Link>
              </Button>
              <Button onClick={onSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <DietInfoForm
          dietName={dietName}
          setDietName={setDietName}
          goal={goal}
          setGoal={setGoal}
          targetCalories={targetCalories}
          setTargetCalories={setTargetCalories}
          initialTargetCalories={initialTargetCalories}
          description={description}
          setDescription={setDescription}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />

        <StudentInfoCard
          studentName={studentName}
          studentId={studentId}
          students={students}
          loadingStudents={loadingStudents}
          onStudentChange={handleStudentChange}
        />

        <MealGroupEditor
          meals={meals}
          onAddMeal={addMeal}
          onRemoveMeal={removeMeal}
          onUpdateMeal={updateMeal}
          onAddFood={addFood}
          onRemoveFood={removeFood}
          onUpdateFood={updateFood}
        />
      </div>
    </div>
  )
}

