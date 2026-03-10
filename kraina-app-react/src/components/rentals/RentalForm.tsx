'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import * as z from 'zod'
import { Rental, Attraction } from '@/lib/types'
import { rentalFormSchema, type RentalFormInput } from '@/lib/schemas'
import { DEFAULT_SETUP_TIME, DEFAULT_TEARDOWN_TIME } from '@/lib/constants'
import { useAttractions } from '@/hooks/useAttractions'
import { useRentals, useCreateRental, useUpdateRental } from '@/hooks/useRentals'
import { useUsers } from '@/hooks/useUsers'
import { useAvailability } from '@/hooks/useAvailability'
import { useCostCalculation } from '@/hooks/useCostCalculation'
import { formatPrice } from '@/lib/utils'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Package,
  FileText,
  Check,
} from 'lucide-react'

const customZodResolver = (schema: z.ZodSchema): Resolver<RentalFormInput> => async (values) => {
  const result = await schema.safeParseAsync(values)
  if (result.success) {
    // Return original values (not result.data) to avoid z.coerce transforming '' → 0
    // which causes react-hook-form to detect a change and re-trigger validation infinitely
    return { values: values as RentalFormInput, errors: {} }
  }
  const errors: Record<string, any> = {}
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.')
    if (path && !errors[path]) {
      errors[path] = { type: issue.code as any, message: issue.message }
    }
  })
  return { values: {} as any, errors }
}

