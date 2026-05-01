'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Plus } from 'lucide-react'
import { PERMISSION_LABELS, type PermissionType } from '@/lib/types'

interface User {
  id: string
  full_name: string
  email: string
  role: string
}

interface DelegatePermissionFormProps {
  users: User[]
}

const permissionTypes: PermissionType[] = [
  'VIEW_REPORTS',
  'VIEW_AREA_REQUESTS',
  'REVIEW_REQUESTS',
  'APPROVE_REQUESTS',
  'MANAGE_USERS',
]

export function DelegatePermissionForm({ users }: DelegatePermissionFormProps) {
  const [selectedUser, setSelectedUser] = useState('')
  const [permissionType, setPermissionType] = useState<PermissionType | ''>('')
  const [area, setArea] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!selectedUser || !permissionType) {
      setError('Selecciona un usuario y un tipo de permiso')
      return
    }

    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { error: insertError } = await supabase
        .from('delegated_permissions')
        .insert({
          granted_to: selectedUser,
          granted_by: user.id,
          permission_type: permissionType,
          area: area || null,
          expires_at: expiresAt || null,
          active: true,
        })

      if (insertError) throw insertError

      setSuccess(true)
      setSelectedUser('')
      setPermissionType('')
      setArea('')
      setExpiresAt('')
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Error al delegar el permiso')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <AlertDescription>Permiso delegado exitosamente</AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel>Usuario</FieldLabel>
          <Select value={selectedUser} onValueChange={setSelectedUser} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un usuario" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Tipo de Permiso</FieldLabel>
          <Select value={permissionType} onValueChange={(v) => setPermissionType(v as PermissionType)} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el permiso" />
            </SelectTrigger>
            <SelectContent>
              {permissionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {PERMISSION_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {permissionType === 'VIEW_AREA_REQUESTS' && (
          <Field>
            <FieldLabel>Área (opcional)</FieldLabel>
            <Input
              placeholder="Nombre del área"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              disabled={isLoading}
            />
            <FieldDescription>
              Deja vacío para permitir ver todas las áreas
            </FieldDescription>
          </Field>
        )}

        <Field>
          <FieldLabel>Fecha de Expiración (opcional)</FieldLabel>
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            disabled={isLoading}
            min={new Date().toISOString().split('T')[0]}
          />
          <FieldDescription>
            Deja vacío para permiso permanente
          </FieldDescription>
        </Field>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? <Spinner className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
          Delegar Permiso
        </Button>
      </FieldGroup>
    </form>
  )
}
