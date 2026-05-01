'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { STATUS_LABELS, type RequestStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const statuses: (RequestStatus | 'ALL')[] = [
  'ALL',
  'BORRADOR',
  'ENVIADO',
  'EN_REVISION',
  'REVISADO',
  'APROBADO',
  'RECHAZADO',
  'DEVUELTO',
]

interface RequestsFilterProps {
  currentStatus?: string
}

export function RequestsFilter({ currentStatus }: RequestsFilterProps) {
  const router = useRouter()

  const handleFilterChange = (status: string | null) => {
    if (status === 'ALL' || !status) {
      router.push('/dashboard/solicitudes')
    } else {
      router.push(`/dashboard/solicitudes?status=${status}`)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <Button
          key={status}
          variant={
            (status === 'ALL' && !currentStatus) || status === currentStatus
              ? 'default'
              : 'outline'
          }
          size="sm"
          onClick={() => handleFilterChange(status === 'ALL' ? null : status)}
          className={cn(
            'transition-colors',
            (status === 'ALL' && !currentStatus) || status === currentStatus
              ? ''
              : 'hover:bg-accent'
          )}
        >
          {status === 'ALL' ? 'Todas' : STATUS_LABELS[status]}
        </Button>
      ))}
    </div>
  )
}
