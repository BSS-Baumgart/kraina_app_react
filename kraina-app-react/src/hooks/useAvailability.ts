'use client'

import { useMemo } from 'react'
import { Rental, Attraction } from '@/lib/types'
import { overlaps } from '@/lib/utils'

export function useAvailability(
  attractions: Attraction[],
  rentals: Rental[],
  date: string,
  setupTime: string,
  teardownTime: string,
  excludeRentalId?: string
) {
  const availableAttractions = useMemo(() => {
    const bookedIds = new Set(
      rentals
        .filter((r) => r.date === date && r.status !== 'cancelled')
        .filter((r) => r.id !== excludeRentalId)
        .filter((r) => overlaps(r.setupTime, r.teardownTime, setupTime, teardownTime))
        .flatMap((r) => r.attractionIds)
    )

    return attractions.filter((a) => a.isActive && !bookedIds.has(a.id))
  }, [attractions, rentals, date, setupTime, teardownTime, excludeRentalId])

  return availableAttractions
}
