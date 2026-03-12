'use client'

import { useState, useCallback } from 'react'
import { useSettingsStore, getFullCompanyAddress } from '@/store/settings.store'

interface DistanceResult {
  distanceKm: number
  durationMinutes: number
}

export function useDistance() {
  const company = useSettingsStore((s) => s.company)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = useCallback(
    async (destinationAddress: string): Promise<DistanceResult | null> => {
      setError(null)

      const originAddress = getFullCompanyAddress(company)
      if (!originAddress) {
        setError('Uzupełnij adres firmy w ustawieniach')
        return null
      }

      if (!destinationAddress.trim()) {
        setError('Podaj adres dostawy')
        return null
      }

      setIsLoading(true)
      try {
        const res = await fetch('/api/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin: originAddress, destination: destinationAddress.trim() }),
        })

        const data = await res.json()

        if (!res.ok || data?.error) {
          setError(data?.error || 'Błąd połączenia z API dystansu')
          return null
        }

        const distanceKm = data?.distanceKm
        const durationMinutes = data?.durationMinutes

        if (distanceKm == null || isNaN(Number(distanceKm))) {
          setError('Nie udało się obliczyć dystansu — sprawdź adresy')
          return null
        }

        return {
          distanceKm: Math.round(Number(distanceKm) * 10) / 10,
          durationMinutes: Math.round(Number(durationMinutes) || 0),
        }
      } catch {
        setError('Nieoczekiwany błąd przy obliczaniu dystansu')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [company]
  )

  return { calculate, isLoading, error }
}
