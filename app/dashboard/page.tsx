import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Plus, ArrowRight } from 'lucide-react'
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
      {/* Welcome Hero */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Bienvenido al Sistema de Asistencia y Validaciones Academicas
              </h1>
              <p className="text-muted-foreground max-w-xl">
                Gestiona tus permisos y justificaciones de forma rapida y sencilla. 
                Todo en un solo lugar, pensado para tu tiempo.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href="/dashboard/solicitudes/nueva">
                <Plus className="mr-2 h-5 w-5" />
                Nueva Solicitud
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enviado}</div>
            <p className="text-xs text-muted-foreground">Pendientes de revision/aprobacion</p>
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
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
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
              <CardDescription>Tus ultimas 5 solicitudes</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/solicitudes">
                Ver Todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                No tienes solicitudes aun
              </p>
              <Button asChild>
                <Link href="/dashboard/solicitudes/nueva">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Solicitud
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/dashboard/solicitudes/${request.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
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
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
