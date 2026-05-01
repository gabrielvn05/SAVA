import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Calendar, FileText, User } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS, ROLE_LABELS, type RequestStatus, type UserRole } from '@/lib/types'
import { ReviewActions } from '@/components/review/review-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RevisionDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'SECRETARIA' && profile.role !== 'DECANO')) {
    redirect('/dashboard')
  }

  // Get the request with related data
  const { data: request } = await supabase
    .from('requests')
    .select(`
      *,
      request_type:request_types(*),
      user:profiles!requests_user_id_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (!request) {
    notFound()
  }

  // Get attachments
  const { data: attachments } = await supabase
    .from('attachments')
    .select('*')
    .eq('request_id', id)

  const canReview = request.status === 'ENVIADO' || request.status === 'EN_REVISION'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/revision">
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
            <p className="text-muted-foreground">Revisión de solicitud</p>
          </div>
        </div>
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
                <p className="whitespace-pre-wrap bg-muted p-3 rounded-md">{request.reason}</p>
              </div>

              {request.observations && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Observaciones del Solicitante</p>
                    <p className="whitespace-pre-wrap bg-muted p-3 rounded-md">{request.observations}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos Adjuntos</CardTitle>
              <CardDescription>
                {attachments?.length || 0} archivo(s) adjunto(s)
                {request.request_type?.requires_attachment && !attachments?.length && (
                  <span className="text-destructive ml-2">
                    (Este tipo de solicitud requiere documentos)
                  </span>
                )}
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
                <p className="text-sm text-muted-foreground">Cédula: {request.user?.cedula}</p>
                {request.user?.area && (
                  <p className="text-sm text-muted-foreground">Área: {request.user?.area}</p>
                )}
                <Badge variant="outline">
                  {ROLE_LABELS[request.user?.role as UserRole]}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Review Actions */}
          {canReview && (
            <ReviewActions
              requestId={request.id}
              currentStatus={request.status as RequestStatus}
              requiresAttachment={request.request_type?.requires_attachment || false}
              hasAttachments={(attachments?.length || 0) > 0}
            />
          )}

          {/* Info if already reviewed */}
          {request.status === 'REVISADO' && (
            <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
              <CardHeader>
                <CardTitle className="text-base">Solicitud Revisada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Esta solicitud ya fue revisada y está pendiente de aprobación por el Decano.
                </p>
                {request.review_notes && (
                  <div className="mt-3">
                    <p className="text-sm font-medium">Notas de revisión:</p>
                    <p className="text-sm text-muted-foreground mt-1">{request.review_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
