import type { TEventColor } from '@/calendar/types'

export interface ICalendarCell {
  day: number
  currentMonth: boolean
  date: Date
}

export interface IRentalEvent {
  id: string
  title: string
  clientName: string
  startDate: string
  endDate: string
  color: TEventColor
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  attractionName: string
  rentalId: string
}
