import { create } from 'zustand'

interface FiltersState {
  dateFrom: Date
  dateTo: Date
  selectedEmployee: string | null

  setDateFrom: (date: Date) => void
  setDateTo: (date: Date) => void
  setSelectedEmployee: (id: string | null) => void
  reset: () => void
}

const defaultDateFrom = new Date()
defaultDateFrom.setMonth(defaultDateFrom.getMonth() - 6)

const defaultDateTo = new Date()

export const useFiltersStore = create<FiltersState>((set) => ({
  dateFrom: defaultDateFrom,
  dateTo: defaultDateTo,
  selectedEmployee: null,

  setDateFrom: (date) => set({ dateFrom: date }),
  setDateTo: (date) => set({ dateTo: date }),
  setSelectedEmployee: (id) => set({ selectedEmployee: id }),
  reset: () =>
    set({
      dateFrom: defaultDateFrom,
      dateTo: defaultDateTo,
      selectedEmployee: null,
    }),
}))
