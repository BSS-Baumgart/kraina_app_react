'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useRentals } from '@/hooks/useRentals'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User as UserIcon, Phone, MapPin, Mail, Shield, Wrench, Wallet, CheckCircle2, Minus, Calendar, DollarSign } from 'lucide-react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { createZodResolver } from '@/lib/form-utils'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { useUsers } from '@/hooks/useUsers'
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

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const { rentals } = useRentals()
  const { users } = useUsers()
  const isMobile = useIsMobile()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: createZodResolver<ProfileFormValues>(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      assemblyRate: 0,
      disassemblyRate: 0,
    },
  })

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

      if (user.role === 'owner') {
        updateData.assembly_rate = values.assemblyRate
        updateData.disassembly_rate = values.disassemblyRate
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

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

  const isManager = user?.role === 'admin' || user?.role === 'owner'

  const recentAssignments = useMemo(() => {
    if (!user) return []

    if (isManager) {
      // Admins/owners see all recent rentals with any employee assigned
      return rentals
        .filter((r) => r.assignedEmployees?.some((a) => a.didAssembly || a.didDisassembly))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6)
        .map((r) => {
          const totalEarnings = r.assignedEmployees
            .filter((a) => a.didAssembly || a.didDisassembly)
            .reduce((sum, a) => {
              const assembly = a.didAssembly ? r.attractionIds.length * (a.assemblyRateSnapshot ?? 0) : 0
              const disassembly = a.didDisassembly ? r.attractionIds.length * (a.disassemblyRateSnapshot ?? 0) : 0
              return sum + assembly + disassembly
            }, 0)
          const employeeNames = r.assignedEmployees
            .filter((a) => a.didAssembly || a.didDisassembly)
            .map((a) => {
              const emp = users.find((u) => u.id === a.employeeId)
              return emp ? `${emp.firstName} ${emp.lastName}` : 'Nieznany'
            })
          return {
            id: r.id,
            date: r.date,
            address: r.address,
            clientName: r.clientName,
            didAssembly: r.assignedEmployees.some((a) => a.didAssembly),
            didDisassembly: r.assignedEmployees.some((a) => a.didDisassembly),
            earnings: totalEarnings,
            employeeNames,
          }
        })
    }

    // Regular employees see only their own
    return rentals
      .filter((r) => r.assignedEmployees?.some((a) => a.employeeId === user.id && (a.didAssembly || a.didDisassembly)))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6)
      .map((r) => {
        const assignment = r.assignedEmployees.find((a) => a.employeeId === user.id)!
        const assembly = assignment.didAssembly ? r.attractionIds.length * (assignment.assemblyRateSnapshot ?? 0) : 0
        const disassembly = assignment.didDisassembly ? r.attractionIds.length * (assignment.disassemblyRateSnapshot ?? 0) : 0
        return {
          id: r.id,
          date: r.date,
          address: r.address,
          clientName: r.clientName,
          didAssembly: assignment.didAssembly,
          didDisassembly: assignment.didDisassembly,
          earnings: assembly + disassembly,
          employeeNames: [] as string[],
        }
      })
  }, [rentals, user, users, isManager])

  const totalEarnings = useMemo(() => recentAssignments.reduce((sum, a) => sum + a.earnings, 0), [recentAssignments])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        
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
                    {user.role === 'owner' && (
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

          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Ostatnie realizacje</CardTitle>
              <CardDescription>
                {isManager ? 'Ostatnie realizacje wszystkich pracowników' : 'Twoja aktywność (montaże i demontaże)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Brak zapisanych realizacji. Zaznacz montaż lub demontaż w szczegółach rezerwacji.
                </p>
              ) : (
                <>
                  {isMobile ? (
                    /* ===== Mobile: card list ===== */
                    <div className="space-y-2.5">
                      {recentAssignments.map((a) => (
                        <Card key={a.id} className="border">
                          <CardContent className="p-3">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-2 pb-2 border-b">
                              <span className="font-semibold text-sm">
                                {new Date(a.date + 'T00:00:00').toLocaleDateString('pl-PL', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              <span className={`font-bold text-sm ${a.earnings > 0 ? 'text-green-600' : ''}`}>
                                {a.earnings > 0 ? `${a.earnings.toFixed(2)} zł` : '—'}
                              </span>
                            </div>
                            {/* Key-value rows */}
                            <div className="space-y-1.5 text-xs">
                              {isManager && a.employeeNames.length > 0 && (
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-muted-foreground">Pracownik</span>
                                  <span className="font-medium text-right truncate">{a.employeeNames.join(', ')}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground shrink-0">Adres</span>
                                <span className="text-right truncate">{a.address}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Montaż</span>
                                {a.didAssembly
                                  ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  : <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Demontaż</span>
                                {a.didDisassembly
                                  ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  : <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    /* ===== Desktop: table ===== */
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Data</TableHead>
                            {isManager && <TableHead>Pracownik</TableHead>}
                            <TableHead>Lokalizacja</TableHead>
                            <TableHead className="text-center w-24">Montaż</TableHead>
                            <TableHead className="text-center w-24">Demontaż</TableHead>
                            <TableHead className="text-right w-28">Wypłata</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentAssignments.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">
                                {new Date(a.date + 'T00:00:00').toLocaleDateString('pl-PL', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </TableCell>
                              {isManager && (
                                <TableCell className="text-sm">{a.employeeNames.join(', ')}</TableCell>
                              )}
                              <TableCell className="max-w-[200px] truncate">{a.address}</TableCell>
                              <TableCell className="text-center">
                                {a.didAssembly
                                  ? <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                                  : <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                              </TableCell>
                              <TableCell className="text-center">
                                {a.didDisassembly
                                  ? <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                                  : <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                              </TableCell>
                              <TableCell className="text-right font-medium text-green-600">
                                {a.earnings > 0 ? `${a.earnings.toFixed(2)} zł` : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4 px-1">
                    <p className="text-xs text-muted-foreground">
                      {isManager ? 'Łączne wypłaty z ostatnich realizacji' : `Montaż: ${(user?.assemblyRate ?? 0).toFixed(2)} zł · Demontaż: ${(user?.disassemblyRate ?? 0).toFixed(2)} zł × atrakcja`}
                    </p>
                    <div className="text-sm font-semibold">
                      Suma: <span className="text-green-600">{totalEarnings.toFixed(2)} zł</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

