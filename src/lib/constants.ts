import type { RentalStatus, UserRole } from '@/lib/types'

export const USER_ROLES = {
  EMPLOYEE: 'employee',
  ADMIN: 'admin',
  OWNER: 'owner',
} as const

export const RENTAL_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const STATUS_DISPLAY = {
  pending: 'Oczekujący',
  confirmed: 'Potwierdzony',
  inProgress: 'W trakcie',
  completed: 'Zakończony',
  cancelled: 'Anulowany',
} as const

export const STATUS_COLORS: Record<string, string> = {
  pending: '#FBBF24',
  confirmed: '#22C55E',
  inProgress: '#3B82F6',
  completed: '#6366F1',
  cancelled: '#EF4444',
}

export const BRAND_COLORS = {
  primary: '#3b86c6',
  secondary: '#ebcc7c',
  accent: '#d98481',
  surface: '#FDF9F0',
  textPrimary: '#1A2744',
  border: '#E8DFC4',
  chipBg: '#FDF3D8',
} as const

export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #2a75bb, #3b86c6)',
  accent: 'linear-gradient(135deg, #d98481, #ebcc7c)',
  gold: 'linear-gradient(135deg, #f0d68a, #ebcc7c)',
  background: 'linear-gradient(180deg, #FDF9F0, #e8f3fb)',
} as const

export const COMPANY_ADDRESS = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || 'Warszawa, Polska'
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Kraina Zjeżdżalni'

export const DEFAULT_SETUP_TIME = '09:00'
export const DEFAULT_TEARDOWN_TIME = '18:00'

export const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000

export const ROUTE_PATHS = {
  LOGIN: '/login',
  APP: '/app',
  DASHBOARD: '/app/dashboard',
  CALENDAR: '/app/calendar',
  ATTRACTIONS: '/app/attractions',
  STATISTICS: '/app/statistics',
  PROFILE: '/app/profile',
  HELP: '/help',
  PRIVACY: '/privacy',
} as const

export const EXPENSE_CATEGORIES = {
  fuel: 'Paliwo',
  food: 'Jedzenie',
  repair: 'Naprawa',
  material: 'Materiały',
  attraction_repair: 'Naprawa atrakcji',
  other: 'Inne',
} as const

export const PAYMENT_TYPE_DISPLAY = {
  cash: 'Gotówka',
  blik: 'BLIK',
  transfer: 'Przelew',
} as const

export const CHART_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)',
]

export const CHART_COLORS_EXTENDED = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)',
  '#F59E0B', '#10B981', '#EC4899',
]

export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'pending', label: STATUS_DISPLAY.pending },
  { value: 'confirmed', label: STATUS_DISPLAY.confirmed },
  { value: 'inProgress', label: STATUS_DISPLAY.inProgress },
  { value: 'completed', label: STATUS_DISPLAY.completed },
  { value: 'cancelled', label: STATUS_DISPLAY.cancelled },
]

export const STATUS_ORDER = ['pending', 'confirmed', 'inProgress', 'completed', 'cancelled'] as const

export const MONTH_NAMES_SHORT = [
  'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
  'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru',
]

export const GRANULARITY_LABELS: Record<string, string> = {
  day: 'Dzień',
  week: 'Tydzień',
  month: 'Miesiąc',
}

export const STATUS_TRANSITIONS: Record<string, { value: RentalStatus; label: string }[]> = {
  pending: [
    { value: 'confirmed', label: 'Potwierdź' },
    { value: 'cancelled', label: 'Anuluj' },
  ],
  confirmed: [
    { value: 'inProgress', label: 'Rozpocznij' },
    { value: 'cancelled', label: 'Anuluj' },
  ],
  inProgress: [
    { value: 'completed', label: 'Zakończ' },
    { value: 'cancelled', label: 'Anuluj' },
  ],
  completed: [],
  cancelled: [],
}

export const ATTRACTION_CATEGORIES = [
  'Zamki dmuchane',
  'Zjeżdżalnie',
  'Place zabaw',
  'Tory przeszkód',
  'Inne',
]

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: 'Pracownik',
  admin: 'Administrator',
  owner: 'Właściciel',
}

export const ROLE_VARIANTS: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  employee: 'secondary',
  admin: 'default',
  owner: 'default',
}
