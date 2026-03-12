'use client'

import { useMemo, useState } from 'react'
import { useRentals } from '@/hooks/useRentals'
import { useUsers } from '@/hooks/useUsers'
import { useAttractions } from '@/hooks/useAttractions'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from 'recharts'
import { CHART_COLORS_EXTENDED } from '@/lib/constants'

export default function AnalyticsPage() {
  const { rentals } = useRentals()
  const { users } = useUsers()
  const { attractions } = useAttractions()
  const { user: currentUser } = useAuth()

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 6)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState<string>('completed')

  const filtered = useMemo(() => {
    return rentals.filter((r) => {
      if (dateFrom && r.date < dateFrom) return false
      if (dateTo && r.date > dateTo) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })
  }, [rentals, dateFrom, dateTo, statusFilter])

  const employeeEarnings = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of filtered) {
      for (const a of r.assignedEmployees || []) {
        const attractionCount = r.attractionIds.length
        const earnings =
          attractionCount *
          ((a.didAssembly ? (a.assemblyRateSnapshot ?? 0) : 0) +
            (a.didDisassembly ? (a.disassemblyRateSnapshot ?? 0) : 0))
        if (earnings > 0) {
          map[a.employeeId] = (map[a.employeeId] || 0) + earnings
        }
      }
    }
    return Object.entries(map)
      .map(([id, total]) => {
        const emp = users.find((u) => u.id === id)
        return {
          name: emp ? `${emp.firstName} ${emp.lastName}` : 'Nieznany',
          total,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [filtered, users])

  const clientStats = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {}
    for (const r of filtered) {
      const key = r.clientName
      if (!map[key]) map[key] = { count: 0, revenue: 0 }
      map[key].count++
      map[key].revenue += r.totalCost ?? r.rentalCost + r.deliveryCost
    }
    return Object.entries(map)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15)
  }, [filtered])

  const attractionRevenue = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {}
    for (const r of filtered) {
      const totalCost = r.totalCost ?? r.rentalCost + r.deliveryCost
      const perAttraction = r.attractionIds.length > 0 ? totalCost / r.attractionIds.length : 0
      for (const attrId of r.attractionIds) {
        if (!map[attrId]) map[attrId] = { count: 0, revenue: 0 }
        map[attrId].count++
        map[attrId].revenue += perAttraction
      }
    }
    return Object.entries(map)
      .map(([id, stats]) => {
        const attr = attractions.find((a) => a.id === id)
        return { name: attr?.name ?? 'Nieznana', ...stats }
      })
      .sort((a, b) => b.revenue - a.revenue)
  }, [filtered, attractions])

  const employeeConfig: ChartConfig = {
    total: { label: 'Zarobki', color: 'var(--chart-1)' },
  }
  const clientConfig: ChartConfig = {
    revenue: { label: 'Przychód', color: 'var(--chart-2)' },
    count: { label: 'Ilość najm.', color: 'var(--chart-4)' },
  }
  const attractionConfig: ChartConfig = {
    revenue: { label: 'Przychód', color: 'var(--chart-3)' },
  }

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'owner'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40"
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            <SelectItem value="completed">Zakończone</SelectItem>
            <SelectItem value="confirmed">Potwierdzone</SelectItem>
            <SelectItem value="inProgress">W trakcie</SelectItem>
            <SelectItem value="pending">Oczekujące</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-2">
          {filtered.length} rezerwacji
        </span>
      </div>

      {canManage && employeeEarnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Zarobki pracowników</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={employeeConfig} className="h-[300px] w-full">
              <BarChart data={employeeEarnings} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <XAxis type="number" tickFormatter={(v) => `${v} zł`} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => formatPrice(Number(value))} />}
                />
                <Bar dataKey="total" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {clientStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Klienci — przychód i liczba najmów</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={clientConfig} className="h-[400px] w-full">
              <BarChart data={clientStats} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <XAxis type="number" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) =>
                        name === 'revenue' ? formatPrice(Number(value)) : `${value} najmów`
                      }
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="revenue" fill="var(--chart-2)" radius={[0, 4, 4, 0]} name="revenue" />
                <Bar dataKey="count" fill="var(--chart-4)" radius={[0, 4, 4, 0]} name="count" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {attractionRevenue.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Przychód z atrakcji</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={attractionConfig} className="h-[350px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => formatPrice(Number(value))} />}
                  />
                  <Pie
                    data={attractionRevenue}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={true}
                  >
                    {attractionRevenue.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS_EXTENDED[i % CHART_COLORS_EXTENDED.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popularność atrakcji</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={attractionConfig} className="h-[350px] w-full">
                <BarChart data={attractionRevenue}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    angle={-25}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tickFormatter={(v) => `${v} zł`} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatPrice(Number(value))}
                      />
                    }
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {attractionRevenue.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS_EXTENDED[i % CHART_COLORS_EXTENDED.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Brak danych w wybranym okresie.
        </div>
      )}
    </div>
  )
}
