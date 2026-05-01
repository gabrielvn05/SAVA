import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Bell, ArrowLeft, ArrowRight, CheckCircle, XCircle, Clock, FileText } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS, type RequestStatus } from '@/lib/types'

async function getNotifications(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  // Get recent request history and status changes
  const { data: requests } = await supabase
    .from('requests')
    .select(`
      id,
      code,
      status,
      updated_at,
      request_type:request_types(name)
    `)
    .eq('user_id', userId)
    .in('status', ['APROBADO', 'RECHAZADO', 'DEVUELTO', 'EN_REVISION', 'REVISADO'])
    .order('updated_at', { ascending: false })
    .limit(20)

  return requests || []
}

export default async function NotificacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const notifications = await getNotifications(user.id, supabase)

  const getNotificationIcon = (status: string) => {
    switch (status) {
      case 'APROBADO':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'RECHAZADO':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'EN_REVISION':
      case 'REVISADO':
        return <Clock className="h-5 w-5 text-amber-500" />
      default:
        return <FileText className="h-5 w-5 text-primary" />
    }
  }

  const getNotificationMessage = (status: string, code: string) => {
    switch (status) {
      case 'APROBADO':
        return `El documento con el codigo ${code} ha sido aprobado`
      case 'RECHAZADO':
        return `El documento con el codigo ${code} ha sido rechazado`
      case 'EN_REVISION':
        return `El documento con el codigo ${code} esta en revision`
      case 'REVISADO':
        return `El documento con el codigo ${code} ha sido revisado`
      case 'DEVUELTO':
        return `El documento con el codigo ${code} ha sido devuelto para correcciones`
      default:
        return `Actualizacion en el documento ${code}`
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground">
            Actualizaciones sobre tus solicitudes
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar
          </Link>
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Ultimas Notificaciones
          </CardTitle>
          <CardDescription>
            Cambios recientes en el estado de tus solicitudes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                No tienes notificaciones
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getNotificationIcon(notification.status)}
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {getNotificationMessage(notification.status, notification.code)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_COLORS[notification.status as RequestStatus]}>
                          {STATUS_LABELS[notification.status as RequestStatus]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.updated_at).toLocaleDateString('es-EC', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/solicitudes/${notification.id}`}>
                      Ir
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
