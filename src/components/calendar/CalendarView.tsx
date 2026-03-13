'use client'

import { useMemo, useState, useCallback } from 'react'
import { Calendar, Views, dateFnsLocalizer, Messages, SlotInfo } from 'react-big-calendar'
import * as dateFns from 'date-fns'
import { pl } from 'date-fns/locale'
import { useRentals } from '@/hooks/useRentals'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/store/ui.store'
import { CalendarHeader } from './CalendarHeader'
import { RentalDetailDialog } from '@/components/rentals/RentalDetailDialog'
import { RentalForm } from '@/components/rentals/RentalForm'
import { Rental } from '@/lib/types'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '@/styles/calendar.css'

const locales = { 'pl-PL': pl }

const localizer = dateFnsLocalizer({
  format: dateFns.format,
  parse: dateFns.parse,
  startOfWeek: dateFns.startOfWeek,
  getDay: dateFns.getDay,
  locales,
})

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
  const { user: currentUser } = useAuth()
  const { selectedDate, calendarView, setSelectedDate, setCalendarView } = useUIStore()
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formInitialDate, setFormInitialDate] = useState<string>('')

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'owner'

  const handleAddEvent = useCallback(() => {
    setFormInitialDate('')
    setIsFormOpen(true)
  }, [])

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    if (!canManage) return
    const date = slotInfo.start
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    setFormInitialDate(dateStr)
    setIsFormOpen(true)
  }, [canManage])

  const events: CalendarEvent[] = useMemo(() => {
    if (!rentals || rentals.length === 0) return []

    return rentals.map((rental) => {
      const rentalDate = new Date(rental.date)
      
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
    const rental = rentals.find((r) => r.id === event.resource.rentalId)
    if (rental) setSelectedRental(rental)
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
      <CalendarHeader events={events} onAddEvent={canManage ? handleAddEvent : undefined} />
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100svh - 200px)', minHeight: '350px' }}
        view={calendarView as any}
        onView={handleViewChange}
        date={selectedDate}
        onNavigate={handleNavigate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        eventPropGetter={EventStyleGetter}
        views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
        messages={polishMessages}
        culture="pl-PL"
        toolbar={false}
        popup
        selectable
      />

      <RentalDetailDialog
        rental={selectedRental}
        onClose={() => setSelectedRental(null)}
        onEdit={canManage ? () => {
          setSelectedRental(null)
          setFormInitialDate('')
          setIsFormOpen(true)
        } : undefined}
      />

      {canManage && (
        <ResponsiveDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <ResponsiveDialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>Nowa rezerwacja</ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            <div className="py-2 sm:py-4 px-4 sm:px-0">
              <RentalForm
                initialDate={formInitialDate || undefined}
                onSuccess={() => setIsFormOpen(false)}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      )}
    </div>
  )
}
