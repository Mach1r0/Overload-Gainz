"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronDown } from "lucide-react"
import { ExerciseLibraryItem } from "@/lib/api/routines"

interface ExerciseLibrarySidebarProps {
  isOpen: boolean
  onClose: () => void
  exerciseLibrary: ExerciseLibraryItem[]
  selectedExerciseSlotId: string | null
  searchQuery: string
  onSearchChange: (value: string) => void
  filterEquipment: string
  onFilterEquipmentChange: (value: string) => void
  filterMuscle: string
  onFilterMuscleChange: (value: string) => void
  onSelectExercise: (exercise: ExerciseLibraryItem) => void
}

export function ExerciseLibrarySidebar({
  isOpen,
  onClose,
  exerciseLibrary,
  selectedExerciseSlotId,
  searchQuery,
  onSearchChange,
  filterEquipment,
  onFilterEquipmentChange,
  filterMuscle,
  onFilterMuscleChange,
  onSelectExercise
}: ExerciseLibrarySidebarProps) {
  if (!isOpen) return null

  const equipmentOptions = Array.from(new Set(exerciseLibrary.map((ex) => ex.equipment).filter(Boolean)))
  const muscleOptions = Array.from(
    new Set(
      exerciseLibrary.flatMap((ex) => 
        ex.primary_muscles_list || ex.primaryMuscles || [ex.muscle_group].filter(Boolean)
      ).filter(Boolean)
    )
  )

  const filteredLibrary = exerciseLibrary.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEquipment = !filterEquipment || ex.equipment === filterEquipment
    const primaryMuscles = ex.primary_muscles_list || ex.primaryMuscles || [ex.muscle_group].filter(Boolean)
    const matchesMuscle =
      !filterMuscle ||
      ex.muscle_group === filterMuscle ||
      primaryMuscles.includes(filterMuscle)
    return matchesSearch && matchesEquipment && matchesMuscle
  })

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-md bg-card border border-border rounded-lg shadow-2xl z-50">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">Biblioteca de Exercícios</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded transition-colors"
          aria-label="Fechar biblioteca"
        >
          <ChevronDown className="h-4 w-4 rotate-180" />
        </button>
      </div>
      <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
        {selectedExerciseSlotId && (
          <div className="p-2 bg-primary/10 border border-primary/20 rounded text-xs text-foreground">
            ✓ Clique em um exercício para adicionar
          </div>
        )}
        <div className="space-y-2">
          <Select value={filterEquipment || "all"} onValueChange={(v) => onFilterEquipmentChange(v === "all" ? "" : v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Equipamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Equipamentos</SelectItem>
              {equipmentOptions.map((eq) => (
                <SelectItem key={eq} value={eq}>
                  {eq}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterMuscle || "all"} onValueChange={(v) => onFilterMuscleChange(v === "all" ? "" : v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Grupo Muscular" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Músculos</SelectItem>
              {muscleOptions.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="pl-8 h-8 text-sm"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {filteredLibrary.length === 0 ? (
          <div className="px-1 py-6 text-center text-xs text-muted-foreground">Nenhum exercício encontrado</div>
        ) : (
          <div className="divide-y divide-border">
            {filteredLibrary.map((ex) => (
              <button
                key={ex.id}
                onClick={() => onSelectExercise(ex)}
                className="w-full px-3 py-2 text-left hover:bg-accent/50 transition-colors"
              >
                <p className="font-medium text-sm text-foreground">{ex.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {ex.equipment && (
                    <Badge variant="outline" className="text-xs">
                      {ex.equipment}
                    </Badge>
                  )}
                  {(ex.primary_muscles_list || ex.primaryMuscles || [ex.muscle_group].filter(Boolean))
                    .map((muscle: string, idx: number) => (
                      <Badge key={`${muscle}-${idx}`} variant="secondary" className="text-xs">
                        {muscle}
                      </Badge>
                    ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
