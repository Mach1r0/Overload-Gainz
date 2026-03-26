# CLAUDE.md — Contexto do projeto Overload Gainz

Este arquivo fornece contexto permanente para auxiliar nas modificações futuras do projeto.

---

## O que é o projeto

Plataforma fitness SaaS com dois perfis: **Trainer** (personal trainer) e **Student** (aluno). Um trainer principal pode cadastrar instrutores subordinados e distribuir alunos entre eles via fila automática (RabbitMQ/Celery). A IA (CrewAI) gera recomendações personalizadas de treino e nutrição.

---

## Arquitetura geral

```
frontend (Next.js 15 / React 19)  →  backend (Django 5.2 / DRF 3.16)
                                       ├── Celery Worker (tarefas assíncronas)
                                       ├── Celery Beat (tarefas periódicas)
                                       ├── RabbitMQ (broker de filas)
                                       └── Redis (cache + result backend)
```

---

## Backend — convenções críticas

### Modelos e apps
| App | Responsabilidade |
|-----|-----------------|
| `users` | Modelo `User` customizado (is_teacher / is_student), login JWT, password reset |
| `teachers` | Modelo `Teacher` (FK para User), `TeacherStudents` (relação M2M com aluno) |
| `student` | Modelo `Student` (FK para User) |
| `training` | `Training` (plano), `Workout` (dia), `WorkoutExercise` (exercício no treino) |
| `exercises` | Catálogo de exercícios com músculos, categoria, nível |
| `diet` | `DietPlan`, `Meal`, `MealFoodItem`, `FoodItem` |
| `tracking` | `WorkoutSession`, `ExerciseLog`, `SetLog` |
| `analytics` | `BodyMeasurement`, `ProgressPhoto`, `PersonalRecord` |
| `videoLesson` | `VideoLesson` com suporte a arquivo ou URL YouTube + `view_count` |
| `queue_management` | `StudentQueue` — distribuição automática de alunos entre trainers |
| `ai_assistant` | Agentes CrewAI: fitness_coach, nutritionist, progress_analyst, coordinator |

### Segurança — isolamento de dados
**CRÍTICO:** Todo ViewSet que retorna dados sensíveis DEVE filtrar por `request.user`.

Padrão usado:
```python
# Para modelos com campo user direto:
class OwnedByUserMixin:
    owner_field = 'user'
    def get_queryset(self):
        return super().get_queryset().filter(**{self.owner_field: self.request.user})

# Para modelos com relação indireta (ex: DietPlan tem teacher e student):
def get_queryset(self):
    user = self.request.user
    return DietPlan.objects.filter(Q(teacher=user) | Q(student=user))
```

O mixin está em `backend/core/mixins.py`. Nunca aceitar `?user=`, `?student=` ou `?teacher=` como filtro direto do request — isso é uma brecha de segurança conhecida.

### Autenticação
- JWT via `djangorestframework-simplejwt`
- Access token: 60 min | Refresh token: 7 dias com rotação
- Endpoints: `POST /api/auth/login/`, `POST /api/token/refresh/`
- Password reset: `POST /api/auth/password-reset/` → retorna `{uid, token}` → `POST /api/auth/password-reset/confirm/` com `{uid, token, new_password}`

### URLs da API
```
/api/auth/          → users/urls.py
/api/analytics/     → analytics/urls.py
/api/diet/          → diet/urls.py  (rotas adicionais de meal)
/api/training/      → training/urls.py
/api/tracking/      → tracking/urls.py
/api/trainer/       → teachers/urls.py
/api/queue/         → queue_management/urls.py
/api/ai/            → ai_assistant/urls.py
/api/exercises/     → router (ExerciseViewSet)
/api/diet-plans/    → router (DietPlanViewSet)
/api/meals/         → router (MealViewSet)
/api/food-items/    → router (FoodItemViewSet)
/api/video-lessons/ → router (VideoLessonViewSet)
/api/students/      → router (StudentViewSet)
/api/feedback/      → router (FeedbackViewSet)
/api/docs/          → Swagger UI
/api/redoc/         → ReDoc
```

### Celery
- Broker: RabbitMQ (`CELERY_BROKER_URL`)
- Result backend: Redis (`CELERY_RESULT_BACKEND`)
- Tasks: `queue_management/tasks.py` (distribuição de alunos), `ai_assistant/tasks.py` (análise IA)
- Sinais de task (success/failure/retry) logados automaticamente em `core/celery.py`

### Testes
- Framework: pytest + pytest-django
- Config: `backend/pyproject.toml` → `[tool.pytest.ini_options]`
- Fixtures compartilhadas: `backend/conftest.py`
  - `teacher_user`, `teacher_user_b`, `student_user`, `student_user_b`
  - `teacher_profile`, `student_profile`, `teacher_profile_b`, `student_profile_b`
  - `auth_client_teacher`, `auth_client_student`, etc.
