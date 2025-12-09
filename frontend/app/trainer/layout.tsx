import type React from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { TopHeader } from "@/components/top-header"
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute"

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleProtectedRoute allowedRole="teacher">
      <div className="flex min-h-screen">
        <SidebarNav userType="trainer" />
        <div className="flex-1 pl-72">
          <TopHeader />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </RoleProtectedRoute>
  )
}
