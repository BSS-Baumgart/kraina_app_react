'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/types'

export function useUsers() {
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*').order('first_name')

      if (error) throw error

      return (data || []).map((user: any) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        role: user.role,
        avatarUrl: user.avatar_url,
        isActive: user.is_active,
        assemblyRate: user.assembly_rate,
        disassemblyRate: user.disassembly_rate,
        createdAt: user.created_at,
        fullName: `${user.first_name} ${user.last_name}`,
      }))
    },
  })

  return { users, isLoading, error }
}
