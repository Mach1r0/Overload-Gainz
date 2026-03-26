"use client"

interface MuscleRadarChartProps {
  muscleGroupCounts: Record<string, number>
}

export function MuscleRadarChart({ muscleGroupCounts }: MuscleRadarChartProps) {
  // Agrupar músculos em categorias principais para o gráfico radar
  const categories = [
    { name: "Core", groups: ["Abdominais", "Lombar"] },
    { name: "Ombros", groups: ["Ombros", "Trapézio"] },
    { name: "Braços", groups: ["Bíceps", "Tríceps", "Antebraços"] },
    { name: "Pernas", groups: ["Quadríceps", "Isquiotibiais", "Panturrilhas", "Glúteos", "Abdutores", "Adutores"] },
    { name: "Costas", groups: ["Dorsais", "Costas Superior"] },
    { name: "Peito", groups: ["Peito"] },
  ]

  // Calcular valores para cada categoria
  const categoryValues = categories.map(cat => {
    const total = cat.groups.reduce((sum, group) => sum + (muscleGroupCounts[group] || 0), 0)
    return { name: cat.name, value: total }
  })

  // Encontrar o valor máximo para normalização
  const maxValue = Math.max(...categoryValues.map(c => c.value), 1)

  // Configurações do gráfico
  const centerX = 100
  const centerY = 100
  const maxRadius = 70
  const numPoints = categories.length
  const angleStep = (2 * Math.PI) / numPoints
  const startAngle = -Math.PI / 2 // Começar do topo

  // Calcular pontos do polígono externo (background)
  const outerPoints = categories.map((_, i) => {
    const angle = startAngle + i * angleStep
    return {
      x: centerX + maxRadius * Math.cos(angle),
      y: centerY + maxRadius * Math.sin(angle),
    }
  })

  // Calcular pontos do polígono de dados
  const dataPoints = categoryValues.map((cat, i) => {
    const angle = startAngle + i * angleStep
    const normalizedValue = cat.value / maxValue
    const radius = Math.max(normalizedValue * maxRadius, 10) // Mínimo de 10 para sempre mostrar algo
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  })

  // Calcular posições dos labels
  const labelPositions = categories.map((cat, i) => {
    const angle = startAngle + i * angleStep
    const labelRadius = maxRadius + 18
    return {
      x: centerX + labelRadius * Math.cos(angle),
      y: centerY + labelRadius * Math.sin(angle),
      name: cat.name,
      value: categoryValues[i].value,
      anchor: angle > Math.PI / 2 && angle < (3 * Math.PI) / 2 ? "end" : angle < -Math.PI / 2 || angle > Math.PI / 2 ? "end" : "start",
    }
  })

  // Gerar linhas de grade (3 níveis)
  const gridLevels = [0.33, 0.66, 1]
  const gridPolygons = gridLevels.map(level => {
    return categories.map((_, i) => {
      const angle = startAngle + i * angleStep
      return {
        x: centerX + (maxRadius * level) * Math.cos(angle),
        y: centerY + (maxRadius * level) * Math.sin(angle),
      }
    })
  })

  const hasData = categoryValues.some(c => c.value > 0)

  return (
    <div className="text-center text-muted-foreground text-sm w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-full h-full max-w-[180px]">
        {/* Grade de fundo */}
        {gridPolygons.map((polygon, idx) => (
          <polygon
            key={`grid-${idx}`}
            points={polygon.map(p => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.2"
          />
        ))}

        {/* Linhas do centro para os vértices */}
        {outerPoints.map((point, idx) => (
          <line
            key={`line-${idx}`}
            x1={centerX}
            y1={centerY}
            x2={point.x}
            y2={point.y}
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.2"
          />
        ))}

        {/* Polígono de dados */}
        {hasData && (
          <polygon
            points={dataPoints.map(p => `${p.x},${p.y}`).join(" ")}
            className="fill-primary/30 stroke-primary"
            strokeWidth="2"
          />
        )}

        {/* Polígono externo */}
        <polygon
          points={outerPoints.map(p => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Labels */}
        {labelPositions.map((label, idx) => {
          // Ajustar anchor baseado na posição
          let textAnchor: "start" | "middle" | "end" = "middle"
          let dx = 0
          
          if (idx === 1) { // Ombros (direita superior)
            textAnchor = "start"
            dx = 5
          } else if (idx === 2) { // Braços (direita inferior)
            textAnchor = "start"
            dx = 5
          } else if (idx === 4) { // Costas (esquerda inferior)
            textAnchor = "end"
            dx = -5
          } else if (idx === 5) { // Peito (esquerda superior)
            textAnchor = "end"
            dx = -5
          }

          return (
            <text
              key={`label-${idx}`}
              x={label.x + dx}
              y={label.y}
              textAnchor={textAnchor}
              className="text-[9px] fill-current"
              dominantBaseline="middle"
            >
              {label.name}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
