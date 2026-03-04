'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Rental } from '@/lib/types'

export function useRentals() {
  const { data: rentals = [], isLoading, error } = useQuery({
    queryKey: ['rentals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rentals')
        .select('*, employee_assignments(*)')
        .order('date', { ascending: false })

      if (error) throw error

      return (data || []).map((rental: any) => ({
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
        assignedEmployees: rental.employee_assignments || [],
        status: rental.status,
        notes: rental.notes,
        contractPhotoUrl: rental.contract_photo_url,
        createdById: rental.created_by,
        createdAt: rental.created_at,
        updatedAt: rental.updated_at,
        calendarEventId: rental.calendar_event_id,
        totalCost: (rental.custom_price ?? rental.rental_cost) + rental.delivery_cost,
        hasContract: !!rental.contract_photo_url,
      }))
    },
  })

  return { rentals, isLoading, error }
}
