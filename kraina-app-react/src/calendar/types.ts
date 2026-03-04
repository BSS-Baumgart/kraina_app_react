export type TCalendarView = 'day' | 'week' | 'month' | 'year' | 'agenda'
export type TEventColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'gray'
export type TWorkingHours = { [key: number]: { from: number; to: number } }
export type TVisibleHours = { from: number; to: number }
