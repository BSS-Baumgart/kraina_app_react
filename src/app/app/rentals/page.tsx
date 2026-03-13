'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRentals } from '@/hooks/useRentals'
import { useAttractions } from '@/hooks/useAttractions'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Plus,
} from 'lucide-react'
import { Rental } from '@/lib/types'
import { STATUS_DISPLAY, STATUS_COLORS, STATUS_OPTIONS } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'
import { RentalForm } from '@/components/rentals/RentalForm'
import { RentalDetailDialog } from '@/components/rentals/RentalDetailDialog'

export default function RentalsPage() {
  const { rentals, isLoading, error } = useRentals()
  const { attractions } = useAttractions()
  const { user: currentUser } = useAuth()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') ?? '')
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') ?? '')

  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [rentalToEdit, setRentalToEdit] = useState<Rental | null>(null)

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'owner'

  const getAttractionName = (id: string) => {
    const attr = attractions.find((a) => a.id === id)
    return attr?.name ?? '—'
  }

  const filteredRentals = useMemo(() => {
    return rentals.filter((r) => {
      const matchesSearch =
        searchQuery === '' ||
        r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.clientPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.address.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      const matchesDateFrom = !dateFrom || r.date >= dateFrom
      const matchesDateTo = !dateTo || r.date <= dateTo

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo
    })
  }, [rentals, searchQuery, statusFilter, dateFrom, dateTo])

  const stats = useMemo(() => {
    const total = rentals.length
    const pending = rentals.filter((r) => r.status === 'pending').length
    const confirmed = rentals.filter((r) => r.status === 'confirmed').length
    const completed = rentals.filter((r) => r.status === 'completed').length
    const revenue = rentals
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + (r.totalCost ?? 0), 0)
    return { total, pending, confirmed, completed, revenue }
  }, [rentals])

  if (error) {
    return <div className="p-4 text-destructive">Wystąpił błąd podczas ładowania rezerwacji.</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-500">
      {canManage && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setRentalToEdit(null)
              setIsFormOpen(true)
            }}
            className="shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nowa rezerwacja
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po kliencie, telefonie, adresie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2 sm:contents">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-[160px]"
            placeholder="Od"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-[160px]"
            placeholder="Do"
          />
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-2 sm:gap-4 ${canManage ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Wszystkie</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold" style={{ color: STATUS_COLORS.pending }}>{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Oczekujące</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold" style={{ color: STATUS_COLORS.confirmed }}>{stats.confirmed}</div>
            <div className="text-xs text-muted-foreground">Potwierdzone</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold" style={{ color: STATUS_COLORS.completed }}>{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Zakończone</div>
          </CardContent>
        </Card>
        {canManage && (
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">{formatPrice(stats.revenue)}</div>
              <div className="text-xs text-muted-foreground">Przychód</div>
            </CardContent>
          </Card>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : filteredRentals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            {searchQuery || statusFilter !== 'all' || dateFrom || dateTo
              ? 'Brak rezerwacji spełniających kryteria wyszukiwania.'
              : 'Brak rezerwacji w bazie.'}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Data</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead className="hidden md:table-cell">Adres</TableHead>
                  <TableHead className="hidden lg:table-cell">Atrakcje</TableHead>
                  {canManage && <TableHead className="text-right">Koszt</TableHead>}
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRentals.map((rental) => (
                  <TableRow
                    key={rental.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedRental(rental)}
                  >
                    <TableCell>
                      <div className="font-medium text-sm">
                        {new Date(rental.date + 'T00:00:00').toLocaleDateString('pl-PL', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rental.setupTime}–{rental.teardownTime}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{rental.clientName}</div>
                      <div className="text-xs text-muted-foreground">{rental.clientPhone}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {rental.address}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {rental.attractionIds.slice(0, 2).map((id) => (
                          <Badge key={id} variant="secondary" className="text-xs">
                            {getAttractionName(id)}
                          </Badge>
                        ))}
                        {rental.attractionIds.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{rental.attractionIds.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right font-medium">
                        {formatPrice(rental.totalCost ?? 0)}
                      </TableCell>
                    )}
                    <TableCell className="text-center">
                      <Badge
                        style={{
                          backgroundColor: `${STATUS_COLORS[rental.status]}20`,
                          color: STATUS_COLORS[rental.status],
                          borderColor: `${STATUS_COLORS[rental.status]}40`,
                        }}
                        variant="outline"
                      >
                        {STATUS_DISPLAY[rental.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <RentalDetailDialog
        rental={selectedRental}
        onClose={() => setSelectedRental(null)}
        onEdit={canManage ? (rental) => {
          setRentalToEdit(rental)
          setIsFormOpen(true)
        } : undefined}
      />

      <ResponsiveDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <ResponsiveDialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{rentalToEdit ? 'Edytuj rezerwację' : 'Nowa rezerwacja'}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <div className="py-2 sm:py-4 px-4 sm:px-0">
            <RentalForm
              rentalToEdit={rentalToEdit}
              onSuccess={() => {
                setIsFormOpen(false)
                if (rentalToEdit && selectedRental?.id === rentalToEdit.id) {
                  setSelectedRental(null)
                }
              }}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
