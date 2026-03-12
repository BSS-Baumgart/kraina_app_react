'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useRentals } from '@/hooks/useRentals'
import { useClients } from '@/hooks/useClients'
import { useAttractions } from '@/hooks/useAttractions'
import { useUsers } from '@/hooks/useUsers'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/lib/utils'
import { STATUS_DISPLAY, STATUS_COLORS, CHART_COLORS } from '@/lib/constants'
import type { Rental } from '@/lib/types'
import { RentalDetailDialog } from '@/components/rentals/RentalDetailDialog'
import { RentalRow } from '@/components/rentals/RentalRow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  Area,
  AreaChart,
} from 'recharts'
import {
  CalendarDays,
  DollarSign,
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  UserCheck,
  ClipboardList,
  ArrowRight,
  Clock,
  Plus,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { rentals } = useRentals()
  const { clients } = useClients()
  const { attractions } = useAttractions()
  const { users } = useUsers()
  const { expenses } = useExpenses()
  const { user: currentUser } = useAuth()

  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'owner'
  const isEmployee = currentUser?.role === 'employee'

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prevMonth = `${now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}-${String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, '0')}`

  const todayRentals = useMemo(
    () => rentals.filter((r) => r.date === today && r.status !== 'cancelled'),
    [rentals, today]
  )

  const tomorrowDate = useMemo(() => {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }, [])

  const tomorrowRentals = useMemo(
    () => rentals.filter((r) => r.date === tomorrowDate && r.status !== 'cancelled'),
    [rentals, tomorrowDate]
  )

  const upcomingRentals = useMemo(
    () => rentals
      .filter((r) => r.date >= today && r.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.setupTime.localeCompare(b.setupTime))
      .slice(0, 8),
    [rentals, today]
  )

  const thisMonthRentals = useMemo(
    () => rentals.filter((r) => r.date.startsWith(currentMonth)),
    [rentals, currentMonth]
  )

  const prevMonthRentals = useMemo(
    () => rentals.filter((r) => r.date.startsWith(prevMonth)),
    [rentals, prevMonth]
  )

  const monthlyRevenue = useMemo(
    () => thisMonthRentals
      .filter((r) => r.status !== 'cancelled')
      .reduce((s, r) => s + (r.totalCost ?? r.rentalCost + r.deliveryCost), 0),
    [thisMonthRentals]
  )

  const prevMonthRevenue = useMemo(
    () => prevMonthRentals
      .filter((r) => r.status !== 'cancelled')
      .reduce((s, r) => s + (r.totalCost ?? r.rentalCost + r.deliveryCost), 0),
    [prevMonthRentals]
  )

  const monthlyExpenses = useMemo(
    () => expenses
      .filter((e) => e.date.startsWith(currentMonth))
      .reduce((s, e) => s + e.amount, 0),
    [expenses, currentMonth]
  )

  const revenueChange = prevMonthRevenue > 0
    ? Math.round(((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
    : 0

  const myTodayAssignments = useMemo(() => {
    if (!currentUser?.id) return []
    return todayRentals.filter((r) =>
      r.assignedEmployees?.some((e) => e.employeeId === currentUser.id)
    )
  }, [todayRentals, currentUser?.id])

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of thisMonthRentals) {
      counts[r.status] = (counts[r.status] || 0) + 1
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_DISPLAY[status as keyof typeof STATUS_DISPLAY] || status,
        value: count,
        color: STATUS_COLORS[status] || '#888',
      }))
  }, [thisMonthRentals])

  const weeklyTrend = useMemo(() => {
    const weeks: { label: string; revenue: number; rentals: number }[] = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const startStr = weekStart.toISOString().split('T')[0]
      const endStr = weekEnd.toISOString().split('T')[0]

      const weekRentals = rentals.filter(
        (r) => r.date >= startStr && r.date <= endStr && r.status !== 'cancelled'
      )

      weeks.push({
        label: `${weekStart.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}`,
        revenue: weekRentals.reduce((s, r) => s + (r.totalCost ?? r.rentalCost + r.deliveryCost), 0),
        rentals: weekRentals.length,
      })
    }
    return weeks
  }, [rentals])

  const topAttractions = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of thisMonthRentals) {
      if (r.status === 'cancelled') continue
      for (const id of r.attractionIds) {
        map[id] = (map[id] || 0) + 1
      }
    }
    return Object.entries(map)
      .map(([id, count]) => {
        const attr = attractions.find((a) => a.id === id)
        return { name: attr?.name ?? 'Nieznana', count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [thisMonthRentals, attractions])

  const trendConfig: ChartConfig = {
    revenue: { label: 'Przychód', color: 'var(--chart-1)' },
  }
  const statusConfig: ChartConfig = { value: { label: 'Ilość' } }

  const formatDatePl = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('pl-PL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })

  const getGreeting = () => {
    const h = now.getHours()
    if (h < 12) return 'Dzień dobry'
    if (h < 18) return 'Cześć'
    return 'Dobry wieczór'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, {currentUser?.firstName || 'Użytkowniku'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {todayRentals.length > 0
              ? `Masz ${todayRentals.length} ${todayRentals.length === 1 ? 'rezerwację' : todayRentals.length < 5 ? 'rezerwacje' : 'rezerwacji'} na dziś`
              : 'Brak rezerwacji na dziś'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/app/calendar')}>
            <CalendarDays className="h-4 w-4 mr-1" />
            Terminarz
          </Button>
          <Button size="sm" onClick={() => router.push('/app/rentals')}>
            <Plus className="h-4 w-4 mr-1" />
            Nowa rezerwacja
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <Card className="cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 h-[100px] flex flex-col justify-center border-border/40 bg-gradient-to-b from-card to-muted/30" onClick={() => router.push('/app/calendar')}>
          <CardHeader className="flex flex-row items-center justify-between px-3 pb-0 pt-0">
            <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Dziś</CardTitle>
            <CalendarDays className="h-3 w-3 text-muted-foreground/60" />
          </CardHeader>
          <CardContent className="px-3 pt-1 pb-0">
            <p className="text-xl font-bold tracking-tight">{todayRentals.length}</p>
            <p className="text-[9px] text-muted-foreground">jutro: {tomorrowRentals.length}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 h-[100px] flex flex-col justify-center border-border/40 bg-gradient-to-b from-card to-muted/30" onClick={() => {
          const now = new Date()
          const y = now.getFullYear()
          const m = String(now.getMonth() + 1).padStart(2, '0')
          const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
          router.push(`/app/rentals?dateFrom=${y}-${m}-01&dateTo=${y}-${m}-${String(lastDay).padStart(2, '0')}`)
        }}>
          <CardHeader className="flex flex-row items-center justify-between px-3 pb-0 pt-0">
            <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Miesiąc</CardTitle>
            <ClipboardList className="h-3 w-3 text-muted-foreground/60" />
          </CardHeader>
          <CardContent className="px-3 pt-1 pb-0">
            <p className="text-xl font-bold tracking-tight">{thisMonthRentals.filter(r => r.status !== 'cancelled').length}</p>
            <p className="text-[9px] text-muted-foreground">rezerwacji</p>
          </CardContent>
        </Card>

        {canManage && (
          <Card className="cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 h-[100px] flex flex-col justify-center border-border/40 bg-gradient-to-b from-card to-muted/30" onClick={() => router.push('/app/statistics/revenue')}>
            <CardHeader className="flex flex-row items-center justify-between px-3 pb-0 pt-0">
              <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Przychód</CardTitle>
              <DollarSign className="h-3 w-3 text-muted-foreground/60" />
            </CardHeader>
            <CardContent className="px-3 pt-1 pb-0">
              <p className="text-xl font-bold text-green-600 tracking-tight">{formatPrice(monthlyRevenue)}</p>
              <div className="flex items-center gap-1">
                {revenueChange >= 0 ? (
                  <TrendingUp className="h-2.5 w-2.5 text-green-500" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                )}
                <span className={`text-[9px] font-medium ${revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {revenueChange > 0 ? '+' : ''}{revenueChange}%
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {canManage && (
          <Card className="cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 h-[100px] flex flex-col justify-center border-border/40 bg-gradient-to-b from-card to-muted/30" onClick={() => router.push('/app/statistics/costs')}>
            <CardHeader className="flex flex-row items-center justify-between px-3 pb-0 pt-0">
              <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Zysk</CardTitle>
              <TrendingUp className="h-3 w-3 text-muted-foreground/60" />
            </CardHeader>
            <CardContent className="px-3 pt-1 pb-0">
              <p className={`text-xl font-bold tracking-tight ${monthlyRevenue - monthlyExpenses >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatPrice(monthlyRevenue - monthlyExpenses)}
              </p>
              <p className="text-[9px] text-muted-foreground">koszty: {formatPrice(monthlyExpenses)}</p>
            </CardContent>
          </Card>
        )}

        {isEmployee && (
          <Card className="h-[100px] flex flex-col justify-center border-border/40 bg-gradient-to-b from-card to-muted/30">
            <CardHeader className="flex flex-row items-center justify-between px-3 pb-0 pt-0">
              <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Zadania</CardTitle>
              <Zap className="h-3 w-3 text-muted-foreground/60" />
            </CardHeader>
            <CardContent className="px-3 pt-1 pb-0">
              <p className="text-xl font-bold tracking-tight">{myTodayAssignments.length}</p>
              <p className="text-[9px] text-muted-foreground">na dziś</p>
            </CardContent>
          </Card>
        )}

        <Card className="cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 h-[100px] flex flex-col justify-center border-border/40 bg-gradient-to-b from-card to-muted/30" onClick={() => router.push('/app/clients')}>
          <CardHeader className="flex flex-row items-center justify-between px-3 pb-0 pt-0">
            <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Klienci</CardTitle>
            <UserCheck className="h-3 w-3 text-muted-foreground/60" />
          </CardHeader>
          <CardContent className="px-3 pt-1 pb-0">
            <p className="text-xl font-bold tracking-tight">{clients.length}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 h-[100px] flex flex-col justify-center border-border/40 bg-gradient-to-b from-card to-muted/30" onClick={() => router.push('/app/attractions')}>
          <CardHeader className="flex flex-row items-center justify-between px-3 pb-0 pt-0">
            <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Atrakcje</CardTitle>
            <Zap className="h-3 w-3 text-muted-foreground/60" />
          </CardHeader>
          <CardContent className="px-3 pt-1 pb-0">
            <p className="text-xl font-bold tracking-tight">{attractions.filter((a) => a.isActive).length}</p>
            <p className="text-[9px] text-muted-foreground">z {attractions.length}</p>
          </CardContent>
        </Card>

        {canManage && (
          <Card className="cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 h-[100px] flex flex-col justify-center border-border/40 bg-gradient-to-b from-card to-muted/30" onClick={() => router.push('/app/users')}>
            <CardHeader className="flex flex-row items-center justify-between px-3 pb-0 pt-0">
              <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pracownicy</CardTitle>
              <Users className="h-3 w-3 text-muted-foreground/60" />
            </CardHeader>
            <CardContent className="px-3 pt-1 pb-0">
              <p className="text-xl font-bold tracking-tight">{users.filter((u) => u.isActive).length}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4" />
                Dzisiejsze rezerwacje
                {todayRentals.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{todayRentals.length}</Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push('/app/calendar')}>
                Wszystkie <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayRentals.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Brak rezerwacji na dziś</p>
              </div>
            ) : (
              <div className="divide-y">
                {todayRentals
                  .sort((a, b) => a.setupTime.localeCompare(b.setupTime))
                  .map((rental) => (
                    <RentalRow key={rental.id} rental={rental} showDate={false} canManage={canManage} formatDatePl={formatDatePl} onClick={setSelectedRental} />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Szybkie akcje</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1.5"
              onClick={() => router.push('/app/rentals')}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">Nowa rezerwacja</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1.5"
              onClick={() => router.push('/app/calendar')}
            >
              <CalendarDays className="h-5 w-5" />
              <span className="text-xs">Terminarz</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1.5"
              onClick={() => router.push('/app/clients')}
            >
              <UserCheck className="h-5 w-5" />
              <span className="text-xs">Klienci</span>
            </Button>
            {canManage && (
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1.5"
                onClick={() => router.push('/app/statistics')}
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs">Statystyki</span>
              </Button>
            )}
            {isEmployee && (
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1.5"
                onClick={() => router.push('/app/statistics/payroll')}
              >
                <DollarSign className="h-5 w-5" />
                <span className="text-xs">Moje wypłaty</span>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Nadchodzące rezerwacje
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push('/app/rentals')}>
                Wszystkie <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingRentals.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Brak nadchodzących rezerwacji</p>
              </div>
            ) : (
              <div className="divide-y">
                {upcomingRentals.map((rental) => (
                  <RentalRow key={rental.id} rental={rental} canManage={canManage} formatDatePl={formatDatePl} onClick={setSelectedRental} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {canManage && weeklyTrend.some(w => w.revenue > 0) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Trend przychodów (4 tyg.)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trendConfig} className="h-[200px] w-full">
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => formatPrice(Number(value))} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statusData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Statusy (ten miesiąc)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={statusConfig} className="h-[180px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => `${value} rezerwacji`} />}
                  />
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center gap-1 text-[11px]">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span>{s.name}: {s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {topAttractions.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top atrakcje (mies.)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topAttractions.map((attr, i) => (
                  <div key={attr.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm truncate">{attr.name}</span>
                        <span className="text-sm font-medium ml-2">{attr.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(attr.count / topAttractions[0].count) * 100}%`,
                            backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <RentalDetailDialog
        rental={selectedRental}
        onClose={() => setSelectedRental(null)}
      />
    </div>
  )
}
