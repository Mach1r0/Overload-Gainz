"""
Montagem das Crews CrewAI para diferentes cenários de análise.
"""
from crewai import Task, Crew, Process
from ai_assistant.agents import (
    fitness_coach_agent,
    nutritionist_agent,
    progress_analyst_agent,
    coordinator_agent,
)


def run_full_analysis(student_id: int) -> str:
    """
    Crew completa: analista de progresso + coach + nutricionista + coordenador.
    Gera plano de ação completo para as próximas 4 semanas.
    """
    analyst = progress_analyst_agent()
    coach = fitness_coach_agent()
    nutritionist = nutritionist_agent()
    coordinator = coordinator_agent()

    t_progress = Task(
        description=(
            f'Analise o progresso do aluno ID {student_id}. '
            'Identifique tendências de peso, composição corporal e aderência. '
            'Aponte o que está funcionando e o que precisa de atenção.'
        ),
        expected_output=(
            'Relatório de progresso com resumo da evolução, pontos fortes, '
            'áreas de melhoria e principais insights.'
        ),
        agent=analyst,
    )

    t_training = Task(
        description=(
            f'Com base no perfil e progresso do aluno ID {student_id}, '
            'avalie o plano de treino atual e sugira ajustes concretos ou um novo programa.'
        ),
        expected_output=(
            'Avaliação do treino com ajustes específicos: exercícios, séries, '
            'repetições, frequência semanal e progressão.'
        ),
        agent=coach,
        context=[t_progress],
    )

    t_nutrition = Task(
        description=(
            f'Com base no perfil e progresso do aluno ID {student_id}, '
            'avalie o plano alimentar e sugira ajustes direcionados ao objetivo.'
        ),
        expected_output=(
            'Avaliação da dieta com sugestões: calorias, distribuição de macros, '
            'timing de refeições e alimentos recomendados.'
        ),
        agent=nutritionist,
        context=[t_progress],
    )

    t_plan = Task(
        description=(
            f'Integre as análises de progresso, treino e nutrição do aluno ID {student_id}. '
            'Crie um plano de ação para as próximas 4 semanas com metas SMART e prioridades.'
        ),
        expected_output=(
            'Plano de ação em português com: '
            '3-5 metas SMART para 4 semanas, '
            'top 3 prioridades de treino, '
            'top 3 ajustes nutricionais, '
            'e métricas de acompanhamento.'
        ),
        agent=coordinator,
        context=[t_progress, t_training, t_nutrition],
    )

    crew = Crew(
        agents=[analyst, coach, nutritionist, coordinator],
        tasks=[t_progress, t_training, t_nutrition, t_plan],
        process=Process.sequential,
        verbose=True,
    )
    return str(crew.kickoff())


def run_training_analysis(student_id: int) -> str:
    """Apenas o agente Personal Trainer analisa e recomenda treino."""
    coach = fitness_coach_agent()
    task = Task(
        description=(
            f'Analise o perfil do aluno ID {student_id} e crie recomendações detalhadas '
            'de treino considerando objetivos, nível atual e exercícios disponíveis.'
        ),
        expected_output=(
            'Recomendações de treino: programa sugerido, exercícios com séries/repetições, '
            'frequência semanal e dicas de execução.'
        ),
        agent=coach,
    )
    crew = Crew(agents=[coach], tasks=[task], process=Process.sequential, verbose=True)
    return str(crew.kickoff())


def run_nutrition_analysis(student_id: int) -> str:
    """Apenas o agente Nutricionista analisa e recomenda dieta."""
    nutritionist = nutritionist_agent()
    task = Task(
        description=(
            f'Analise o perfil do aluno ID {student_id} e crie um plano alimentar '
            'personalizado baseado no objetivo e dados corporais.'
        ),
        expected_output=(
            'Plano alimentar: calorias-alvo, distribuição de macros, '
            'sugestão de refeições com alimentos do banco de dados e dicas práticas.'
        ),
        agent=nutritionist,
    )
    crew = Crew(agents=[nutritionist], tasks=[task], process=Process.sequential, verbose=True)
    return str(crew.kickoff())
