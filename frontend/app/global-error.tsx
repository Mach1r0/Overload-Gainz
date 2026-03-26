"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-3">Erro crítico</h2>
          <p className="text-gray-400 mb-8">
            A aplicação encontrou um erro crítico. Recarregue a página para continuar.
          </p>
          <button
            onClick={reset}
            className="px-6 py-2 bg-white text-gray-950 rounded-md font-medium hover:bg-gray-100 transition-colors"
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  )
}
