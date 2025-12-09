"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  TrendingUp,
  Dumbbell,
  Apple,
  Search,
  Plus,
  MoreVertical,
  Calendar,
  Activity,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { authApi } from "@/lib/api/auth"
import { getTeacherByUserId, getTeacherStudents, getTeacherStats } from "@/lib/api"

interface StudentDisplay {
  id: number
  name: string
  email: string
  avatar?: string
  status: string
  workoutsCompleted: number
  lastWorkout: string
  progress: number
  pendingTasks: string[]
}

interface Stats {
  totalStudents: number
  activeStudents: number
  workoutsThisWeek: number
  avgProgress: number
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showPendingOnly, setShowPendingOnly] = useState(false)
  const [students, setStudents] = useState<StudentDisplay[]>([])
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activeStudents: 0,
    workoutsThisWeek: 0,
    avgProgress: 0,
  })
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const trainerId = params.id as string
  const [userId, setUserId] = useState<string | null>(null)
  const [teacherId, setTeacherId] = useState<number | null>(null)

  useEffect(() => {
    const user = authApi.getUserFromStorage()
    if (user) {
      setUserId(user.id.toString())
      fetchTeacherData()
    }
  }, [])

  const fetchTeacherData = async () => {
    try {
      setLoading(true)
      const teacher = await getTeacherByUserId()
      setTeacherId(teacher.id)
      
      const studentsData = await getTeacherStudents()
      
      const transformedStudents: StudentDisplay[] = studentsData.map((student: any) => ({
        id: student.student_id ?? student.student?.id ?? student.id,
        name: student.student_name || `${student.student?.user_data?.first_name || ''} ${student.student?.user_data?.last_name || ''}`.trim() || student.student?.user_data?.username || 'Sem nome',
        email: student.student?.user_data?.email || '',
        avatar: student.student?.user_data?.profile_picture || null,
        status: 'active',
        workoutsCompleted: 0, 
        lastWorkout: '',
        progress: 0,
        pendingTasks: [], 
      }))
      
      setStudents(transformedStudents)
      
      const statsData = await getTeacherStats(teacher.id)
      setStats({
        totalStudents: statsData.total_students,
        activeStudents: statsData.active_students,
        workoutsThisWeek: statsData.workouts_this_week,
        avgProgress: statsData.avg_progress,
      })
    } catch (error) {
      console.error('Error fetching teacher data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPending = !showPendingOnly || student.pendingTasks.length > 0
    return matchesSearch && matchesPending
  })

  const studentsWithPending = students.filter((s) => s.pendingTasks.length > 0).length

  if (!userId) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Gerencie seus alunos e treinos</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Agenda
              </Button>
              <Avatar>
                <AvatarImage src="/athletic-trainer.png" />
                <AvatarFallback>PT</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-lg">Carregando...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Alunos</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats.totalStudents}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats.activeStudents}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </Card>


              <Card className="p-4 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tarefas Pendentes</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{studentsWithPending}</p>
                </div>
                  <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </Card>
            </div>

            <Tabs defaultValue="students" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="students">Alunos</TabsTrigger>
              <TabsTrigger value="workouts">Treinos</TabsTrigger>
              <TabsTrigger value="diets">Dietas</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/trainer/students/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Aluno
                </Link>
              </Button>
            </div>
          </div>

          <TabsContent value="students" className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar alunos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showPendingOnly ? "default" : "outline"}
                onClick={() => setShowPendingOnly(!showPendingOnly)}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Pendentes ({studentsWithPending})
              </Button>
            </div>

            {/* Students List */}
            <div className="grid gap-3">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="p-4 bg-card border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{student.name}</h3>
                          <Badge variant={student.status === "active" ? "default" : "secondary"}>
                            {student.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                          {student.pendingTasks.length > 0 && (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                              {student.pendingTasks.length} pendente{student.pendingTasks.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        {student.pendingTasks.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {student.pendingTasks.map((task, idx) => (
                              <span key={idx} className="text-xs text-orange-500">
                                • {task}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="hidden md:flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">{student.workoutsCompleted}</p>
                          <p className="text-xs text-muted-foreground">Treinos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">{student.progress}%</p>
                          <p className="text-xs text-muted-foreground">Progresso</p>
                        </div>
                        <div className="text-center min-w-[100px]">
                          <p className="text-sm font-medium text-foreground">
                            {new Date(student.lastWorkout).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="text-xs text-muted-foreground">Último treino</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/trainer/${trainerId}/students/${student.id}`}>Ver Detalhes</Link>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="workouts">
            <Card className="p-8 bg-card border-border">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Dumbbell className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Gerenciar Treinos</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crie e gerencie planos de treino personalizados para seus alunos
                  </p>
                </div>
                <Button asChild>
                  <Link href="/trainer/workouts/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Novo Treino
                  </Link>
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="diets">
            <Card className="p-8 bg-card border-border">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <Apple className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Gerenciar Dietas</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crie planos alimentares adaptados às necessidades de cada aluno
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/trainer/${trainerId}/diets`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Nova Dieta
                  </Link>
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
