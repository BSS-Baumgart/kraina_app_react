'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Grid3x3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUIStore } from '@/store/ui.store'
import { getEventsCount, navigateDate, rangeText } from '@/calendar/helpers'

interface CalendarHeaderProps {
  events: any[]
  onAddEvent?: () => void
}

export function CalendarHeader({ events, onAddEvent }: CalendarHeaderProps) {
  const { selectedDate, setSelectedDate, calendarView, setCalendarView } = useUIStore()

  // Calculate event count based on selected date and view type
  const eventCount = useMemo(() => {
    return getEventsCount(events, selectedDate, calendarView as any)
  }, [events, selectedDate, calendarView])

  const handlePreviousDate = () => {
    setSelectedDate(navigateDate(selectedDate, calendarView, 'previous'))
  }

  const handleNextDate = () => {
    setSelectedDate(navigateDate(selectedDate, calendarView, 'next'))
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  const today = new Date()
  const monthName = selectedDate.toLocaleDateString('pl-PL', { month: 'long' })
  const year = selectedDate.getFullYear()
  const todayMonth = today.toLocaleDateString('pl-PL', { month: 'short' }).toUpperCase()

  return (
    <div className="flex items-center gap-2 border-b bg-background px-3 py-2 sm:px-4 sm:py-2.5">
      {/* Today Button — compact */}
      <button
        onClick={handleToday}
        className="flex shrink-0 w-10 flex-col items-start overflow-hidden rounded-md border hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <p className="flex h-5 w-full items-center justify-center bg-primary text-center text-[10px] font-semibold text-primary-foreground">
          {todayMonth}
        </p>
        <p className="flex w-full items-center justify-center text-sm font-bold py-0.5">{today.getDate()}</p>
      </button>

      {/* Month / Year + badge */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold capitalize sm:text-base truncate">
            {monthName} {year}
          </span>
          <Badge variant="outline" className="px-1 text-xs shrink-0">
            {eventCount} {eventCount === 1 ? 'rez.' : 'rez.'}
          </Badge>
        </div>
        <p className="hidden text-xs text-muted-foreground truncate sm:block">
          {rangeText(calendarView, selectedDate)}
        </p>
      </div>

      {/* Nav arrows */}
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handlePreviousDate}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleNextDate}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* View Switcher — icons only on mobile, icons+text on sm+ */}
      <div className="inline-flex shrink-0 overflow-hidden rounded-lg border">
        <Button
          size="sm"
          variant={calendarView === 'month' ? 'default' : 'ghost'}
          className="rounded-none border-r px-2 sm:px-3"
          onClick={() => setCalendarView('month')}
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="hidden sm:inline sm:ml-1.5">Miesiąc</span>
        </Button>
        <Button
          size="sm"
          variant={calendarView === 'week' ? 'default' : 'ghost'}
          className="rounded-none border-r px-2 sm:px-3"
          onClick={() => setCalendarView('week')}
        >
          <Grid3x3 className="h-4 w-4" />
          <span className="hidden sm:inline sm:ml-1.5">Tydzień</span>
        </Button>
        <Button
          size="sm"
          variant={calendarView === 'agenda' ? 'default' : 'ghost'}
          className="rounded-none px-2 sm:px-3"
          onClick={() => setCalendarView('agenda')}
        >
          <List className="h-4 w-4" />
          <span className="hidden sm:inline sm:ml-1.5">Agenda</span>
        </Button>
      </div>

      {/* Add Event Button */}
      {onAddEvent && (
        <Button onClick={onAddEvent} size="sm" className="shrink-0">
          + Dodaj
        </Button>
      )}
    </div>
  )
}
