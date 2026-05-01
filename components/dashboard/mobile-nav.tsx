'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUser } from '@/lib/auth/context'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import {
  Home,
  FileText,
  FilePlus,
  Bell,
  User,
  LogOut,
  Menu,
  ClipboardCheck,
  CheckCircle,
  Users,
  Shield,
  BarChart3,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
  requiresApproverMode?: boolean
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/solicitudes', label: 'Mis Solicitudes', icon: FileText },
  { href: '/dashboard/solicitudes/nueva', label: 'Nueva Solicitud', icon: FilePlus },
  { href: '/dashboard/notificaciones', label: 'Notificaciones', icon: Bell },
  { href: '/dashboard/perfil', label: 'Mi perfil', icon: User },
]

const adminNavItems: NavItem[] = [
  { href: '/dashboard/revision', label: 'Revision', icon: ClipboardCheck, roles: ['SECRETARIA', 'DECANO'], requiresApproverMode: true },
  { href: '/dashboard/aprobacion', label: 'Aprobacion', icon: CheckCircle, roles: ['DECANO'], requiresApproverMode: true },
  { href: '/dashboard/usuarios', label: 'Usuarios', icon: Users, roles: ['DECANO'], requiresApproverMode: true },
  { href: '/dashboard/permisos', label: 'Delegacion', icon: Shield, roles: ['DECANO'], requiresApproverMode: true },
  { href: '/dashboard/reportes', label: 'Reportes', icon: BarChart3, roles: ['DECANO', 'SECRETARIA'], requiresApproverMode: true },
]

interface MobileNavProps {
  initialProfile: Profile
}

export function MobileNav({ initialProfile }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { profile, activeMode, setActiveMode, canSwitchMode } = useUser()
  const currentProfile = profile || initialProfile
  const [open, setOpen] = useState(false)

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
        onClick={() => setOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-foreground hover:bg-accent'
        )}
      >
        <Icon className="h-5 w-5" />
        {item.label}
      </Link>
    )
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">S</span>
        </div>
        <span className="font-bold text-lg">SAVA</span>
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">S</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">SAVA</h1>
                  <p className="text-xs text-muted-foreground leading-tight">
                    Sistema de Asistencia y<br />Validaciones Academicas
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Switch */}
            {canSwitchMode && (
              <div className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Modo:</span>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs', activeMode === 'SOLICITANTE' ? 'font-medium' : 'text-muted-foreground')}>
                      Solicitante
                    </span>
                    <Switch
                      checked={activeMode === 'APROBADOR'}
                      onCheckedChange={(checked) => setActiveMode(checked ? 'APROBADOR' : 'SOLICITANTE')}
                    />
                    <span className={cn('text-xs', activeMode === 'APROBADOR' ? 'font-medium' : 'text-muted-foreground')}>
                      {currentProfile.role === 'DECANO' ? 'Aprobador' : 'Revisora'}
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
                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Administracion
                    </p>
                  </div>
                  {filteredAdminItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </>
              )}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Cerrar Sesion
              </button>
            </div>

            <div className="p-4 pt-0">
              <p className="text-xs text-muted-foreground text-center">
                &copy; 2026 FCVVT
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
