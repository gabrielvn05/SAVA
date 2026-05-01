'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUser } from '@/lib/auth/context'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import {
  Home,
  FileText,
  FilePlus,
  Bell,
  User,
  LogOut,
  ClipboardCheck,
  CheckCircle,
  Users,
  Shield,
  BarChart3,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
  requiresApproverMode?: boolean
}

const mainNavItems: NavItem[] = [
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
    href: '/dashboard/solicitudes/nueva',
    label: 'Nueva Solicitud',
    icon: FilePlus,
  },
  {
    href: '/dashboard/notificaciones',
    label: 'Notificaciones',
    icon: Bell,
  },
  {
    href: '/dashboard/perfil',
    label: 'Mi perfil',
    icon: User,
  },
]

const adminNavItems: NavItem[] = [
  {
    href: '/dashboard/revision',
    label: 'Revision',
    icon: ClipboardCheck,
    roles: ['SECRETARIA', 'DECANO'],
    requiresApproverMode: true,
  },
  {
    href: '/dashboard/aprobacion',
    label: 'Aprobacion',
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
    label: 'Delegacion',
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

interface DashboardSidebarProps {
  initialProfile: Profile
}

export function DashboardSidebar({ initialProfile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { profile, activeMode, setActiveMode, canSwitchMode } = useUser()
  const currentProfile = profile || initialProfile

  const filteredAdminItems = adminNavItems.filter((item) => {
    if (!item.roles) return true
    if (!item.roles.includes(currentProfile.role)) return false
    if (item.requiresApproverMode && activeMode !== 'APROBADOR') return false
    return true
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon
    const isActive = pathname === item.href || 
      (item.href !== '/dashboard' && pathname.startsWith(item.href))

    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
        )}
      >
        <Icon className="h-5 w-5" />
        {item.label}
      </Link>
    )
  }

  return (
    <aside className="hidden w-64 flex-col bg-sidebar md:flex">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-2xl">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">SAVA</h1>
            <p className="text-xs text-sidebar-foreground/70 leading-tight">
              Sistema de Asistencia y<br />Validaciones Academicas
            </p>
          </div>
        </Link>
      </div>

      {/* Mode Switch for Admin Users */}
      {canSwitchMode && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">Modo</span>
            <div className="flex items-center justify-between gap-2 bg-sidebar-accent/30 rounded-lg p-2">
              <span className={cn(
                'text-xs',
                activeMode === 'SOLICITANTE' ? 'font-semibold text-sidebar-foreground' : 'text-sidebar-foreground/60'
              )}>
                Solicitante
              </span>
              <Switch
                checked={activeMode === 'APROBADOR'}
                onCheckedChange={(checked) => setActiveMode(checked ? 'APROBADOR' : 'SOLICITANTE')}
                className="data-[state=checked]:bg-sidebar-primary"
              />
              <span className={cn(
                'text-xs',
                activeMode === 'APROBADOR' ? 'font-semibold text-sidebar-foreground' : 'text-sidebar-foreground/60'
              )}>
                {currentProfile.role === 'DECANO' ? 'Aprobador' : 'Revisor'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        
        {filteredAdminItems.length > 0 && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                Administracion
              </p>
            </div>
            {filteredAdminItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesion
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 pt-0">
        <p className="text-xs text-sidebar-foreground/50 text-center">
          &copy; 2026 FCVVT
        </p>
      </div>
    </aside>
  )
}
