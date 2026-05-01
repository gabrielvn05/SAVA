import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { RequestForm } from '@/components/requests/request-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarSolicitudPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get the request
  const { data: request } = await supabase
    .from('requests')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!request) {
    notFound()
  }

  // Only allow editing drafts and returned requests
  if (request.status !== 'BORRADOR' && request.status !== 'DEVUELTO') {
    redirect(`/dashboard/solicitudes/${id}`)
  }

  // Get request types
  const { data: requestTypes } = await supabase
    .from('request_types')
    .select('*')
    .eq('active', true)
    .order('name')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/solicitudes/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Solicitud</h1>
          <p className="text-muted-foreground">
            Código: {request.code}
          </p>
        </div>
      </div>

      <RequestForm 
        requestTypes={requestTypes || []} 
        existingRequest={request}
      />
    </div>
  )
}
