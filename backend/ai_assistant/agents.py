"""
Definição dos agentes CrewAI do Overload Gainz.
"""
from crewai import Agent
from ai_assistant.tools import (
    GetStudentProfileTool,
    GetStudentProgressTool,
    GetStudentWorkoutTool,
    GetStudentDietTool,
    GetExercisesTool,
    GetFoodItemsTool,
)


def _llm():
    from django.conf import settings
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        model=settings.OPENAI_MODEL,
        temperature=0.7,
        api_key=settings.OPENAI_API_KEY,
    )


def fitness_coach_agent() -> Agent:
    return Agent(
        role='Personal Trainer Especialista',
        goal=(
            'Criar e ajustar programas de treino personalizados baseados no perfil, '
            'objetivos e histórico do aluno.'
        ),
        backstory=(
            'Você é personal trainer certificado com 15 anos de experiência em musculação, '
            'crossfit e condicionamento físico. Domina periodização, progressão de carga e '
            'prevenção de lesões. Seus programas são fundamentados em ciência e adaptados '
            'à realidade de cada aluno.'
        ),
        tools=[
            GetStudentProfileTool(),
            GetStudentProgressTool(),
            GetStudentWorkoutTool(),
            GetExercisesTool(),
        ],
        llm=_llm(),
        verbose=True,
        allow_delegation=False,
    )


def nutritionist_agent() -> Agent:
    return Agent(
        role='Nutricionista Esportivo',
        goal=(
            'Criar e ajustar planos alimentares que maximizem resultados fitness '
            'com base nos objetivos e dados corporais do aluno.'
        ),
        backstory=(
            'Você é nutricionista esportivo especializado em performance atlética e composição '
            'corporal. Domina estratégias de bulking, cutting e manutenção, além de timing '
            'nutricional e suplementação baseada em evidências.'
        ),
        tools=[
            GetStudentProfileTool(),
            GetStudentDietTool(),
            GetFoodItemsTool(),
        ],
        llm=_llm(),
        verbose=True,
        allow_delegation=False,
    )


def progress_analyst_agent() -> Agent:
    return Agent(
        role='Analista de Progresso Fitness',
        goal=(
            'Analisar dados de progresso do aluno, identificar tendências '
            'e fornecer insights acionáveis.'
        ),
        backstory=(
            'Você é especialista em fisiologia do exercício e análise de dados fitness. '
            'Analisa composição corporal, performance e aderência ao treino para identificar '
            'o que está funcionando e o que precisa de ajuste.'
        ),
        tools=[
            GetStudentProfileTool(),
            GetStudentProgressTool(),
            GetStudentWorkoutTool(),
            GetStudentDietTool(),
        ],
        llm=_llm(),
        verbose=True,
        allow_delegation=False,
    )


def coordinator_agent() -> Agent:
    return Agent(
        role='Coordenador de Saúde e Performance',
        goal=(
            'Integrar análises de treino, nutrição e progresso num plano de ação '
            'coeso com metas SMART e prioridades claras.'
        ),
        backstory=(
            'Você é coordenador sênior de saúde e performance. Integra recomendações de '
            'diferentes especialistas, define prioridades e cria roadmaps de evolução '
            'realistas e motivadores.'
        ),
        tools=[GetStudentProfileTool()],
        llm=_llm(),
        verbose=True,
        allow_delegation=True,
    )
