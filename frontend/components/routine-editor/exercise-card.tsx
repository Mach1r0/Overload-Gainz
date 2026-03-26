"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Trash2, Plus } from "lucide-react"
import { ExerciseLibraryItem } from "@/lib/api/routines"

interface ExerciseSeries {
  id: string
  reps: string
  repsMin?: string
  repsMax?: string
  useRepsRange?: boolean
  rest: string
  notes?: string
}

interface Exercise {
  id: string
  name: string
  notes?: string
  series: ExerciseSeries[]
  exerciseId?: number
  equipment?: string
  primaryMuscles?: string[]
  image?: string | null
  video_url?: string | null
}

interface ExerciseCardProps {
  exercise: Exercise
  exerciseIndex: number
  exerciseLibrary: ExerciseLibraryItem[]
  selectedExerciseSlotId: string | null
  showAutocomplete: boolean
  onUpdateName: (id: string, value: string) => void
  onUpdateNotes: (id: string, value: string) => void
  onRemove: (id: string) => void
  onSelectExercise: (exerciseId: string, libraryExercise: ExerciseLibraryItem) => void
  onAddSeries: (exerciseId: string) => void
  onUpdateSeries: (exerciseId: string, seriesId: string, field: keyof ExerciseSeries, value: string) => void
  onRemoveSeries: (exerciseId: string, seriesId: string) => void
  onToggleRepsRange: (exerciseId: string, seriesId: string) => void
  onFocus: (id: string) => void
  onBlur: () => void
  onShowDetails: (exercise: Exercise) => void
  cardRef: (el: HTMLDivElement | null) => void
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  exerciseLibrary,
  selectedExerciseSlotId,
  showAutocomplete,
  onUpdateName,
  onUpdateNotes,
  onRemove,
  onSelectExercise,
  onAddSeries,
  onUpdateSeries,
  onRemoveSeries,
  onToggleRepsRange,
  onFocus,
  onBlur,
  onShowDetails,
  cardRef
}: ExerciseCardProps) {
  return (
    <div ref={cardRef} className="p-4 bg-card/50 border border-border/50 rounded-lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3 relative">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move flex-shrink-0" />
          {exercise.image || exercise.video_url ? (
            <button
              onClick={() => onShowDetails(exercise)}
              className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 hover:ring-2 hover:ring-primary transition-all cursor-pointer"
            >
              {exercise.image ? (
                <img 
                  src={exercise.image} 
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="flex items-center justify-center w-full h-full text-primary text-sm font-semibold">${exerciseIndex + 1}</span>`;
                    }
                  }}
                />
              ) : exercise.video_url ? (
                <video 
                  src={exercise.video_url} 
                  className="w-full h-full object-cover"
                  muted
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="flex items-center justify-center w-full h-full text-primary text-sm font-semibold">${exerciseIndex + 1}</span>`;
                    }
                  }}
                />
              ) : null}
            </button>
          ) : (
            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 text-primary text-sm font-semibold flex-shrink-0">
              {exerciseIndex + 1}
            </span>
          )}
          <div className="flex-1 relative">
            <Input
              value={exercise.name}
              onChange={(e) => {
                onUpdateName(exercise.id, e.target.value)
                onFocus(exercise.id)
              }}
              onFocus={() => onFocus(exercise.id)}
              onBlur={() => setTimeout(() => onBlur(), 200)}
              placeholder="Selecione ou digite o nome"
              className={`font-semibold bg-muted/50 ${selectedExerciseSlotId === exercise.id && showAutocomplete ? "ring-2 ring-primary" : ""}`}
            />

            {selectedExerciseSlotId === exercise.id && showAutocomplete && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                {(() => {
                  const searchTerm = exercise.name.toLowerCase().trim()
                  const matches = exerciseLibrary
                    .filter((ex) => searchTerm === "" || ex.name.toLowerCase().includes(searchTerm))
                    .slice(0, 10)
                  
                  if (matches.length === 0) {
                    return (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                        Nenhum exercício encontrado
                      </div>
                    )
                  }
                  
                  return matches.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => onSelectExercise(exercise.id, ex)}
                      className="w-full px-3 py-2 text-left hover:bg-accent/50 transition-colors border-b border-border/30 text-sm"
                    >
                      <p className="font-medium text-foreground">{ex.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ex.equipment && (
                          <Badge variant="outline" className="text-xs">
                            {ex.equipment}
                          </Badge>
                        )}
                        {(ex.primary_muscles_list || ex.primaryMuscles || [ex.muscle_group].filter(Boolean))
                          .slice(0, 2)
                          .map((muscle: string, idx: number) => (
                            <Badge key={`${muscle}-${idx}`} variant="secondary" className="text-xs">
                              {muscle}
                            </Badge>
                          ))}
                      </div>
                    </button>
                  ))
                })()}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => onRemove(exercise.id)} className="flex-shrink-0">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        {/* Tags */}
        {(exercise.equipment || exercise.primaryMuscles) && (
          <div className="flex flex-wrap gap-2 px-1">
            {exercise.equipment && <Badge variant="outline" className="text-xs">{exercise.equipment}</Badge>}
            {exercise.primaryMuscles?.map((muscle) => (
              <Badge key={muscle} variant="secondary" className="text-xs">
                {muscle}
              </Badge>
            ))}
          </div>
        )}

        {/* Notas */}
        <Textarea
          value={exercise.notes || ""}
          onChange={(e) => onUpdateNotes(exercise.id, e.target.value)}
          placeholder="Notas do exercício (opcional)"
          rows={2}
          className="bg-muted/50 resize-none text-sm"
        />

        {/* Séries */}
        <div className="space-y-3 border-t border-border/50 pt-4">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
            <div className="col-span-1">SET</div>
            <div className="col-span-4">REPS</div>
            <div className="col-span-3">REST (s)</div>
            <div className="col-span-3">NOTES</div>
            <div className="col-span-1"></div>
          </div>

          {exercise.series.map((series, seriesIndex) => (
            <div key={series.id} className="space-y-2">
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1">
                  <span className="text-sm font-medium text-muted-foreground">{seriesIndex + 1}</span>
                </div>
                <div className="col-span-4">
                  <div className="flex gap-2 items-center">
                    {series.useRepsRange ? (
                      <div className="flex gap-2 items-center flex-1">
                        <Input
                          value={series.repsMin || ""}
                          onChange={(e) => onUpdateSeries(exercise.id, series.id, "repsMin", e.target.value)}
                          placeholder="10"
                          type="number"
                          className="h-8 text-sm bg-muted/50 flex-1"
                        />
                        <span className="text-xs text-muted-foreground font-medium">-</span>
                        <Input
                          value={series.repsMax || ""}
                          onChange={(e) => onUpdateSeries(exercise.id, series.id, "repsMax", e.target.value)}
                          placeholder="12"
                          type="number"
                          className="h-8 text-sm bg-muted/50 flex-1"
                        />
                      </div>
                    ) : (
                      <Input
                        value={series.reps}
                        onChange={(e) => onUpdateSeries(exercise.id, series.id, "reps", e.target.value)}
                        placeholder="12"
                        type="number"
                        className="h-8 text-sm bg-muted/50 flex-1"
                      />
                    )}
                    <label className="flex items-center gap-1 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={series.useRepsRange || false}
                        onChange={() => onToggleRepsRange(exercise.id, series.id)}
                        className="w-3 h-3 rounded"
                      />
                      <span>Range</span>
                    </label>
                  </div>
                </div>
                <div className="col-span-3">
                  <Input
                    value={series.rest}
                    onChange={(e) => onUpdateSeries(exercise.id, series.id, "rest", e.target.value)}
                    placeholder="60"
                    type="number"
                    className="h-8 text-sm bg-muted/50"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    value={series.notes || ""}
                    onChange={(e) => onUpdateSeries(exercise.id, series.id, "notes", e.target.value)}
                    placeholder="-"
                    className="h-8 text-sm bg-muted/50"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  {exercise.series.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveSeries(exercise.id, series.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddSeries(exercise.id)}
            className="w-full h-8 text-xs bg-transparent"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar Série
          </Button>
        </div>
      </div>
    </div>
  )
}
