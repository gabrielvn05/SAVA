'use client'

import { cn } from '@/lib/utils'
import { STATUS_LABELS, type RequestStatus, ROLE_LABELS, type UserRole } from '@/lib/types'
import { CheckCircle, Clock, Send, Eye, XCircle, RotateCcw, FileEdit } from 'lucide-react'

interface HistoryItem {
  id: string
  action: string
  old_status: RequestStatus | null
  new_status: RequestStatus | null
  performed_by: string
  notes: string | null
  created_at: string
  performer?: {
    full_name: string
    role: UserRole
  } | null
}

interface RequestTimelineProps {
  history: HistoryItem[]
}

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CREATED: FileEdit,
  SUBMITTED: Send,
  REVIEWED: Eye,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
  RETURNED: RotateCcw,
  UPDATED: FileEdit,
}

const actionColors: Record<string, string> = {
  CREATED: 'bg-gray-500',
  SUBMITTED: 'bg-blue-500',
  REVIEWED: 'bg-purple-500',
  APPROVED: 'bg-green-500',
  REJECTED: 'bg-red-500',
  RETURNED: 'bg-orange-500',
  UPDATED: 'bg-gray-500',
}

const actionLabels: Record<string, string> = {
  CREATED: 'Solicitud creada',
  SUBMITTED: 'Solicitud enviada',
  REVIEWED: 'Revisada por Secretaría',
  APPROVED: 'Aprobada por Decanato',
  REJECTED: 'Rechazada',
  RETURNED: 'Devuelta para correcciones',
  UPDATED: 'Solicitud actualizada',
}

export function RequestTimeline({ history }: RequestTimelineProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No hay historial disponible
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((item, index) => {
        const Icon = actionIcons[item.action] || Clock
        const color = actionColors[item.action] || 'bg-gray-500'
        const label = actionLabels[item.action] || item.action

        return (
          <div key={item.id} className="relative flex gap-3">
            {/* Line */}
            {index < history.length - 1 && (
              <div className="absolute left-3 top-6 h-full w-0.5 bg-border" />
            )}

            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-white',
                color
              )}
            >
              <Icon className="h-3 w-3" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <p className="font-medium text-sm">{label}</p>
              {item.performer && (
                <p className="text-xs text-muted-foreground">
                  por {item.performer.full_name}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleString('es-EC', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </p>
              {item.notes && (
                <p className="mt-1 text-sm text-muted-foreground bg-muted p-2 rounded">
                  {item.notes}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
