'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/types'
import { toast } from 'sonner'

function mapUser(row: any): User {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    role: row.role,
    avatarUrl: row.avatar_url,
    isActive: row.is_active,
    assemblyRate: row.assembly_rate,
    disassemblyRate: row.disassembly_rate,
    createdAt: row.created_at,
    fullName: `${row.first_name} ${row.last_name}`,
  }
}

export function useUsers() {
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*').order('first_name')
      if (error) throw error
      return (data || []).map(mapUser)
    },
  })

  return { users, isLoading, error }
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const mapped: Record<string, any> = {}
      if (updates.firstName !== undefined) mapped.first_name = updates.firstName
      if (updates.lastName !== undefined) mapped.last_name = updates.lastName
      if (updates.phone !== undefined) mapped.phone = updates.phone
      if (updates.email !== undefined) mapped.email = updates.email
      if (updates.address !== undefined) mapped.address = updates.address
      if (updates.role !== undefined) mapped.role = updates.role
      if (updates.assemblyRate !== undefined) mapped.assembly_rate = updates.assemblyRate
      if (updates.disassemblyRate !== undefined) mapped.disassembly_rate = updates.disassemblyRate
      if (updates.isActive !== undefined) mapped.is_active = updates.isActive

      const { data, error } = await supabase
        .from('users')
        .update(mapped)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Dane użytkownika zostały zaktualizowane.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Wystąpił błąd podczas aktualizacji użytkownika.')
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      email: string
      password: string
      firstName: string
      lastName: string
      phone: string
      address?: string
      role?: string
      assemblyRate?: number
      disassemblyRate?: number
      isActive?: boolean
    }) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd tworzenia użytkownika')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Użytkownik został dodany pomyślnie.')
    },
    onError: (error) => {
      console.error(error)
      toast.error(error.message || 'Wystąpił błąd podczas dodawania użytkownika.')
    },
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(`Użytkownik został ${variables.isActive ? 'aktywowany' : 'dezaktywowany'}.`)
    },
    onError: (error) => {
      console.error(error)
      toast.error('Wystąpił błąd podczas zmiany statusu użytkownika.')
    },
  })
}
