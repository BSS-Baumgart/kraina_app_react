'use client'

import { useState } from 'react'
import { useUsers, useToggleUserStatus } from '@/hooks/useUsers'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Edit,
  Power,
  PowerOff,
  Phone,
  Mail,
  MapPin,
  Wrench,
  WrenchIcon,
  X,
  Shield,
  User as UserIcon,
  Plus,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react'
import { User } from '@/lib/types'
import { ROLE_LABELS, ROLE_VARIANTS } from '@/lib/constants'
import { getInitials, formatPrice } from '@/lib/utils'
import { UserForm } from '@/components/users/UserForm'
import { toast } from 'sonner'

export default function UsersPage() {
  const { users, isLoading, error } = useUsers()
  const toggleMutation = useToggleUserStatus()
  const { user: currentUser } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('active')

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)

  const [resetLoading, setResetLoading] = useState<string | null>(null)
  const [resetLink, setResetLink] = useState<string | null>(null)
  const [resetLinkCopied, setResetLinkCopied] = useState(false)
  const [emailSending, setEmailSending] = useState<string | null>(null)

  const canManageUsers = currentUser?.role === 'owner'

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchQuery === '' ||
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'inactive' && !u.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

  const handlePasswordReset = async (userId: string) => {
    setResetLoading(userId)
    setResetLink(null)
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd generowania linku resetowania hasła')
      setResetLink(data.resetLink)
      toast.success('Link do resetu hasła został wygenerowany.')
    } catch (err: any) {
      toast.error(err.message || 'Wystąpił błąd podczas generowania linku.')
    } finally {
      setResetLoading(null)
    }
  }

  const copyResetLink = () => {
    if (!resetLink) return
    window.navigator.clipboard.writeText(resetLink).then(() => {
      setResetLinkCopied(true)
      toast.success('Link skopiowany do schowka.')
      setTimeout(() => setResetLinkCopied(false), 2000)
    })
  }

  const handleSendResetEmail = async (userId: string) => {
    setEmailSending(userId)
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd wysyłania emaila')
      toast.success('Email z linkiem do resetu hasła został wysłany.')
    } catch (err: any) {
      toast.error(err.message || 'Wystąpił błąd podczas wysyłania emaila.')
    } finally {
      setEmailSending(null)
    }
  }

  if (error) {
    return <div className="p-4 text-destructive">Wystąpił błąd podczas ładowania użytkowników.</div>
  }

  if (currentUser && currentUser.role !== 'owner') {
    return <div className="p-4 text-destructive">Brak dostępu. Tylko właściciel może zarządzać użytkownikami.</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {canManageUsers && (
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateFormOpen(true)} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Dodaj użytkownika
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po imieniu, nazwisku, telefonie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Rola" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie role</SelectItem>
            <SelectItem value="employee">Pracownik</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
            <SelectItem value="owner">Właściciel</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszyscy</SelectItem>
            <SelectItem value="active">Aktywni</SelectItem>
            <SelectItem value="inactive">Nieaktywni</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{users.length}</div>
            <div className="text-xs text-muted-foreground">Wszyscy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{users.filter((u) => u.isActive).length}</div>
            <div className="text-xs text-muted-foreground">Aktywni</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {users.filter((u) => u.role === 'employee').length}
            </div>
            <div className="text-xs text-muted-foreground">Pracownicy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {users.filter((u) => u.role === 'admin' || u.role === 'owner').length}
            </div>
            <div className="text-xs text-muted-foreground">Administratorzy</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Brak użytkowników spełniających kryteria wyszukiwania.'
              : 'Brak użytkowników w bazie.'}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Użytkownik</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Rola</TableHead>
                  <TableHead className="text-right">Montaż</TableHead>
                  <TableHead className="text-right">Demontaż</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  {canManageUsers && <TableHead className="text-right">Akcje</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow
                    key={u.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedUser(u)
                      setResetLink(null)
                      setResetLinkCopied(false)
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {u.avatarUrl && <AvatarImage src={u.avatarUrl} />}
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {getInitials(u.firstName, u.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">
                            {u.fullName}
                          </div>
                          {u.email && (
                            <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.phone}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANTS[u.role]}>
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(u.assemblyRate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(u.disassemblyRate)}
                    </TableCell>
                    <TableCell className="text-center">
                      {u.isActive ? (
                        <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/10">
                          Aktywny
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Nieaktywny</Badge>
                      )}
                    </TableCell>
                    {canManageUsers && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setUserToEdit(u)
                              setIsEditFormOpen(true)
                            }}
                            title="Edytuj"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${u.isActive ? 'text-destructive hover:text-destructive' : 'text-green-500 hover:text-green-500'}`}
                            onClick={() => toggleMutation.mutate({ id: u.id, isActive: !u.isActive })}
                            disabled={toggleMutation.isPending}
                            title={u.isActive ? 'Dezaktywuj' : 'Aktywuj'}
                          >
                            {u.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null)
            setResetLink(null)
            setResetLinkCopied(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-0 gap-0">
          {selectedUser && (
            <>
              <div className="p-6 pb-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      {selectedUser.avatarUrl && <AvatarImage src={selectedUser.avatarUrl} />}
                      <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                        {getInitials(selectedUser.firstName, selectedUser.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-xl font-bold">{selectedUser.fullName}</DialogTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={ROLE_VARIANTS[selectedUser.role]}>
                          {ROLE_LABELS[selectedUser.role]}
                        </Badge>
                        {selectedUser.isActive ? (
                          <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/10 font-normal">
                            Aktywny
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="font-normal">Nieaktywny</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full border border-border bg-background"
                    onClick={() => setSelectedUser(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Dane kontaktowe
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="text-foreground">{selectedUser.phone}</span>
                    </div>
                    {selectedUser.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{selectedUser.email}</span>
                      </div>
                    )}
                    {selectedUser.address && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{selectedUser.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Stawki
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="shadow-none">
                      <CardContent className="p-4 flex flex-col gap-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Wrench className="h-3 w-3" /> Montaż
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {formatPrice(selectedUser.assemblyRate)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none">
                      <CardContent className="p-4 flex flex-col gap-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <WrenchIcon className="h-3 w-3" /> Demontaż
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {formatPrice(selectedUser.disassemblyRate)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Informacje
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4" />
                      <span>Rola: <span className="text-foreground font-medium">{ROLE_LABELS[selectedUser.role]}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-4 w-4" />
                      <span>
                        Dodano:{' '}
                        <span className="text-foreground font-medium">
                          {new Date(selectedUser.createdAt).toLocaleDateString('pl-PL', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {canManageUsers && selectedUser.email && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Reset hasła
                    </h3>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePasswordReset(selectedUser.id)}
                          disabled={resetLoading === selectedUser.id}
                        >
                          <KeyRound className="h-4 w-4 mr-2" />
                          {resetLoading === selectedUser.id ? 'Generowanie...' : 'Generuj link'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendResetEmail(selectedUser.id)}
                          disabled={emailSending === selectedUser.id}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {emailSending === selectedUser.id ? 'Wysyłanie...' : 'Wyślij email z resetem'}
                        </Button>
                      </div>
                      {resetLink && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                          <code className="text-xs flex-1 break-all select-all">{resetLink}</code>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyResetLink}>
                            {resetLinkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {canManageUsers && (
                <div className="p-6 border-t border-border flex flex-col sm:flex-row sm:justify-between items-center gap-3 w-full bg-background/95 backdrop-blur sticky bottom-0">
                  <Button
                    variant="outline"
                    onClick={() =>
                      toggleMutation.mutate(
                        { id: selectedUser.id, isActive: !selectedUser.isActive },
                        {
                          onSuccess: () =>
                            setSelectedUser({
                              ...selectedUser,
                              isActive: !selectedUser.isActive,
                            }),
                        }
                      )
                    }
                    disabled={toggleMutation.isPending}
                    className={
                      selectedUser.isActive
                        ? 'text-destructive hover:bg-destructive/10 hover:text-destructive border-border'
                        : 'text-green-500 hover:bg-green-500/10 hover:text-green-500 border-border'
                    }
                  >
                    {selectedUser.isActive ? (
                      <>
                        <PowerOff className="w-4 h-4 mr-2" /> Dezaktywuj
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-2" /> Aktywuj
                      </>
                    )}
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                      setUserToEdit(selectedUser)
                      setIsEditFormOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edytuj
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edytuj użytkownika — {userToEdit?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {userToEdit && (
              <UserForm
                employee={userToEdit}
                onSuccess={() => {
                  setIsEditFormOpen(false)
                  if (selectedUser?.id === userToEdit.id) {
                    setSelectedUser(null)
                  }
                }}
                onCancel={() => setIsEditFormOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dodaj nowego użytkownika</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <UserForm
              mode="create"
              onSuccess={() => setIsCreateFormOpen(false)}
              onCancel={() => setIsCreateFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
