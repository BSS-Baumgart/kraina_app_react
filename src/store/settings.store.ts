import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TransportSettings {
  pricePerKm: number
  freeKmThreshold: number
}

interface CompanySettings {
  street: string
  houseNumber: string
  postalCode: string
  city: string
}

export function getFullCompanyAddress(company: CompanySettings): string {
  const parts = [
    company.street && company.houseNumber
      ? `${company.street} ${company.houseNumber}`
      : company.street || company.houseNumber,
    company.postalCode,
    company.city,
  ].filter(Boolean)
  return parts.join(', ')
}

interface SettingsState {
  transport: TransportSettings
  company: CompanySettings
  setTransportSettings: (settings: Partial<TransportSettings>) => void
  setCompanySettings: (settings: Partial<CompanySettings>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      transport: {
        pricePerKm: 1.5,
        freeKmThreshold: 25,
      },
      company: {
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
      },
      setTransportSettings: (settings) =>
        set((state) => ({
          transport: { ...state.transport, ...settings },
        })),
      setCompanySettings: (settings) =>
        set((state) => ({
          company: { ...state.company, ...settings },
        })),
    }),
    {
      name: 'kraina-settings',
      merge: (persisted, current) => {
        const p = persisted as Partial<SettingsState> | undefined
        return {
          ...current,
          ...p,
          transport: { ...(current as SettingsState).transport, ...p?.transport },
          company: { ...(current as SettingsState).company, ...p?.company },
        } as SettingsState
      },
    }
  )
)
