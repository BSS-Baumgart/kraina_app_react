'use client'

import { usePathname } from 'next/navigation'
import { getPageMeta } from '@/lib/page-meta'

interface PageHeaderProps {
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const pathname = usePathname()
  const meta = getPageMeta(pathname)

  const resolvedTitle = title ?? meta.title
  const resolvedDescription = description ?? meta.description

  return (
    <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 sm:pb-5 border-b border-border">
      <div className="space-y-0.5 min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">{resolvedTitle}</h1>
        {resolvedDescription && (
          <p className="text-sm text-muted-foreground">{resolvedDescription}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
