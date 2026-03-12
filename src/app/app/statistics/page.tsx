'use client'

import { useMemo } from 'react'
import { useRentals } from '@/hooks/useRentals'
import { useClients } from '@/hooks/useClients'
import { useAttractions } from '@/hooks/useAttractions'
import { useUsers } from '@/hooks/useUsers'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/lib/utils'
import { STATUS_DISPLAY, STATUS_COLORS, STATUS_ORDER } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from 'recharts'
import {
  CalendarDays,
  DollarSign,
  Users,
  Zap,
  TrendingUp,
  UserCheck,
} from 'lucide-react'

export default function StatisticsOverviewPage() {
  const { rentals } = useRentals()
  const { clients } = useClients()
  const { attractions } = useAttractions()
  const { users } = useUsers()
  const { expenses } = useExpenses()
  const { user: currentUser } = useAuth()

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'owner'

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const thisMonthRentals = useMemo(
    () => rentals.filter((r) => r.date.startsWith(currentMonth)),
    [rentals, currentMonth]
  )

  const totalRevenue = useMemo(
    () => rentals
      .filter((r) => r.status !== 'cancelled')
      .reduce((s, r) => s + (r.totalCost ?? r.rentalCost + r.deliveryCost), 0),
    [rentals]
  )

  const monthlyRevenue = useMemo(
    () => thisMonthRentals
      .filter((r) => r.status !== 'cancelled')
      .reduce((s, r) => s + (r.totalCost ?? r.rentalCost + r.deliveryCost), 0),
    [thisMonthRentals]
  )

  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  )

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of rentals) {
      counts[r.status] = (counts[r.status] || 0) + 1
    }
    return STATUS_ORDER
      .filter((s) => counts[s])
      .map((s) => ({
        name: STATUS_DISPLAY[s],
        value: counts[s],
        color: STATUS_COLORS[s],
      }))
  }, [rentals])

  const topAttractions = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of rentals) {
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
  }, [rentals, attractions])

  const statusConfig: ChartConfig = {
    value: { label: 'Ilość' },
  }

  const attractionConfig: ChartConfig = {
    count: { label: 'Rezerwacje', color: 'var(--chart-1)' },
  }

  const today = now.toISOString().split('T')[0]
  const upcomingRentals = useMemo(
    () => rentals
      .filter((r) => r.date >= today && r.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5),
    [rentals, today]
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rezerwacje</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rentals.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {thisMonthRentals.length} w tym miesiącu
            </p>
          </CardContent>
        </Card>

        {canManage && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Przychody</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatPrice(monthlyRevenue)} w tym miesiącu
              </p>
            </CardContent>
          </Card>
        )}

        {canManage && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Koszty</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{formatPrice(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Zysk: {formatPrice(totalRevenue - totalExpenses)}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Klienci</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{clients.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atrakcje</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{attractions.filter((a) => a.isActive).length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              aktywnych z {attractions.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pracownicy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{users.filter((u) => u.isActive).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rezerwacje wg statusu</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={statusConfig} className="h-[280px] w-full">
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
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {topAttractions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Najpopularniejsze atrakcje</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={attractionConfig} className="h-[280px] w-full">
                <BarChart data={topAttractions} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <XAxis type="number" />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => `${value} rezerwacji`} />}
                  />
                  <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {upcomingRentals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nadchodzące rezerwacje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingRentals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-sm">{r.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.date + 'T00:00:00').toLocaleDateString('pl-PL', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })} · {r.setupTime}–{r.teardownTime} · {r.attractionIds.length} {r.attractionIds.length === 1 ? 'atrakcja' : 'atrakcji'}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${STATUS_COLORS[r.status]}20`,
                      color: STATUS_COLORS[r.status],
                    }}
                  >
                    {STATUS_DISPLAY[r.status]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
