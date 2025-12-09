
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search } from "lucide-react"

interface Routine {
  id: number
  name: string
  programName: string
  exercises: { id: number; name: string; sets: number; muscleGroup: string }[]
}

interface AddRoutineModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateNew: () => void
  onImportRoutines: (routines: Routine[]) => void
  existingRoutines?: Routine[]
}

export function AddRoutineModal({
  open,
  onOpenChange,
  onCreateNew,
  onImportRoutines,
  existingRoutines = [],
}: AddRoutineModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoutines, setSelectedRoutines] = useState<number[]>([])

  const libraryRoutines: Routine[] = [
    {
      id: 101,
      name: "Rotina Sem Título",
      programName: "Meus Programas / Programa Hipertrofia",
      exercises: [
        { id: 1, name: "Supino Reto", sets: 4, muscleGroup: "Peito" },
        { id: 2, name: "Crucifixo", sets: 3, muscleGroup: "Peito" },
      ],
    },
    {
      id: 102,
      name: "Rotina Sem Título",
      programName: "Meus Programas / Programa Força",
      exercises: [
        { id: 3, name: "Agachamento", sets: 5, muscleGroup: "Quadríceps" },
        { id: 4, name: "Terra", sets: 5, muscleGroup: "Costas" },
      ],
    },
    {
      id: 103,
      name: "Rotina Sem Título",
      programName: "Meus Programas / Programa Iniciante",
      exercises: [
        { id: 5, name: "Leg Press", sets: 3, muscleGroup: "Quadríceps" },
        { id: 6, name: "Cadeira Extensora", sets: 3, muscleGroup: "Quadríceps" },
      ],
    },
    ...existingRoutines.map((r) => ({
      ...r,
      programName: "Programa Atual",
    })),
  ]

  const filteredRoutines = libraryRoutines.filter(
    (routine) =>
      routine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      routine.programName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleRoutine = (routineId: number) => {
    setSelectedRoutines((prev) =>
      prev.includes(routineId) ? prev.filter((id) => id !== routineId) : [...prev, routineId],
    )
  }

  const handleCreateNew = () => {
    onCreateNew()
    onOpenChange(false)
    setSearchQuery("")
    setSelectedRoutines([])
  }

  const handleImport = () => {
    const routinesToImport = libraryRoutines.filter((r) => selectedRoutines.includes(r.id))
    onImportRoutines(routinesToImport)
    onOpenChange(false)
    setSearchQuery("")
    setSelectedRoutines([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Rotinas</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="border border-dashed border-border rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Criar Nova Rotina do Zero</p>
            <Button onClick={handleCreateNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Nova Rotina
            </Button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <p className="text-sm text-muted-foreground mb-3">Ou importar da biblioteca</p>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar rotina"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[300px]">
              {filteredRoutines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma rotina encontrada</p>
              ) : (
                filteredRoutines.map((routine) => (
                  <div
                    key={routine.id}
                    onClick={() => toggleRoutine(routine.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRoutines.includes(routine.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedRoutines.includes(routine.id)}
                      onCheckedChange={() => toggleRoutine(routine.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">De: {routine.programName}</p>
                      <p className="font-medium">{routine.name}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Button
            onClick={handleImport}
            disabled={selectedRoutines.length === 0}
            variant={selectedRoutines.length === 0 ? "secondary" : "default"}
            className="w-full"
          >
            Copiar Rotina para Programa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
