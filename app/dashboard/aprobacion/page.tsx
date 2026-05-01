import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle, Eye, Clock, XCircle, Stamp } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS, type RequestStatus } from '@/lib/types'

export default async function AprobacionPage() {
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

  // Get requests pending approval (REVISADO status)
  const { data: pendingRequests } = await supabase
    .from('requests')
    .select(`
      *,
      request_type:request_types(name, code),
      user:profiles!requests_user_id_fkey(full_name, email, area),
      reviewer:profiles!requests_reviewed_by_fkey(full_name)
    `)
    .eq('status', 'REVISADO')
    .order('reviewed_at', { ascending: true })

  // Get recently processed requests
  const { data: processedRequests } = await supabase
    .from('requests')
    .select(`
      *,
      request_type:request_types(name, code),
      user:profiles!requests_user_id_fkey(full_name, email, area)
    `)
    .in('status', ['APROBADO', 'RECHAZADO'])
    .eq('approved_by', user.id)
    .order('approved_at', { ascending: false })
    .limit(10)

  const pendingCount = pendingRequests?.length || 0
  const approvedToday = processedRequests?.filter(r => {
    const today = new Date().toDateString()
    return r.status === 'APROBADO' && new Date(r.approved_at).toDateString() === today
  }).length || 0
  const rejectedToday = processedRequests?.filter(r => {
    const today = new Date().toDateString()
    return r.status === 'RECHAZADO' && new Date(r.approved_at).toDateString() === today
  }).length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aprobación de Solicitudes</h1>
        <p className="text-muted-foreground">
          Revisa y aprueba o rechaza las solicitudes enviadas por Secretaría
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Aprobación</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Revisadas por Secretaría</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedToday}</div>
            <p className="text-xs text-muted-foreground">Solicitudes aprobadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas Hoy</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedToday}</div>
            <p className="text-xs text-muted-foreground">Solicitudes rechazadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes Pendientes de Aprobación</CardTitle>
          <CardDescription>
            {pendingCount} solicitud{pendingCount !== 1 ? 'es' : ''} revisada{pendingCount !== 1 ? 's' : ''} por Secretaría
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingCount === 0 ? (
            <div className="text-center py-12">
              <Stamp className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No hay solicitudes pendientes de aprobación
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests?.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-medium">{request.code}</span>
                      <Badge className={STATUS_COLORS[request.status as RequestStatus]}>
                        {STATUS_LABELS[request.status as RequestStatus]}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">
                      {request.request_type?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Solicitante: {request.user?.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Revisado por: {request.reviewer?.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.start_date).toLocaleDateString('es-EC')} 
                      {request.start_date !== request.end_date && 
                        ` - ${new Date(request.end_date).toLocaleDateString('es-EC')}`}
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/dashboard/aprobacion/${request.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Revisar y Aprobar
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Processed */}
      {processedRequests && processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Procesadas Recientemente</CardTitle>
            <CardDescription>
              Últimas solicitudes aprobadas o rechazadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{request.code}</span>
                      <Badge className={STATUS_COLORS[request.status as RequestStatus]}>
                        {STATUS_LABELS[request.status as RequestStatus]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.user?.full_name} - {request.request_type?.name}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/aprobacion/${request.id}`}>
                      Ver
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
