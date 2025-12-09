"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Apple,
  Video,
  MessageSquare,
  Settings,
  Dumbbell,
  Ruler,
  TrendingUp,
  Moon,
  Sun,
  Bell,
  Search,
} from "lucide-react"
import { authApi } from "@/lib/api/auth"
import { BrandLogo } from "@/components/brand-logo"

export function NavHeader() {
  const pathname = usePathname()
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [userName, setUserName] = useState<string>("")
  const [userId, setUserId] = useState<string>("")
  const [userType, setUserType] = useState<"trainer" | "student" | null>(null)

  useEffect(() => {
    const user = authApi.getUserFromStorage()
    if (user) {
      setUserId(user.id?.toString() || "")
      setUserName(user.first_name || user.username || "")

      if (user.is_teacher) {
        setUserType("trainer")
      } else if (user.is_student) {
        setUserType("student")
      }
    }
    const type = authApi.getUserType()
    if (type === "teacher") {
      setUserType("trainer")
    } else if (type === "trainer" || type === "student") {
      setUserType(type)
    }

    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light")
    setTheme(initialTheme)
    document.documentElement.classList.toggle("dark", initialTheme === "dark")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const navLinks = useMemo(() => {
    if (!userId) return []

    const effectiveType = userType || "trainer"

    if (effectiveType === "student") {
      return [
        {
          label: "Dashboard",
          href: userId ? `/student/${userId}/dashboard` : "/",
          icon: LayoutDashboard,
        },
        {
          label: "Meus Treinos",
          href: userId ? `/student/${userId}/workout` : "/workout",
          icon: Dumbbell,
        },
        {
          label: "Minha Dieta",
          href: userId ? `/student/${userId}/diet` : "/diet",
          icon: Apple,
        },
        {
          label: "Vídeo Aulas",
          href: userId ? `/student/${userId}/videos` : "/videos",
          icon: Video,
        },
        {
          label: "Progresso",
          href: userId ? `/student/${userId}/progress` : "/progress",
          icon: TrendingUp,
        },
        {
          label: "Assistente IA",
          href: userId ? `/student/${userId}/ai-assistant` : "/ai-assistant",
          icon: MessageSquare,
        },
        {
          label: "Medidas",
          href: userId ? `/student/${userId}/measurements` : "/measurements",
          icon: Ruler,
        },
      ]
    }

    return [
      {
        label: "Dashboard",
        href: userId ? `/trainer/${userId}/dashboard` : "/",
        icon: LayoutDashboard,
      },
      {
        label: "Alunos",
        href: userId ? `/trainer/${userId}/students` : "/students",
        icon: Users,
      },
      {
        label: "Programas",
        href: userId ? `/trainer/${userId}/programs` : "/programs",
        icon: FolderKanban,
      },
      {
        label: "Dietas",
        href: userId ? `/trainer/${userId}/diets` : "/diets",
        icon: Apple,
      },
      {
        label: "Vídeo Aulas",
        href: userId ? `/trainer/${userId}/videos` : "/videos",
        icon: Video,
      },
      {
        label: "Assistente IA",
        href: userId ? `/trainer/${userId}/ai-assistant` : "/ai-assistant",
        icon: MessageSquare,
      },
      {
        label: "Configurações",
        href: userId ? `/trainer/${userId}/settings` : "/settings",
        icon: Settings,
      },
    ]
  }, [userId, userType])

  const homeHref = (userType === "student") ? (userId ? `/student/${userId}/dashboard` : "/") : (userId ? `/trainer/${userId}/dashboard` : "/")
  const searchPlaceholder = userType === "student" ? "Buscar treinos, aulas, dieta" : "Buscar alunos, programas, dietas"

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0b1424]/95 text-slate-100 backdrop-blur supports-[backdrop-filter]:bg-[#0b1424]/85">
      {/* Top row: logo + search + actions */}
      <div className="container mx-auto flex h-14 items-center gap-4 px-4 border-b border-slate-800/70">
        <Link href={homeHref} className="flex items-center gap-3 shrink-0">
          <BrandLogo className="h-8 w-auto" />
        </Link>

        <div className="flex-1 flex items-center gap-4">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-10 h-10 rounded-md bg-slate-800/80 border border-slate-700 text-slate-100 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-sky-400"
              aria-label={searchPlaceholder}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-200 hover:bg-slate-800" aria-label="Notificações">
            <Bell className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-200 hover:bg-slate-800"
            onClick={toggleTheme}
            aria-label="Alternar tema"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <div className="flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1.5 text-sm font-medium border border-slate-700">
            <span className="hidden sm:inline text-slate-300">{userName || "Conta"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {userName ? userName.charAt(0).toUpperCase() : "C"}
            </div>
          </div>
        </div>
      </div>

      {/* Second row: nav links */}
      <div className="container mx-auto flex h-12 items-center gap-2 px-4">
        <nav className="flex items-center gap-1 overflow-x-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
