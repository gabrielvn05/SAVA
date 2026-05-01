import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, FileText, Eye, Edit } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS, type RequestStatus } from '@/lib/types'
import { RequestsFilter } from '@/components/requests/requests-filter'

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function SolicitudesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  let query = supabase
    .from('requests')
    .select(`
      *,
      request_type:request_types(id, name, code)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data: requests } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Solicitudes</h1>
          <p className="text-muted-foreground">
            Gestiona tus solicitudes de permisos y justificaciones
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/solicitudes/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Link>
        </Button>
      </div>

      <RequestsFilter currentStatus={params.status} />

      <Card>
        <CardHeader>
          <CardTitle>Listado de Solicitudes</CardTitle>
          <CardDescription>
            {requests?.length || 0} solicitud{requests?.length !== 1 ? 'es' : ''} encontrada{requests?.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {params.status 
                  ? 'No hay solicitudes con este estado' 
                  : 'No tienes solicitudes aún'}
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/solicitudes/nueva">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Solicitud
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
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
                      {new Date(request.start_date).toLocaleDateString('es-EC')} 
                      {request.start_date !== request.end_date && 
                        ` - ${new Date(request.end_date).toLocaleDateString('es-EC')}`}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {request.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {request.status === 'BORRADOR' || request.status === 'DEVUELTO' ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/solicitudes/${request.id}/editar`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/solicitudes/${request.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver
                      </Link>
                    </Button>
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
