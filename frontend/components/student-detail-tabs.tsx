"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import Link from "next/link"
import { DietManagement } from "@/components/diet-management"
import { TrainingManagement } from "@/components/training-management"
import { PhotosMeasurements } from "@/components/photos-measurements"
import { apiClient } from "@/lib/api/client"

interface Student {
  id: number
  user_data: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    profile_picture?: string
  }
  age?: number
  weight?: number
  height?: number
  phone_number?: string
}

export function StudentDetailTabs({ studentId, trainerId }: { studentId: string, trainerId: string }) {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get(`/students/${studentId}/`)
        console.log('Student data:', response.data)
        setStudent(response.data)
      } catch (error) {
        console.error('Error fetching student:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
  }, [studentId])

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  if (!student) {
    return <div className="text-center py-8">Aluno não encontrado</div>
  }

  const fullName = `${student.user_data.first_name} ${student.user_data.last_name}`.trim() || student.user_data.username
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  
  const userId = student.user_data.id.toString()

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href={`/trainer/${trainerId}/students`} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Alunos
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={student.user_data.profile_picture || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{fullName}</CardTitle>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>@{student.user_data.username}</span>
                <span>•</span>
                <span>{student.user_data.email}</span>
                {student.phone_number && (
                  <>
                    <span>•</span>
                    <span>{student.phone_number}</span>
                  </>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                {student.age && <Badge variant="secondary">{student.age} anos</Badge>}
                {student.weight && <Badge variant="secondary">{student.weight} kg</Badge>}
                {student.height && <Badge variant="secondary">{student.height} m</Badge>}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="diets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diets">Dietas</TabsTrigger>
          <TabsTrigger value="training">Programas</TabsTrigger>
          <TabsTrigger value="progress">Fotos e Medidas</TabsTrigger>
        </TabsList>

        <TabsContent value="diets" className="mt-6">
          <DietManagement studentId={studentId} userId={userId} />
        </TabsContent>

        <TabsContent value="training" className="mt-6">
          <TrainingManagement studentId={studentId} userId={userId} />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <PhotosMeasurements studentId={studentId} userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
