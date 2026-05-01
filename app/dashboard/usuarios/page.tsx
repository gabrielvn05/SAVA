import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, UserCheck, UserX } from 'lucide-react'
import { ROLE_LABELS, type UserRole } from '@/lib/types'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Only Decano can access
  if (!profile || profile.role !== 'DECANO') {
    redirect('/dashboard')
  }

  // Get all users
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  const activeUsers = users?.filter(u => u.active).length || 0
  const inactiveUsers = users?.filter(u => !u.active).length || 0

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const roleColors: Record<UserRole, string> = {
    DECANO: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    SECRETARIA: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    ADMINISTRATIVO: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    DIRECTOR_AREA: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Administra los usuarios del sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Usuarios registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">Con acceso al sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Inactivos</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveUsers}</div>
            <p className="text-xs text-muted-foreground">Sin acceso al sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Usuarios</CardTitle>
          <CardDescription>
            {users?.length || 0} usuario{users?.length !== 1 ? 's' : ''} en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No hay usuarios registrados
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className={u.active ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                        {getInitials(u.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{u.full_name}</span>
                        {!u.active && (
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            Inactivo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={roleColors[u.role as UserRole]}>
                          {ROLE_LABELS[u.role as UserRole]}
                        </Badge>
                        {u.area && (
                          <span className="text-xs text-muted-foreground">
                            {u.area}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Cédula: {u.cedula}</p>
                    <p>Registrado: {new Date(u.created_at).toLocaleDateString('es-EC')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
