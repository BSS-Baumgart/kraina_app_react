import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function overlaps(
  aSetup: string,
  aTeardown: string,
  bSetup: string,
  bTeardown: string
): boolean {
  return timeToMinutes(aSetup) < timeToMinutes(bTeardown) && timeToMinutes(bSetup) < timeToMinutes(aTeardown)
}

export function formatPrice(price: number): string {
  return `${price.toFixed(2)} zł`
}

export function formatDimensions(width: number, length: number, height: number): string {
  return `Szer. ${width}m × Dł. ${length}m × Wys. ${height}m`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
}

export function mapSnakeToCamelCase(obj: Record<string, any>): Record<string, any> {
  return Object.keys(obj).reduce((result: Record<string, any>, key: string) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = obj[key]
    return result
  }, {})
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.toDateString() === tomorrow.toDateString()
}

export function formatDateLabel(date: Date): string {
  if (isToday(date)) return 'Dziś'
  if (isTomorrow(date)) return 'Jutro'
  return date.toLocaleDateString('pl-PL', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
