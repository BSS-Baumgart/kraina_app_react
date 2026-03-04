'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useAppStore } from '@/store/app.store'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const { user, session, isAuthenticated, isLoading, setUser, setSession, setIsAuthenticated, setIsLoading } =
    useAuthStore()
  const { setCurrentUser } = useAppStore()

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session: supabaseSession },
        } = await supabase.auth.getSession()

        if (supabaseSession?.user) {
          setSession({
            access_token: supabaseSession.access_token || '',
          })
          setIsAuthenticated(true)

          // Fetch user profile from users table
          const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', supabaseSession.user.id)
            .single()

          if (error) throw error

          const mappedUser = {
            id: userProfile.id,
            firstName: userProfile.first_name,
            lastName: userProfile.last_name,
            phone: userProfile.phone,
            email: userProfile.email,
            address: userProfile.address,
            role: userProfile.role,
            avatarUrl: userProfile.avatar_url,
            isActive: userProfile.is_active,
            assemblyRate: userProfile.assembly_rate,
            disassemblyRate: userProfile.disassembly_rate,
            createdAt: userProfile.created_at,
            fullName: `${userProfile.first_name} ${userProfile.last_name}`,
          }

          setUser(mappedUser)
          setCurrentUser(mappedUser)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [setUser, setSession, setIsAuthenticated, setIsLoading, setCurrentUser])

  return { user, session, isAuthenticated, isLoading }
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
