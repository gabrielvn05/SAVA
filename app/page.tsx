import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Shield, Clock, CheckCircle } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              S
            </div>
            <span className="text-lg font-semibold">SAVA</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/registro">Registrarse</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
          Sistema de Gestión de
          <span className="text-primary"> Permisos y Justificaciones</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Plataforma digital para la gestión de solicitudes de permisos y justificaciones
          de la Facultad de Ciencias Veterinarias - ULEAM
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/auth/registro">Comenzar Ahora</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">Ya tengo cuenta</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold mb-12">
            Características del Sistema
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Solicitudes Digitales</h3>
              <p className="text-sm text-muted-foreground">
                Crea y gestiona tus solicitudes de permisos y justificaciones de forma digital
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Seguimiento en Tiempo Real</h3>
              <p className="text-sm text-muted-foreground">
                Conoce el estado de tus solicitudes en cualquier momento
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Aprobación Rápida</h3>
              <p className="text-sm text-muted-foreground">
                Flujo de trabajo optimizado para revisión y aprobación eficiente
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Seguro y Confiable</h3>
              <p className="text-sm text-muted-foreground">
                Tus datos están protegidos con las mejores prácticas de seguridad
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>SAVA - Sistema de Gestión de Permisos y Justificaciones</p>
          <p className="mt-1">Facultad de Ciencias Veterinarias - Universidad Laica Eloy Alfaro de Manabí</p>
        </div>
      </footer>
    </div>
  )
}
