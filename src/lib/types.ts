export type UserRole = 'employee' | 'admin' | 'owner'
export type RentalStatus = 'pending' | 'confirmed' | 'inProgress' | 'completed' | 'cancelled'
export type PaymentType = 'cash' | 'blik' | 'transfer'
export type Granularity = 'day' | 'week' | 'month'

export interface User {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  address?: string
  role: UserRole
  avatarUrl?: string
  isActive: boolean
  assemblyRate: number
  disassemblyRate: number
  createdAt: string
  fullName?: string
  initials?: string
}

export interface Attraction {
  id: string
  name: string
  description: string
  width: number
  length: number
  height: number
  weight: number
  rentalPrice: number
  imageUrls: string[]
  category?: string
  isActive: boolean
  createdAt: string
  createdBy?: string
  dimensions?: string
  formattedPrice?: string
  primaryImageUrl?: string
}

export interface EmployeeAssignment {
  id?: string
  rentalId?: string
  employeeId: string
  didAssembly: boolean
  didDisassembly: boolean
  assemblyTime?: string
  disassemblyTime?: string
  assemblyRateSnapshot?: number
  disassemblyRateSnapshot?: number
}

export interface AssemblyRecord {
  attractionId: string
  employeeId: string
  timestamp: string
  isAssembly: boolean
}

export interface Rental {
  id: string
  date: string
  setupTime: string
  teardownTime: string
  clientName: string
  clientPhone: string
  address: string
  latitude: number
  longitude: number
  attractionIds: string[]
  rentalCost: number
  deliveryCost: number
  customPrice?: number
  distanceKm?: number
  assignedEmployeeId?: string
  assignedEmployees: EmployeeAssignment[]
  status: RentalStatus
  notes?: string
  contractPhotoUrl?: string
  setupPhotoUrls?: string[]
  paymentType?: PaymentType
  hasInvoice?: boolean
  hasReceipt?: boolean
  createdById: string
  createdAt: string
  updatedAt?: string
  assemblyRecords?: AssemblyRecord[]
  disassemblyRecords?: AssemblyRecord[]
  calendarEventId?: string
  totalCost?: number
  hasContract?: boolean
}

export interface Client {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface AuthSession {
  user: {
    id: string
    email: string
    user_metadata?: Record<string, any>
  }
  session: {
    access_token: string
    refresh_token?: string
  } | null
}

export interface LoadingState {
  users: boolean
  attractions: boolean
  rentals: boolean
  currentUser: boolean
}

export type ExpenseCategory = 'fuel' | 'food' | 'repair' | 'material' | 'attraction_repair' | 'other'

export interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  description: string
  amount: number
  createdBy: string
  createdAt: string
}

export interface AppError {
  message: string
  code?: string
  details?: any
}
