'use client'

import type { Rental } from '@/lib/types'
import { STATUS_DISPLAY, STATUS_COLORS } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Clock, Package, ArrowRight, Camera } from 'lucide-react'

interface RentalRowProps {
  rental: Rental
  showDate?: boolean
  canManage: boolean
  formatDatePl: (dateStr: string) => string
  onClick: (rental: Rental) => void
}

export function RentalRow({ rental, showDate = true, canManage, formatDatePl, onClick }: RentalRowProps) {
  return (
    <div
      className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
      onClick={() => onClick(rental)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{rental.clientName}</p>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 shrink-0"
            style={{
              borderColor: STATUS_COLORS[rental.status],
              color: STATUS_COLORS[rental.status],
            }}
          >
            {STATUS_DISPLAY[rental.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          {showDate && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDatePl(rental.date)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {rental.setupTime}-{rental.teardownTime}
          </span>
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {rental.attractionIds.length}
          </span>
          {(rental.setupPhotoUrls?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Camera className="h-3 w-3" />
              {rental.setupPhotoUrls!.length}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {canManage && (
          <span className="text-sm font-medium">
            {formatPrice(rental.totalCost ?? rental.rentalCost + rental.deliveryCost)}
          </span>
        )}
        <ArrowRight className="h-4 w-4 text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}