- **Atenção:** `Training` e `Workout` recebem instâncias de `Student`/`Teacher`, não de `User`
- **Atenção:** `WorkoutExercise.rest_time` é `DurationField` — usar `timedelta(minutes=1)`, não string
- Rodar: `docker compose exec backend python -m pytest -v`
- Suite atual: **41 testes, 100% passando**

### Banco de dados
- Dev: SQLite (`db.sqlite3`)
- Prod: PostgreSQL via `DATABASE_URL=postgres://user:pass@host:5432/db`
- O settings.py detecta automaticamente pelo prefixo da URL

---

## Frontend — convenções críticas

### Estrutura de rotas
```
app/
├── auth/forgot-password/   → page, reset (uid+token via sessionStorage)
├── login/
├── register/
├── trainer/[id]/           → dashboard, students, programs, diets, videos, workouts, ai-assistant
└── student/[id]/           → dashboard, workout, diet, measurements, progress, videos, ai-assistant
```

### API Client
- Axios configurado em `frontend/lib/api/client.ts`
- Base URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000/api`)
- Interceptor de request: adiciona `Bearer <token>` do localStorage
- Interceptor de response: tenta refresh automático em 401

### Arquivos de API por domínio
| Arquivo | Responsabilidade |
|---------|-----------------|
| `lib/api/auth.ts` | Login, registro, password reset, tokens |
| `lib/api/videos.ts` | VideoLesson CRUD + incrementVideoView |
| `lib/api/diets.ts` | DietPlan, Meal, FoodItem |
| `lib/api/routines.ts` | Training, Workout, exercícios |
| `lib/api/teachers.ts` | Perfil do trainer, alunos |
| `lib/api/trainer-students.ts` | Listagens de alunos por status |
| `lib/api/client.ts` | Axios base + interceptors |

### Padrões de loading e erro
- Loading: usar componentes de `components/page-skeleton.tsx` (`PageSkeleton`, `ListSkeleton`, `FormSkeleton`)
- Erro de rota: `app/error.tsx` (com reset)
- Erro global: `app/global-error.tsx`
- 404: `app/not-found.tsx`
- Toasts: hook `useToast` de `@/hooks/use-toast`

### Autenticação no frontend
- Tokens em `localStorage`: `access_token`, `refresh_token`, `user`, `user_type`
- Hook: `useAuth` de `@/hooks/useAuth`
- Redirecionamento automático em 401 via interceptor do Axios

---

## Docker / Infra

| Arquivo | Uso |
|---------|-----|
| `docker-compose.yml` | Desenvolvimento (SQLite, runserver, hot-reload) |
| `docker-compose.prod.yml` | Produção (PostgreSQL, Gunicorn, restart always) |
| `backend/Dockerfile` | Python 3.11-slim + Poetry (sem grupo dev) |
| `frontend/Dockerfile` | Node + pnpm |

**Importante:** A imagem do backend usa `poetry install --without dev`, então pytest não está disponível na imagem de produção. Para rodar testes, instalar manualmente: `pip install pytest pytest-django`.

---

## CI

`.github/workflows/ci.yml` — roda em push para `main` e `develop`:
1. **backend**: Poetry install `--with dev`, migrate, pytest
2. **frontend**: pnpm install, `lint:ci` (zero warnings), build
3. **docker**: build da imagem do backend

---

## Decisões de arquitetura tomadas

- **Sem mock de banco em testes** — todos os testes usam SQLite real via pytest-django
- **Password reset** retorna `uid` e `token` diretamente na response (aceitável em DEBUG; em produção enviar por e-mail via Celery)
- **increment-view** usa `F()` expression + `update()` atômico para evitar race conditions
- **OwnedByUserMixin** centraliza o isolamento de dados — não duplicar lógica nos ViewSets
- **PostgreSQL** ativado automaticamente quando `DATABASE_URL` começa com `postgres`
- **Logging** usa formato JSON em produção (`DEBUG=False`) e verbose em dev

---

## O que ainda pode ser feito (fora do escopo atual)

- Envio real de e-mail no password reset (configurar `EMAIL_BACKEND` + Celery task)
- WebSocket para mensagens em tempo real (hoje a página de mensagens não existe)
- Testes de integração frontend (Playwright ou Cypress)
- Nginx como reverse proxy na frente do Gunicorn em produção
- Monitoramento de Celery com Flower (`pip install flower`)
- Migração do `user_type` para grupos Django (`django.contrib.auth.models.Group`)
