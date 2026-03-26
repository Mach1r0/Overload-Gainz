from django.db.models import Q
from rest_framework import viewsets, permissions

from .models import DietPlan, Meal, MealFoodItem, FoodItem
from .serializers import (
    DietPlanSerializer,
    DietPlanCreateSerializer,
    MealSerializer,
    MealFoodItemSerializer,
    FoodItemSerializer,
)


class MealViewSet(viewsets.ModelViewSet):
    queryset = Meal.objects.all()  # basename hint para o router
    serializer_class = MealSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Meal.objects.filter(
            Q(diet_plan__teacher=self.request.user) | Q(diet_plan__student=self.request.user)
        )


class DietPlanViewSet(viewsets.ModelViewSet):
    queryset = DietPlan.objects.all()  # basename hint para o router
    serializer_class = DietPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        is_active = self.request.query_params.get('is_active')

        # Teacher vê os planos que criou; student vê os planos atribuídos a ele.
        qs = DietPlan.objects.filter(Q(teacher=user) | Q(student=user))

        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')

        return qs

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return DietPlanCreateSerializer
        return DietPlanSerializer


class MealFoodItemViewSet(viewsets.ModelViewSet):
    queryset = MealFoodItem.objects.all()  # basename hint para o router
    serializer_class = MealFoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MealFoodItem.objects.filter(
            Q(meal__diet_plan__teacher=self.request.user)
            | Q(meal__diet_plan__student=self.request.user)
        )


class FoodItemViewSet(viewsets.ModelViewSet):
    # Catálogo público — qualquer usuário autenticado pode ler.
    queryset = FoodItem.objects.all()
    serializer_class = FoodItemSerializer
    permission_classes = [permissions.IsAuthenticated]
