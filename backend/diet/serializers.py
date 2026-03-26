from rest_framework import serializers
from .models import Meal, DietPlan, MealFoodItem, FoodItem
from users.serializers import UserSerializer
from django.contrib.auth import get_user_model

class FoodItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = ['id', 'name', 'calories', 'protein', 'carbs', 'fats', 'category']
        read_only_fields = ['created_at', 'updated_at', 'id']

class MealFoodItemSerializer(serializers.ModelSerializer):
    food_item = FoodItemSerializer(read_only=True)
    food_item_id = serializers.PrimaryKeyRelatedField(queryset=FoodItem.objects.all(), source='food_item', write_only=True, required=False)
    
    food_name = serializers.CharField(write_only=True, required=False)
    food_calories = serializers.IntegerField(write_only=True, required=False)
    food_protein = serializers.FloatField(write_only=True, required=False)
    food_carbs = serializers.FloatField(write_only=True, required=False)
    food_fats = serializers.FloatField(write_only=True, required=False)

    class Meta:
        model = MealFoodItem
        fields = ['id', 'food_item', 'food_item_id', 'quantity', 'unit', 
                  'food_name', 'food_calories', 'food_protein', 'food_carbs', 'food_fats']

class MealSerializer(serializers.ModelSerializer):
    food_items = serializers.SerializerMethodField()
    total_calories = serializers.ReadOnlyField()
    diet_plan_id = serializers.PrimaryKeyRelatedField(queryset=DietPlan.objects.all(), source='diet_plan', write_only=True, required=False)

    class Meta: 
        model = Meal 
        fields = ['id', 'options_type', 'diet_plan_id', 'name', 'time', 'description', 'food_items', 'total_calories']
    
    def get_food_items(self, obj):
        meal_food_items = obj.mealfooditem_set.all()
        return MealFoodItemSerializer(meal_food_items, many=True).data

class MealCreateSerializer(serializers.ModelSerializer):
    foods = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)

    class Meta:
        model = Meal
        fields = ['id', 'name', 'time', 'description', 'options_type', 'foods']

    def create(self, validated_data):
        foods_data = validated_data.pop('foods', [])
        meal = Meal.objects.create(**validated_data)
        
        for food_data in foods_data:
            food_name = food_data.get('name', '')
            if not food_name:
                continue
                
            food_item, created = FoodItem.objects.get_or_create(
                name=food_name,
                defaults={
                    'calories': int(food_data.get('calories', 0)),
                    'protein': float(food_data.get('protein', 0)),
                    'carbs': float(food_data.get('carbs', 0)),
                    'fats': float(food_data.get('fat', 0)),
                    'category': 'OTH',
                }
            )
            
            MealFoodItem.objects.create(
                meal=meal,
                food_item=food_item,
                quantity=float(food_data.get('quantity', 0)),
                unit=food_data.get('unit', 'g')
            )
        
        return meal

class DietPlanSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    teacher = UserSerializer(read_only=True)
    meals = MealSerializer(many=True, read_only=True)

    class Meta:
        model = DietPlan
        fields = [
            'id',
            'student',
            'teacher',
            'name',
            'goal',
            'description',
            'target_calories',
            'start_date',
            'end_date',
            'is_active',
            'meals',
        ]
        read_only_fields = ['id', 'student', 'teacher', 'start_date', 'end_date', 'is_active']

class DietPlanCreateSerializer(serializers.ModelSerializer):
    meals = MealCreateSerializer(many=True, write_only=True, required=False)
    student_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = DietPlan
        fields = [
            'id',
            'student_id',
            'name',
            'goal',
            'description',
            'target_calories',
            'start_date',
            'end_date',
            'meals',
        ]
    
    def create(self, validated_data):
        meals_data = validated_data.pop('meals', [])
        student_id = validated_data.pop('student_id')
        
        teacher = self.context['request'].user
        
        User = get_user_model()
        try:
            student = User.objects.get(id=student_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"student_id": "User not found. Send a valid user id (not student id)."})
        
        diet_plan = DietPlan.objects.create(
            student=student,
            teacher=teacher,
            **validated_data
        )
        
        for meal_data in meals_data:
            meal_data['diet_plan'] = diet_plan
            meal_serializer = MealCreateSerializer(data=meal_data)
            if meal_serializer.is_valid():
                meal_serializer.save(diet_plan=diet_plan)
        
        return diet_plan
    
    def update(self, instance, validated_data):
        meals_data = validated_data.pop('meals', [])
        student_id = validated_data.pop('student_id', None)
        
        # Update basic fields
        instance.name = validated_data.get('name', instance.name)
        instance.goal = validated_data.get('goal', instance.goal)
        instance.description = validated_data.get('description', instance.description)
        instance.target_calories = validated_data.get('target_calories', instance.target_calories)
        instance.start_date = validated_data.get('start_date', instance.start_date)
        instance.end_date = validated_data.get('end_date', instance.end_date)
        
        if student_id:
            User = get_user_model()
            instance.student = User.objects.get(id=student_id)
        
        instance.save()
        
        # Delete existing meals
        instance.meals.all().delete()
        
        # Create new meals
        for meal_data in meals_data:
            meal_data['diet_plan'] = instance
            meal_serializer = MealCreateSerializer(data=meal_data)
            if meal_serializer.is_valid():
                meal_serializer.save(diet_plan=instance)
        
        return instance

    def to_representation(self, instance):
        return DietPlanSerializer(instance, context=self.context).data