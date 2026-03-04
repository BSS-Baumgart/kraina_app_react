'use client'

import { ReactNode } from 'react'
import { AppSidebar } from './AppSidebar'
import { TopHeader } from './TopHeader'
import { AppBreadcrumb } from './AppBreadcrumb'
import { useAuth } from '@/hooks/useAuth'
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"

interface MainShellProps {
  children: ReactNode
}

export function MainShell({ children }: MainShellProps) {
  const { isLoading, isAuthenticated } = useAuth() // Wywołanie hooka tutaj wymusza inicjalizację stanu autoryzacji przy każdym załadowaniu aplikacji!

  // Przerywamy renderowanie Sidebar zanim załaduje się user i rola
  if (isLoading || (!isAuthenticated && typeof window !== 'undefined')) {
    return (
      <div className="flex h-svh w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
           {/* You can add your app logo here */}
           <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-md"></div>
           <p className="text-sm text-muted-foreground animate-pulse">Ładowanie aplikacji...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
      <SidebarInset className="flex flex-col overflow-hidden">
        <TopHeader />
        <div className="flex-1 overflow-auto bg-background">
          <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-8">
            <div className="mb-4">
              <AppBreadcrumb />
            </div>
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
