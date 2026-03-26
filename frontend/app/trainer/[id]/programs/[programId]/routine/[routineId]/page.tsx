"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { ExerciseCard } from "@/components/routine-editor/exercise-card"
import { ExerciseLibrarySidebar } from "@/components/routine-editor/exercise-library-sidebar"
import { ExerciseDetailsModal } from "@/components/exercise-details-modal"
import { useRoutineEditor } from "@/hooks/use-routine-editor"

export default function RoutineEditorPage({
  params,
}: {
  params: Promise<{ id: string; programId: string; routineId: string }>
}) {
  const { id, programId, routineId } = use(params)
  const router = useRouter()
  const [selectedExerciseForDetails, setSelectedExerciseForDetails] = useState<any>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const {
    routineTitle,
    setRoutineTitle,
    routineNote,
    setRoutineNote,
    exercises,
    loading,
    saving,
    setSaving,
    exerciseLibrary,
    isLibraryOpen,
    setIsLibraryOpen,
    exerciseSearch,
    setExerciseSearch,
    filterEquipment,
    setFilterEquipment,
    filterMuscle,
    setFilterMuscle,
    selectedExerciseSlotId,
    setSelectedExerciseSlotId,
    showAutocomplete,
    setShowAutocomplete,
    exerciseRefs,
    addExercise,
    removeExercise,
    updateExerciseName,
    updateExerciseNotes,
    selectExistingExercise,
    addSeries,
    updateSeriesField,
    removeSeries,
    toggleRepsRange,
    getTotalExercises,
    getTotalSets,
    saveRoutine,
  } = useRoutineEditor(routineId, programId)

  const handleSave = async () => {
    try {
      await saveRoutine()
      alert("Rotina salva com sucesso!")
      router.push(`/trainer/${id}/programs/${programId}/edit`)
    } catch (error) {
      console.error("Error saving routine:", error)
      alert("Erro ao salvar rotina")
    }
  }

  const handleShowExerciseDetails = (exercise: any) => {
    setSelectedExerciseForDetails(exercise)
    setIsDetailsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 text-center">Carregando rotina...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/trainer/${id}/programs/${programId}/edit`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <p className="text-sm text-muted-foreground">Meus Programas / Untitled Program</p>
              <h1 className="text-2xl font-bold">Editar Rotina</h1>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">Todas as alterações salvas</span>
        </div>
      </header>

      {/* Resumo em bloco separado */}
      <div className="px-6 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total de Exercícios</p>
            <p className="text-2xl font-semibold">{getTotalExercises()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total de Séries</p>
            <p className="text-2xl font-semibold">{getTotalSets()}</p>
          </Card>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="px-6 pb-12 pt-6 space-y-6">
          {/* Informações da Rotina */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="routine-title" className="text-sm font-medium">Título da Rotina</Label>
                <Input
                  id="routine-title"
                  value={routineTitle}
                  onChange={(e) => setRoutineTitle(e.target.value)}
                  placeholder="Ex: Treino A - Peito e Tríceps"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="routine-note" className="text-sm font-medium">Nota da Rotina</Label>
                <Textarea
                  id="routine-note"
                  value={routineNote}
                  onChange={(e) => setRoutineNote(e.target.value)}
                  placeholder="Adicione uma breve descrição da rotina"
                  rows={3}
                  className="bg-muted/50 resize-none"
                />
              </div>
             
            </div>
          </Card>

          <div className="space-y-4">
            {exercises.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Sem Exercícios</h3>
                  <p className="text-muted-foreground mb-4">
                    Até agora, você não adicionou nenhum exercício a esta rotina.
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

          {/* Ações */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none sm:px-6">
              {saving ? "Salvando..." : "Salvar Rotina"}
            </Button>
            <Button variant="outline" asChild className="flex-1 sm:flex-none sm:px-6">
              <Link href={`/trainer/${id}/programs/${programId}/edit`}>Cancelar</Link>
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
        onSelectExercise={selectExistingExercise}
      />

      <ExerciseDetailsModal
        exercise={selectedExerciseForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </div>
  )
}
