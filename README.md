# Overload Gainz

Plataforma completa de gestão fitness para personal trainers e alunos. Permite que um treinador principal gerencie múltiplos instrutores, distribua alunos via fila automatizada e ofereça recomendações personalizadas por IA.

---

## Funcionalidades principais

### Para o Trainer (Personal Trainer)
- Dashboard com visão geral de alunos, treinos e dietas
- Gerenciamento de alunos (cadastro, edição, avaliação)
- Criação e edição de programas de treino e rotinas
- Criação e edição de planos alimentares (dietas)
- Upload de vídeo-aulas (arquivo ou YouTube)
- Distribuição automática de alunos entre instrutores via fila RabbitMQ
- Assistente IA (CrewAI) para análise e recomendações de treino/nutrição

### Para o Aluno (Student)
- Dashboard com progresso, treinos e dieta ativa
- Execução de treinos com registro de séries/repetições/carga
- Visualização do plano alimentar
- Acompanhamento de medidas corporais e fotos de progresso
- Acesso às vídeo-aulas do treinador
- Assistente IA para dúvidas e recomendações

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django 5.2 + Django REST Framework 3.16 |
| Autenticação | JWT (djangorestframework-simplejwt) |
| Fila de tarefas | Celery 5.3 + RabbitMQ 3.13 |
| Cache | Redis 7.2 + django-redis |
| IA | CrewAI + LangChain + OpenAI GPT-4o-mini |
| Documentação API | drf-spectacular (Swagger + ReDoc) |
| Dependências Python | Poetry 1.8 |
| Frontend | Next.js 15 + React 19 + TypeScript |
| UI | Tailwind CSS + Radix UI (shadcn/ui) |
| HTTP Client | Axios |
| Banco (dev) | SQLite |
| Banco (prod) | PostgreSQL 16 |
| CI | GitHub Actions |
| Containerização | Docker + Docker Compose |

---

## Estrutura do projeto

```
Overload-Gainz/
├── backend/
│   ├── core/               # Settings, URLs, Celery, mixins
│   ├── users/              # Auth, login, password reset
│   ├── teachers/           # Perfil do trainer e relação com alunos
│   ├── student/            # Perfil do aluno
│   ├── training/           # Programas, treinos, exercícios de treino
│   ├── exercises/          # Catálogo de exercícios
│   ├── diet/               # Planos alimentares, refeições, alimentos
│   ├── tracking/           # Sessões de treino, logs de exercício/série
│   ├── analytics/          # Medidas corporais, fotos, PRs
│   ├── videoLesson/        # Vídeo-aulas
│   ├── queue_management/   # Fila RabbitMQ + Celery para distribuição de alunos
│   ├── ai_assistant/       # Agentes CrewAI (coach, nutricionista, analista)
│   ├── feedback/           # Avaliações
│   └── conftest.py         # Fixtures pytest compartilhadas
├── frontend/
│   ├── app/
│   │   ├── auth/           # Login, registro, forgot-password
│   │   ├── trainer/[id]/   # Dashboard, alunos, programas, dietas, vídeos, IA
│   │   └── student/[id]/   # Dashboard, treino, dieta, progresso, vídeos, IA
│   ├── components/         # Componentes reutilizáveis (UI + domínio)
│   ├── hooks/              # Hooks customizados (useAuth, useDietBuilder, etc.)
│   └── lib/api/            # Clientes de API por domínio
├── docker-compose.yml          # Desenvolvimento
├── docker-compose.prod.yml     # Produção (PostgreSQL + Gunicorn)
├── .github/workflows/ci.yml    # CI: lint + testes + build
└── .env.prod.example           # Template de variáveis de produção
```

---

## Como rodar localmente

### Pré-requisitos
- Docker e Docker Compose instalados

### 1. Configurar variáveis de ambiente

```bash
cp .env.prod.example .env
# Edite .env conforme necessário (para dev os defaults já funcionam)
```

### 2. Subir os serviços

```bash
docker compose up -d
```

Isso inicia: backend (Django), celery_worker, celery_beat, RabbitMQ, Redis e frontend (Next.js).

### 3. Acessar

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000/api/ |
| Swagger | http://localhost:8000/api/docs/ |
| ReDoc | http://localhost:8000/api/redoc/ |
| RabbitMQ UI | http://localhost:15672 (guest/guest) |

---

## Produção

```bash
cp .env.prod.example .env.prod
# Preencha TODAS as variáveis em .env.prod

docker compose -f docker-compose.prod.yml up -d
```

Diferenças em produção:
- PostgreSQL no lugar de SQLite
- Gunicorn no lugar do runserver
- `DEBUG=False`
- `collectstatic` executado automaticamente

---

## Testes (backend)

```bash
# Dentro do container
docker compose exec backend python -m pytest -v

# Ou com Poetry localmente (Python 3.11)
cd backend
poetry install --with dev
python -m pytest -v
```

Suite atual: **41 testes**, cobrindo segurança, isolamento de dados, endpoints críticos e fluxo de autenticação.

---

## API — principais endpoints

| Grupo | Prefixo |
|-------|---------|
| Auth (login, registro, password reset) | `/api/auth/` |
| Alunos | `/api/students/` |
| Trainers | `/api/trainer/` |
| Treinos e programas | `/api/training/` |
| Exercícios | `/api/exercises/` |
| Dietas | `/api/diet-plans/` `/api/meals/` `/api/food-items/` |
| Rastreamento | `/api/tracking/` |
| Analytics | `/api/analytics/` |
| Vídeo-aulas | `/api/video-lessons/` |
| Fila de alunos | `/api/queue/` |
| Assistente IA | `/api/ai/` |
| JWT | `/api/token/` `/api/token/refresh/` |
| Swagger | `/api/docs/` |

---

## CI/CD

O pipeline GitHub Actions (`.github/workflows/ci.yml`) executa em todo push para `main` e `develop`:

1. **Backend** — instala dependências via Poetry, roda migrações e executa pytest
2. **Frontend** — instala pnpm, executa `lint:ci` (zero warnings) e `build`
3. **Docker** — build da imagem do backend

---

## Variáveis de ambiente relevantes

| Variável | Descrição | Default (dev) |
|----------|-----------|---------------|
| `DJANGO_SECRET_KEY` | Chave secreta Django | insegura (só dev) |
| `DEBUG` | Modo debug | `True` |
| `DATABASE_URL` | URL PostgreSQL (prod) | SQLite se ausente |
| `CELERY_BROKER_URL` | URL RabbitMQ | `amqp://guest:guest@localhost:5672//` |
| `REDIS_URL` | URL Redis (cache) | `redis://localhost:6379/1` |
| `OPENAI_API_KEY` | Chave OpenAI para IA | vazio (IA desativada) |
| `NEXT_PUBLIC_API_URL` | URL da API para o frontend | `http://localhost:8000/api` |
