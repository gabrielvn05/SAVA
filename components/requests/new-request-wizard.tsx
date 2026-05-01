'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, ChevronLeft, ChevronRight, Save, Send, FileText, Plane, AlertTriangle, Clock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { RequestType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NewRequestWizardProps {
  requestTypes: RequestType[]
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'LIC': FileText,      // Licencia Medica / Certificado Medico
  'VAC': Plane,         // Vacaciones
  'ACA': Plane,         // Permiso por Viaje / Academico  
  'LUT': AlertTriangle, // Calamidad Domestica / Luto
  'PER': Clock,         // Permiso Personal
  'MAT': FileText,      // Maternidad
  'PAT': FileText,      // Paternidad
  'COM': Plane,         // Comision de Servicio
  'SGS': Clock,         // Sin Goce de Sueldo
}

const typeDescriptions: Record<string, string> = {
  'LIC': 'Justificacion por incapacidad medica (IESS o Avalado)',
  'VAC': 'Solicitud de dias de vacaciones anuales',
  'ACA': 'Permiso por seminarios, congresos o actividades academicas',
  'LUT': 'Permiso por situaciones de fuerza mayor o calamidad',
  'PER': 'Permiso para asuntos personales (citas medicas, tramites, etc.)',
  'MAT': 'Licencia por maternidad',
  'PAT': 'Licencia por paternidad',
  'COM': 'Comision para actividades institucionales fuera del campus',
  'SGS': 'Permiso especial sin remuneracion',
}

export function NewRequestWizard({ requestTypes }: NewRequestWizardProps) {
  const [step, setStep] = useState(1)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    reason: '',
    observations: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'save' | 'submit' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const selectedType = requestTypes.find(t => t.id === selectedTypeId)

  const handleSave = async (submit: boolean = false) => {
    if (!selectedTypeId) return

    setError(null)
    setIsLoading(true)
    setLoadingAction(submit ? 'submit' : 'save')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const requestData = {
        request_type_id: selectedTypeId,
        user_id: user.id,
        status: submit ? 'ENVIADO' : 'BORRADOR',
        submitted_at: submit ? new Date().toISOString() : null,
        code: '',
        ...formData,
      }

      const { error: insertError } = await supabase
        .from('requests')
        .insert(requestData)

      if (insertError) throw insertError

      router.push('/dashboard/solicitudes')
      router.refresh()
    } catch (err) {
      console.error('Error saving request:', err)
      setError(err instanceof Error ? err.message : 'Error al guardar la solicitud')
    } finally {
      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  const isFormValid = formData.start_date && formData.end_date && formData.reason

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva Solicitud</h1>
        <p className="text-muted-foreground">
          {step === 1 
            ? 'Seleccione el tipo de tramite que desea realizar' 
            : 'Complete los datos de su solicitud'}
        </p>
      </div>

      {/* Step 1: Select Type */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {requestTypes.map((type) => {
              const Icon = typeIcons[type.code] || FileText
              const description = typeDescriptions[type.code] || type.description

              return (
                <Card
                  key={type.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
                    selectedTypeId === type.id && 'ring-2 ring-primary border-primary'
                  )}
                  onClick={() => setSelectedTypeId(type.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                        selectedTypeId === type.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-primary/10 text-primary'
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold">{type.name}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedTypeId}
            >
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Form Details */}
      {step === 2 && selectedType && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = typeIcons[selectedType.code] || FileText
                return (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                )
              })()}
              <div>
                <CardTitle>{selectedType.name}</CardTitle>
                <CardDescription>{typeDescriptions[selectedType.code] || selectedType.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="start_date">Fecha de Inicio *</FieldLabel>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    disabled={isLoading}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="end_date">Fecha de Fin *</FieldLabel>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date}
                    disabled={isLoading}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="start_time">Hora de Inicio (opcional)</FieldLabel>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    disabled={isLoading}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="end_time">Hora de Fin (opcional)</FieldLabel>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    disabled={isLoading}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="reason">Motivo *</FieldLabel>
                <Textarea
                  id="reason"
                  placeholder="Describe el motivo de tu solicitud..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  disabled={isLoading}
                  rows={4}
                />
                <FieldDescription>
                  Explica detalladamente el motivo de tu solicitud de permiso o justificacion
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="observations">Observaciones (opcional)</FieldLabel>
                <Textarea
                  id="observations"
                  placeholder="Informacion adicional..."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  disabled={isLoading}
                  rows={2}
                />
              </Field>

              {selectedType.requires_attachment && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Este tipo de solicitud requiere adjuntar documentos de respaldo.
                    Podras adjuntarlos despues de guardar la solicitud.
                  </AlertDescription>
                </Alert>
              )}
            </FieldGroup>
          </CardContent>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-6 pt-0">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={isLoading || !isFormValid}
                className="w-full sm:w-auto"
              >
                {loadingAction === 'save' ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Borrador
              </Button>
              <Button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isLoading || !isFormValid}
                className="w-full sm:w-auto"
              >
                {loadingAction === 'submit' ? <Spinner className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar Solicitud
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
