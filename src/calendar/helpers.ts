import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  subDays,
  subMonths,
  subWeeks,
  subYears,
  isSameWeek,
  isSameDay,
  isSameMonth,
  isSameYear,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  startOfDay,
  differenceInDays,
  endOfYear,
  startOfYear,
} from 'date-fns'

import type { ICalendarCell, IRentalEvent } from '@/calendar/interfaces'
import type { TCalendarView, TVisibleHours, TWorkingHours } from '@/calendar/types'

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function rangeText(view: TCalendarView, date: Date): string {
  let start: Date
  let end: Date

  switch (view) {
    case 'agenda':
      start = startOfMonth(date)
      end = endOfMonth(date)
      break
    case 'year':
      start = startOfYear(date)
      end = endOfYear(date)
      break
    case 'month':
      start = startOfMonth(date)
      end = endOfMonth(date)
      break
    case 'week':
      start = startOfWeek(date)
      end = endOfWeek(date)
      break
    case 'day':
      return formatDate(date)
    default:
      return 'Error while formatting'
  }

  return `${formatDate(start)} - ${formatDate(end)}`
}

export function navigateDate(
  date: Date,
  view: TCalendarView,
  direction: 'previous' | 'next'
): Date {
  const operations = {
    agenda: direction === 'next' ? addMonths : subMonths,
    year: direction === 'next' ? addYears : subYears,
    month: direction === 'next' ? addMonths : subMonths,
    week: direction === 'next' ? addWeeks : subWeeks,
    day: direction === 'next' ? addDays : subDays,
  }

  return operations[view](date, 1)
}

export function getEventsCount(
  events: IRentalEvent[],
  date: Date,
  view: TCalendarView
): number {
  const compareFns = {
    agenda: isSameMonth,
    year: isSameYear,
    day: isSameDay,
    week: isSameWeek,
    month: isSameMonth,
  }

  const compareFn = compareFns[view] || isSameMonth
  return events.filter((event) => {
    const eventDate = new Date(event.startDate)
    return compareFn(eventDate, date)
  }).length
}

export function getCurrentEvents(events: IRentalEvent[]) {
  const now = new Date()
  return (
    events.filter((event) => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      return now >= eventStart && now <= eventEnd
    }) || null
  )
}

export function groupEvents(dayEvents: IRentalEvent[]) {
  const sortedEvents = dayEvents.sort(
    (a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )
  const groups: IRentalEvent[][] = []

  for (const event of sortedEvents) {
    const eventStart = new Date(event.startDate)

    let placed = false
    for (const group of groups) {
      const lastEventInGroup = group[group.length - 1]
      const lastEventEnd = new Date(lastEventInGroup.endDate)

      if (eventStart >= lastEventEnd) {
        group.push(event)
        placed = true
        break
      }
    }

    if (!placed) groups.push([event])
  }

  return groups
}

export function getEventBlockStyle(
  event: IRentalEvent,
  day: Date,
  groupIndex: number,
  groupSize: number,
  visibleHoursRange?: { from: number; to: number }
) {
  const startDate = new Date(event.startDate)
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0)
  const eventStart = startDate < dayStart ? dayStart : startDate
  const startMinutes = Math.floor((eventStart.getTime() - dayStart.getTime()) / (1000 * 60))

  let top

  if (visibleHoursRange) {
    const visibleStartMinutes = visibleHoursRange.from * 60
    const visibleEndMinutes = visibleHoursRange.to * 60
    const visibleRangeMinutes = visibleEndMinutes - visibleStartMinutes
    top = ((startMinutes - visibleStartMinutes) / visibleRangeMinutes) * 100
  } else {
    top = (startMinutes / 1440) * 100
  }

  const width = 100 / groupSize
  const left = groupIndex * width

  return { top: `${top}%`, width: `${width}%`, left: `${left}%` }
}

export function isWorkingHour(
  day: Date,
  hour: number,
  workingHours: TWorkingHours
) {
  const dayIndex = day.getDay() as keyof typeof workingHours
  const dayHours = workingHours[dayIndex]
  return hour >= dayHours.from && hour < dayHours.to
}

