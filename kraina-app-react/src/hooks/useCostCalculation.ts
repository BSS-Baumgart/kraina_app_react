'use client'

import { useMemo } from 'react'
import { useSettingsStore } from '@/store/settings.store'

export function useCostCalculation(attractions: any[], selectedAttractionIds: string[], distanceKm: number = 0) {
  const { pricePerKm, freeKmThreshold } = useSettingsStore((s) => s.transport)

  const costs = useMemo(() => {
    const selected = attractions.filter((a) => selectedAttractionIds.includes(a.id))
    const rentalCost = selected.reduce((sum, a) => sum + a.rentalPrice, 0)

    const billableKm = Math.max(0, distanceKm - freeKmThreshold)
    const deliveryCost = Math.round(billableKm * pricePerKm * 100) / 100

    return {
      rentalCost,
      deliveryCost,
      totalCost: rentalCost + deliveryCost,
      selectedAttractionCount: selected.length,
    }
  }, [attractions, selectedAttractionIds, distanceKm, pricePerKm, freeKmThreshold])

  return costs
}
