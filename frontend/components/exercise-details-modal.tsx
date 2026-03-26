"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface Exercise {
  id: string
  name: string
  equipment?: string
  primaryMuscles?: string[]
  image?: string | null
  video_url?: string | null
}

interface ExerciseDetailsModalProps {
  exercise: Exercise | null
  isOpen: boolean
  onClose: () => void
}

export function ExerciseDetailsModal({ exercise, isOpen, onClose }: ExerciseDetailsModalProps) {
  if (!exercise) return null

  // Dados mockados para instruções
  const mockInstructions = [
    "Grab an ab wheel and get down on your knees.",
    "Lean forward and place the ab wheel on the floor while holding it firmly with both hands.",
    "Engage your abs and take a breath.",
    "Roll the ab wheel forward as you extend your body.",
    "Move forward as much as your ab strength allows and roll the wheel back to the starting position. Exhale.",
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{exercise.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Imagem/Vídeo */}
          {(exercise.image || exercise.video_url) && (
            <div className="w-full">
              {exercise.video_url ? (
                <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
                  <video 
                    src={exercise.video_url} 
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    muted
                    loop
                  />
                </div>
              ) : exercise.image ? (
                <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={exercise.image} 
                    alt={exercise.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : null}
            </div>
          )}

          {/* Informações do Exercício */}
          <div className="space-y-3">
            {exercise.equipment && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Equipment:</p>
                <Badge variant="outline">{exercise.equipment}</Badge>
              </div>
            )}

            {exercise.primaryMuscles && exercise.primaryMuscles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Primary Muscle Group:</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.primaryMuscles.map((muscle, idx) => (
                    <Badge key={idx} variant="secondary">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Exercise Type:</p>
              <p className="text-sm">Reps Only</p>
            </div>
          </div>

          {/* Instruções do Exercício */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Exercise Instructions</h3>
            <div className="space-y-3">
              {mockInstructions.map((instruction, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{index + 1}</span>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1 pt-1">{instruction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Anexos */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-lg font-semibold">Attachment</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-5 h-5 rounded border border-border flex items-center justify-center">
                <span className="text-xs">📎</span>
              </div>
              <span>There is no attachment</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Edit Exercise
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
