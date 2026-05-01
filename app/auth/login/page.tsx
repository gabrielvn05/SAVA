import { LoginForm } from '@/components/auth/login-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">SAVA</h1>
          <p className="text-muted-foreground mt-2">
            Sistema de Gestión de Permisos y Justificaciones
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Facultad de Ciencias Veterinarias - ULEAM
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
