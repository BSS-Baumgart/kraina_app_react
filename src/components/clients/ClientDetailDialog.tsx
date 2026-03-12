'use client'

import { useState, useMemo, useEffect } from 'react'
import { Client, Rental } from '@/lib/types'
import { Attraction } from '@/lib/types'
import { useUpdateClient } from '@/hooks/useClients'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  TrendingUp,
  ClipboardList,
  X,
  Star,
  Pencil,
  Save,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { STATUS_DISPLAY, STATUS_COLORS } from '@/lib/constants'

interface ClientDetailDialogProps {
  client: Client | null
  rentals: Rental[]
  attractions: Attraction[]
  open: boolean
  onClose: () => void
  onClientUpdated?: () => void
  onRentalClick?: (rental: Rental) => void
}

export function ClientDetailDialog({
  client,
  rentals,
  attractions,
  open,
  onClose,
  onClientUpdated,
  onRentalClick,
}: ClientDetailDialogProps) {
  const updateClient = useUpdateClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })

  useEffect(() => {
    if (client) {
      setEditForm({
        name: client.name,
        phone: client.phone,
        email: client.email ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
      })
      setIsEditing(false)
    }
  }, [client])

  const handleSave = () => {
    if (!client) return
    updateClient.mutate(
      { id: client.id, ...editForm },
      { onSuccess: () => { setIsEditing(false); onClientUpdated?.() } }
    )
  }
  const clientRentals = useMemo(() => {
    if (!client) return []
    return rentals.filter(
      (r) => r.clientPhone === client.phone || r.clientName === client.name
    ).sort((a, b) => b.date.localeCompare(a.date))
  }, [client, rentals])

  const stats = useMemo(() => {
    const total = clientRentals.length
    const completed = clientRentals.filter((r) => r.status === 'completed').length
    const cancelled = clientRentals.filter((r) => r.status === 'cancelled').length
    const pending = clientRentals.filter((r) => r.status === 'pending' || r.status === 'confirmed').length
    const totalRevenue = clientRentals
      .filter((r) => r.status !== 'cancelled')
      .reduce((sum, r) => sum + (r.totalCost ?? 0), 0)
    const completedRevenue = clientRentals
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + (r.totalCost ?? 0), 0)
    const avgOrderValue = completed > 0 ? completedRevenue / completed : 0

    const attractionCounts: Record<string, number> = {}
    for (const r of clientRentals) {
      for (const id of r.attractionIds) {
        attractionCounts[id] = (attractionCounts[id] || 0) + 1
      }
    }
    const topAttractions = Object.entries(attractionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({
        name: attractions.find((a) => a.id === id)?.name ?? '—',
        count,
      }))

    const dates = clientRentals.map((r) => r.date).sort()
    const firstRental = dates[0] ?? null
    const lastRental = dates[dates.length - 1] ?? null

    return { total, completed, cancelled, pending, totalRevenue, completedRevenue, avgOrderValue, topAttractions, firstRental, lastRental }
  }, [clientRentals, attractions])

  if (!client) return null

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-[900px] max-h-[80vh] overflow-hidden flex flex-col p-0 top-[10vh] translate-y-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{client.name}</DialogTitle>
        </DialogHeader>

        <div className="shrink-0 bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{client.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm">
                <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:underline text-primary">
                  <Phone className="h-3.5 w-3.5" />{client.phone}
                </a>
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:underline text-primary">
                    <Mail className="h-3.5 w-3.5" />{client.email}
                  </a>
                )}
                {client.address && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(client.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:underline text-primary"
                  >
                    <MapPin className="h-3.5 w-3.5" />{client.address}
                  </a>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border bg-background" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="flex flex-col min-h-0 flex-1">
          <div className="shrink-0 px-6 pt-4 pb-0">
            <TabsList className="mb-0">
              <TabsTrigger value="overview" className="gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Podsumowanie
              </TabsTrigger>
              <TabsTrigger value="rentals" className="gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                Rezerwacje ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="info" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Dane
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">

            <TabsContent value="overview" className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Rezerwacji</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Zrealizowanych</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{formatPrice(stats.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Przychód łączny</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{formatPrice(stats.avgOrderValue)}</p>
                  <p className="text-xs text-muted-foreground">Śr. wartość</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Historia
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pierwsza rezerwacja:</span>
                      <span className="font-medium">{stats.firstRental ? formatDate(stats.firstRental) : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ostatnia rezerwacja:</span>
                      <span className="font-medium">{stats.lastRental ? formatDate(stats.lastRental) : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Aktywne/oczekujące:</span>
                      <span className="font-medium">{stats.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Anulowane:</span>
                      <span className="font-medium text-red-500">{stats.cancelled}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Ulubione atrakcje
                  </h3>
                  {stats.topAttractions.length > 0 ? (
                    <div className="space-y-1 text-sm">
                      {stats.topAttractions.map((a, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{a.name}</span>
                          <span className="text-muted-foreground">{a.count}×</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Brak danych</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rentals">
              {clientRentals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Brak rezerwacji dla tego klienta.</p>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Godziny</TableHead>
                        <TableHead>Atrakcje</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Kwota</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientRentals.map((r) => (
                        <TableRow
                          key={r.id}
                          className={onRentalClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                          onClick={() => onRentalClick?.(r)}
                        >
                          <TableCell className="font-medium">{formatDate(r.date)}</TableCell>
                          <TableCell className="text-muted-foreground">{r.setupTime} – {r.teardownTime}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {r.attractionIds.slice(0, 2).map((id) => {
                                const attr = attractions.find((a) => a.id === id)
                                return (
                                  <Badge key={id} variant="outline" className="text-xs">
                                    {attr?.name ?? '—'}
                                  </Badge>
                                )
                              })}
                              {r.attractionIds.length > 2 && (
                                <Badge variant="outline" className="text-xs">+{r.attractionIds.length - 2}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              style={{
                                backgroundColor: `${STATUS_COLORS[r.status]}20`,
                                color: STATUS_COLORS[r.status],
                                borderColor: `${STATUS_COLORS[r.status]}40`,
                              }}
                              variant="outline"
                            >
                              {STATUS_DISPLAY[r.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatPrice(r.totalCost ?? 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" /> Edytuj
                    </Button>
                  </div>
                  <div className="rounded-lg border p-4 space-y-3 text-sm">
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">Imię i nazwisko:</span>
                      <span className="font-medium">{client.name}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">Telefon:</span>
                      <a href={`tel:${client.phone}`} className="font-medium hover:underline text-primary">{client.phone}</a>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{client.email || '—'}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">Adres:</span>
                      {client.address ? (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(client.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline text-primary"
                        >
                          {client.address}
                        </a>
                      ) : (
                        <span className="font-medium">—</span>
                      )}
                    </div>
                    {client.notes && (
                      <div className="grid grid-cols-[120px_1fr] gap-2">
                        <span className="text-muted-foreground">Notatki:</span>
                        <span className="whitespace-pre-wrap">{client.notes}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-[120px_1fr] gap-2 border-t pt-3">
                      <span className="text-muted-foreground">Klient od:</span>
                      <span>{formatDate(client.createdAt.substring(0, 10))}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-name">Imię i nazwisko</Label>
                        <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-phone">Telefon</Label>
                        <Input id="edit-phone" value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input id="edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-address">Adres</Label>
                        <Input id="edit-address" value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-notes">Notatki</Label>
                      <Textarea id="edit-notes" rows={3} value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Anuluj</Button>
                    <Button size="sm" onClick={handleSave} disabled={updateClient.isPending} className="gap-1.5">
                      <Save className="h-3.5 w-3.5" /> Zapisz
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