export function getVisibleHours(
  visibleHours: TVisibleHours,
  singleDayEvents: IRentalEvent[]
) {
  let earliestEventHour = visibleHours.from
  let latestEventHour = visibleHours.to

  singleDayEvents.forEach((event) => {
    const startHour = new Date(event.startDate).getHours()
    const endTime = new Date(event.endDate)
    const endHour = endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0)
    if (startHour < earliestEventHour) earliestEventHour = startHour
    if (endHour > latestEventHour) latestEventHour = endHour
  })

  latestEventHour = Math.min(latestEventHour, 24)

  const hours = Array.from(
    { length: latestEventHour - earliestEventHour },
    (_, i) => i + earliestEventHour
  )

  return { hours, earliestEventHour, latestEventHour }
}

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
  const currentYear = selectedDate.getFullYear()
  const currentMonth = selectedDate.getMonth()

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay()

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1)
  const totalDays = firstDayOfMonth + daysInMonth

  const prevMonthCells = Array.from({ length: firstDayOfMonth }, (_, i) => ({
    day: daysInPrevMonth - firstDayOfMonth + i + 1,
    currentMonth: false,
    date: new Date(
      currentYear,
      currentMonth - 1,
      daysInPrevMonth - firstDayOfMonth + i + 1
    ),
  }))

  const currentMonthCells = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    currentMonth: true,
    date: new Date(currentYear, currentMonth, i + 1),
  }))

  const nextMonthCells = Array.from(
    { length: (7 - (totalDays % 7)) % 7 },
    (_, i) => ({
      day: i + 1,
      currentMonth: false,
      date: new Date(currentYear, currentMonth + 1, i + 1),
    })
  )

  return [...prevMonthCells, ...currentMonthCells, ...nextMonthCells]
}

export function calculateMonthEventPositions(
  multiDayEvents: IRentalEvent[],
  singleDayEvents: IRentalEvent[],
  selectedDate: Date
) {
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)

  const eventPositions: { [key: string]: number } = {}
  const occupiedPositions: { [key: string]: boolean[] } = {}

  const currentDate = new Date(monthStart)
  while (currentDate <= monthEnd) {
    occupiedPositions[currentDate.toISOString()] = [false, false, false]
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const sortedEvents = [
    ...multiDayEvents.sort((a, b) => {
      const aDuration = differenceInDays(
        new Date(a.endDate),
        new Date(a.startDate)
      )
      const bDuration = differenceInDays(
        new Date(b.endDate),
        new Date(b.startDate)
      )
      return (
        bDuration - aDuration ||
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )
    }),
    ...singleDayEvents.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    ),
  ]

  sortedEvents.forEach((event) => {
    const eventStart = new Date(event.startDate)
    const eventEnd = new Date(event.endDate)
    
    const eventDays: Date[] = []
    const current = new Date(eventStart < monthStart ? monthStart : eventStart)
    const end = eventEnd > monthEnd ? monthEnd : eventEnd
    
    while (current <= end) {
      eventDays.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    let position = -1

    for (let i = 0; i < 3; i++) {
      if (
        eventDays.every((day: Date) => {
          const dayPositions = occupiedPositions[startOfDay(day).toISOString()]
          return dayPositions && !dayPositions[i]
        })
      ) {
        position = i
        break
      }
    }

    if (position !== -1) {
      eventDays.forEach((day: Date) => {
        const dayKey = startOfDay(day).toISOString()
        occupiedPositions[dayKey][position] = true
      })
      eventPositions[event.id] = position
    }
  })

  return eventPositions
}

export function getMonthCellEvents(
  date: Date,
  events: IRentalEvent[],
  eventPositions: Record<string, number>
) {
  const eventsForDate = events.filter((event) => {
    const eventStart = new Date(event.startDate)
    const eventEnd = new Date(event.endDate)

    return (
      (date >= eventStart && date <= eventEnd) ||
      isSameDay(date, eventStart) ||
      isSameDay(date, eventEnd)
    )
  })

  return eventsForDate
    .map((event) => ({
      ...event,
      position: eventPositions[event.id] ?? -1,
      isMultiDay: event.startDate !== event.endDate,
    }))
    .sort((a, b) => {
      if (a.isMultiDay && !b.isMultiDay) return -1
      if (!a.isMultiDay && b.isMultiDay) return 1
      return a.position - b.position
    })
}
