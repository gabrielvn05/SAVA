'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react'
import type { RequestStatus } from '@/lib/types'

interface ApprovalActionsProps {
  requestId: string
  currentStatus: RequestStatus
}

export function ApprovalActions({
  requestId,
  currentStatus,
}: ApprovalActionsProps) {
  const [notes, setNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | 'return' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAction = async (actionType: 'approve' | 'reject' | 'return') => {
    setError(null)
    setIsLoading(true)
    setAction(actionType)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      if (actionType === 'approve') {
        // Approve the request
        const { error: updateError } = await supabase
          .from('requests')
          .update({
            status: 'APROBADO',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            approval_notes: notes || null,
          })
          .eq('id', requestId)

        if (updateError) throw updateError

        // Add history entry
        await supabase.from('request_history').insert({
          request_id: requestId,
          action: 'APPROVED',
          old_status: currentStatus,
          new_status: 'APROBADO',
          performed_by: user.id,
          notes: notes || null,
        })
      } else if (actionType === 'reject') {
        // Reject the request
        if (!rejectionReason.trim()) {
          setError('Debes indicar el motivo del rechazo')
          setIsLoading(false)
          setAction(null)
          return
        }

        const { error: updateError } = await supabase
          .from('requests')
          .update({
            status: 'RECHAZADO',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            rejection_reason: rejectionReason,
          })
          .eq('id', requestId)

        if (updateError) throw updateError

        // Add history entry
        await supabase.from('request_history').insert({
          request_id: requestId,
          action: 'REJECTED',
          old_status: currentStatus,
          new_status: 'RECHAZADO',
          performed_by: user.id,
          notes: rejectionReason,
        })
      } else {
        // Return to requester
        if (!notes.trim()) {
          setError('Debes indicar el motivo de la devolución')
          setIsLoading(false)
          setAction(null)
          return
        }

        const { error: updateError } = await supabase
          .from('requests')
          .update({
            status: 'DEVUELTO',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            approval_notes: notes,
          })
          .eq('id', requestId)

        if (updateError) throw updateError

        // Add history entry
        await supabase.from('request_history').insert({
          request_id: requestId,
          action: 'RETURNED',
          old_status: currentStatus,
          new_status: 'DEVUELTO',
          performed_by: user.id,
          notes: notes,
        })
      }

      router.push('/dashboard/aprobacion')
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud')
    } finally {
      setIsLoading(false)
      setAction(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones de Aprobación</CardTitle>
        <CardDescription>
          Aprueba, rechaza o devuelve la solicitud
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Field>
            <FieldLabel htmlFor="notes">Notas de Aprobación (opcional)</FieldLabel>
            <Textarea
              id="notes"
              placeholder="Agrega notas o comentarios..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={2}
            />
          </Field>

          <Button
            onClick={() => handleAction('approve')}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {action === 'approve' ? (
              <Spinner className="mr-2" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Aprobar Solicitud
          </Button>

          <div className="border-t pt-4 mt-2">
            <Field>
              <FieldLabel htmlFor="rejectionReason">Motivo de Rechazo (requerido para rechazar)</FieldLabel>
              <Textarea
                id="rejectionReason"
                placeholder="Indica el motivo del rechazo..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={isLoading}
                rows={2}
              />
            </Field>

            <Button
              variant="destructive"
              onClick={() => handleAction('reject')}
              disabled={isLoading}
              className="w-full"
            >
              {action === 'reject' ? (
                <Spinner className="mr-2" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Rechazar Solicitud
            </Button>
          </div>

          <div className="border-t pt-4 mt-2">
            <Button
              variant="outline"
              onClick={() => handleAction('return')}
              disabled={isLoading}
              className="w-full"
            >
              {action === 'return' ? (
                <Spinner className="mr-2" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Devolver para Corrección
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Use las notas de aprobación para indicar qué debe corregirse
            </p>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
