import { createClient } from '@/lib/supabase/server'
import { RequestForm } from '@/components/requests/request-form'

export default async function NuevaSolicitudPage() {
  const supabase = await createClient()
  
  // Get request types
  const { data: requestTypes } = await supabase
    .from('request_types')
    .select('*')
    .eq('active', true)
    .order('name')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva Solicitud</h1>
        <p className="text-muted-foreground">
          Completa el formulario para crear una nueva solicitud de permiso o justificación
        </p>
      </div>

      <RequestForm requestTypes={requestTypes || []} />
    </div>
  )
}
