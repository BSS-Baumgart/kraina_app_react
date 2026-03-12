'use client'

import { useState, useMemo } from 'react'
import { useClients } from '@/hooks/useClients'
import { useRentals } from '@/hooks/useRentals'
import { useAttractions } from '@/hooks/useAttractions'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Phone,
  Users,
  DollarSign,
  ClipboardList,
  TrendingUp,
} from 'lucide-react'
import { Client, Rental } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { ClientDetailDialog } from '@/components/clients/ClientDetailDialog'
import { RentalDetailDialog } from '@/components/rentals/RentalDetailDialog'

export default function ClientsPage() {
  const { clients, isLoading, error } = useClients()
  const { rentals } = useRentals()
  const { attractions } = useAttractions()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)

  const clientStats = useMemo(() => {
    const map = new Map<string, { rentalCount: number; completedCount: number; totalRevenue: number; lastDate: string | null }>()

    for (const c of clients) {
      const clientRentals = rentals.filter(
        (r) => r.clientPhone === c.phone || r.clientName === c.name
      )
      const completed = clientRentals.filter((r) => r.status === 'completed')
      const totalRevenue = clientRentals
        .filter((r) => r.status !== 'cancelled')
        .reduce((sum, r) => sum + (r.totalCost ?? 0), 0)
      const dates = clientRentals.map((r) => r.date).sort()
      map.set(c.id, {
        rentalCount: clientRentals.length,
        completedCount: completed.length,
        totalRevenue,
        lastDate: dates[dates.length - 1] ?? null,
      })
    }
    return map
  }, [clients, rentals])

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients
    const q = searchQuery.toLowerCase()
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
    )
  }, [clients, searchQuery])

  const globalStats = useMemo(() => {
    const totalClients = clients.length
    const totalRevenue = Array.from(clientStats.values()).reduce((sum, s) => sum + s.totalRevenue, 0)
    const totalRentals = Array.from(clientStats.values()).reduce((sum, s) => sum + s.rentalCount, 0)
    const returning = Array.from(clientStats.values()).filter((s) => s.rentalCount > 1).length
    return { totalClients, totalRevenue, totalRentals, returning }
  }, [clients, clientStats])

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  if (error) {
    return <div className="p-4 text-destructive">Wystąpił błąd podczas ładowania klientów.</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-10" /> : globalStats.totalClients}</div>
              <div className="text-xs text-muted-foreground">Klientów</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-green-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-10" /> : globalStats.returning}</div>
              <div className="text-xs text-muted-foreground">Powracających</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-blue-500/10 p-2">
              <ClipboardList className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-10" /> : globalStats.totalRentals}</div>
              <div className="text-xs text-muted-foreground">Rezerwacji</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-yellow-500/10 p-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-10" /> : formatPrice(globalStats.totalRevenue)}</div>
              <div className="text-xs text-muted-foreground">Przychód łączny</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwisku, telefonie, adresie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? 'Brak wyników dla podanego wyszukiwania.' : 'Brak klientów w systemie.'}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klient</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="hidden md:table-cell">Adres</TableHead>
                  <TableHead className="text-center">Rezerwacje</TableHead>
                  <TableHead className="text-right">Przychód</TableHead>
                  <TableHead className="hidden lg:table-cell">Ostatnia rez.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const s = clientStats.get(client.id)
                  return (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedClient(client)}
                    >
                      <TableCell>
                        <div className="font-medium">{client.name}</div>
                        {client.email && (
                          <div className="text-xs text-muted-foreground">{client.email}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`tel:${client.phone}`}
                          className="flex items-center gap-1 text-sm hover:underline text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {client.phone}
                        </a>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                        {client.address || '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{s?.rentalCount ?? 0}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(s?.totalRevenue ?? 0)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {s?.lastDate ? formatDate(s.lastDate) : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ClientDetailDialog
        client={selectedClient}
        rentals={rentals}
        attractions={attractions}
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        onRentalClick={(rental) => {
          setSelectedClient(null)
          setSelectedRental(rental)
        }}
      />

      <RentalDetailDialog
        rental={selectedRental}
        onClose={() => setSelectedRental(null)}
      />
    </div>
  )
}
