'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User as UserIcon, Phone, MapPin, Mail, Shield, Wrench, Wallet } from 'lucide-react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const profileSchema = z.object({
  firstName: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
  lastName: z.string().min(2, 'Nazwisko musi mieć co najmniej 2 znaki'),
  phone: z.string().min(9, 'Podaj prawidłowy numer telefonu'),
  address: z.string().optional(),
  assemblyRate: z.coerce.number().min(0, 'Stawka nie może być ujemna').optional(),
  disassemblyRate: z.coerce.number().min(0, 'Stawka nie może być ujemna').optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

// Omijamy wywalanie error-overlay przez Zoda w Next 16 Turbopack
const customZodResolver = (schema: z.ZodSchema): Resolver<ProfileFormValues> => async (values) => {
  const result = await schema.safeParseAsync(values)
  if (result.success) {
    return { values: result.data, errors: {} }
  }
  const errors: Record<string, any> = {}
  result.error.issues.forEach((issue) => {
    const path = issue.path[0] as string
    if (path && !errors[path]) {
      errors[path] = { type: issue.code as any, message: issue.message }
    }
  })
  return { values: {} as any, errors }
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: customZodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      assemblyRate: 0,
      disassemblyRate: 0,
    },
  })

  // Inicjalizacja formularza kiedy użytkownik jest dostępny
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        assemblyRate: user.assemblyRate || 0,
        disassemblyRate: user.disassemblyRate || 0,
      })
    }
  }, [user, form])

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return
    setIsSaving(true)
    
    try {
      const updateData: any = {
        first_name: values.firstName,
        last_name: values.lastName,
        phone: values.phone,
        address: values.address || null,
      }

      // Tylko admin i owner mogą edytować swoje stawki
      if (user.role === 'admin' || user.role === 'owner') {
        updateData.assembly_rate = values.assemblyRate
        updateData.disassembly_rate = values.disassemblyRate
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      // Aktualizacja stanu UI po udanym zapisie
      setUser({
        ...user,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        address: values.address || '',
        fullName: `${values.firstName} ${values.lastName}`,
        ...(user.role === 'admin' || user.role === 'owner' ? {
          assemblyRate: values.assemblyRate || 0,
          disassemblyRate: values.disassemblyRate || 0,
        } : {})
      })

      setIsEditing(false)
      toast.success('Profil został zaktualizowany')
    } catch (error: any) {
      console.error('Błąd aktualizacji profilu', error)
      toast.error('Nie udało się zapisać zmian')
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) return null // MainShell wymusza ładowanie/Auth, jeśli user=null to znaczy, że się wczytuje

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Właściciel'
      case 'admin': return 'Administrator'
      case 'employee': return 'Pracownik'
      default: return role
    }
  }

  const initials = user.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'KZ'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Lewa kolumna: Zwięzłe info o profilu */}
        <div className="w-full md:w-1/3 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="w-32 h-32 mb-4 border-4 border-muted">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                ) : (
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                )}
              </Avatar>
              <h2 className="text-2xl font-bold tracking-tight">{user.fullName}</h2>
              <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                <Shield className="w-4 h-4" />
                <span className="font-medium">{getRoleLabel(user.role)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Stawki pracownicze</CardTitle>
              <CardDescription>Twoje stawki za wynajem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Wrench className="w-4 h-4" />
                  <span>Montaż</span>
                </div>
                <span className="font-semibold">{user.assemblyRate} zł</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="w-4 h-4" />
                  <span>Demontaż</span>
                </div>
                <span className="font-semibold">{user.disassemblyRate} zł</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prawa kolumna: Szczegóły i Edycja profilu */}
        <div className="w-full md:w-2/3 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dane Twojego Profilu</CardTitle>
                  <CardDescription>Zarządzaj podstawowymi informacjami kontaktowymi</CardDescription>
                </div>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edytuj profil
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-muted-foreground">
                        <UserIcon className="w-4 h-4" /> Imię i Nazwisko
                      </Label>
                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
                        {user.fullName}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" /> Email (Login)
                      </Label>
                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
                        {user.email || 'Brak emaila'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" /> Telefon
                      </Label>
                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
                        {user.phone || 'Brak telefonu'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" /> Adres Zamieszkania
                      </Label>
                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
                        {user.address || 'Brak adresu'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Imię</FormLabel>
                            <FormControl>
                              <Input placeholder="Wpisz imię" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nazwisko</FormLabel>
                            <FormControl>
                              <Input placeholder="Wpisz nazwisko" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefon</FormLabel>
                            <FormControl>
                              <Input placeholder="Np. +48 123 456 789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={user.email || ''} disabled className="bg-muted text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Email nie może zostać zmieniony w tym miejscu.</p>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pełny adres (z kodem pocztowym i miastem)</FormLabel>
                          <FormControl>
                            <Input placeholder="Np. ul. Cicha 4/2, 00-000 Warszawa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {(user.role === 'admin' || user.role === 'owner') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t mt-4">
                        <FormField
                          control={form.control}
                          name="assemblyRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stawka za montaż (PLN)</FormLabel>
                              <FormControl>
                                <Input type="number" step="1" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="disassemblyRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stawka za demontaż (PLN)</FormLabel>
                              <FormControl>
                                <Input type="number" step="1" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    <div className="flex gap-2 justify-end pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsEditing(false);
                        form.reset();
                      }} disabled={isSaving}>
                        Anuluj
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* Tabelka poglądowa (Mockup) */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Ostatnie realizacje</CardTitle>
              <CardDescription>Twoja aktywność (montaże i demontaże)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Data</TableHead>
                      <TableHead>Lokalizacja</TableHead>
                      <TableHead className="text-center w-24">Montaż</TableHead>
                      <TableHead className="text-center w-24">Demontaż</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">10 Maj 2026</TableCell>
                      <TableCell>Warszawa, ul. Wesoła 5</TableCell>
                      <TableCell className="text-center text-green-600 bg-green-50/50">✅</TableCell>
                      <TableCell className="text-center text-green-600 bg-green-50/50">✅</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">08 Maj 2026</TableCell>
                      <TableCell>Kraków, Rynek Główny</TableCell>
                      <TableCell className="text-center text-green-600 bg-green-50/50">✅</TableCell>
                      <TableCell className="text-center text-muted-foreground">-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">05 Maj 2026</TableCell>
                      <TableCell>Gdańsk, Park Oliwski</TableCell>
                      <TableCell className="text-center text-muted-foreground">-</TableCell>
                      <TableCell className="text-center text-green-600 bg-green-50/50">✅</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">01 Maj 2026</TableCell>
                      <TableCell>Poznań, Szkoła Podstawowa nr 3</TableCell>
                      <TableCell className="text-center text-green-600 bg-green-50/50">✅</TableCell>
                      <TableCell className="text-center text-green-600 bg-green-50/50">✅</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">28 Kwi 2026</TableCell>
                      <TableCell>Wrocław, Festyn Rodzinny</TableCell>
                      <TableCell className="text-center text-green-600 bg-green-50/50">✅</TableCell>
                      <TableCell className="text-center text-green-600 bg-green-50/50">✅</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-4">
                Pełna historia wyjazdów będzie dostępna po podpięciu modułu Terminarza i Statystyk.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

