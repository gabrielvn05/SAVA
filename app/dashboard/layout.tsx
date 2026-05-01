import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserProvider } from '@/lib/auth/context'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  return (
    <UserProvider>
      <div className="flex h-screen bg-background">
        <DashboardSidebar initialProfile={profile} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader initialProfile={profile} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  )
}
