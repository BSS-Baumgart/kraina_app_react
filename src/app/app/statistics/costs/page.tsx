'use client'

import { useState, useMemo } from 'react'
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/hooks/useExpenses'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/hooks/useAuth'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'
import type { ExpenseCategory } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Fuel, Wrench, UtensilsCrossed, Package, Star, MoreHorizontal } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  fuel: <Fuel className="h-4 w-4" />,
  food: <UtensilsCrossed className="h-4 w-4" />,
  repair: <Wrench className="h-4 w-4" />,
  material: <Package className="h-4 w-4" />,
  attraction_repair: <Star className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  fuel: '#F59E0B',
  food: '#10B981',
  repair: '#EF4444',
  material: '#8B5CF6',
  attraction_repair: '#EC4899',
  other: '#6B7280',
}

export default function CostsPage() {
  const { expenses, isLoading } = useExpenses()
  const { users } = useUsers()
  const { user: currentUser } = useAuth()
  const createExpense = useCreateExpense()
  const deleteExpense = useDeleteExpense()

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'owner'
  const isMobile = useIsMobile()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0])
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('fuel')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCategory !== 'all' && e.category !== filterCategory) return false
      if (filterMonth && !e.date.startsWith(filterMonth)) return false
      return true
    })
  }, [expenses, filterCategory, filterMonth])

  const totalFiltered = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  )

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const e of filteredExpenses) {
      totals[e.category] = (totals[e.category] || 0) + e.amount
    }
    return totals
  }, [filteredExpenses])

  const getEmployeeName = (id: string) => {
    const emp = users.find((u) => u.id === id)
    return emp ? `${emp.firstName} ${emp.lastName}` : '—'
  }

  const handleSubmit = () => {
    const amount = parseFloat(formAmount)
    if (!formDate || !formCategory || !formDescription.trim() || isNaN(amount) || amount <= 0) return

    createExpense.mutate(
      { date: formDate, category: formCategory, description: formDescription.trim(), amount },
      {
        onSuccess: () => {
          setDialogOpen(false)
          setFormDescription('')
          setFormAmount('')
        },
      }
    )
  }

  if (!canManage) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Brak dostępu do tej strony.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Suma kosztów</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <p className="text-lg sm:text-2xl font-bold text-destructive">{formatPrice(totalFiltered)}</p>
          </CardContent>
        </Card>
        {Object.entries(categoryTotals).map(([cat, total]) => (
          <Card key={cat}>
            <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                {CATEGORY_ICONS[cat]}
                {EXPENSE_CATEGORIES[cat as ExpenseCategory]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <p className="text-base sm:text-lg font-bold">{formatPrice(total)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="w-44"
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Kategoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj koszt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nowy koszt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Kategoria</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as ExpenseCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Opis</Label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="np. Tankowanie busa"
                />
              </div>
              <div className="space-y-2">
                <Label>Kwota (zł)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <Button
                className="w-full"
                disabled={createExpense.isPending}
                onClick={handleSubmit}
              >
                {createExpense.isPending ? 'Zapisywanie...' : 'Dodaj koszt'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Ładowanie...</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Brak kosztów w wybranym okresie.</div>
      ) : isMobile ? (
        /* ===== Mobile: card list ===== */
        <div className="space-y-2.5">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b">
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: `${CATEGORY_COLORS[expense.category]}40`,
                      color: CATEGORY_COLORS[expense.category],
                      backgroundColor: `${CATEGORY_COLORS[expense.category]}10`,
                    }}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    {CATEGORY_ICONS[expense.category]}
                    {EXPENSE_CATEGORIES[expense.category]}
                  </Badge>
                  <span className="font-bold text-sm">{formatPrice(expense.amount)}</span>
                </div>
                {/* Key-value rows */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span>{new Date(expense.date + 'T00:00:00').toLocaleDateString('pl-PL')}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">Opis</span>
                    <span className="text-right truncate">{expense.description}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dodał</span>
                    <span>{getEmployeeName(expense.createdBy)}</span>
                  </div>
                </div>
                {/* Delete button */}
                <div className="flex justify-end mt-2 pt-2 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1">
                        <Trash2 className="h-3 w-3" />
                        Usuń
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Usunąć koszt?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {expense.description} — {formatPrice(expense.amount)}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          onClick={() => deleteExpense.mutate(expense.id)}
                        >
                          Usuń
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* ===== Desktop: table ===== */
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead>Opis</TableHead>
                <TableHead>Dodał</TableHead>
                <TableHead className="text-right">Kwota</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(expense.date + 'T00:00:00').toLocaleDateString('pl-PL')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: `${CATEGORY_COLORS[expense.category]}40`,
                        color: CATEGORY_COLORS[expense.category],
                        backgroundColor: `${CATEGORY_COLORS[expense.category]}10`,
                      }}
                      className="flex items-center gap-1.5 w-fit"
                    >
                      {CATEGORY_ICONS[expense.category]}
                      {EXPENSE_CATEGORIES[expense.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell className="text-muted-foreground">{getEmployeeName(expense.createdBy)}</TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(expense.amount)}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Usunąć koszt?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {expense.description} — {formatPrice(expense.amount)}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anuluj</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            onClick={() => deleteExpense.mutate(expense.id)}
                          >
                            Usuń
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
