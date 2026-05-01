import { createClient } from '@/lib/supabase/server'
import { NewRequestWizard } from '@/components/requests/new-request-wizard'

export default async function NuevaSolicitudPage() {
  const supabase = await createClient()
  
  // Get request types
  const { data: requestTypes } = await supabase
    .from('request_types')
    .select('*')
    .eq('active', true)
    .order('name')

  return <NewRequestWizard requestTypes={requestTypes || []} />
}
