import { create } from 'zustand'

interface UIState {
  selectedDate: Date
  calendarView: 'day' | 'week' | 'month' | 'year' | 'agenda'
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  selectedRentalId: string | null

  // setters
  setSelectedDate: (date: Date) => void
  setCalendarView: (view: 'day' | 'week' | 'month' | 'year' | 'agenda') => void
  setSidebarOpen: (open: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
  setSelectedRentalId: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedDate: new Date(),
  calendarView: 'month',
  sidebarOpen: false,
  mobileMenuOpen: false,
  selectedRentalId: null,

  setSelectedDate: (date) => set({ selectedDate: date }),
  setCalendarView: (view) => set({ calendarView: view }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setSelectedRentalId: (id) => set({ selectedRentalId: id }),
}))
