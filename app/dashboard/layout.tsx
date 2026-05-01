import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserProvider } from '@/lib/auth/context'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'

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
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar initialProfile={profile} />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Header */}
          <MobileNav initialProfile={profile} />
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="hidden md:block py-3 px-6 border-t border-border bg-card">
            <p className="text-xs text-muted-foreground text-center">
              &copy; 2026 FCVVT. Todos los derechos reservados.
            </p>
          </footer>
        </div>
      </div>
    </UserProvider>
  )
}
