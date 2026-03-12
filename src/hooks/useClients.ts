'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Client } from '@/lib/types'
import { toast } from 'sonner'

function mapClient(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useClients() {
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return (data || []).map(mapClient)
    },
  })

  return { clients, isLoading, error }
}

export function useUpsertClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { name: string; phone: string; address?: string }) => {
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', payload.phone)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('clients')
          .update({ name: payload.name, address: payload.address ?? null })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('clients')
          .insert({ name: payload.name, phone: payload.phone, address: payload.address ?? null })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { id: string; name?: string; phone?: string; email?: string; address?: string; notes?: string }) => {
      const { id, ...fields } = payload
      const dbFields: Record<string, unknown> = {}
      if (fields.name !== undefined) dbFields.name = fields.name
      if (fields.phone !== undefined) dbFields.phone = fields.phone
      if (fields.email !== undefined) dbFields.email = fields.email
      if (fields.address !== undefined) dbFields.address = fields.address
      if (fields.notes !== undefined) dbFields.notes = fields.notes

      const { error } = await supabase
        .from('clients')
        .update(dbFields)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Dane klienta zaktualizowane.')
    },
    onError: () => {
      toast.error('Nie udało się zaktualizować klienta.')
    },
  })
}
