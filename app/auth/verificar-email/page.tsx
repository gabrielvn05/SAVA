import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function VerificarEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Revisa tu correo electrónico</CardTitle>
          <CardDescription>
            Hemos enviado un enlace de verificación a tu correo electrónico.
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Si no recibes el correo en unos minutos, revisa tu carpeta de spam.
          </p>
          <Button asChild variant="outline">
            <Link href="/auth/login">
              Volver al inicio de sesión
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
