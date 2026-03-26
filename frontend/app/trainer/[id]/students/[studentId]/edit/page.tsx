import { NavHeader } from "@/components/nav-header"
import { StudentForm } from "@/components/student-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { userAgent } from "next/server"

export default function EditStudentPage({ params }: { params: { id: string, studentId: string } }) {
  const student = {
    id: params.studentId,
    name: "João Silva",
    email: "joao@example.com",
    phone: "(11) 98765-4321",
    age: 28,
    weight: 75.5,
    height: 1.75,
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Link
          href={`/trainer/${params.id}/students/${params.studentId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para detalhes
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Editar Aluno</h1>
          <p className="text-muted-foreground mt-2">Atualize as informações do aluno</p>
        </div>

        <StudentForm mode="edit" initialData={student} />
      </main>
    </div>
  )
}
