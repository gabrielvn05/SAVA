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
import { CheckCircle, RotateCcw, AlertCircle, Send } from 'lucide-react'
import type { RequestStatus } from '@/lib/types'

interface ReviewActionsProps {
  requestId: string
  currentStatus: RequestStatus
  requiresAttachment: boolean
  hasAttachments: boolean
}

export function ReviewActions({
  requestId,
  currentStatus,
  requiresAttachment,
  hasAttachments,
}: ReviewActionsProps) {
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<'review' | 'return' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAction = async (actionType: 'review' | 'return') => {
    setError(null)
    setIsLoading(true)
    setAction(actionType)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      if (actionType === 'review') {
        // Mark as reviewed and send to dean
        const { error: updateError } = await supabase
          .from('requests')
          .update({
            status: 'REVISADO',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            review_notes: notes || null,
          })
          .eq('id', requestId)

        if (updateError) throw updateError

        // Add history entry
        await supabase.from('request_history').insert({
          request_id: requestId,
          action: 'REVIEWED',
          old_status: currentStatus,
          new_status: 'REVISADO',
          performed_by: user.id,
          notes: notes || null,
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
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            review_notes: notes,
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

      router.push('/dashboard/revision')
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud')
    } finally {
      setIsLoading(false)
      setAction(null)
    }
  }

  const missingAttachments = requiresAttachment && !hasAttachments

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones de Revisión</CardTitle>
        <CardDescription>
          Revisa la solicitud y decide el siguiente paso
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

          {missingAttachments && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este tipo de solicitud requiere documentos adjuntos, pero no se han proporcionado.
                Considera devolver la solicitud para que el usuario adjunte la documentación necesaria.
              </AlertDescription>
            </Alert>
          )}

          <Field>
            <FieldLabel htmlFor="notes">Notas de Revisión (opcional para aprobar)</FieldLabel>
            <Textarea
              id="notes"
              placeholder="Agrega notas o comentarios sobre tu revisión..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </Field>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => handleAction('review')}
              disabled={isLoading}
              className="w-full"
            >
              {action === 'review' ? (
                <Spinner className="mr-2" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar al Decano para Aprobación
            </Button>

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
              Devolver al Solicitante
            </Button>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
