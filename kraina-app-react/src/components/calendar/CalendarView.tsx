'use client'

import { useMemo } from 'react'
import { Calendar, Views, dateFnsLocalizer, Messages } from 'react-big-calendar'
import * as dateFns from 'date-fns'
import { pl } from 'date-fns/locale'
import { useRentals } from '@/hooks/useRentals'
import { useUIStore } from '@/store/ui.store'
import { CalendarHeader } from './CalendarHeader'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '@/styles/calendar.css'

// Configure date-fns localizer for react-big-calendar
const locales = { 'pl-PL': pl }

const localizer = dateFnsLocalizer({
  format: dateFns.format,
  parse: dateFns.parse,
  startOfWeek: dateFns.startOfWeek,
  getDay: dateFns.getDay,
  locales,
})

// Polish translations for react-big-calendar
const polishMessages: Messages = {
  date: 'Data',
  time: 'Czas',
  event: 'Wydarzenie',
  allDay: 'Cały dzień',
  week: 'Tydzień',
  work_week: 'Tydzień roboczy',
  day: 'Dzień',
  month: 'Miesiąc',
  previous: 'Poprzedni',
  next: 'Następny',
  yesterday: 'Wczoraj',
  tomorrow: 'Jutro',
  today: 'Dzisiaj',
  agenda: 'Agenda',
  noEventsInRange: 'Brak wydarzeń w tym okresie.',
  showMore: (total: number) => `+ pokaż więcej (${total})`,
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  startDate: string // ISO format for helpers
  endDate: string // ISO format for helpers
  resource: {
    rentalId: string
    clientName: string
    address: string
    status: string
    cost: number
  }
}

export function CalendarView() {
  const { rentals = [], isLoading } = useRentals()
  const { selectedDate, calendarView, setSelectedDate, setCalendarView } = useUIStore()

  // Convert rentals to calendar events for react-big-calendar
  const events: CalendarEvent[] = useMemo(() => {
    if (!rentals || rentals.length === 0) return []

    return rentals.map((rental) => {
      // Parse date from rental - assuming it's stored as string YYYY-MM-DD
      const rentalDate = new Date(rental.date)
      
      // Parse setup and teardown times
      const [setupHour, setupMin] = rental.setupTime?.split(':').map(Number) || [9, 0]
      const [teardownHour, teardownMin] = rental.teardownTime?.split(':').map(Number) || [18, 0]

      const start = new Date(rentalDate)
      start.setHours(setupHour, setupMin, 0, 0)

      const end = new Date(rentalDate)
      end.setHours(teardownHour, teardownMin, 0, 0)

      return {
        id: rental.id,
        title: `${rental.clientName} - ${rental.address}`,
        start,
        end,
        startDate: start.toISOString(), // For compatibility with helpers
        endDate: end.toISOString(), // For compatibility with helpers
        resource: {
          rentalId: rental.id,
          clientName: rental.clientName,
          address: rental.address,
          status: rental.status,
          cost: rental.rentalCost + (rental.deliveryCost || 0),
        },
      }
    })
  }, [rentals])

  const handleSelectEvent = (event: CalendarEvent) => {
    console.log('Event selected:', event)
    // TODO: Open rental details modal or navigate to rental edit page
    useUIStore.setState({ selectedRentalId: event.resource.rentalId })
  }

  const handleNavigate = (date: Date) => {
    setSelectedDate(date)
  }

  const handleViewChange = (view: string) => {
    setCalendarView(view as any)
  }

  const EventStyleGetter = (event: CalendarEvent) => {
    const statusClassMap: Record<string, string> = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      in_progress: 'status-in_progress',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
    }

    const statusClass = statusClassMap[event.resource.status] || 'status-pending'

    return {
      className: statusClass,
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-background rounded-lg border">
        <p className="text-muted-foreground">Ładowanie terminrza...</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card bg-background shadow-sm">
      <CalendarHeader events={events} />
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100svh - 225px)', minHeight: '400px' }}
        view={calendarView as any}
        onView={handleViewChange}
        date={selectedDate}
        onNavigate={handleNavigate}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={EventStyleGetter}
        views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
        messages={polishMessages}
        culture="pl-PL"
        toolbar={false}
        popup
        selectable
      />
    </div>
  )
}
