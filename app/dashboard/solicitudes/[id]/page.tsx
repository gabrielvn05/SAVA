import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Edit, Clock, User, Calendar, FileText, MessageSquare } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS, ROLE_LABELS, type RequestStatus } from '@/lib/types'
import { RequestTimeline } from '@/components/requests/request-timeline'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SolicitudDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get the request with related data
  const { data: request } = await supabase
    .from('requests')
    .select(`
      *,
      request_type:request_types(*),
      user:profiles!requests_user_id_fkey(*),
      reviewer:profiles!requests_reviewed_by_fkey(*),
      approver:profiles!requests_approved_by_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (!request) {
    notFound()
  }

  // Get request history
  const { data: history } = await supabase
    .from('request_history')
    .select(`
      *,
      performer:profiles(full_name, role)
    `)
    .eq('request_id', id)
    .order('created_at', { ascending: true })

  // Get attachments
  const { data: attachments } = await supabase
    .from('attachments')
    .select('*')
    .eq('request_id', id)

  const canEdit = request.status === 'BORRADOR' || request.status === 'DEVUELTO'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/solicitudes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{request.code}</h1>
              <Badge className={STATUS_COLORS[request.status as RequestStatus]}>
                {STATUS_LABELS[request.status as RequestStatus]}
              </Badge>
            </div>
            <p className="text-muted-foreground">{request.request_type?.name}</p>
          </div>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/dashboard/solicitudes/${id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información de la Solicitud
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Solicitud</p>
                  <p className="font-medium">{request.request_type?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Código</p>
                  <p className="font-mono font-medium">{request.code}</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Fecha de Inicio
                  </p>
                  <p className="font-medium">
                    {new Date(request.start_date).toLocaleDateString('es-EC', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {request.start_time && ` - ${request.start_time}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Fecha de Fin
                  </p>
                  <p className="font-medium">
                    {new Date(request.end_date).toLocaleDateString('es-EC', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {request.end_time && ` - ${request.end_time}`}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Motivo</p>
                <p className="whitespace-pre-wrap">{request.reason}</p>
              </div>

              {request.observations && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Observaciones</p>
                    <p className="whitespace-pre-wrap">{request.observations}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Review/Approval Notes */}
          {(request.review_notes || request.approval_notes || request.rejection_reason) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Notas del Proceso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.review_notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Notas de Revisión (Secretaría)
                    </p>
                    <p className="bg-muted p-3 rounded-md">{request.review_notes}</p>
                  </div>
                )}
                {request.approval_notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Notas de Aprobación (Decanato)
                    </p>
                    <p className="bg-green-50 p-3 rounded-md dark:bg-green-950/20">
                      {request.approval_notes}
                    </p>
                  </div>
                )}
                {request.rejection_reason && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Motivo de Rechazo
                    </p>
                    <p className="bg-red-50 p-3 rounded-md dark:bg-red-950/20">
                      {request.rejection_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos Adjuntos</CardTitle>
              <CardDescription>
                {attachments?.length || 0} archivo(s) adjunto(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!attachments || attachments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay documentos adjuntos
                </p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'Tamaño desconocido'}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                          Ver
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Solicitante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{request.user?.full_name}</p>
                <p className="text-sm text-muted-foreground">{request.user?.email}</p>
                <Badge variant="outline">{ROLE_LABELS[request.user?.role as keyof typeof ROLE_LABELS]}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RequestTimeline history={history || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
