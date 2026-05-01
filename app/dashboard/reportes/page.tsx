import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, FileText, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import { STATUS_LABELS, type RequestStatus } from '@/lib/types'

export default async function ReportesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Only Decano and Secretaria can access
  if (!profile || (profile.role !== 'SECRETARIA' && profile.role !== 'DECANO')) {
    redirect('/dashboard')
  }

  // Get all requests for stats
  const { data: allRequests } = await supabase
    .from('requests')
    .select(`
      id,
      status,
      created_at,
      submitted_at,
      request_type:request_types(name)
    `)

  // Calculate stats
  const totalRequests = allRequests?.length || 0
  const statusCounts: Record<string, number> = {}
  const typeCounts: Record<string, number> = {}

  allRequests?.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
    const typeName = r.request_type?.name || 'Desconocido'
    typeCounts[typeName] = (typeCounts[typeName] || 0) + 1
  })

  // Calculate this month stats
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const thisMonthRequests = allRequests?.filter(
    r => new Date(r.created_at) >= thisMonth
  ).length || 0

  const approvalRate = totalRequests > 0 
    ? Math.round(((statusCounts['APROBADO'] || 0) / totalRequests) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes y Estadísticas</h1>
        <p className="text-muted-foreground">
          Vista general del sistema de solicitudes
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">Todas las solicitudes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthRequests}</div>
            <p className="text-xs text-muted-foreground">Solicitudes creadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Aprobación</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalRate}%</div>
            <p className="text-xs text-muted-foreground">Solicitudes aprobadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(statusCounts['ENVIADO'] || 0) + (statusCounts['EN_REVISION'] || 0) + (statusCounts['REVISADO'] || 0)}
            </div>
            <p className="text-xs text-muted-foreground">En proceso</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribución por Estado
          </CardTitle>
          <CardDescription>
            Cantidad de solicitudes por estado actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(statusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const percentage = Math.round((count / totalRequests) * 100)
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{STATUS_LABELS[status as RequestStatus] || status}</span>
                      <span className="font-medium">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Tipo de Solicitud</CardTitle>
          <CardDescription>
            Cantidad de solicitudes por tipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(typeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="rounded-lg border p-4">
                  <p className="font-medium">{type}</p>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((count / totalRequests) * 100)}% del total
                  </p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
