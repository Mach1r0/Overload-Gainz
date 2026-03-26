from django.contrib import admin
from queue_management.models import StudentQueue


@admin.register(StudentQueue)
class StudentQueueAdmin(admin.ModelAdmin):
    list_display = ['student', 'status', 'priority', 'assigned_trainer', 'created_at', 'assigned_at']
    list_filter = ['status']
    search_fields = ['student__user__username', 'student__user__email']
    ordering = ['-priority', 'created_at']
    readonly_fields = ['created_at', 'updated_at', 'assigned_at']
    actions = ['reset_to_pending']

    @admin.action(description='Redefinir selecionados como Pendente')
    def reset_to_pending(self, request, queryset):
        queryset.update(
            status=StudentQueue.STATUS_PENDING,
            assigned_trainer=None,
            assigned_at=None,
        )
