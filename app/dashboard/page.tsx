import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS, type RequestStatus } from '@/lib/types'

async function getStats(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: requests } = await supabase
    .from('requests')
    .select('status')
    .eq('user_id', userId)

  const stats = {
    total: requests?.length || 0,
    borrador: 0,
    enviado: 0,
    aprobado: 0,
    rechazado: 0,
  }

  requests?.forEach((r) => {
    if (r.status === 'BORRADOR') stats.borrador++
    else if (r.status === 'ENVIADO' || r.status === 'EN_REVISION' || r.status === 'REVISADO') stats.enviado++
    else if (r.status === 'APROBADO') stats.aprobado++
    else if (r.status === 'RECHAZADO') stats.rechazado++
  })

  return stats
}

async function getRecentRequests(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: requests } = await supabase
    .from('requests')
    .select(`
      *,
      request_type:request_types(name, code)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  return requests || []
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const [stats, recentRequests] = await Promise.all([
    getStats(user.id, supabase),
    getRecentRequests(user.id, supabase),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bienvenido, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            Resumen de tus solicitudes de permisos y justificaciones
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/solicitudes/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Todas tus solicitudes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enviado}</div>
            <p className="text-xs text-muted-foreground">Pendientes de revisión/aprobación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aprobado}</div>
            <p className="text-xs text-muted-foreground">Solicitudes aprobadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rechazado}</div>
            <p className="text-xs text-muted-foreground">Solicitudes rechazadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Borradores Alert */}
      {stats.borrador > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-base">Tienes {stats.borrador} borrador{stats.borrador > 1 ? 'es' : ''} sin enviar</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Recuerda completar y enviar tus solicitudes en borrador para que sean procesadas.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/solicitudes?status=BORRADOR">
                Ver Borradores
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Solicitudes Recientes</CardTitle>
              <CardDescription>Tus últimas 5 solicitudes</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/solicitudes">Ver Todas</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No tienes solicitudes aún
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/solicitudes/nueva">
                  Crear Primera Solicitud
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{request.code}</span>
                      <Badge className={STATUS_COLORS[request.status as RequestStatus]}>
                        {STATUS_LABELS[request.status as RequestStatus]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.request_type?.name} - {new Date(request.start_date).toLocaleDateString('es-EC')}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/solicitudes/${request.id}`}>
                      Ver Detalle
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
