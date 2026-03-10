'use client'

import { useState, useEffect } from 'react'
import { Rental, RentalStatus } from '@/lib/types'
import { useAttractions } from '@/hooks/useAttractions'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateRentalStatus, useDeleteRental, useUpsertAssignment } from '@/hooks/useRentals'
import { STATUS_DISPLAY, STATUS_COLORS } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Clock,
  User,
  Phone,
  MapPin,
  Package,
  Trash2,
  Edit,
  X,
  ChevronRight,
  Wrench,
  DollarSign,
} from 'lucide-react'

const STATUS_TRANSITIONS: Record<string, { value: RentalStatus; label: string }[]> = {
  pending: [
    { value: 'confirmed', label: 'Potwierdź' },
    { value: 'cancelled', label: 'Anuluj' },
  ],
  confirmed: [
    { value: 'inProgress', label: 'Rozpocznij' },
    { value: 'cancelled', label: 'Anuluj' },
  ],
  inProgress: [
    { value: 'completed', label: 'Zakończ' },
    { value: 'cancelled', label: 'Anuluj' },
  ],
  completed: [],
  cancelled: [],
}

interface RentalDetailDialogProps {
  rental: Rental | null
  onClose: () => void
  onEdit?: (rental: Rental) => void
}

export function RentalDetailDialog({ rental, onClose, onEdit }: RentalDetailDialogProps) {
  const { attractions } = useAttractions()
  const { users } = useUsers()
  const { user: currentUser } = useAuth()
  const statusMutation = useUpdateRentalStatus()
  const deleteMutation = useDeleteRental()
  const assignmentMutation = useUpsertAssignment()

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'owner'

  // Local state for current rental (to update status/assignment without closing)
  const [currentRental, setCurrentRental] = useState<Rental | null>(rental)

  useEffect(() => {
    setCurrentRental(rental)
  }, [rental])

  if (!currentRental) return null

  const getEmployeeName = (id?: string) => {
    if (!id) return '—'
    const emp = users.find((u) => u.id === id)
    return emp ? `${emp.firstName} ${emp.lastName}` : '—'
  }

  // Find current user's assignment for this rental
  const myAssignment = currentRental.assignedEmployees?.find(
    (a) => a.employeeId === currentUser?.id
  )

  const attractionCount = currentRental.attractionIds.length

  // Zarobki — stawka z momentu zaznaczenia (snapshot), bez fallbacków
  const myActions = (myAssignment?.didAssembly ? 1 : 0) + (myAssignment?.didDisassembly ? 1 : 0)
  const myEarnings = attractionCount * (
    (myAssignment?.didAssembly ? (myAssignment.assemblyRateSnapshot ?? 0) : 0) +
    (myAssignment?.didDisassembly ? (myAssignment.disassemblyRateSnapshot ?? 0) : 0)
  )

  const handleToggleAssembly = (field: 'assembly' | 'disassembly') => {
    if (!currentUser) return
    const didAssembly = field === 'assembly'
      ? !myAssignment?.didAssembly
      : (myAssignment?.didAssembly ?? false)
    const didDisassembly = field === 'disassembly'
      ? !myAssignment?.didDisassembly
      : (myAssignment?.didDisassembly ?? false)

    assignmentMutation.mutate(
      {
        rentalId: currentRental.id,
        employeeId: currentUser.id,
        didAssembly,
        didDisassembly,
        assemblyRate: currentUser.assemblyRate ?? 0,
        disassemblyRate: currentUser.disassemblyRate ?? 0,
      },
      {
        onSuccess: () => {
          // Optimistic local update
          const updatedAssignments = [...(currentRental.assignedEmployees || [])]
          const idx = updatedAssignments.findIndex((a) => a.employeeId === currentUser.id)
          const newAssignment = {
            employeeId: currentUser.id,
            didAssembly,
            didDisassembly,
            assemblyTime: didAssembly ? (myAssignment?.assemblyTime ?? new Date().toISOString()) : undefined,
            disassemblyTime: didDisassembly ? (myAssignment?.disassemblyTime ?? new Date().toISOString()) : undefined,
            assemblyRateSnapshot: currentUser.assemblyRate ?? 0,
            disassemblyRateSnapshot: currentUser.disassemblyRate ?? 0,
          }
          if (idx >= 0) {
            updatedAssignments[idx] = newAssignment
          } else {
            updatedAssignments.push(newAssignment)
          }
          setCurrentRental({ ...currentRental, assignedEmployees: updatedAssignments })
        },
      }
    )
  }

  return (
    <Dialog open={!!rental} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Sticky header */}
        <div className="p-6 pb-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">{currentRental.clientName}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  style={{
                    backgroundColor: `${STATUS_COLORS[currentRental.status]}20`,
                    color: STATUS_COLORS[currentRental.status],
                    borderColor: `${STATUS_COLORS[currentRental.status]}40`,
                  }}
                  variant="outline"
                >
                  {STATUS_DISPLAY[currentRental.status]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(currentRental.date + 'T00:00:00').toLocaleDateString('pl-PL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-sm text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {currentRental.setupTime} – {currentRental.teardownTime}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {currentRental.createdById && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />{getEmployeeName(currentRental.createdById)}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full border border-border bg-background"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Client info — single row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-primary" />{currentRental.clientName}</span>
            <a href={`tel:${currentRental.clientPhone}`} className="flex items-center gap-1.5 hover:underline text-primary"><Phone className="h-4 w-4" />{currentRental.clientPhone}</a>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentRental.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline text-primary"><MapPin className="h-4 w-4" />{currentRental.address}</a>
          </div>

          {/* Two columns: Attractions + Costs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Attractions */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Atrakcje ({attractionCount})
              </h3>
              <div className="space-y-1">
                {currentRental.attractionIds.map((id) => {
                  const attr = attractions.find((a) => a.id === id)
                  return (
                    <div key={id} className="flex justify-between text-sm py-0.5">
                      <span>{attr?.name ?? '—'}</span>
                      <span className="font-medium text-muted-foreground">
                        {attr ? formatPrice(attr.rentalPrice) : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Costs */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Koszty</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wynajem:</span>
                  <span className={currentRental.customPrice != null ? 'line-through text-muted-foreground' : ''}>
                    {formatPrice(currentRental.rentalCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dojazd ({currentRental.distanceKm ?? 0} km):</span>
                  <span className={currentRental.customPrice != null ? 'line-through text-muted-foreground' : ''}>
                    {formatPrice(currentRental.deliveryCost)}
                  </span>
                </div>
                {currentRental.customPrice != null && (
                  <div className="flex justify-between font-medium">
                    <span className="text-orange-500">Cena nadpisana:</span>
                    <span className="text-orange-500">{formatPrice(currentRental.customPrice)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2 mt-2">
                  <span>Razem:</span>
                  <span className="text-primary">
                    {formatPrice(currentRental.customPrice ?? ((currentRental.rentalCost ?? 0) + (currentRental.deliveryCost ?? 0)))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {currentRental.notes && (
            <div className="text-sm">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notatki</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{currentRental.notes}</p>
            </div>
          )}

          {/* Assembly / Disassembly tracking */}
          {currentUser && currentRental.status !== 'cancelled' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Moja praca
              </h3>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Rozłożyłem</Label>
                    <Switch
                      checked={myAssignment?.didAssembly ?? false}
                      onCheckedChange={() => handleToggleAssembly('assembly')}
                      disabled={assignmentMutation.isPending}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Złożyłem</Label>
                    <Switch
                      checked={myAssignment?.didDisassembly ?? false}
                      onCheckedChange={() => handleToggleAssembly('disassembly')}
                      disabled={assignmentMutation.isPending}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    Montaż: {formatPrice(myAssignment?.assemblyRateSnapshot ?? 0)} · Demontaż: {formatPrice(myAssignment?.disassemblyRateSnapshot ?? 0)} × {attractionCount} {attractionCount === 1 ? 'atrakcja' : attractionCount < 5 ? 'atrakcje' : 'atrakcji'}
                  </span>
                  {myActions > 0 && (
                    <span className="font-bold text-green-600 flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" />
                      {formatPrice(myEarnings)}
                    </span>
                  )}
                </div>
              </div>

              {/* Show all employees' work summary for admin/owner */}
              {canManage && currentRental.assignedEmployees && currentRental.assignedEmployees.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status pracy wszystkich pracowników
                  </h4>
                  <div className="rounded-lg border divide-y">
                    {currentRental.assignedEmployees.map((assignment) => {
                      const emp = users.find((u) => u.id === assignment.employeeId)
                      const actions = (assignment.didAssembly ? 1 : 0) + (assignment.didDisassembly ? 1 : 0)
                      const earnings = attractionCount * (
                        (assignment.didAssembly ? (assignment.assemblyRateSnapshot ?? 0) : 0) +
                        (assignment.didDisassembly ? (assignment.disassemblyRateSnapshot ?? 0) : 0)
                      )
                      return (
                        <div key={assignment.employeeId} className="flex items-center justify-between p-3 text-sm">
                          <div>
                            <span className="font-medium">
                              {emp ? `${emp.firstName} ${emp.lastName}` : 'Nieznany pracownik'}
                            </span>
                            <div className="flex gap-2 mt-0.5">
                              {assignment.didAssembly && (
                                <Badge variant="secondary" className="text-xs">Rozłożył</Badge>
                              )}
                              {assignment.didDisassembly && (
                                <Badge variant="secondary" className="text-xs">Złożył</Badge>
                              )}
                              {!assignment.didAssembly && !assignment.didDisassembly && (
                                <span className="text-xs text-muted-foreground">Brak zaznaczonych czynności</span>
                              )}
                            </div>
                          </div>
                          {actions > 0 && (
                            <span className="font-medium text-green-600">{formatPrice(earnings)}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status transitions - only for admin/owner */}
          {canManage && STATUS_TRANSITIONS[currentRental.status]?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Zmień status
              </h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_TRANSITIONS[currentRental.status].map((t) => (
                  <Button
                    key={t.value}
                    variant="outline"
                    size="sm"
                    disabled={statusMutation.isPending}
                    style={{
                      borderColor: `${STATUS_COLORS[t.value]}60`,
                      color: STATUS_COLORS[t.value],
                    }}
                    onClick={() => {
                      statusMutation.mutate(
                        { id: currentRental.id, status: t.value },
                        {
                          onSuccess: () => setCurrentRental({ ...currentRental, status: t.value }),
                        }
                      )
                    }}
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action bar - only for admin/owner */}
        {canManage && onEdit && (
          <div className="p-6 border-t border-border flex flex-col sm:flex-row sm:justify-between items-center gap-3 w-full bg-background/95 backdrop-blur sticky bottom-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Usuń
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Czy na pewno chcesz usunąć rezerwację?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ta akcja jest nieodwracalna. Rezerwacja klienta &quot;{currentRental.clientName}&quot; z dnia{' '}
                    {new Date(currentRental.date + 'T00:00:00').toLocaleDateString('pl-PL')} zostanie trwale usunięta.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    onClick={(e) => {
                      e.preventDefault()
                      deleteMutation.mutate(currentRental.id, {
                        onSuccess: () => onClose(),
                      })
                    }}
                  >
                    {deleteMutation.isPending ? 'Usuwanie...' : 'Usuń bezpowrotnie'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => onEdit(currentRental)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edytuj
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
