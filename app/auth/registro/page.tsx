import { RegisterForm } from '@/components/auth/register-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RegistroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">SAVA</h1>
          <p className="text-muted-foreground mt-2">
            Crear una nueva cuenta
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
