import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw } from "lucide-react"

interface StudentInfoCardProps {
  studentName: string
  studentId: number
  students: any[]
  loadingStudents: boolean
  onStudentChange: (studentUserId: string) => void
}

export function StudentInfoCard({
  studentName,
  studentId,
  students,
  loadingStudents,
  onStudentChange,
}: StudentInfoCardProps) {
  const [isEditingStudent, setIsEditingStudent] = useState(false)
  const [studentSearchTerm, setStudentSearchTerm] = useState("")

  const filteredStudents = students.filter(student =>
    student.student_name?.toLowerCase().includes(studentSearchTerm.toLowerCase())
  )

  const handleStudentSelect = (newStudentUserId: string) => {
    onStudentChange(newStudentUserId)
    setIsEditingStudent(false)
    setStudentSearchTerm("")
  }

  if (!studentName) return null

  return (
    <Card className="p-6 bg-card border-border mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Aluno</h2>
        {!isEditingStudent && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditingStudent(true)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Trocar Aluno
          </Button>
        )}
      </div>
      {isEditingStudent ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Pesquisar aluno</Label>
            <Input
              placeholder="Digite o nome do aluno..."
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Selecione o novo aluno</Label>
            <Select 
              value={studentId.toString()} 
              onValueChange={handleStudentSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {loadingStudents ? (
                  <div className="p-2 text-sm text-muted-foreground">Carregando...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {studentSearchTerm ? 'Nenhum aluno encontrado com esse nome' : 'Nenhum aluno encontrado'}
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <SelectItem 
                      key={student.student_id} 
                      value={student.student_user_id?.toString() || student.student_id?.toString()}
                    >
                      {student.student_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setIsEditingStudent(false)
                setStudentSearchTerm("")
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">{studentName}</p>
            <p className="text-sm text-muted-foreground">Dieta criada para este aluno</p>
          </div>
        </div>
      )}
    </Card>
  )
}
