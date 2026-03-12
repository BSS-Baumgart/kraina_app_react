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
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Clock, Package, Check } from 'lucide-react'

interface RentalFormStepAttractionsProps {
  availableAttractions: Attraction[]
  selectedIds: string[]
  toggleAttraction: (id: string) => void
  rentalCost: number
}

export function RentalFormStepAttractions({
  availableAttractions,
  selectedIds,
  toggleAttraction,
  rentalCost,
}: RentalFormStepAttractionsProps) {
  const form = useFormContext<RentalFormInput>()

  return (
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
              Koszt wynajmu: {formatPrice(rentalCost)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
