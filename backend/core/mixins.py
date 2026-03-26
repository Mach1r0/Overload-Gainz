"""
Mixins reutilizáveis para ViewSets.
"""


class OwnedByUserMixin:
    """
    Restringe o queryset aos objetos do usuário autenticado.
    Configura `owner_field` para mudar o campo de lookup (padrão: 'user').
    """
    owner_field: str = 'user'

    def get_queryset(self):
        qs = super().get_queryset()
        return qs.filter(**{self.owner_field: self.request.user})
