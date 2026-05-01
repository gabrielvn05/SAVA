'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, ActiveMode, DelegatedPermission, PermissionType } from '@/lib/types'

interface UserContextType {
  profile: Profile | null
  isLoading: boolean
  activeMode: ActiveMode
  setActiveMode: (mode: ActiveMode) => void
  delegatedPermissions: DelegatedPermission[]
  hasPermission: (permission: PermissionType) => boolean
  canSwitchMode: boolean
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeMode, setActiveMode] = useState<ActiveMode>('SOLICITANTE')
  const [delegatedPermissions, setDelegatedPermissions] = useState<DelegatedPermission[]>([])

  const supabase = createClient()

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setProfile(null)
        setIsLoading(false)
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Fetch delegated permissions
      const { data: permissions } = await supabase
        .from('delegated_permissions')
        .select('*')
        .eq('granted_to', user.id)
        .eq('active', true)

      setDelegatedPermissions(permissions || [])
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Decano and Secretaria can switch between modes
  const canSwitchMode = profile?.role === 'DECANO' || profile?.role === 'SECRETARIA'

  // Check if user has a specific permission (either by role or delegation)
  const hasPermission = (permission: PermissionType): boolean => {
    if (!profile) return false

    // Decano has all permissions
    if (profile.role === 'DECANO') return true

    // Secretaria has review permissions
    if (profile.role === 'SECRETARIA' && permission === 'REVIEW_REQUESTS') return true

    // Check delegated permissions
    return delegatedPermissions.some(
      p => p.permission_type === permission && p.active
    )
  }

  return (
    <UserContext.Provider
      value={{
        profile,
        isLoading,
        activeMode,
        setActiveMode,
        delegatedPermissions,
        hasPermission,
        canSwitchMode,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
