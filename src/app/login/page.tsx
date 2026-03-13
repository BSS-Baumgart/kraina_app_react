'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/store/auth.store'
import { useAppStore } from '@/store/app.store'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { AlertCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const { setUser, setSession, setIsAuthenticated } = useAuthStore()
  const { setCurrentUser } = useAppStore()
  const wasInactive = searchParams.get('reason') === 'inactivity'

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error || !data.user) {
        throw new Error(error?.message || 'Błąd logowania')
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

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

      setSession({
        access_token: data.session?.access_token || '',
      })
      setUser(mappedUser)
      setCurrentUser(mappedUser)
      setIsAuthenticated(true)

      window.location.href = '/app/dashboard'
    } catch (err: any) {
      setError(err.message || 'Błąd logowania. Spróbuj ponownie.')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-secondary p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">🎪 Kraina Zjeżdżalni</CardTitle>
          <CardDescription className="text-center">Zaloguj się do systemu</CardDescription>
        </CardHeader>

        <CardContent>
          {wasInactive && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Sesja wygasła z powodu braku aktywności. Zaloguj się ponownie.</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="twoj@email.com"
                        type="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hasło</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Logowanie...
                  </>
                ) : (
                  'Zaloguj się'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
