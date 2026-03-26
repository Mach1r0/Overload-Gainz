from django.db import models
from django.conf import settings

class FoodItem(models.Model):
    CATEGORY = [ 
        ('FRT', 'Fruit'),
        ('VEG', 'Vegetable'),
        ('GRN', 'Grain'),
        ('PRN', 'Protein'),
        ('DRY', 'Dairy'),
        ('FAT', 'Fat & Oil'),
        ('OTH', 'Other'),
    ]

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    calories = models.IntegerField(help_text="Calories per 100g")
    protein = models.FloatField(help_text="Protein per 100g")
    carbs = models.FloatField(help_text="Carbs per 100g")
    fats = models.FloatField(help_text="Fats per 100g")
    category = models.CharField(max_length=5, choices=CATEGORY)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class DietPlan(models.Model):
    GOAL = [ 
        ('BUK', 'Bulking'),
        ('CUT', 'Cutting'),
        ('MAINT', 'Maintenance'),
    ]
    
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='diet_plans')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_diet_plans')
    name = models.CharField(max_length=150)
    goal = models.CharField(max_length=5, choices=GOAL)
    description = models.TextField(blank=True, null=True)
    target_calories = models.IntegerField(blank=True, null=True, help_text="Target daily calories")
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} for {self.student.username}"

class Meal(models.Model):
    options = [ 
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
        ('cheat', 'Cheat meal'),
        ('other', 'Other'), 
    ]
    
    diet_plan = models.ForeignKey(DietPlan, on_delete=models.CASCADE, related_name='meals')
    name = models.CharField(max_length=100) 
    time = models.TimeField()
    description = models.TextField(blank=True, null=True)
    options_type = models.CharField(max_length=20, choices=options, default='other')
    
    food_items = models.ManyToManyField(
        FoodItem, 
        through='MealFoodItem', 
        related_name="meals"
    )

    def __str__(self):
        return f"{self.name} for plan '{self.diet_plan.name}'"

    @property
    def total_calories(self):
        total = 0
        for item in self.mealfooditem_set.all():
            if item.unit == 'g':
                total += (item.food_item.calories / 100.0) * item.quantity
        return total

class MealFoodItem(models.Model):
    UNIT_CHOICES = [
        ('g', 'grams'),
        ('oz', 'ounces'),
        ('ml', 'milliliters'),
        ('cup', 'cup(s)'),
        ('slice', 'slice(s)'),
        ('unit', 'unit(s)'),
    ]

    meal = models.ForeignKey(Meal, on_delete=models.CASCADE)
    food_item = models.ForeignKey(FoodItem, on_delete=models.PROTECT)
    quantity = models.FloatField()
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='g')

    def __str__(self):
        return f"{self.quantity}{self.unit} of {self.food_item.name}"
    

class MealRegistration(models.Model):
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name='registrations')
    date = models.DateField()
    consumed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('meal', 'date')

    def __str__(self):
        return f"Registration of {self.meal.name} on {self.date}"
      