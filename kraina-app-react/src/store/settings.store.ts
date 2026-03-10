import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TransportSettings {
  pricePerKm: number
  freeKmThreshold: number
}

interface CompanySettings {
  address: string
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
        address: '',
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
    }
  )
)
