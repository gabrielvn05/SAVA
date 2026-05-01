'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/lib/types'
import { ROLE_LABELS } from '@/lib/types'
import { LogOut, User, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { MobileSidebar } from './mobile-sidebar'

interface DashboardHeaderProps {
  initialProfile: Profile
}

export function DashboardHeader({ initialProfile }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const { profile, activeMode, setActiveMode, canSwitchMode } = useUser()
  const currentProfile = profile || initialProfile

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <MobileSidebar initialProfile={initialProfile} />
          </SheetContent>
        </Sheet>

        {canSwitchMode && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Modo:</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${activeMode === 'SOLICITANTE' ? 'font-medium' : 'text-muted-foreground'}`}>
                Solicitante
              </span>
              <Switch
                checked={activeMode === 'APROBADOR'}
                onCheckedChange={(checked) => setActiveMode(checked ? 'APROBADOR' : 'SOLICITANTE')}
              />
              <span className={`text-sm ${activeMode === 'APROBADOR' ? 'font-medium' : 'text-muted-foreground'}`}>
                {currentProfile.role === 'DECANO' ? 'Aprobador' : 'Revisora'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="outline" className="hidden sm:inline-flex">
          {ROLE_LABELS[currentProfile.role]}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(currentProfile.full_name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{currentProfile.full_name}</p>
                <p className="text-xs text-muted-foreground">{currentProfile.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/dashboard/perfil" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
