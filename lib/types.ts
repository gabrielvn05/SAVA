// User roles in the system
export type UserRole = 'DECANO' | 'SECRETARIA' | 'ADMINISTRATIVO' | 'DIRECTOR_AREA'

// Active mode for users with dual functionality (Decano/Secretaria)
export type ActiveMode = 'APROBADOR' | 'SOLICITANTE'

// Request status workflow
export type RequestStatus = 
  | 'BORRADOR'      // Draft - not yet submitted
  | 'ENVIADO'       // Submitted - waiting for secretary review
  | 'EN_REVISION'   // Under review by secretary
  | 'REVISADO'      // Reviewed by secretary - waiting for dean
  | 'APROBADO'      // Approved by dean
  | 'RECHAZADO'     // Rejected
  | 'DEVUELTO'      // Returned for corrections

// Permission types that can be delegated
export type PermissionType = 
  | 'VIEW_REPORTS'
  | 'VIEW_AREA_REQUESTS'
  | 'REVIEW_REQUESTS'
  | 'APPROVE_REQUESTS'
  | 'MANAGE_USERS'

// Database types
export interface Profile {
  id: string
  email: string
  full_name: string
  cedula: string
  role: UserRole
  area: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface RequestType {
  id: string
  name: string
  code: string
  description: string | null
  requires_attachment: boolean
  max_days: number | null
  active: boolean
  created_at: string
}

export interface Request {
  id: string
  code: string
  user_id: string
  request_type_id: string
  status: RequestStatus
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
  reason: string
  observations: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  approved_by: string | null
  approved_at: string | null
  approval_notes: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  submitted_at: string | null
  // Relations
  request_type?: RequestType
  user?: Profile
  reviewer?: Profile
  approver?: Profile
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  request_id: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  uploaded_by: string
  created_at: string
}

export interface DelegatedPermission {
  id: string
  granted_to: string
  granted_by: string
  permission_type: PermissionType
  area: string | null
  active: boolean
  expires_at: string | null
  created_at: string
  // Relations
  grantee?: Profile
  grantor?: Profile
}

export interface RequestHistory {
  id: string
  request_id: string
  action: string
  old_status: RequestStatus | null
  new_status: RequestStatus | null
  performed_by: string
  notes: string | null
  created_at: string
  // Relations
  performer?: Profile
}

// Form types
export interface CreateRequestForm {
  request_type_id: string
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  reason: string
  observations?: string
}

export interface LoginForm {
  email: string
  password: string
}

export interface SignUpForm {
  email: string
  password: string
  full_name: string
  cedula: string
  role: UserRole
  area?: string
}

// Status display helpers
export const STATUS_LABELS: Record<RequestStatus, string> = {
  BORRADOR: 'Borrador',
  ENVIADO: 'Enviado',
  EN_REVISION: 'En Revisión',
  REVISADO: 'Revisado',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  DEVUELTO: 'Devuelto',
}

export const STATUS_COLORS: Record<RequestStatus, string> = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  ENVIADO: 'bg-blue-100 text-blue-800',
  EN_REVISION: 'bg-yellow-100 text-yellow-800',
  REVISADO: 'bg-purple-100 text-purple-800',
  APROBADO: 'bg-green-100 text-green-800',
  RECHAZADO: 'bg-red-100 text-red-800',
  DEVUELTO: 'bg-orange-100 text-orange-800',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  DECANO: 'Decano',
  SECRETARIA: 'Secretaria',
  ADMINISTRATIVO: 'Administrativo',
  DIRECTOR_AREA: 'Director de Área',
}

export const PERMISSION_LABELS: Record<PermissionType, string> = {
  VIEW_REPORTS: 'Ver Reportes',
  VIEW_AREA_REQUESTS: 'Ver Solicitudes de Área',
  REVIEW_REQUESTS: 'Revisar Solicitudes',
  APPROVE_REQUESTS: 'Aprobar Solicitudes',
  MANAGE_USERS: 'Gestionar Usuarios',
}
