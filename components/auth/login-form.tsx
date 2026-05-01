'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
        } else {
          setError(signInError.message)
        }
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Ocurrio un error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-semibold">Iniciar Sesion</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ingrese sus credenciales institucionales
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Usuario</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="p1314977255@live.uleam.edu.ec"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </Field>
            
            <Field>
              <FieldLabel htmlFor="password">Contrasena</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </Field>
          </FieldGroup>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Recordarme
              </label>
            </div>
            <Link 
              href="/auth/recuperar" 
              className="text-sm text-primary hover:underline"
            >
              Olvide mi contrasena?
            </Link>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium" 
            disabled={isLoading}
          >
            {isLoading ? <Spinner className="mr-2" /> : null}
            Iniciar Sesion
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}
