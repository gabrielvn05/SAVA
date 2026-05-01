import { LoginForm } from '@/components/auth/login-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header con logo ULEAM */}
      <header className="w-full py-6 px-4 flex justify-center border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">U</span>
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground font-medium tracking-wide">UNIVERSIDAD LAICA</p>
            <p className="text-sm font-bold text-foreground">ELOY ALFARO DE MANABI</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          {/* SAVA Logo/Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-2">
              <span className="text-primary-foreground font-bold text-3xl">S</span>
            </div>
            <h1 className="text-4xl font-bold text-primary tracking-tight">SAVA</h1>
            <p className="text-muted-foreground text-balance">
              Sistema de Asistencia y<br />Validaciones Academicas
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-border bg-card">
        <p className="text-sm text-muted-foreground">
          &copy; 2026 FCVVT. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}
