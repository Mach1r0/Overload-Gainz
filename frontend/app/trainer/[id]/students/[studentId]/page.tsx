import { NavHeader } from "@/components/nav-header"
import { StudentDetailTabs } from "@/components/student-detail-tabs"

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string; studentId: string }> }) {
  const { studentId, id: trainerId } = await params
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <StudentDetailTabs studentId={studentId} trainerId={trainerId} />
      </main>
    </div>
  )
}
