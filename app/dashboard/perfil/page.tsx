import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, CreditCard, Building, Calendar } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/types'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Informacion de tu cuenta institucional
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl font-bold text-primary">
              {profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <CardTitle className="text-xl">{profile.full_name}</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
          <div className="pt-2">
            <Badge variant="secondary" className="text-sm">
              {ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nombre Completo</p>
                <p className="font-medium">{profile.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Correo Electronico</p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cedula</p>
                <p className="font-medium">{profile.cedula || 'No registrada'}</p>
              </div>
            </div>

            {profile.area && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="font-medium">{profile.area}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Miembro desde</p>
                <p className="font-medium">
                  {new Date(profile.created_at).toLocaleDateString('es-EC', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
