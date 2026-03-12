'use client'

import { ReactNode } from 'react'
import { MainShell } from '@/components/layout/MainShell'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return <MainShell>{children}</MainShell>
}