interface RentalFormProps {
  rentalToEdit?: Rental | null
  initialDate?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const STEPS = [
  { label: 'Atrakcje', icon: Package },
  { label: 'Klient', icon: User },
  { label: 'Podsumowanie', icon: Check },
]

export function RentalForm({ rentalToEdit, initialDate, onSuccess, onCancel }: RentalFormProps) {
  const [step, setStep] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>(rentalToEdit?.attractionIds ?? [])
  const [useCustomPrice, setUseCustomPrice] = useState(rentalToEdit?.customPrice != null)
  const isEditing = !!rentalToEdit

  const { attractions } = useAttractions()
  const { rentals } = useRentals()
  const createMutation = useCreateRental()
  const updateMutation = useUpdateRental()

  const form = useForm<RentalFormInput>({
    resolver: customZodResolver(rentalFormSchema),
    defaultValues: rentalToEdit
      ? {
          date: rentalToEdit.date,
          setupTime: rentalToEdit.setupTime,
          teardownTime: rentalToEdit.teardownTime,
          clientName: rentalToEdit.clientName,
          clientPhone: rentalToEdit.clientPhone,
          address: rentalToEdit.address,
          attractionIds: rentalToEdit.attractionIds,
          customPrice: rentalToEdit.customPrice ?? '',
          distanceKm: rentalToEdit.distanceKm ?? '',
          notes: rentalToEdit.notes ?? '',
        }
      : {
          date: initialDate || new Date().toISOString().split('T')[0],
          setupTime: DEFAULT_SETUP_TIME,
          teardownTime: DEFAULT_TEARDOWN_TIME,
          clientName: '',
          clientPhone: '',
          address: '',
          attractionIds: [],
          customPrice: '',
          distanceKm: '',
          notes: '',
        },
  })

  useEffect(() => {
    if (rentalToEdit) {
      form.reset({
        date: rentalToEdit.date,
        setupTime: rentalToEdit.setupTime,
        teardownTime: rentalToEdit.teardownTime,
        clientName: rentalToEdit.clientName,
        clientPhone: rentalToEdit.clientPhone,
        address: rentalToEdit.address,
        attractionIds: rentalToEdit.attractionIds,
        customPrice: rentalToEdit.customPrice ?? '',
        distanceKm: rentalToEdit.distanceKm ?? '',
        notes: rentalToEdit.notes ?? '',
      })
      setSelectedIds(rentalToEdit.attractionIds)
      setUseCustomPrice(rentalToEdit.customPrice != null)
      setStep(0)
    }
  }, [rentalToEdit, form])

  const watchDate = form.watch('date')
  const watchSetupTime = form.watch('setupTime')
  const watchTeardownTime = form.watch('teardownTime')
  const watchDistanceKm = form.watch('distanceKm')

  const availableAttractions = useAvailability(
    attractions,
    rentals,
    watchDate || '',
    watchSetupTime || DEFAULT_SETUP_TIME,
    watchTeardownTime || DEFAULT_TEARDOWN_TIME,
    rentalToEdit?.id
  )

  const distanceNum = typeof watchDistanceKm === 'number' ? watchDistanceKm : (parseFloat(String(watchDistanceKm)) || 0)
  const costs = useCostCalculation(attractions, selectedIds, distanceNum)

  const toggleAttraction = useCallback((attractionId: string) => {
    setSelectedIds(prev => {
      const next = prev.includes(attractionId)
        ? prev.filter((id) => id !== attractionId)
        : [...prev, attractionId]
      // Sync to form silently (no validation trigger)
      form.setValue('attractionIds', next)
      return next
    })
  }, [form])

  const canGoNext = () => {
    if (step === 0) {
      const date = form.getValues('date')
      const setup = form.getValues('setupTime')
      const teardown = form.getValues('teardownTime')
      return !!date && !!setup && !!teardown && selectedIds.length > 0
    }
    if (step === 1) {
      const name = form.getValues('clientName')
      const phone = form.getValues('clientPhone')
      const address = form.getValues('address')
      return !!name && name.length >= 2 && !!phone && phone.length >= 7 && !!address && address.length >= 3
    }
    return true
  }

  const onSubmit = async (data: RentalFormInput) => {
    const payload = {
      date: data.date,
      setupTime: data.setupTime,
      teardownTime: data.teardownTime,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      address: data.address,
      attractionIds: data.attractionIds,
      rentalCost: costs.rentalCost,
      deliveryCost: costs.deliveryCost,
      customPrice: useCustomPrice && data.customPrice !== '' && data.customPrice !== undefined ? Number(data.customPrice) : undefined,
      distanceKm: data.distanceKm !== '' && data.distanceKm !== undefined ? Number(data.distanceKm) : undefined,
      notes: data.notes || undefined,
    }

    if (isEditing) {
      updateMutation.mutate(
        { id: rentalToEdit.id, updates: payload },
        { onSuccess: () => onSuccess?.() }
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => onSuccess?.() })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  // Get attraction name by id
  const getAttractionById = (id: string) => attractions.find((a) => a.id === id)

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Step indicators */}
        <div className="flex items-center justify-between gap-2 mb-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <button
                key={i}
                type="button"
                className={`flex items-center gap-2 flex-1 justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  i === step
                    ? 'bg-primary text-primary-foreground'
                    : i < step
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => { if (i < step) setStep(i) }}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            )
          })}
        </div>

        {/* Step 1: Date + Attractions */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Data
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="setupTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Montaż
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teardownTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Demontaż
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" /> Dostępne atrakcje ({availableAttractions.length})
                </label>
                {availableAttractions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3">
                    Brak dostępnych atrakcji w wybranym terminie.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 mt-2">
                    {availableAttractions.map((attraction) => {
                      const isSelected = selectedIds.includes(attraction.id)
                      return (
                        <Card
                          key={attraction.id}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => toggleAttraction(attraction.id)}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            <div
                              className={`size-4 shrink-0 rounded-[4px] border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-input'
                              }`}
                            >
                              {isSelected && <Check className="size-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{attraction.name}</div>
                              <div className="text-xs text-muted-foreground">{attraction.category}</div>
                            </div>
                            <span className="text-sm font-semibold text-primary shrink-0">
                              {formatPrice(attraction.rentalPrice)}
                            </span>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {selectedIds.length > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="text-sm font-medium">
                    Wybrano: {selectedIds.length} atrakcj{selectedIds.length === 1 ? 'ę' : selectedIds.length < 5 ? 'e' : 'i'}
                  </div>
                  <div className="text-sm text-primary font-semibold">
                    Koszt wynajmu: {formatPrice(costs.rentalCost)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Client info */}
        {step === 1 && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Imię i nazwisko klienta
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Jan Kowalski" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Telefon klienta
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+48 123 456 789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Adres dostawy
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="ul. Przykładowa 10, Warszawa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="distanceKm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dystans (km)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="np. 15"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Summary card */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Szczegóły rezerwacji</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Data:</div>
                  <div className="font-medium">
                    {new Date(watchDate + 'T00:00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="text-muted-foreground">Godziny:</div>
                  <div className="font-medium">{watchSetupTime} – {watchTeardownTime}</div>
                  <div className="text-muted-foreground">Klient:</div>
                  <div className="font-medium">{form.getValues('clientName')}</div>
                  <div className="text-muted-foreground">Telefon:</div>
                  <div className="font-medium">{form.getValues('clientPhone')}</div>
                  <div className="text-muted-foreground">Adres:</div>
                  <div className="font-medium">{form.getValues('address')}</div>
                </div>
              </CardContent>
            </Card>

            {/* Selected attractions */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Atrakcje ({selectedIds.length})</h4>
                {selectedIds.map((id: string) => {
                  const attr = getAttractionById(id)
                  return attr ? (
                    <div key={id} className="flex justify-between text-sm py-1">
                      <span>{attr.name}</span>
                      <span className="font-medium">{formatPrice(attr.rentalPrice)}</span>
                    </div>
                  ) : null
                })}
              </CardContent>
            </Card>

            {/* Costs */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Koszty</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wynajem atrakcji:</span>
                  <span className={useCustomPrice ? 'line-through text-muted-foreground' : ''}>{formatPrice(costs.rentalCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dojazd ({distanceNum} km × 5 zł):</span>
                  <span className={useCustomPrice ? 'line-through text-muted-foreground' : ''}>{formatPrice(costs.deliveryCost)}</span>
                </div>
                {useCustomPrice && (
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-orange-500">Cena nadpisana:</span>
                    <span className="text-orange-500">{formatPrice(Number(form.getValues('customPrice')) || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                  <span>Razem:</span>
                  <span className="text-primary">
                    {formatPrice(useCustomPrice ? (Number(form.getValues('customPrice')) || 0) : costs.totalCost)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Custom price toggle */}
            <div className="space-y-3">
              <div
                className="flex items-center gap-3 cursor-pointer select-none"
                onClick={() => {
                  const next = !useCustomPrice
                  setUseCustomPrice(next)
                  if (!next) form.setValue('customPrice', '')
                }}
              >
                <div
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                    useCustomPrice ? 'bg-orange-500' : 'bg-input'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                      useCustomPrice ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-sm font-medium">Nadpisz cenę całkowitą</span>
              </div>

              {useCustomPrice && (
                <FormField
                  control={form.control}
                  name="customPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cena całkowita (zł)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Wpisz cenę końcową"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Notatki
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dodatkowe informacje..."
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-3 pt-2">
          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Wstecz
              </Button>
            )}
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Anuluj
              </Button>
            )}
          </div>

          {step < 2 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
            >
              Dalej
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="button" disabled={isPending} onClick={() => form.handleSubmit(onSubmit)()}>
              {isPending
                ? 'Zapisywanie...'
                : isEditing
                ? 'Zapisz zmiany'
                : 'Utwórz rezerwację'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
