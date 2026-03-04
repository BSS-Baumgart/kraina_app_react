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

export const ROUTE_PATHS = {
  LOGIN: '/login',
  APP: '/app',
  CALENDAR: '/app/calendar',
  ATTRACTIONS: '/app/attractions',
  STATISTICS: '/app/statistics',
  PROFILE: '/app/profile',
  HELP: '/help',
  PRIVACY: '/privacy',
} as const
