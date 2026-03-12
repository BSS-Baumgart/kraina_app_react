'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Expense } from '@/lib/types'
import type { ExpenseCategory } from '@/lib/types'
import { toast } from 'sonner'

function mapExpense(row: any): Expense {
  return {
    id: row.id,
    date: row.date,
    category: row.category as ExpenseCategory,
    description: row.description,
    amount: row.amount,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

export function useExpenses() {
  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      return (data || []).map(mapExpense)
    },
  })

  return { expenses, isLoading, error }
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      date: string
      category: ExpenseCategory
      description: string
      amount: number
    }) => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Brak zalogowanego użytkownika')

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          date: payload.date,
          category: payload.category,
          description: payload.description,
          amount: payload.amount,
          created_by: userData.user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Koszt został dodany.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Wystąpił błąd podczas dodawania kosztu.')
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Koszt został usunięty.')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Wystąpił błąd podczas usuwania kosztu.')
    },
  })
}
