import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Plus } from 'lucide-react'
import { PERMISSION_LABELS, ROLE_LABELS, type PermissionType, type UserRole } from '@/lib/types'
import { DelegatePermissionForm } from '@/components/admin/delegate-permission-form'
import { RevokePermissionButton } from '@/components/admin/revoke-permission-button'

export default async function PermisosPage() {
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

  // Get all delegated permissions with user info
  const { data: delegatedPermissions } = await supabase
    .from('delegated_permissions')
    .select(`
      *,
      grantee:profiles!delegated_permissions_granted_to_fkey(full_name, email, role)
    `)
    .eq('active', true)
    .order('created_at', { ascending: false })

  // Get all users except Decano for delegation
  const { data: availableUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .neq('role', 'DECANO')
    .eq('active', true)
    .order('full_name')

  const permissionColors: Record<PermissionType, string> = {
    VIEW_REPORTS: 'bg-blue-100 text-blue-800',
    VIEW_AREA_REQUESTS: 'bg-green-100 text-green-800',
    REVIEW_REQUESTS: 'bg-purple-100 text-purple-800',
    APPROVE_REQUESTS: 'bg-orange-100 text-orange-800',
    MANAGE_USERS: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Delegación de Permisos</h1>
        <p className="text-muted-foreground">
          Asigna permisos especiales a otros usuarios del sistema
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Delegate Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Delegar Nuevo Permiso
            </CardTitle>
            <CardDescription>
              Selecciona un usuario y el permiso que deseas delegar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DelegatePermissionForm users={availableUsers || []} />
          </CardContent>
        </Card>

        {/* Active Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permisos Activos
            </CardTitle>
            <CardDescription>
              {delegatedPermissions?.length || 0} permiso{delegatedPermissions?.length !== 1 ? 's' : ''} delegado{delegatedPermissions?.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!delegatedPermissions || delegatedPermissions.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  No hay permisos delegados
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {delegatedPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{permission.grantee?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{permission.grantee?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={permissionColors[permission.permission_type as PermissionType]}>
                          {PERMISSION_LABELS[permission.permission_type as PermissionType]}
                        </Badge>
                        {permission.area && (
                          <span className="text-xs text-muted-foreground">
                            Área: {permission.area}
                          </span>
                        )}
                      </div>
                      {permission.expires_at && (
                        <p className="text-xs text-muted-foreground">
                          Expira: {new Date(permission.expires_at).toLocaleDateString('es-EC')}
                        </p>
                      )}
                    </div>
                    <RevokePermissionButton permissionId={permission.id} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permission Types Info */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Permisos</CardTitle>
          <CardDescription>
            Descripción de cada tipo de permiso que puede ser delegado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4">
              <Badge className={permissionColors['VIEW_REPORTS']}>Ver Reportes</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Permite ver reportes y estadísticas del sistema
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <Badge className={permissionColors['VIEW_AREA_REQUESTS']}>Ver Solicitudes de Área</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Permite ver las solicitudes de un área específica
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <Badge className={permissionColors['REVIEW_REQUESTS']}>Revisar Solicitudes</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Permite revisar solicitudes como la Secretaría
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <Badge className={permissionColors['APPROVE_REQUESTS']}>Aprobar Solicitudes</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Permite aprobar solicitudes en nombre del Decano
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <Badge className={permissionColors['MANAGE_USERS']}>Gestionar Usuarios</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Permite ver y gestionar usuarios del sistema
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
