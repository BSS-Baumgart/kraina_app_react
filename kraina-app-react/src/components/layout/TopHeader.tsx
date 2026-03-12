'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth.store'
import { ModeToggle } from '@/components/mode-toggle'
import { getPageMeta } from '@/lib/page-meta'

export function TopHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const meta = getPageMeta(pathname)

  const handleLogout = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.auth.signOut()
      logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'KZ'

  return (
    <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border">
      <div className="px-5 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <SidebarTrigger className="h-10 w-10 [&>svg]:size-6" />
          <div className="flex flex-col min-w-0">
            <span className="text-2xl font-bold text-foreground truncate tracking-tight">{meta.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ModeToggle className="h-10 w-10" />
          <div className="hidden sm:flex flex-col text-right mr-2">
            <span className="text-sm font-semibold text-foreground leading-snug">{user?.fullName}</span>
            <span className="text-sm text-muted-foreground leading-snug">
              {user?.role === 'owner' ? 'Właściciel' : user?.role === 'admin' ? 'Administrator' : 'Pracownik'}
            </span>
          </div>
          <Avatar className="h-10 w-10 cursor-pointer" onClick={() => router.push('/app/profile')}>
            <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">{initials}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={handleLogout} title="Wyloguj">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
