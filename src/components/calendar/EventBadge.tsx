'use client'

import { cn } from '@/lib/utils'

interface EventBadgeProps {
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  children: React.ReactNode
  className?: string
}

const statusStyles = {
  pending: 'bg-status-pending text-status-pending-fg border-l-[4px] border-l-status-pending-border',
  confirmed: 'bg-status-confirmed text-status-confirmed-fg border-l-[4px] border-l-status-confirmed-border',
  in_progress: 'bg-status-in-progress text-status-in-progress-fg border-l-[4px] border-l-status-in-progress-border',
  completed: 'bg-status-completed text-status-completed-fg border-l-[4px] border-l-status-completed-border',
  cancelled: 'bg-status-cancelled text-status-cancelled-fg border-l-[4px] border-l-status-cancelled-border',
}

export function EventBadge({ status, children, className }: EventBadgeProps) {
  return (
    <div
      className={cn(
        'rounded-md px-3 py-1.5 text-xs font-semibold',
        'transition-shadow hover:shadow-md',
        statusStyles[status],
        className
      )}
    >
      {children}
    </div>
  )
}
