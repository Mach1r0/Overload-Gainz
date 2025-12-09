"use client"

import { useState, useEffect } from "react"
import { NavHeader } from "@/components/nav-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Folder, MoreVertical, ChevronDown, ChevronRight, FolderPlus } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { apiClient } from "@/lib/api/client"
import { authApi } from "@/lib/api/auth"

interface Routine {
  id: number
  name: string
  exercises_count: number
}

interface Program {
  id: number
  name: string
  description: string
  goal: string
  category: string
  routines: Routine[]
  students_count: number
  created_at: string
  updated_at: string
}

interface ProgramFolder {
  id: number
  name: string
  programs: Program[]
  isOpen: boolean
}

export default function ProgramsPage() {
  const params = useParams()
  const trainerId = params.id as string
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [folders, setFolders] = useState<ProgramFolder[]>([
    {
      id: 1,
      name: "Meus Programas",
      isOpen: true,
      programs: [],
    },
  ])

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const user = authApi.getUserFromStorage()
      if (!user) {
        setLoading(false)
        return
      }

      // Get teacher by user id
      const teacherResponse = await apiClient.get(`/trainer/teachers/?user=${user.id}`)
      const teacher = teacherResponse.data?.[0]

      if (!teacher) {
        setLoading(false)
        return
      }

      // Get programs for this teacher
      const programsResponse = await apiClient.get(`/programs/?teacher=${teacher.id}`)
      const programs = programsResponse.data

      // Transform programs with trainings data
      const programsWithRoutines = programs.map((program: any) => {
        // Get unique workout names from all trainings linked to this program
        const routinesMap = new Map<string, { id: number; name: string; exercises_count: number }>()
        
        if (program.trainings && program.trainings.length > 0) {
          program.trainings.forEach((training: any) => {
            if (training.workouts) {
              training.workouts.forEach((workout: any) => {
                if (!routinesMap.has(workout.name)) {
                  routinesMap.set(workout.name, {
                    id: workout.id,
                    name: workout.name,
                    exercises_count: workout.exercises?.length || 0,
                  })
                }
              })
            }
          })
        }

        return {
          id: program.id,
          name: program.name,
          description: program.description || "",
          goal: program.goal,
          category: program.category || "",
          routines: Array.from(routinesMap.values()),
          students_count: program.trainings?.length || 0,
          created_at: program.created_at,
          updated_at: program.updated_at,
        }
      })

      setFolders([
        {
          id: 1,
          name: "Meus Programas",
          isOpen: true,
          programs: programsWithRoutines,
        },
      ])
    } catch (error) {
      console.error("Erro ao buscar programas:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = (folderId: number) => {
    setFolders(folders.map((f) => (f.id === folderId ? { ...f, isOpen: !f.isOpen } : f)))
  }

  const filteredFolders = folders.map((folder) => ({
    ...folder,
    programs: folder.programs.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">Carregando programas...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-10 max-w-7xl">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Biblioteca de Programas</h1>
          <p className="text-muted-foreground text-lg">Organize todos os seus programas e rotinas de treino</p>
        </div>
        <hr className="border-muted mb-8" />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Button asChild size="lg">
            <Link href={`/trainer/${trainerId}/programs/new`} className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Criar Programa
            </Link>
          </Button>

          <Button variant="outline" size="lg" className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Nova Pasta
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <MoreVertical className="h-5 w-5" />
                Mais Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Exportar Programas</DropdownMenuItem>
              <DropdownMenuItem>Importar Programas</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <hr className="border-muted mb-8" />

        <Tabs defaultValue="my-library" className="space-y-8">
          <TabsList className="h-12">
            <TabsTrigger value="my-library" className="px-6">Minha Biblioteca</TabsTrigger>
            <TabsTrigger value="templates" className="px-6">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="my-library" className="space-y-8">
            {/* Search Bar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar programas por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
              </div>
            </div>
            <hr className="border-muted mb-8" />

            {/* Folders and Programs */}
            <div className="space-y-8">
              {filteredFolders.map((folder) => (
                <div key={folder.id} className="space-y-5">
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="flex items-center gap-3 text-lg font-semibold hover:text-primary transition-colors group"
                  >
                    {folder.isOpen ? (
                      <ChevronDown className="h-6 w-6 transition-transform group-hover:translate-y-0.5" />
                    ) : (
                      <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5" />
                    )}
                    <Folder className="h-6 w-6" />
                    <span>{folder.name}</span>
                    <Badge variant="secondary" className="ml-2 px-3 py-1">
                      {folder.programs.length}
                    </Badge>
                  </button>

                  {folder.isOpen && (
                    <div className="pl-10">
                      {folder.programs.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg">
                          <FolderPlus className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                          <p className="text-lg text-muted-foreground">Nenhum programa nesta pasta</p>
                          <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro programa para começar</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {folder.programs.map((program) => (
                            <Card key={program.id} className="hover:shadow-lg transition-all hover:border-primary/50 group">
                              <CardContent className="p-6">
                                <div className="flex flex-col h-full">
                                  <Link href={`/trainer/${trainerId}/programs/${program.id}/edit`} className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                        {program.name}
                                      </h3>
                                      {program.category && (
                                        <Badge variant="secondary" className="shrink-0">
                                          {program.category}
                                        </Badge>
                                      )}
                                    </div>

                                    {program.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                        {program.description}
                                      </p>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                                      <span className="flex items-center gap-1">
                                        <strong>{program.routines.length}</strong> rotinas
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <strong>{program.routines.reduce((acc, r) => acc + r.exercises_count, 0)}</strong> exercícios
                                      </span>
                                      {program.students_count > 0 && (
                                        <span className="flex items-center gap-1">
                                          <strong>{program.students_count}</strong> alunos
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap pt-2">
                                      {program.routines.slice(0, 3).map((routine) => (
                                        <Badge key={routine.id} variant="outline" className="text-xs font-normal">
                                          {routine.name}
                                        </Badge>
                                      ))}
                                      {program.routines.length > 3 && (
                                        <Badge variant="outline" className="text-xs font-normal">
                                          +{program.routines.length - 3} mais
                                        </Badge>
                                      )}
                                    </div>
                                  </Link>

                                  <div className="flex justify-end pt-4 mt-2 border-t">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                          <Link href={`/trainer/${trainerId}/programs/${program.id}/edit`}>Editar Programa</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>Duplicar Programa</DropdownMenuItem>
                                        <DropdownMenuItem>Atribuir a Aluno</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">Excluir Programa</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
              <FolderPlus className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Templates em Breve</h3>
              <p className="text-muted-foreground">Modelos de programas prontos para usar estarão disponíveis em breve</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
