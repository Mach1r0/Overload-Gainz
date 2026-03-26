"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, X, Users } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { authApi } from "@/lib/api/auth"

interface Student {
  id: number
  first_name: string
  last_name: string
  user?: {
    username: string
  }
}

interface RoutineStudentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routineId: number
  routineName: string
  programId: number
}

export function RoutineStudentsModal({
  open,
  onOpenChange,
  routineId,
  routineName,
  programId,
}: RoutineStudentsModalProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [showAddStudents, setShowAddStudents] = useState(false)

  useEffect(() => {
    if (open) {
      fetchRoutineStudents()
      fetchAllStudents()
    }
  }, [open, routineId])

  const fetchRoutineStudents = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/training/trainings/all_students_rotine/?routine_id=${programId}`)
      setStudents(response.data)
    } catch (error) {
      console.error("Erro ao buscar alunos da rotina:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllStudents = async () => {
    try {
      const response = await apiClient.get('/students/')
      setAllStudents(response.data)
    } catch (error) {
      console.error("Erro ao buscar todos os alunos:", error)
    }
  }

  const addStudentToRoutine = async (studentId: number) => {
    try {
      const user = authApi.getUserFromStorage()
      if (!user) return

      const teacherResponse = await apiClient.get(`/trainer/teachers/?user=${user.id}`)
      const teacher = teacherResponse.data?.[0]

      if (!teacher) return

      // Create a new training for this student with the same program
      await apiClient.post('/training/trainings/', {
        student: studentId,
        teacher: teacher.id,
        program: programId,
        goal: 'HYP',
        name: routineName,
        description: '',
        is_active: true,
      })

      // Refresh the student list
      await fetchRoutineStudents()
      setShowAddStudents(false)
    } catch (error) {
      console.error("Erro ao adicionar aluno:", error)
      alert("Erro ao adicionar aluno à rotina")
    }
  }

  const removeStudentFromRoutine = async (studentId: number) => {
    if (!confirm("Tem certeza que deseja remover este aluno desta rotina?")) return

    try {
      // Find the training for this student and program
      const trainingsResponse = await apiClient.get(
        `/training/trainings/?student=${studentId}&program=${programId}`
      )
      const training = trainingsResponse.data?.[0]

      if (training) {
        await apiClient.delete(`/training/trainings/${training.id}/`)
        await fetchRoutineStudents()
      }
    } catch (error) {
      console.error("Erro ao remover aluno:", error)
      alert("Erro ao remover aluno da rotina")
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const availableStudents = allStudents.filter(
    (s) =>
      !students.some((rs) => rs.id === s.id) &&
      (s.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.last_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Alunos - {routineName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {!showAddStudents ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {students.length} {students.length === 1 ? "aluno" : "alunos"} nesta rotina
                </p>
                <Button
                  onClick={() => setShowAddStudents(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Aluno
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                ) : students.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Nenhum aluno nesta rotina</p>
                    <Button
                      onClick={() => setShowAddStudents(true)}
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      Adicionar Primeiro Aluno
                    </Button>
                  </div>
                ) : (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(student.first_name, student.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.user?.username || "Sem username"}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeStudentFromRoutine(student.id)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Adicionar Alunos</p>
                <Button onClick={() => setShowAddStudents(false)} variant="ghost" size="sm">
                  Voltar
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
                {availableStudents.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    {searchQuery
                      ? "Nenhum aluno encontrado"
                      : "Todos os alunos já estão nesta rotina"}
                  </p>
                ) : (
                  availableStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(student.first_name, student.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.user?.username || "Sem username"}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => addStudentToRoutine(student.id)}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
