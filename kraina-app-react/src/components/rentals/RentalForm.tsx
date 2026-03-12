'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Rental, Client } from '@/lib/types'
import { rentalFormSchema, type RentalFormInput } from '@/lib/schemas'
import { DEFAULT_SETUP_TIME, DEFAULT_TEARDOWN_TIME } from '@/lib/constants'
import { createZodResolver } from '@/lib/form-utils'
import { useAttractions } from '@/hooks/useAttractions'
import { useRentals, useCreateRental, useUpdateRental } from '@/hooks/useRentals'
import { useClients, useUpsertClient } from '@/hooks/useClients'
import { useAvailability } from '@/hooks/useAvailability'
import { useCostCalculation } from '@/hooks/useCostCalculation'
import { useDistance } from '@/hooks/useDistance'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  Check,
} from 'lucide-react'
import { useSettingsStore } from '@/store/settings.store'
import { RentalFormStepAttractions } from './RentalFormStepAttractions'
import { RentalFormStepClient } from './RentalFormStepClient'
import { RentalFormStepSummary } from './RentalFormStepSummary'

function parseAddress(address: string): { street: string; houseNumber: string; postalCode: string; city: string } {
  const match = address.match(/^(.+?)\s+(\S+),\s*(\d{2}-\d{3})\s+(.+)$/)
  if (match) return { street: match[1], houseNumber: match[2], postalCode: match[3], city: match[4] }
  return { street: address, houseNumber: '', postalCode: '', city: '' }
}

function buildAddress(data: { street: string; houseNumber: string; postalCode: string; city: string }): string {
  return `${data.street} ${data.houseNumber}, ${data.postalCode} ${data.city}`
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

  const [showSuggestions, setShowSuggestions] = useState(false)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)

  const { attractions } = useAttractions()
  const { rentals } = useRentals()
  const { clients } = useClients()
  const createMutation = useCreateRental()
  const updateMutation = useUpdateRental()
  const upsertClientMutation = useUpsertClient()
  const transport = useSettingsStore((s) => s.transport)
  const { calculate: calculateDistance, isLoading: isDistanceLoading, error: distanceError } = useDistance()

  const form = useForm<RentalFormInput>({
    resolver: createZodResolver<RentalFormInput>(rentalFormSchema),
    defaultValues: rentalToEdit
      ? {
          date: rentalToEdit.date,
          setupTime: rentalToEdit.setupTime,
          teardownTime: rentalToEdit.teardownTime,
          clientName: rentalToEdit.clientName,
          clientPhone: rentalToEdit.clientPhone,
          ...parseAddress(rentalToEdit.address),
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
          street: '',
          houseNumber: '',
          postalCode: '',
          city: '',
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
        ...parseAddress(rentalToEdit.address),
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

  const watchClientName = form.watch('clientName')
  const filteredClients = clients.filter(
    (c) => watchClientName && watchClientName.length >= 2 &&
      c.name.toLowerCase().includes(watchClientName.toLowerCase())
  )

  const selectClient = (client: Client) => {
    form.setValue('clientName', client.name)
    form.setValue('clientPhone', client.phone || '')
    if (client.address) {
      const parsed = parseAddress(client.address)
      form.setValue('street', parsed.street)
      form.setValue('houseNumber', parsed.houseNumber)
      form.setValue('postalCode', parsed.postalCode)
      form.setValue('city', parsed.city)
    }
    setShowSuggestions(false)
  }

  const distanceNum = typeof watchDistanceKm === 'number' ? watchDistanceKm : (parseFloat(String(watchDistanceKm)) || 0)
  const costs = useCostCalculation(attractions, selectedIds, distanceNum)

  const toggleAttraction = useCallback((attractionId: string) => {
    setSelectedIds(prev => {
      const next = prev.includes(attractionId)
        ? prev.filter((id) => id !== attractionId)
        : [...prev, attractionId]
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
      const street = form.getValues('street')
      const houseNumber = form.getValues('houseNumber')
      const city = form.getValues('city')
      return !!name && name.length >= 2 && !!phone && phone.length >= 7 && !!street && street.length >= 2 && !!houseNumber && !!city && city.length >= 2
    }
    return true
  }

  const onSubmit = async (data: RentalFormInput) => {
    const fullAddress = buildAddress(data)
    const payload = {
      date: data.date,
      setupTime: data.setupTime,
      teardownTime: data.teardownTime,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      address: fullAddress,
      attractionIds: data.attractionIds,
      rentalCost: costs.rentalCost,
      deliveryCost: costs.deliveryCost,
      customPrice: useCustomPrice && data.customPrice !== '' && data.customPrice !== undefined ? Number(data.customPrice) : undefined,
      distanceKm: data.distanceKm !== '' && data.distanceKm !== undefined ? Number(data.distanceKm) : undefined,
      notes: data.notes || undefined,
    }

    const afterSuccess = () => {
      upsertClientMutation.mutate({
        name: data.clientName,
        phone: data.clientPhone,
        address: fullAddress,
      })
      onSuccess?.()
    }

    if (isEditing) {
      updateMutation.mutate(
        { id: rentalToEdit.id, updates: payload },
        { onSuccess: afterSuccess }
      )
    } else {
      createMutation.mutate(payload, { onSuccess: afterSuccess })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const getAttractionById = (id: string) => attractions.find((a) => a.id === id)

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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

        {step === 0 && (
          <RentalFormStepAttractions
            availableAttractions={availableAttractions}
            selectedIds={selectedIds}
            toggleAttraction={toggleAttraction}
            rentalCost={costs.rentalCost}
          />
        )}

        {step === 1 && (
          <RentalFormStepClient
            filteredClients={filteredClients}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            selectClient={selectClient}
            isDistanceLoading={isDistanceLoading}
            distanceError={distanceError}
            durationMinutes={durationMinutes}
            onCalculateDistance={async () => {
              const address = buildAddress({
                street: form.getValues('street'),
                houseNumber: form.getValues('houseNumber'),
                postalCode: form.getValues('postalCode'),
                city: form.getValues('city'),
              })
              const result = await calculateDistance(address)
              if (result) {
                form.setValue('distanceKm', result.distanceKm)
                setDurationMinutes(result.durationMinutes)
              }
            }}
          />
        )}

        {step === 2 && (
          <RentalFormStepSummary
            selectedIds={selectedIds}
            getAttractionById={getAttractionById}
            costs={costs}
            useCustomPrice={useCustomPrice}
            setUseCustomPrice={setUseCustomPrice}
            distanceNum={distanceNum}
            pricePerKm={transport.pricePerKm}
            buildAddress={buildAddress}
          />
        )}

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

