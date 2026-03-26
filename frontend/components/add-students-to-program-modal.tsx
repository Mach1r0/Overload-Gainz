"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2 } from "lucide-react"
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

interface AddStudentsToProgramModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  programId: number
  currentStudents: Student[]
  onStudentsAdded: (students: Student[]) => void
}

export function AddStudentsToProgramModal({
  open,
  onOpenChange,
  programId,
  currentStudents,
  onStudentsAdded,
}: AddStudentsToProgramModalProps) {
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      fetchAllStudents()
    }
  }, [open])

  const fetchAllStudents = async () => {
    try {
      setLoading(true)
      
      const teacherStudentsResponse = await apiClient.get(`/trainer/teacher-students/get_active_students/`)
      
      const studentsData = teacherStudentsResponse.data.map((ts: any) => {
        return {
          id: ts.student?.id || ts.student_id,
          first_name: ts.student?.user_data?.first_name || '',
          last_name: ts.student?.user_data?.last_name || '',
          user: ts.student?.user_data ? {
            username: ts.student.user_data.username
          } : undefined
        }
      })
      
      console.log("👥 Students Data:", studentsData)
      
      const currentStudentIds = currentStudents.map(s => s.id)
      const availableStudents = studentsData.filter(
        (s: Student) => s.id && !currentStudentIds.includes(s.id)
      )
      
      console.log("✅ Available Students:", availableStudents)
      setAllStudents(availableStudents)
    } catch (error) {
      console.error("❌ Erro ao buscar alunos:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = allStudents.filter((student) => {
    const searchLower = searchTerm.toLowerCase()
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
    const username = student.user?.username?.toLowerCase() || ""
    
    return fullName.includes(searchLower) || username.includes(searchLower)
  })

  const toggleStudent = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) return

    try {
      setSaving(true)
      
      const addPromises = selectedStudents.map(studentId =>
        apiClient.post(`/training/trainings/assign_student_to_routine/`, {
          routine_id: programId,
          student_id: studentId
        })
      )

      await Promise.all(addPromises)

      const addedStudents = allStudents.filter(s => selectedStudents.includes(s.id))
      onStudentsAdded(addedStudents)

      setSelectedStudents([])
      setSearchTerm("")
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao adicionar alunos:", error)
      alert("Erro ao adicionar alunos. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Alunos ao Programa</DialogTitle>
          <DialogDescription>
            Selecione os alunos que deseja adicionar a este programa de treino.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px] border rounded-md p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {searchTerm ? "Nenhum aluno encontrado" : "Todos os alunos já estão neste programa"}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((student) => {
                  const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Nome não disponível'
                  const username = student.user?.username || ''
                  
                  console.log("👤 Rendering student:", { id: student.id, fullName, username })
                  
                  return (
                    <div
                      key={student.id}
                      className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted cursor-pointer"
                      onClick={() => toggleStudent(student.id)}
                    >
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {fullName}
                        </p>
                        {username && (
                          <p className="text-xs text-muted-foreground">
                            @{username}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedStudents.length} aluno{selectedStudents.length !== 1 ? "s" : ""} selecionado{selectedStudents.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddStudents}
                disabled={selectedStudents.length === 0 || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  `Adicionar ${selectedStudents.length > 0 ? `(${selectedStudents.length})` : ""}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
