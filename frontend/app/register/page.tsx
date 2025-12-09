"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrandLogo } from "@/components/brand-logo"
import { authApi } from "@/lib/api/auth"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get("type") || "student"
  const [userType, setUserType] = useState<"trainer" | "student">(defaultType as "trainer" | "student")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authApi.isAuthenticated()) {
      const userType = authApi.getUserType()
      const user = authApi.getUserFromStorage()
      if (userType === 'student' && user) {
        router.push(`/student/${user.id}/dashboard`)
      } else if (userType === 'teacher' && user) {
        router.push(`/trainer/${user.id}/dashboard`)
      }
    }
  }, [router])

  const [studentData, setStudentData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  })

  const [trainerData, setTrainerData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    specialization: ''
  })

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (studentData.password !== studentData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (studentData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      const response = await authApi.registerStudent({
        username: studentData.username,
        email: studentData.email,
        password: studentData.password,
        first_name: studentData.first_name,
        last_name: studentData.last_name,
      })

      // Registro bem-sucedido, redireciona para login
      router.push('/login?registered=true')
    } catch (err: any) {
      console.error('Registration error:', err)
      if (err.response?.data) {
        const errorData = err.response.data
        if (errorData.username) {
          setError(`Usuário: ${errorData.username[0]}`)
        } else if (errorData.email) {
          setError(`Email: ${errorData.email[0]}`)
      } else if (errorData.password) {
          setError(`Senha: ${errorData.password[0]}`)
        } else if (errorData.detail) {
          setError(errorData.detail)
        } else {
          setError('Erro ao criar conta. Verifique os dados e tente novamente.')
        }
      } else {
        setError('Erro ao conectar com o servidor')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrainerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (trainerData.password !== trainerData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (trainerData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      const response = await authApi.registerTeacher({
        username: trainerData.username,
        email: trainerData.email,
        password: trainerData.password,
        first_name: trainerData.first_name,
        last_name: trainerData.last_name,
        specialization: trainerData.specialization,
      })
      
      // Registro bem-sucedido, redireciona para login
      router.push('/login?registered=true')
    } catch (err: any) {
      console.error('Registration error:', err)
      if (err.response?.data) {
        const errorData = err.response.data
        if (errorData.username) {
          setError(`Usuário: ${errorData.username[0]}`)
        } else if (errorData.email) {
          setError(`Email: ${errorData.email[0]}`)
        } else if (errorData.password) {
          setError(`Senha: ${errorData.password[0]}`)
        } else if (errorData.detail) {
          setError(errorData.detail)
        } else {
          setError('Erro ao criar conta. Verifique os dados e tente novamente.')
        }
      } else {
        setError('Erro ao conectar com o servidor')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
           <BrandLogo className="h-10 w-auto" />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
            <CardDescription>Escolha o tipo de conta e preencha seus dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <Tabs value={userType} onValueChange={(v) => setUserType(v as "trainer" | "student")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="trainer">Personal</TabsTrigger>
                <TabsTrigger value="student">Aluno</TabsTrigger>
              </TabsList>

              <TabsContent value="trainer" className="space-y-4 mt-4">
                <form onSubmit={handleTrainerSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="trainer-first-name">Nome</Label>
                      <Input 
                        id="trainer-first-name" 
                        placeholder="João" 
                        value={trainerData.first_name}
                        onChange={(e) => setTrainerData({ ...trainerData, first_name: e.target.value })}
                        disabled={isLoading}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trainer-last-name">Sobrenome</Label>
                      <Input 
                        id="trainer-last-name" 
                        placeholder="Silva" 
                        value={trainerData.last_name}
                        onChange={(e) => setTrainerData({ ...trainerData, last_name: e.target.value })}
                        disabled={isLoading}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainer-username">Usuário</Label>
                    <Input 
                      id="trainer-username" 
                      placeholder="joaosilva" 
                      value={trainerData.username}
                      onChange={(e) => setTrainerData({ ...trainerData, username: e.target.value })}
                      disabled={isLoading}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainer-email">Email</Label>
                    <Input 
                      id="trainer-email" 
                      type="email" 
                      placeholder="joao@email.com" 
                      value={trainerData.email}
                      onChange={(e) => setTrainerData({ ...trainerData, email: e.target.value })}
                      disabled={isLoading}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainer-specialization">Especialização (opcional)</Label>
                    <Input 
                      id="trainer-specialization" 
                      placeholder="Musculação, Hipertrofia..." 
                      value={trainerData.specialization}
                      onChange={(e) => setTrainerData({ ...trainerData, specialization: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainer-password">Senha</Label>
                    <Input 
                      id="trainer-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={trainerData.password}
                      onChange={(e) => setTrainerData({ ...trainerData, password: e.target.value })}
                      disabled={isLoading}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainer-confirm">Confirmar senha</Label>
                    <Input 
                      id="trainer-confirm" 
                      type="password" 
                      placeholder="••••••••" 
                      value={trainerData.confirmPassword}
                      onChange={(e) => setTrainerData({ ...trainerData, confirmPassword: e.target.value })}
                      disabled={isLoading}
                      required 
                    />
                  </div>
                  <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                    {isLoading ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="student" className="space-y-4 mt-4">
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="student-first-name">Nome</Label>
                      <Input 
                        id="student-first-name" 
                        placeholder="Maria" 
                        value={studentData.first_name}
                        onChange={(e) => setStudentData({ ...studentData, first_name: e.target.value })}
                        disabled={isLoading}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-last-name">Sobrenome</Label>
                      <Input 
                        id="student-last-name" 
                        placeholder="Santos" 
                        value={studentData.last_name}
                        onChange={(e) => setStudentData({ ...studentData, last_name: e.target.value })}
                        disabled={isLoading}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-username">Usuário</Label>
                    <Input 
                      id="student-username" 
                      placeholder="mariasantos" 
                      value={studentData.username}
                      onChange={(e) => setStudentData({ ...studentData, username: e.target.value })}
                      disabled={isLoading}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-email">Email</Label>
                    <Input 
                      id="student-email" 
                      type="email" 
                      placeholder="maria@email.com" 
                      value={studentData.email}
                      onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
                      disabled={isLoading}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Senha</Label>
                    <Input 
                      id="student-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={studentData.password}
                      onChange={(e) => setStudentData({ ...studentData, password: e.target.value })}
                      disabled={isLoading}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-confirm">Confirmar senha</Label>
                    <Input 
                      id="student-confirm" 
                      type="password" 
                      placeholder="••••••••" 
                      value={studentData.confirmPassword}
                      onChange={(e) => setStudentData({ ...studentData, confirmPassword: e.target.value })}
                      disabled={isLoading}
                      required 
                    />
                  </div>
                  <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                    {isLoading ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Entrar
              </Link>
            </div>
          </CardFooter>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar para home
          </Link>
        </div>
      </div>
    </div>
  )
}
