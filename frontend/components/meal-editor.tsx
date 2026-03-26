import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { mealTypeLabels, mealTypeIcons, mealTypeColors, type Meal, type Food } from "@/lib/constants/meal-types"
import { FoodItemEditor } from "./food-item-editor"

interface MealEditorProps {
  meal: Meal
  mealIndex: number
  mealType: string
  canRemove: boolean
  onRemove: () => void
  onUpdateMeal: (field: keyof Meal, value: string) => void
  onAddFood: () => void
  onRemoveFood: (foodId: string | number) => void
  onUpdateFood: (foodId: string | number, field: string, value: string) => void
}

export function MealEditor({
  meal,
  mealIndex,
  mealType,
  canRemove,
  onRemove,
  onUpdateMeal,
  onAddFood,
  onRemoveFood,
  onUpdateFood,
}: MealEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-base font-semibold">Opção {mealIndex + 1}</Label>
          <Badge variant="outline" className={mealTypeColors[mealType]}>
            {mealTypeLabels[mealType]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      {/* Meal Type Selector */}
      <div className="space-y-2">
        <Label>Tipo de Refeição</Label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(mealTypeLabels).map(([type, label]) => {
            const Icon = mealTypeIcons[type]
            const isSelected = meal.options_type === type
            return (
              <Badge
                key={type}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  isSelected ? mealTypeColors[type] : 'hover:bg-muted'
                }`}
                onClick={() => onUpdateMeal("options_type" as keyof Meal, type)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </Badge>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`meal-name-${meal.id}`}>Nome da Refeição</Label>
          <Input
            id={`meal-name-${meal.id}`}
            placeholder="Ex: Café da Manhã"
            value={meal.name}
            onChange={(e) => onUpdateMeal("name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`meal-time-${meal.id}`}>Horário</Label>
          <Input
            id={`meal-time-${meal.id}`}
            type="time"
            value={meal.time}
            onChange={(e) => onUpdateMeal("time", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`meal-desc-${meal.id}`}>Descrição (opcional)</Label>
        <Input
          id={`meal-desc-${meal.id}`}
          placeholder="Ex: Refeição principal..."
          value={meal.description}
          onChange={(e) => onUpdateMeal("description", e.target.value)}
        />
      </div>

      <div className="space-y-3 pl-4 border-l-2 border-border">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Alimentos</Label>
          <Button onClick={onAddFood} variant="ghost" size="sm">
            <Plus className="h-3 w-3 mr-1" />
            Adicionar Alimento
          </Button>
        </div>

        {meal.foods.map((food, foodIndex) => (
          <FoodItemEditor
            key={food.id}
            food={food}
            foodIndex={foodIndex}
            canRemove={meal.foods.length > 1}
            onRemove={() => onRemoveFood(food.id)}
            onUpdate={(field, value) => onUpdateFood(food.id, field, value)}
          />
        ))}
      </div>
    </div>
  )
}
