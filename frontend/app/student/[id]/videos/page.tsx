"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Play, Eye, Search, BookOpen } from "lucide-react"
import { getVideoLessons, incrementVideoView, VideoLesson, VIDEO_CATEGORIES } from "@/lib/api/videos"

const ALL_LABEL = "Todos"
const categories = [ALL_LABEL, ...VIDEO_CATEGORIES.map((c) => c.label)]

export default function StudentVideosPage() {
  const params = useParams()
  const { user, isLoading: authLoading } = useAuth()
  const [videos, setVideos] = useState<VideoLesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(ALL_LABEL)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null)

  useEffect(() => {
    getVideoLessons()
      .then(setVideos)
      .catch(() => setVideos([]))
      .finally(() => setIsLoading(false))
  }, [])

  const handleSelectVideo = useCallback(async (video: VideoLesson) => {
    setSelectedVideo(video)
    try {
      const result = await incrementVideoView(video.id)
      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, view_count: result.view_count } : v))
      )
      setSelectedVideo((prev) => prev?.id === video.id ? { ...prev, view_count: result.view_count } : prev)
    } catch {
      // view count update is non-critical
    }
  }, [])

  const categoryLabel = (video: VideoLesson) =>
    VIDEO_CATEGORIES.find((c) => c.value === video.category)?.label ?? video.category ?? ""

  const filteredVideos = videos.filter((video) => {
    const label = categoryLabel(video)
    const matchesCategory = selectedCategory === ALL_LABEL || label === selectedCategory
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (authLoading || isLoading) {
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
              <h1 className="text-3xl font-bold text-foreground">Vídeo Aulas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Aprenda com conteúdo exclusivo do seu treinador
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{videos.length}</p>
              <p className="text-xs text-muted-foreground">Aulas disponíveis</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar vídeo aulas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {selectedVideo && (
          <Card className="p-6 mb-6 bg-card border-border">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4 overflow-hidden">
              {selectedVideo.url_youtube ? (
                <iframe
                  src={selectedVideo.url_youtube.replace("watch?v=", "embed/")}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title={selectedVideo.title}
                />
              ) : (
                <div className="text-center">
                  <Play className="h-16 w-16 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Reproduzindo: {selectedVideo.title}</p>
                </div>
              )}
            </div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-2">{selectedVideo.title}</h2>
                {selectedVideo.description && (
                  <p className="text-muted-foreground mb-4">{selectedVideo.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {selectedVideo.view_count ?? 0} visualizações
                  </span>
                  {selectedVideo.category && (
                    <Badge>{categoryLabel(selectedVideo)}</Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <Card
              key={video.id}
              className="overflow-hidden bg-card border-border hover:border-primary transition-colors cursor-pointer"
              onClick={() => handleSelectVideo(video)}
            >
              <div className="relative aspect-video bg-muted">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{video.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {video.view_count ?? 0}
                    </span>
                    {video.category && (
                      <Badge variant="secondary" className="text-xs">
                        {categoryLabel(video)}
                      </Badge>
                    )}
                  </div>
                  {video.created_at && (
                    <span>{new Date(video.created_at).toLocaleDateString("pt-BR")}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <Card className="p-12 bg-card border-border">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum vídeo encontrado</h3>
              <p className="text-muted-foreground">
                {videos.length === 0
                  ? "Seu treinador ainda não publicou vídeos."
                  : "Tente ajustar seus filtros ou termo de busca."}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
