import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DietInfoFormProps {
  dietName: string
  setDietName: (value: string) => void
  goal: "BUK" | "CUT" | "MAINT"
  setGoal: (value: "BUK" | "CUT" | "MAINT") => void
  targetCalories: string
  setTargetCalories: (value: string) => void
  initialTargetCalories: string
  description: string
  setDescription: (value: string) => void
  startDate: string
  setStartDate: (value: string) => void
  endDate: string
  setEndDate: (value: string) => void
}

export function DietInfoForm({
  dietName,
  setDietName,
  goal,
  setGoal,
  targetCalories,
  setTargetCalories,
  initialTargetCalories,
  description,
  setDescription,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: DietInfoFormProps) {
  return (
    <Card className="p-6 bg-card border-border mb-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Informações da Dieta</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Dieta</Label>
          <Input
            id="name"
            placeholder="Ex: Dieta Hipertrofia 3000 kcal"
            value={dietName}
            onChange={(e) => setDietName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="goal">Objetivo</Label>
            <Select value={goal} onValueChange={(value: any) => setGoal(value)}>
              <SelectTrigger id="goal">
                <SelectValue placeholder="Selecione um objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUK">Bulking</SelectItem>
                <SelectItem value="CUT">Cutting</SelectItem>
                <SelectItem value="MAINT">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calories">Meta de Calorias (kcal)</Label>
            <Input
              id="calories"
              type="number"
              placeholder={initialTargetCalories || "Ex: 2500"}
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea
            id="description"
            placeholder="Adicione observações sobre a dieta..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Data de Término (opcional)</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
