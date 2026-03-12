'use client'

import { useFormContext } from 'react-hook-form'
import type { Attraction } from '@/lib/types'
import type { RentalFormInput } from '@/lib/schemas'
import { formatPrice } from '@/lib/utils'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'

interface CostBreakdown {
  rentalCost: number
  deliveryCost: number
  totalCost: number
}

interface RentalFormStepSummaryProps {
  selectedIds: string[]
  getAttractionById: (id: string) => Attraction | undefined
  costs: CostBreakdown
  useCustomPrice: boolean
  setUseCustomPrice: (val: boolean) => void
  distanceNum: number
  pricePerKm: number
  buildAddress: (data: { street: string; houseNumber: string; postalCode: string; city: string }) => string
}

export function RentalFormStepSummary({
  selectedIds,
  getAttractionById,
  costs,
  useCustomPrice,
  setUseCustomPrice,
  distanceNum,
  pricePerKm,
  buildAddress,
}: RentalFormStepSummaryProps) {
  const form = useFormContext<RentalFormInput>()
  const watchDate = form.watch('date')
  const watchSetupTime = form.watch('setupTime')
  const watchTeardownTime = form.watch('teardownTime')

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Szczegóły rezerwacji</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Data:</div>
            <div className="font-medium">
              {new Date(watchDate + 'T00:00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="text-muted-foreground">Godziny:</div>
            <div className="font-medium">{watchSetupTime} - {watchTeardownTime}</div>
            <div className="text-muted-foreground">Klient:</div>
            <div className="font-medium">{form.getValues('clientName')}</div>
            <div className="text-muted-foreground">Telefon:</div>
            <div className="font-medium">{form.getValues('clientPhone')}</div>
            <div className="text-muted-foreground">Adres:</div>
            <div className="font-medium">{buildAddress({ street: form.getValues('street'), houseNumber: form.getValues('houseNumber'), postalCode: form.getValues('postalCode'), city: form.getValues('city') })}</div>
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardContent className="p-4 space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Koszty</h4>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Wynajem atrakcji:</span>
            <span className={useCustomPrice ? 'line-through text-muted-foreground' : ''}>{formatPrice(costs.rentalCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dojazd ({distanceNum} km x {pricePerKm} zł):</span>
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
  )
}
