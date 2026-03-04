import { create } from 'zustand'
import { User, Rental, Attraction, LoadingState } from '@/lib/types'

interface AppState {
  users: User[]
  rentals: Rental[]
  attractions: Attraction[]
  currentUser: User | null
  loading: LoadingState
  error: string | null

  // setters
  setUsers: (users: User[]) => void
  setRentals: (rentals: Rental[]) => void
  setAttractions: (attractions: Attraction[]) => void
  setCurrentUser: (user: User | null) => void
  setLoading: (loading: Partial<LoadingState>) => void
  setError: (error: string | null) => void

  // data refresh
  isRefreshing: boolean
  setIsRefreshing: (value: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  users: [],
  rentals: [],
  attractions: [],
  currentUser: null,
  loading: {
    users: false,
    attractions: false,
    rentals: false,
    currentUser: false,
  },
  error: null,
  isRefreshing: false,

  setUsers: (users) => set({ users }),
  setRentals: (rentals) => set({ rentals }),
  setAttractions: (attractions) => set({ attractions }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setLoading: (loading) => set((state) => ({ loading: { ...state.loading, ...loading } })),
  setError: (error) => set({ error }),
  setIsRefreshing: (value) => set({ isRefreshing: value }),
}))
