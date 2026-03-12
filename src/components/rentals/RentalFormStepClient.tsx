'use client'

import { useFormContext } from 'react-hook-form'
import type { Client } from '@/lib/types'
import type { RentalFormInput } from '@/lib/schemas'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Phone, MapPin, Loader2 } from 'lucide-react'

interface RentalFormStepClientProps {
  filteredClients: Client[]
  showSuggestions: boolean
  setShowSuggestions: (show: boolean) => void
  selectClient: (client: Client) => void
  isDistanceLoading: boolean
  distanceError: string | null
  durationMinutes: number | null
  onCalculateDistance: () => void
}

export function RentalFormStepClient({
  filteredClients,
  showSuggestions,
  setShowSuggestions,
  selectClient,
  isDistanceLoading,
  distanceError,
  durationMinutes,
  onCalculateDistance,
}: RentalFormStepClientProps) {
  const form = useFormContext<RentalFormInput>()

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="clientName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <User className="h-4 w-4" /> Imię i nazwisko klienta
            </FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  placeholder="Jan Kowalski"
                  {...field}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  autoComplete="off"
                />
              </FormControl>
              {showSuggestions && filteredClients.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectClient(client)}
                    >
                      <div className="font-medium">{client.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {client.phone}{client.address ? ` • ${client.address}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
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

      <div className="space-y-2">
        <FormLabel className="flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Adres dostawy
        </FormLabel>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ulica</FormLabel>
                <FormControl>
                  <Input placeholder="np. Przykładowa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="houseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nr domu</FormLabel>
                <FormControl>
                  <Input placeholder="np. 10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kod pocztowy</FormLabel>
                <FormControl>
                  <Input placeholder="00-000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Miasto</FormLabel>
                <FormControl>
                  <Input placeholder="np. Warszawa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <FormField
        control={form.control}
        name="distanceKm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dystans (km)</FormLabel>
            <div className="flex items-center gap-2">
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="np. 15"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDistanceLoading}
                onClick={onCalculateDistance}
              >
                {isDistanceLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                <span className="ml-1 hidden sm:inline">Oblicz</span>
              </Button>
            </div>
            {distanceError && (
              <p className="text-sm text-destructive mt-1">{distanceError}</p>
            )}
            {durationMinutes != null && !distanceError && (
              <p className="text-sm text-muted-foreground mt-1">
                Szacowany czas dojazdu: {durationMinutes} min
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
