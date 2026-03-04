'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Attraction } from '@/lib/types'
import { formatDimensions, formatPrice } from '@/lib/utils'
import { toast } from 'sonner'

export function useAttractions() {
  const { data: attractions = [], isLoading, error } = useQuery({
    queryKey: ['attractions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('attractions').select('*').order('name')

      if (error) throw error

      return (data || []).map((attr: any) => ({
        id: attr.id,
        name: attr.name,
        description: attr.description,
        width: attr.width,
        length: attr.length,
        height: attr.height,
        weight: attr.weight,
        rentalPrice: attr.rental_price,
        imageUrls: attr.image_urls || [],
        category: attr.category,
        isActive: attr.is_active,
        createdAt: attr.created_at,
        createdBy: attr.created_by,
        dimensions: formatDimensions(attr.width, attr.length, attr.height),
        formattedPrice: formatPrice(attr.rental_price),
        primaryImageUrl: attr.image_urls?.[0] || '',
      }))
    },
  })

  return { attractions, isLoading, error }
}

// Mutacja do włączania/wyłączania atrakcji
export function useToggleAttractionStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('attractions')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single()
        
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attractions'] })
      toast.success(`Atrakcja została ${variables.isActive ? 'aktywowana' : 'dezaktywowana'}.`)
    },
    onError: (error) => {
      console.error(error)
      toast.error('Wystąpił błąd podczas zmiany statusu.')
    }
  })
}

// Mutacja do trwałego usunięcia atrakcji
export function useDeleteAttraction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('attractions')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attractions'] })
      toast.success('Atrakcja została całkowicie usunięta.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Wystąpił błąd podczas usuwania atrakcji.')
    }
  })
}

// Mutacja dodająca atrakcję
export function useCreateAttraction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (newAttraction: Omit<Attraction, 'id' | 'createdAt' | 'createdBy' | 'dimensions' | 'formattedPrice' | 'primaryImageUrl'>) => {
      const { data: userData } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('attractions')
        .insert([{
          name: newAttraction.name,
          description: newAttraction.description,
          width: newAttraction.width,
          length: newAttraction.length,
          height: newAttraction.height,
          weight: newAttraction.weight,
          rental_price: newAttraction.rentalPrice,
          image_urls: newAttraction.imageUrls,
          category: newAttraction.category,
          is_active: newAttraction.isActive,
          created_by: userData.user?.id
        }])
        .select()
        .single()
        
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attractions'] })
      toast.success('Atrakcja została dodana pomyślnie.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Wystąpił błąd podczas dodawania atrakcji.')
    }
  })
}

// Mutacja aktualizująca
export function useUpdateAttraction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Omit<Attraction, 'id' | 'createdAt' | 'createdBy' | 'dimensions' | 'formattedPrice' | 'primaryImageUrl'>> }) => {
      const mappedUpdates: any = {}
      if (updates.name !== undefined) mappedUpdates.name = updates.name
      if (updates.description !== undefined) mappedUpdates.description = updates.description
      if (updates.width !== undefined) mappedUpdates.width = updates.width
      if (updates.length !== undefined) mappedUpdates.length = updates.length
      if (updates.height !== undefined) mappedUpdates.height = updates.height
      if (updates.weight !== undefined) mappedUpdates.weight = updates.weight
      if (updates.rentalPrice !== undefined) mappedUpdates.rental_price = updates.rentalPrice
      if (updates.imageUrls !== undefined) mappedUpdates.image_urls = updates.imageUrls
      if (updates.category !== undefined) mappedUpdates.category = updates.category
      if (updates.isActive !== undefined) mappedUpdates.is_active = updates.isActive

      const { data, error } = await supabase
        .from('attractions')
        .update(mappedUpdates)
        .eq('id', id)
        .select()
        .single()
        
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attractions'] })
      toast.success('Atrakcja została zaktualizowana.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Wystąpił błąd podczas aktualizacji atrakcji.')
    }
  })
}
