import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { type Food } from "@/lib/constants/meal-types"

interface FoodItemEditorProps {
  food: Food
  foodIndex: number
  canRemove: boolean
  onRemove: () => void
  onUpdate: (field: keyof Food, value: string) => void
}

export function FoodItemEditor({
  food,
  foodIndex,
  canRemove,
  onRemove,
  onUpdate,
}: FoodItemEditorProps) {
  return (
    <div className="space-y-3 p-3 bg-background rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Alimento {foodIndex + 1}</span>
        {canRemove && (
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`food-name-${food.id}`} className="text-xs">
            Nome
          </Label>
          <Input
            id={`food-name-${food.id}`}
            placeholder="Ex: Aveia"
            value={food.name}
            onChange={(e) => onUpdate("name", e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor={`food-quantity-${food.id}`} className="text-xs">
              Qtd
            </Label>
            <Input
              id={`food-quantity-${food.id}`}
              type="number"
              placeholder="100"
              value={food.quantity}
              onChange={(e) => onUpdate("quantity", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`food-unit-${food.id}`} className="text-xs">
              Unidade
            </Label>
            <Select
              value={food.unit}
              onValueChange={(value) => onUpdate("unit", value)}
            >
              <SelectTrigger id={`food-unit-${food.id}`} className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">g</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="un">un</SelectItem>
                <SelectItem value="col">col</SelectItem>
                <SelectItem value="xic">xíc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`food-calories-${food.id}`} className="text-xs">
            Calorias
          </Label>
          <Input
            id={`food-calories-${food.id}`}
            type="number"
            placeholder="150"
            value={food.calories}
            onChange={(e) => onUpdate("calories", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`food-protein-${food.id}`} className="text-xs">
            Prot (g)
          </Label>
          <Input
            id={`food-protein-${food.id}`}
            type="number"
            placeholder="5"
            value={food.protein}
            onChange={(e) => onUpdate("protein", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`food-carbs-${food.id}`} className="text-xs">
            Carb (g)
          </Label>
          <Input
            id={`food-carbs-${food.id}`}
            type="number"
            placeholder="25"
            value={food.carbs}
            onChange={(e) => onUpdate("carbs", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`food-fat-${food.id}`} className="text-xs">
            Gord (g)
          </Label>
          <Input
            id={`food-fat-${food.id}`}
            type="number"
            placeholder="3"
            value={food.fat}
            onChange={(e) => onUpdate("fat", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
