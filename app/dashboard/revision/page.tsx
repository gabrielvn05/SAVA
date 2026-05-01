import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ClipboardCheck, Eye, Clock, CheckCircle } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS, type RequestStatus } from '@/lib/types'

export default async function RevisionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Only Secretaria and Decano can access
  if (!profile || (profile.role !== 'SECRETARIA' && profile.role !== 'DECANO')) {
    redirect('/dashboard')
  }

  // Get requests pending review (ENVIADO status)
  const { data: pendingRequests } = await supabase
    .from('requests')
    .select(`
      *,
      request_type:request_types(name, code),
      user:profiles!requests_user_id_fkey(full_name, email, area)
    `)
    .in('status', ['ENVIADO', 'EN_REVISION'])
    .order('submitted_at', { ascending: true })

  // Get recently reviewed requests
  const { data: reviewedRequests } = await supabase
    .from('requests')
    .select(`
      *,
      request_type:request_types(name, code),
      user:profiles!requests_user_id_fkey(full_name, email, area)
    `)
    .eq('status', 'REVISADO')
    .order('reviewed_at', { ascending: false })
    .limit(10)

  const pendingCount = pendingRequests?.length || 0
  const inReviewCount = pendingRequests?.filter(r => r.status === 'EN_REVISION').length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revisión de Solicitudes</h1>
        <p className="text-muted-foreground">
          Revisa las solicitudes enviadas y envíalas al Decano para aprobación
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Revisión</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount - inReviewCount}</div>
            <p className="text-xs text-muted-foreground">Solicitudes por revisar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inReviewCount}</div>
            <p className="text-xs text-muted-foreground">Actualmente revisando</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revisadas Hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviewedRequests?.filter(r => {
                const today = new Date().toDateString()
                return new Date(r.reviewed_at).toDateString() === today
              }).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Enviadas al Decano</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes Pendientes de Revisión</CardTitle>
          <CardDescription>
            {pendingCount} solicitud{pendingCount !== 1 ? 'es' : ''} esperando revisión
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingCount === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No hay solicitudes pendientes de revisión
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
                      {new Date(request.start_date).toLocaleDateString('es-EC')} 
                      {request.start_date !== request.end_date && 
                        ` - ${new Date(request.end_date).toLocaleDateString('es-EC')}`}
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/dashboard/revision/${request.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Revisar
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Reviewed */}
      {reviewedRequests && reviewedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recientemente Revisadas</CardTitle>
            <CardDescription>
              Últimas solicitudes enviadas al Decano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{request.code}</span>
                      <Badge variant="outline" className="text-purple-600 border-purple-300">
                        Revisado
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.user?.full_name} - {request.request_type?.name}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/revision/${request.id}`}>
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
