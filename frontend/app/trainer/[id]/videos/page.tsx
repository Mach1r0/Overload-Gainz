"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, Video, Eye, Clock, Trash2, Edit, Plus } from "lucide-react"
import { authApi } from "@/lib/api/auth"
import { 
  getTeacherVideoLessons, 
  createVideoLesson, 
  deleteVideoLesson,
  VIDEO_CATEGORIES,
  type VideoLesson 
} from "@/lib/api/videos"
import { apiClient } from "@/lib/api/client"

function getYouTubeEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    let id = ""
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.replace("/", "")
    } else if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") {
        id = u.searchParams.get("v") || ""
      } else if (u.pathname.startsWith("/embed/")) {
        id = u.pathname.split("/embed/")[1]
      } else if (u.pathname.startsWith("/shorts/")) {
        id = u.pathname.split("/shorts/")[1]
      }
    }
    id = id.split("?")[0]
    return id ? `https://www.youtube.com/embed/${id}` : url
  } catch {
    return url
  }
}

export default function TrainerVideosPage() {
  const params = useParams()
  const trainerId = params.id as string
  const { user, isLoading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [videos, setVideos] = useState<VideoLesson[]>([])
  const [teacherId, setTeacherId] = useState<number | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedVideoForPreview, setSelectedVideoForPreview] = useState<VideoLesson | null>(null)
  const [uploadData, setUploadData] = useState<{
    title: string
    description: string
    category: string
    url_youtube: string
    for_all: boolean
    videoFile?: File
  }>({
    title: "",
    description: "",
    category: "",
    url_youtube: "",
    for_all: false,
  })

  const categories = VIDEO_CATEGORIES

  useEffect(() => {
    fetchTeacherAndVideos()
  }, [])

  const fetchTeacherAndVideos = async () => {
    try {
      setLoading(true)
      const user = authApi.getUserFromStorage()
      
      if (user) {
        const teacherResponse = await apiClient.get(`/trainer/teachers/?user=${user.id}`)
        const teacher = teacherResponse.data[0]
        
        if (teacher) {
          setTeacherId(teacher.id)
          const videosData = await getTeacherVideoLessons(teacher.id)
          console.log('Videos data:', videosData)
          setVideos(videosData)
        }
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadData.title || !uploadData.category) {
      alert('Por favor, preencha o título e a categoria')
      return
    }

    try {
      setUploading(true)
      
      // Don't send teacher - backend will auto-set it from authenticated user
      const videoData: any = {
        title: uploadData.title,
        description: uploadData.description,
        category: uploadData.category,
        url_youtube: uploadData.url_youtube,
        for_all: uploadData.for_all,
        state: true,
      }

      console.log('Creating video:', videoData)
      await createVideoLesson(videoData as any)
      
      // Reset form
      setUploadData({
        title: "",
        description: "",
        category: "",
        url_youtube: "",
        for_all: false,
      })
      
      setIsUploadDialogOpen(false)
      
      // Refresh videos list
      await fetchTeacherAndVideos()
      
      alert('Vídeo criado com sucesso!')
    } catch (error: any) {
      console.error('Error uploading video:', error)
      console.error('Error response:', error.response?.data)
      alert('Erro ao criar vídeo: ' + JSON.stringify(error.response?.data || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (videoId: number) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) {
      return
    }

    try {
      await deleteVideoLesson(videoId)
      await fetchTeacherAndVideos()
      alert('Vídeo excluído com sucesso!')
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Erro ao excluir vídeo')
    }
  }

  const totalVideos = videos.length
  const activeVideos = videos.filter(v => v.state).length

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gerenciar Vídeo Aulas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Faça upload e gerencie seu conteúdo educacional
              </p>
            </div>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Vídeo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Upload de Vídeo Aula</DialogTitle>
                  <DialogDescription>
                    Faça upload de um novo vídeo para seus alunos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título do Vídeo</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Técnica de Agachamento"
                      value={uploadData.title}
                      onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva o conteúdo do vídeo..."
                      rows={4}
                      value={uploadData.description}
                      onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={uploadData.category}
                      onValueChange={(value) => setUploadData({ ...uploadData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube-url">URL do YouTube (opcional)</Label>
                    <Input
                      id="youtube-url"
                      placeholder="https://www.youtube.com/watch?v=xxxxxxxxxxx"
                      value={uploadData.url_youtube}
                      onChange={(e) => setUploadData({ ...uploadData, url_youtube: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video">Arquivo de Vídeo</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Clique para selecionar ou arraste o vídeo aqui
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Formatos aceitos: MP4, AVI, MOV (Máx. 500MB)
                      </p>
                      <Input
                        id="video"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadData({ ...uploadData, videoFile: e.target.files[0] })
                          }
                        }}
                      />
                    </div>
                    {uploadData.videoFile && (
                      <p className="text-sm text-green-500">
                        ✓ {uploadData.videoFile.name} selecionado
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpload} disabled={uploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Enviando...' : 'Salvar Vídeo'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalVideos}</p>
                  <p className="text-sm text-muted-foreground">Vídeos Publicados</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{videos.length > 0 ? videos.length * 150 : 0}</p>
                  <p className="text-sm text-muted-foreground">Total de Visualizações</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {videos.length * 15} min
                  </p>
                  <p className="text-sm text-muted-foreground">Tempo Total de Conteúdo</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Video List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Seus Vídeos</h2>
          
          {videos.map((video) => (
            <Card key={video.id} className="p-4 bg-card border-border">
              <div className="flex gap-4">
                {/* Thumbnail / Embed */}
                <div 
                  className="relative w-72 h-40 bg-muted rounded-lg flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedVideoForPreview(video)}
                >
                  {video.url_youtube ? (
                    <iframe
                      className="w-full h-full"
                      src={getYouTubeEmbedUrl(video.url_youtube)}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {video.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {video.description}
                      </p>
                    </div>
                    <Badge variant={video.state ? "default" : "secondary"}>
                      {video.state ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <Badge variant="outline">{categories.find(c => c.value === video.category)?.label || video.category}</Badge>
                    <span>
                      Criado em {new Date(video.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(video.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {videos.length === 0 && (
          <Card className="p-12 bg-card border-border">
            <div className="text-center">
              <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum vídeo publicado ainda
              </h3>
              <p className="text-muted-foreground mb-4">
                Comece fazendo upload do seu primeiro vídeo aula
              </p>
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Vídeo
              </Button>
            </div>
          </Card>
        )}

        {/* Video Preview Modal */}
        <Dialog open={!!selectedVideoForPreview} onOpenChange={(open) => {
          if (!open) setSelectedVideoForPreview(null)
        }}>
          <DialogContent className="max-w-5xl w-full">
            <DialogHeader>
              <DialogTitle>{selectedVideoForPreview?.title}</DialogTitle>
              <DialogDescription>
                {selectedVideoForPreview?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
              {selectedVideoForPreview?.url_youtube ? (
                <iframe
                  className="w-full h-full"
                  src={getYouTubeEmbedUrl(selectedVideoForPreview.url_youtube)}
                  title={selectedVideoForPreview.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
