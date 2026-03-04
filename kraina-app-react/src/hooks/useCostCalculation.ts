'use client'

import { useMemo } from 'react'
import { Rental } from '@/lib/types'

export function useCostCalculation(attractions: any[], selectedAttractionIds: string[], distanceKm: number = 0) {
  const costs = useMemo(() => {
    const selected = attractions.filter((a) => selectedAttractionIds.includes(a.id))
    const rentalCost = selected.reduce((sum, a) => sum + a.rentalPrice, 0)

    // Mock delivery cost calculation: 5 zł per km
    const deliveryCost = distanceKm * 5

    return {
      rentalCost,
      deliveryCost,
      totalCost: rentalCost + deliveryCost,
      selectedAttractionCount: selected.length,
    }
  }, [attractions, selectedAttractionIds, distanceKm])

  return costs
}
