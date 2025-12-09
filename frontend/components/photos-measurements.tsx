"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, TrendingUp, TrendingDown, Minus, ImageIcon } from "lucide-react"
import { apiClient } from "@/lib/api/client"

interface BodyMeasurement {
  id: number
  date: string
  weight_kg?: number
  body_fat_percent?: number
  muscle_mass_kg?: number
  neck_cm?: number
  chest_cm?: number
  waist_cm?: number
  hips_cm?: number
  bicep_left_cm?: number
  bicep_right_cm?: number
  thigh_left_cm?: number
  thigh_right_cm?: number
  notes?: string
}

interface ProgressPhoto {
  id: number
  photo_type: "FRONT" | "SIDE" | "BACK"
  image: string
  created_at: string
  notes?: string
}

const photoTypeLabels = {
  FRONT: "Frente",
  SIDE: "Lateral",
  BACK: "Costas",
}

export function PhotosMeasurements({ studentId, userId }: { studentId: string; userId: string }) {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const measurementsResponse = await apiClient.get(`/analytics/body-measurements/?user=${userId}`)
        setMeasurements(measurementsResponse.data)
        
        const photosResponse = await apiClient.get(`/analytics/progress-photos/?user=${userId}`)
        setPhotos(photosResponse.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  if (loading) {
    return <div className="text-center py-8">Carregando dados...</div>
  }

  const latestMeasurement = measurements[0]
  const previousMeasurement = measurements[1]

  const getTrend = (current?: number, previous?: number) => {
    if (!current || !previous) return null
    const diff = current - previous
    if (Math.abs(diff) < 0.1) return { icon: Minus, color: "text-gray-500", text: "Manteve" }
    if (diff > 0) return { icon: TrendingUp, color: "text-green-600", text: `+${diff.toFixed(1)}` }
    return { icon: TrendingDown, color: "text-red-600", text: diff.toFixed(1) }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="measurements" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="measurements">Medidas</TabsTrigger>
          <TabsTrigger value="photos">Fotos de Progresso</TabsTrigger>
        </TabsList>

        <TabsContent value="measurements" className="mt-6 space-y-6">
          {latestMeasurement && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Última Avaliação</CardTitle>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(latestMeasurement.date).toLocaleDateString("pt-BR")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {latestMeasurement.weight_kg && (
                    <MeasurementCard
                      label="Peso"
                      value={`${latestMeasurement.weight_kg} kg`}
                      trend={getTrend(latestMeasurement.weight_kg, previousMeasurement?.weight_kg)}
                    />
                  )}
                  {latestMeasurement.body_fat_percent && (
                    <MeasurementCard
                      label="Gordura Corporal"
                      value={`${latestMeasurement.body_fat_percent}%`}
                      trend={getTrend(latestMeasurement.body_fat_percent, previousMeasurement?.body_fat_percent)}
                    />
                  )}
                  {latestMeasurement.muscle_mass_kg && (
                    <MeasurementCard
                      label="Massa Muscular"
                      value={`${latestMeasurement.muscle_mass_kg} kg`}
                      trend={getTrend(latestMeasurement.muscle_mass_kg, previousMeasurement?.muscle_mass_kg)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Measurements */}
          {latestMeasurement && (
            <Card>
              <CardHeader>
                <CardTitle>Medidas Detalhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {latestMeasurement.chest_cm && (
                    <MeasurementCard
                      label="Peito"
                      value={`${latestMeasurement.chest_cm} cm`}
                      trend={getTrend(latestMeasurement.chest_cm, previousMeasurement?.chest_cm)}
                    />
                  )}
                  {latestMeasurement.waist_cm && (
                    <MeasurementCard
                      label="Cintura"
                      value={`${latestMeasurement.waist_cm} cm`}
                      trend={getTrend(latestMeasurement.waist_cm, previousMeasurement?.waist_cm)}
                    />
                  )}
                  {latestMeasurement.bicep_left_cm && (
                    <MeasurementCard
                      label="Bíceps Esq."
                      value={`${latestMeasurement.bicep_left_cm} cm`}
                      trend={getTrend(latestMeasurement.bicep_left_cm, previousMeasurement?.bicep_left_cm)}
                    />
                  )}
                  {latestMeasurement.bicep_right_cm && (
                    <MeasurementCard
                      label="Bíceps Dir."
                      value={`${latestMeasurement.bicep_right_cm} cm`}
                      trend={getTrend(latestMeasurement.bicep_right_cm, previousMeasurement?.bicep_right_cm)}
                    />
                  )}
                  {latestMeasurement.thigh_left_cm && (
                    <MeasurementCard
                      label="Coxa Esq."
                      value={`${latestMeasurement.thigh_left_cm} cm`}
                      trend={getTrend(latestMeasurement.thigh_left_cm, previousMeasurement?.thigh_left_cm)}
                    />
                  )}
                  {latestMeasurement.thigh_right_cm && (
                    <MeasurementCard
                      label="Coxa Dir."
                      value={`${latestMeasurement.thigh_right_cm} cm`}
                      trend={getTrend(latestMeasurement.thigh_right_cm, previousMeasurement?.thigh_right_cm)}
                    />
                  )}
                </div>
                {latestMeasurement.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Observações:</span> {latestMeasurement.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Measurement History */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              {measurements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma avaliação registrada</p>
              ) : (
                <div className="space-y-3">
                  {measurements.map((measurement) => (
                    <div key={measurement.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{new Date(measurement.date).toLocaleDateString("pt-BR")}</span>
                        <div className="flex gap-2 text-sm">
                          {measurement.weight_kg && <Badge variant="outline">{measurement.weight_kg} kg</Badge>}
                          {measurement.body_fat_percent && (
                            <Badge variant="outline">{measurement.body_fat_percent}% BF</Badge>
                          )}
                        </div>
                      </div>
                      {measurement.notes && <p className="text-sm text-muted-foreground">{measurement.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Fotos de Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              {photos.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma foto de progresso registrada</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Latest Photos */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Fotos Mais Recentes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {photos.slice(0, 3).map((photo) => (
                        <div key={photo.id} className="space-y-2">
                          <div className="relative aspect-[3/4] rounded-lg overflow-hidden border bg-muted">
                            <img
                              src={photo.image || "/placeholder.svg"}
                              alt={`Foto de progresso - ${photoTypeLabels[photo.photo_type]}`}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <Badge variant="secondary">{photoTypeLabels[photo.photo_type]}</Badge>
                            <span className="text-muted-foreground">
                              {new Date(photo.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          {photo.notes && (
                            <p className="text-xs text-muted-foreground">Observações: {photo.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Photo History */}
                  {photos.length > 3 && (
                    <div>
                      <h3 className="text-sm font-medium mb-3">Histórico</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {photos.slice(3).map((photo) => (
                          <div key={photo.id} className="space-y-1">
                            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border bg-muted">
                              <img
                                src={photo.image || "/placeholder.svg"}
                                alt={`Foto de progresso - ${photoTypeLabels[photo.photo_type]}`}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                              {new Date(photo.created_at).toLocaleDateString("pt-BR")}
                            </p>
                            {photo.notes && (
                              <p className="text-[10px] text-muted-foreground text-center">{photo.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MeasurementCard({
  label,
  value,
  trend,
}: {
  label: string
  value: string
  trend: { icon: React.ElementType; color: string; text: string } | null
}) {
  return (
    <div className="p-3 border rounded-lg bg-card">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.color}`}>
            <trend.icon className="h-4 w-4" />
            <span>{trend.text}</span>
          </div>
        )}
      </div>
    </div>
  )
}
