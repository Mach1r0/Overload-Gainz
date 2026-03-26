import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, GripVertical, Trash2 } from "lucide-react"
import { mealTypeLabels, mealTypeIcons, mealTypeColors, type Meal } from "@/lib/constants/meal-types"
import { MealEditor } from "./meal-editor"

interface MealGroupEditorProps {
  meals: Meal[]
  onAddMeal: () => void
  onRemoveMeal: (mealId: string | number) => void
  onUpdateMeal: (mealId: string | number, field: keyof Meal, value: string) => void
  onAddFood: (mealId: string | number) => void
  onRemoveFood: (mealId: string | number, foodId: string | number) => void
  onUpdateFood: (mealId: string | number, foodId: string | number, field: string, value: string) => void
}

export function MealGroupEditor({
  meals,
  onAddMeal,
  onRemoveMeal,
  onUpdateMeal,
  onAddFood,
  onRemoveFood,
  onUpdateFood,
}: MealGroupEditorProps) {
  const mealsByType = meals.reduce((groups: Record<string, Meal[]>, meal) => {
    const type = meal.options_type || 'other'
    if (!groups[type]) groups[type] = []
    groups[type].push(meal)
    return groups
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Refeições</h2>
        <Button onClick={onAddMeal} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Refeição
        </Button>
      </div>

      {Object.entries(mealsByType).map(([mealType, mealsInGroup]) => {
        const MealIcon = mealTypeIcons[mealType]
        
        return (
          <Card key={mealType} className="p-4 bg-card border-border">
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${mealTypeColors[mealType].split(' ').slice(0, 2).join(' ')}`}>
                  <MealIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{mealTypeLabels[mealType]}</h3>
                  <p className="text-sm text-muted-foreground">
                    {mealsInGroup.length} {mealsInGroup.length === 1 ? 'opção' : 'opções'}
                  </p>
                </div>
              </div>

              {mealsInGroup.map((meal, mealIndex) => (
                <div key={meal.id} className="space-y-4 p-4 bg-muted/20 rounded-lg border border-border">
                  <div className="flex items-start gap-3">
                    <div className="mt-6 cursor-move">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1">
                      <MealEditor
                        meal={meal}
                        mealIndex={mealIndex}
                        mealType={mealType}
                        canRemove={mealsInGroup.length > 1}
                        onRemove={() => onRemoveMeal(meal.id)}
                        onUpdateMeal={(field, value) => onUpdateMeal(meal.id, field, value)}
                        onAddFood={() => onAddFood(meal.id)}
                        onRemoveFood={(foodId) => onRemoveFood(meal.id, foodId)}
                        onUpdateFood={(foodId, field, value) => onUpdateFood(meal.id, foodId, field, value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      })}

      <Button onClick={onAddMeal} variant="outline" className="w-full bg-transparent">
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Refeição
      </Button>
    </div>
  )
}
