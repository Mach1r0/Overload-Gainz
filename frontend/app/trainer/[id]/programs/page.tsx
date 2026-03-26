"use client"

import { useState, useEffect } from "react"
import { NavHeader } from "@/components/nav-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Folder, MoreVertical, ChevronDown, ChevronRight, FolderPlus, Trash2, Copy, Loader2, FolderInput } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { apiClient } from "@/lib/api/client"
import { authApi } from "@/lib/api/auth"
import { getFoldersByTeacher, createFolder, updateFolder, deleteFolder, changeProgramFolder } from "@/lib/api/training"

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
  const router = useRouter()
  const trainerId = params.id as string
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [folders, setFolders] = useState<ProgramFolder[]>([])
  const [teacherIdState, setTeacherIdState] = useState<number | null>(null)
  
  // Folder management states
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [folderToEdit, setFolderToEdit] = useState<ProgramFolder | null>(null)
  const [folderName, setFolderName] = useState("")
  const [isSavingFolder, setIsSavingFolder] = useState(false)
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<ProgramFolder | null>(null)
  const [isDeletingFolder, setIsDeletingFolder] = useState(false)
  
  // Move program to folder states
  const [moveFolderDialogOpen, setMoveFolderDialogOpen] = useState(false)
  const [programToMove, setProgramToMove] = useState<Program | null>(null)
  const [selectedMoveFolder, setSelectedMoveFolder] = useState<string>("none")
  const [isMovingFolder, setIsMovingFolder] = useState(false)

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
      
      setTeacherIdState(teacher.id)

      // Get folders with programs from the new endpoint
      const foldersData = await getFoldersByTeacher(teacher.id)

      // Transform folders data
      const transformedFolders = foldersData.map((folder: any) => {
        const programsWithRoutines = folder.programs.map((program: any) => {
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

        return {
          id: folder.id,
          name: folder.name,
          programs: programsWithRoutines,
          isOpen: true,
        }
      })

      setFolders(transformedFolders)
    } catch (error) {
      console.error("Erro ao buscar programas:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = (folderId: number) => {
    setFolders(folders.map((f) => (f.id === folderId ? { ...f, isOpen: !f.isOpen } : f)))
  }

  const handleDuplicateProgram = async (program: Program) => {
    setIsDuplicating(true)
    try {
      const response = await apiClient.post(`/training/programs/${program.id}/duplicate/`)
      const newProgram = response.data
      
      // Add the new program to the folders list
      setFolders(prevFolders => 
        prevFolders.map(folder => ({
          ...folder,
          programs: [...folder.programs, {
            id: newProgram.id,
            name: newProgram.name,
            description: newProgram.description || "",
            goal: newProgram.goal,
            category: newProgram.category || "",
            routines: [],
            students_count: 0,
            created_at: newProgram.created_at,
            updated_at: newProgram.updated_at,
          }]
        }))
      )
    } catch (error) {
      console.error("Erro ao duplicar programa:", error)
      alert("Erro ao duplicar o programa. Tente novamente.")
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleDeleteProgram = async () => {
    if (!programToDelete) return
    
    setIsDeleting(true)
    try {
      await apiClient.delete(`/training/programs/${programToDelete.id}/`)
      
      // Remove the program from the folders list
      setFolders(prevFolders => 
        prevFolders.map(folder => ({
          ...folder,
          programs: folder.programs.filter(p => p.id !== programToDelete.id)
        }))
      )
      
      setDeleteDialogOpen(false)
      setProgramToDelete(null)
    } catch (error) {
      console.error("Erro ao excluir programa:", error)
      alert("Erro ao excluir o programa. Tente novamente.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Folder management functions
  const handleCreateFolder = () => {
    setFolderToEdit(null)
    setFolderName("")
    setFolderDialogOpen(true)
  }

  const handleEditFolder = (folder: ProgramFolder) => {
    setFolderToEdit(folder)
    setFolderName(folder.name)
    setFolderDialogOpen(true)
  }

  const handleSaveFolder = async () => {
    if (!folderName.trim() || !teacherIdState) return
    
    setIsSavingFolder(true)
    try {
      if (folderToEdit) {
        // Update existing folder
        const updatedFolder = await updateFolder(folderToEdit.id, folderName)
        setFolders(prevFolders =>
          prevFolders.map(f => f.id === folderToEdit.id ? { ...f, name: updatedFolder.name } : f)
        )
      } else {
        // Create new folder
        const newFolder = await createFolder(teacherIdState, folderName)
        setFolders(prevFolders => [
          ...prevFolders,
          {
            id: newFolder.id,
            name: newFolder.name,
            programs: [],
            isOpen: true,
          }
        ])
      }
      
      setFolderDialogOpen(false)
      setFolderName("")
      setFolderToEdit(null)
    } catch (error) {
      console.error("Erro ao salvar pasta:", error)
      alert("Erro ao salvar a pasta. Tente novamente.")
    } finally {
      setIsSavingFolder(false)
    }
  }

  const handleDeleteFolderConfirm = (folder: ProgramFolder) => {
    setFolderToDelete(folder)
    setDeleteFolderDialogOpen(true)
  }

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return
    
    setIsDeletingFolder(true)
    try {
      await deleteFolder(folderToDelete.id)
      
      setFolders(prevFolders => prevFolders.filter(f => f.id !== folderToDelete.id))
      
      setDeleteFolderDialogOpen(false)
      setFolderToDelete(null)
    } catch (error) {
      console.error("Erro ao excluir pasta:", error)
      alert("Erro ao excluir a pasta. Tente novamente.")
    } finally {
      setIsDeletingFolder(false)
    }
  }

  // Move program to folder functions
  const handleMoveProgramToFolder = (program: Program) => {
    setProgramToMove(program)
    setSelectedMoveFolder("none")
    setMoveFolderDialogOpen(true)
  }

  const handleConfirmMoveFolder = async () => {
    if (!programToMove) return
    
    setIsMovingFolder(true)
    try {
      const folderId = selectedMoveFolder === "none" ? null : parseInt(selectedMoveFolder)
      await changeProgramFolder(programToMove.id, folderId)
      
      // Refresh the programs list
      await fetchPrograms()
      
      setMoveFolderDialogOpen(false)
      setProgramToMove(null)
    } catch (error) {
      console.error("Erro ao mover programa:", error)
      alert("Erro ao mover o programa. Tente novamente.")
    } finally {
      setIsMovingFolder(false)
    }
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

          <Button variant="outline" size="lg" className="flex items-center gap-2" onClick={handleCreateFolder}>
            <FolderPlus className="h-5 w-5" />
            Nova Pasta
          </Button>


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
                  <div className="flex items-center justify-between">
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

                    <div className="flex items-center gap-2">
                      {/* Create Program in Folder Button */}
                      <Button 
                        asChild
                        variant="outline" 
                        size="sm"
                        className="h-8"
                      >
                        <Link href={folder.id !== null ? `/trainer/${trainerId}/programs/new?folder=${folder.id}` : `/trainer/${trainerId}/programs/new`}>
                          <Plus className="h-4 w-4 mr-1" />
                          Novo Programa
                        </Link>
                      </Button>

                      {/* Folder Actions - Only show for folders that are not "Sem Pasta" */}
                      {folder.id !== null && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditFolder(folder)}>
                              Editar Pasta
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteFolderConfirm(folder)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir Pasta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

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
                                        <DropdownMenuItem 
                                          onClick={() => handleMoveProgramToFolder(program)}
                                        >
                                          <FolderInput className="h-4 w-4 mr-2" />
                                          Mover para Pasta
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDuplicateProgram(program)}
                                          disabled={isDuplicating}
                                        >
                                          <Copy className="h-4 w-4 mr-2" />
                                          {isDuplicating ? "Duplicando..." : "Duplicar Programa"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="text-destructive"
                                          onClick={() => {
                                            setProgramToDelete(program)
                                            setDeleteDialogOpen(true)
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Excluir Programa
                                        </DropdownMenuItem>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Programa</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o programa "{programToDelete?.name}"? 
                Esta ação não pode ser desfeita e todos os treinos associados serão removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteProgram}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Folder Create/Edit Dialog */}
        <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{folderToEdit ? "Editar Pasta" : "Nova Pasta"}</DialogTitle>
              <DialogDescription>
                {folderToEdit ? "Altere o nome da pasta." : "Crie uma nova pasta para organizar seus programas."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Nome da Pasta</Label>
                <Input
                  id="folder-name"
                  placeholder="Digite o nome da pasta..."
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && folderName.trim()) {
                      handleSaveFolder()
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFolderDialogOpen(false)} disabled={isSavingFolder}>
                Cancelar
              </Button>
              <Button onClick={handleSaveFolder} disabled={!folderName.trim() || isSavingFolder}>
                {isSavingFolder ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  folderToEdit ? "Salvar" : "Criar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Folder Confirmation Dialog */}
        <AlertDialog open={deleteFolderDialogOpen} onOpenChange={setDeleteFolderDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Pasta</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a pasta "{folderToDelete?.name}"?
                {folderToDelete && folderToDelete.programs.length > 0 && (
                  <span className="block mt-2 text-destructive font-medium">
                    Atenção: Esta pasta contém {folderToDelete.programs.length} programa(s). 
                    Os programas serão movidos para "Sem Pasta".
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingFolder}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteFolder}
                disabled={isDeletingFolder}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingFolder ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Move Program to Folder Dialog */}
        <Dialog open={moveFolderDialogOpen} onOpenChange={setMoveFolderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mover Programa para Pasta</DialogTitle>
              <DialogDescription>
                Selecione a pasta para onde deseja mover o programa "{programToMove?.name}".
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={selectedMoveFolder} onValueChange={setSelectedMoveFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma pasta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Pasta</SelectItem>
                  {folders.filter((folder) => folder.id !== null).map((folder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMoveFolderDialogOpen(false)} disabled={isMovingFolder}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmMoveFolder} disabled={isMovingFolder}>
                {isMovingFolder ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Movendo...
                  </>
                ) : (
                  "Mover"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
