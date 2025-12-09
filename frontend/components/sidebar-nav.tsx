"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Home,
  Dumbbell,
  Apple,
  Users,
  MessageSquare,
  Settings,
  TrendingUp,
  Ruler,
  Sparkles,
  BookOpen,
  PlaySquare,
  Activity,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { authApi } from "@/lib/api/auth"
import { BrandLogo } from "@/components/brand-logo"

interface SidebarNavProps {
  userType: "trainer" | "student"
}

export function SidebarNav({ userType }: SidebarNavProps) {
  const pathname = usePathname()
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    const user = authApi.getUserFromStorage()
    if (user) {
      setUserId(user.id.toString())
      setUserName(user.first_name || user.username || "")
      setUserEmail(user.email || "")
    }
  }, [])

  if (!userId) {
    return null
  }

  const trainerLinks = [
    {
      title: "Dashboard",
      href: `/trainer/${userId}/dashboard`,
      icon: Home,
    },
    {
      title: "Alunos",
      href: `/trainer/${userId}/students`,
      icon: Users,
    },
    {
      title: "Programas",
      href: `/trainer/${userId}/programs`,
      icon: BookOpen,
    },
    {
      title: "Dietas",
      href: `/trainer/${userId}/diets`,
      icon: Apple,
    },
    {
      title: "Vídeo Aulas",
      href: `/trainer/${userId}/videos`,
      icon: PlaySquare,
    },
    {
      title: "Assistente IA",
      href: `/trainer/${userId}/ai-assistant`,
      icon: MessageSquare,
    },
 
  ]

  const studentLinks = [
    {
      title: "Dashboard",
      href: `/student/${userId}/dashboard`,
      icon: Home,
    },
    {
      title: "Meus Treinos",
      href: `/student/${userId}/workout`,
      icon: Dumbbell,
    },
    {
      title: "Minha Dieta",
      href: `/student/${userId}/diet`,
      icon: Apple,
    },
    {
      title: "Vídeo Aulas",
      href: `/student/${userId}/videos`,
      icon: PlaySquare,
    },
    {
      title: "Progresso",
      href: `/student/${userId}/progress`,
      icon: TrendingUp,
    },
    {
      title: "Assistente IA",
      href: `/student/${userId}/ai-assistant`,
      icon: MessageSquare,
    },
    {
      title: "Medidas",
      href: `/student/${userId}/measurements`,
      icon: Ruler,
    },
  ]

  const links = userType === "trainer" ? trainerLinks : studentLinks

  const dashboardUrl = userType === "trainer" 
    ? `/trainer/${userId}/dashboard` 
    : `/student/${userId}/dashboard`

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-[#0b1424] text-slate-100 border-r border-slate-800/70">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-slate-800/70 px-4">
          <Link href={dashboardUrl} className="flex items-center gap-2">
            <BrandLogo className="h-10 w-auto" />
          </Link>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-200">{userType === "trainer" ? "Coach" : "Aluno"}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            <p className="px-2 text-xs uppercase tracking-[0.18em] text-slate-500">Navegação</p>
            {links.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + "/")
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-base font-semibold transition-all",
                    isActive
                      ? "bg-gradient-to-r from-sky-700/80 via-indigo-500/70 to-cyan-400/60 text-white shadow-lg shadow-sky-900/25"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <link.icon className="h-6 w-6" />
                  <span>{link.title}</span>
                </Link>
              )
            })}
          </div>

        
        </div>

        <div className="border-t border-slate-800/70 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/70 px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-700 to-cyan-400 text-white text-sm font-bold">
              {userName ? userName.charAt(0).toUpperCase() : userType === "trainer" ? "PT" : "AL"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold text-white">{userName || (userType === "trainer" ? "Personal Trainer" : "Aluno")}</p>
              <p className="truncate text-xs text-slate-400">{userEmail || (userType === "trainer" ? "trainer@fitpro.com" : "aluno@fitpro.com")}</p>
            </div>
            <Settings className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>
    </aside>
  )
}
