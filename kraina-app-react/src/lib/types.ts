export type UserRole = 'employee' | 'admin' | 'owner'
export type RentalStatus = 'pending' | 'confirmed' | 'inProgress' | 'completed' | 'cancelled'

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
  // computed
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
  // computed
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
  createdById: string
  createdAt: string
  updatedAt?: string
  assemblyRecords?: AssemblyRecord[]
  disassemblyRecords?: AssemblyRecord[]
  calendarEventId?: string
  // computed
  totalCost?: number
  hasContract?: boolean
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

export interface AppError {
  message: string
  code?: string
  details?: any
}
