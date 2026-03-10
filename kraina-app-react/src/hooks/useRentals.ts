'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Rental } from '@/lib/types'
import type { RentalStatus } from '@/lib/types'
import { toast } from 'sonner'

const toAppStatus = (s: string) => (s === 'in_progress' ? 'inProgress' : s) as RentalStatus
const toDbStatus = (s: string) => s === 'inProgress' ? 'in_progress' : s

function mapRental(rental: any): Rental {
  return {
    id: rental.id,
    date: rental.date,
    setupTime: rental.setup_time,
    teardownTime: rental.teardown_time,
    clientName: rental.client_name,
    clientPhone: rental.client_phone,
    address: rental.address,
    latitude: rental.latitude,
    longitude: rental.longitude,
    attractionIds: rental.attraction_ids,
    rentalCost: rental.rental_cost,
    deliveryCost: rental.delivery_cost,
    customPrice: rental.custom_price,
    distanceKm: rental.distance_km,
    assignedEmployeeId: rental.assigned_employee_id,
    assignedEmployees: (rental.employee_assignments || []).map((a: any) => ({
      id: a.id,
      rentalId: a.rental_id,
      employeeId: a.employee_id,
      didAssembly: a.did_assembly,
      didDisassembly: a.did_disassembly,
      assemblyTime: a.assembly_time,
      disassemblyTime: a.disassembly_time,
      assemblyRateSnapshot: a.assembly_rate_snapshot,
      disassemblyRateSnapshot: a.disassembly_rate_snapshot,
    })),
    status: toAppStatus(rental.status),
    notes: rental.notes,
    contractPhotoUrl: rental.contract_photo_url,
    createdById: rental.created_by,
    createdAt: rental.created_at,
    updatedAt: rental.updated_at,
    calendarEventId: rental.calendar_event_id,
    totalCost: rental.custom_price ?? (rental.rental_cost + rental.delivery_cost),
    hasContract: !!rental.contract_photo_url,
  }
}

export function useRentals() {
  const { data: rentals = [], isLoading, error } = useQuery({
    queryKey: ['rentals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rentals')
        .select('*, employee_assignments(*)')
        .order('date', { ascending: false })

      if (error) throw error
      return (data || []).map(mapRental)
    },
  })

  return { rentals, isLoading, error }
}

export function useCreateRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      date: string
      setupTime: string
      teardownTime: string
      clientName: string
      clientPhone: string
      address: string
      latitude?: number
      longitude?: number
      attractionIds: string[]
      rentalCost: number
      deliveryCost: number
      customPrice?: number
      distanceKm?: number
      assignedEmployeeId?: string
      notes?: string
    }) => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Brak zalogowanego użytkownika')

      const { data, error } = await supabase
        .from('rentals')
        .insert({
          date: payload.date,
          setup_time: payload.setupTime,
          teardown_time: payload.teardownTime,
          client_name: payload.clientName,
          client_phone: payload.clientPhone,
          address: payload.address,
          latitude: payload.latitude ?? 0,
          longitude: payload.longitude ?? 0,
          attraction_ids: payload.attractionIds,
          rental_cost: payload.rentalCost,
          delivery_cost: payload.deliveryCost,
          custom_price: payload.customPrice ?? null,
          distance_km: payload.distanceKm ?? null,
          assigned_employee_id: payload.assignedEmployeeId ?? null,
          notes: payload.notes ?? null,
          status: 'pending',
          created_by: userData.user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Rezerwacja została utworzona.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Wystąpił błąd podczas tworzenia rezerwacji.')
    },
  })
}

export function useUpdateRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const mapped: Record<string, any> = {}
      if (updates.date !== undefined) mapped.date = updates.date
      if (updates.setupTime !== undefined) mapped.setup_time = updates.setupTime
      if (updates.teardownTime !== undefined) mapped.teardown_time = updates.teardownTime
      if (updates.clientName !== undefined) mapped.client_name = updates.clientName
      if (updates.clientPhone !== undefined) mapped.client_phone = updates.clientPhone
      if (updates.address !== undefined) mapped.address = updates.address
      if (updates.latitude !== undefined) mapped.latitude = updates.latitude
      if (updates.longitude !== undefined) mapped.longitude = updates.longitude
      if (updates.attractionIds !== undefined) mapped.attraction_ids = updates.attractionIds
      if (updates.rentalCost !== undefined) mapped.rental_cost = updates.rentalCost
      if (updates.deliveryCost !== undefined) mapped.delivery_cost = updates.deliveryCost
      if (updates.customPrice !== undefined) mapped.custom_price = updates.customPrice
      if (updates.distanceKm !== undefined) mapped.distance_km = updates.distanceKm
      if (updates.assignedEmployeeId !== undefined) mapped.assigned_employee_id = updates.assignedEmployeeId
      if (updates.notes !== undefined) mapped.notes = updates.notes
      if (updates.status !== undefined) mapped.status = toDbStatus(updates.status)
      mapped.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('rentals')
        .update(mapped)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Rezerwacja została zaktualizowana.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Wystąpił błąd podczas aktualizacji rezerwacji.')
    },
  })
}

export function useUpdateRentalStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('rentals')
        .update({ status: toDbStatus(status), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Status rezerwacji został zmieniony.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Wystąpił błąd podczas zmiany statusu.')
    },
  })
}

export function useDeleteRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rentals').delete().eq('id', id)
      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Rezerwacja została usunięta.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Wystąpił błąd podczas usuwania rezerwacji.')
    },
  })
}

export function useUpsertAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      rentalId: string
      employeeId: string
      didAssembly: boolean
      didDisassembly: boolean
      assemblyRate: number
      disassemblyRate: number
    }) => {
      // Check for existing assignment
      const { data: existing } = await supabase
        .from('employee_assignments')
        .select('id, did_assembly, did_disassembly')
        .eq('rental_id', payload.rentalId)
        .eq('employee_id', payload.employeeId)
        .maybeSingle()

      const updates: Record<string, any> = {
        did_assembly: payload.didAssembly,
        did_disassembly: payload.didDisassembly,
        assembly_rate_snapshot: payload.assemblyRate,
        disassembly_rate_snapshot: payload.disassemblyRate,
      }
      if (payload.didAssembly && !existing?.did_assembly) {
        updates.assembly_time = new Date().toISOString()
      }
      if (payload.didDisassembly && !existing?.did_disassembly) {
        updates.disassembly_time = new Date().toISOString()
      }

      if (existing) {
        const { error } = await supabase
          .from('employee_assignments')
          .update(updates)
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('employee_assignments')
          .insert({
            rental_id: payload.rentalId,
            employee_id: payload.employeeId,
            ...updates,
          })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] })
      toast.success('Status pracy został zapisany.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Wystąpił błąd podczas zapisywania statusu pracy.')
    },
  })
}
