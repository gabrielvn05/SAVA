'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUser } from '@/lib/auth/context'
import type { Profile } from '@/lib/types'
import {
  FileText,
  Home,
  ClipboardCheck,
  CheckCircle,
  Users,
  Shield,
  BarChart3,
  Settings,
} from 'lucide-react'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
  requiresApproverMode?: boolean
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: Home,
  },
  {
    href: '/dashboard/solicitudes',
    label: 'Mis Solicitudes',
    icon: FileText,
  },
  {
    href: '/dashboard/revision',
    label: 'Revisión',
    icon: ClipboardCheck,
    roles: ['SECRETARIA', 'DECANO'],
    requiresApproverMode: true,
  },
  {
    href: '/dashboard/aprobacion',
    label: 'Aprobación',
    icon: CheckCircle,
    roles: ['DECANO'],
    requiresApproverMode: true,
  },
  {
    href: '/dashboard/usuarios',
    label: 'Usuarios',
    icon: Users,
    roles: ['DECANO'],
    requiresApproverMode: true,
  },
  {
    href: '/dashboard/permisos',
    label: 'Delegación',
    icon: Shield,
    roles: ['DECANO'],
    requiresApproverMode: true,
  },
  {
    href: '/dashboard/reportes',
    label: 'Reportes',
    icon: BarChart3,
    roles: ['DECANO', 'SECRETARIA'],
    requiresApproverMode: true,
  },
]

interface MobileSidebarProps {
  initialProfile: Profile
}

export function MobileSidebar({ initialProfile }: MobileSidebarProps) {
  const pathname = usePathname()
  const { profile, activeMode } = useUser()
  const currentProfile = profile || initialProfile

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true
    if (!item.roles.includes(currentProfile.role)) return false
    if (item.requiresApproverMode && activeMode !== 'APROBADOR') return false
    return true
  })

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b px-6 py-4">
        <SheetTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            S
          </div>
          <span>SAVA</span>
        </SheetTitle>
      </SheetHeader>
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <Link
          href="/dashboard/configuracion"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/dashboard/configuracion'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
          Configuración
        </Link>
      </div>
    </div>
  )
}
