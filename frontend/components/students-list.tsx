"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { authApi } from "@/lib/api/auth"
import { fetchTeacherStudents } from "@/lib/api/trainer-students"

interface Student {
  id: number
  student: {
    id: number
    age?: number
    user_data: {
      id: number
      username: string
      email: string
      first_name: string
      last_name: string
      profile_picture?: string
    }
  }
  student_id: number
  student_name: string
  student_user_id: number
  assigned_at: string
  is_active: boolean
  evaluation_status?: {
    has_initial_photos: boolean
    has_diet_plan: boolean
    has_training_plan: boolean
    has_progress_log: boolean
    has_body_measurements: boolean
    completion_percentage: number
    is_complete: boolean
  }
}

export function StudentsList() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const user = authApi.getUserFromStorage()
      if (!user) {
        console.error('No user found')
        setStudents([])
        return
      }

      // Get teacher's students (evaluation_status is already included)
      const studentsData = await fetchTeacherStudents()
      console.log('[StudentsList] fetched students:', studentsData?.length ?? 0, studentsData)
      setStudents(studentsData || [])
    } catch (error: any) {
      console.error('Error fetching students:', error);
      if (error.response) {
        console.error('API error response:', error.response);
      } else if (error.request) {
        console.error('API error request:', error.request);
      }
    } finally {
      setLoading(false)
    }
  }

  const evaluatedStudents = students.filter((s) => 
    s.evaluation_status?.has_diet_plan || 
    s.evaluation_status?.has_training_plan || 
    s.evaluation_status?.has_progress_log
  )
  const notEvaluatedStudents = students.filter((s) => 
    !s.evaluation_status?.has_diet_plan && 
    !s.evaluation_status?.has_training_plan && 
    !s.evaluation_status?.has_progress_log
  )

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div className="space-y-8">
      {/* Evaluated Students */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">Avaliados</h2>
          <Badge variant="secondary">{evaluatedStudents.length}</Badge>
        </div>

        {evaluatedStudents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">Nenhum aluno avaliado ainda</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {evaluatedStudents.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        )}
      </section>

      {/* Not Evaluated Students */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="h-5 w-5 text-orange-600" />
          <h2 className="text-xl font-semibold">Não Avaliados</h2>
          <Badge variant="secondary">{notEvaluatedStudents.length}</Badge>
        </div>

        {notEvaluatedStudents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Todos os alunos foram avaliados
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notEvaluatedStudents.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StudentCard({ student }: { student: Student }) {
  const fullName = `${student.student.user_data.first_name} ${student.student.user_data.last_name}`.trim() || student.student.user_data.username
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const pathname = usePathname()
  const segments = pathname ? pathname.split("/").filter(Boolean) : []
  const trainerIndex = segments.indexOf("trainer")
  const trainerId = trainerIndex >= 0 ? segments[trainerIndex + 1] ?? "" : ""
  const href = trainerId ? `/trainer/${trainerId}/students/${student.student_id}` : `/students/${student.student_id}`

  // Determine missing items (what trainer hasn't provided yet)
  const missing: string[] = [];
  if (!student.evaluation_status?.has_diet_plan) missing.push("Falta dieta");
  if (!student.evaluation_status?.has_training_plan) missing.push("Falta treino");
  // Only show "Falta feedback" if student has uploaded photos
  if (student.evaluation_status?.has_initial_photos && !student.evaluation_status?.has_progress_log) {
    missing.push("Falta feedback");
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={student.student.user_data.profile_picture || "/placeholder.svg"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{fullName}</CardTitle>
            <p className="text-sm text-muted-foreground truncate">@{student.student.user_data.username}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 text-sm">
          {student.student.age && <Badge variant="outline">{student.student.age} anos</Badge>}
        </div>
        {/* Show missing items if any */}
        {missing.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            {missing.map((item) => (
              <Badge key={item} variant="destructive">{item}</Badge>
            ))}
          </div>
        )}
        <Button asChild className="w-full">
          <Link href={href}>Ver Detalhes</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
