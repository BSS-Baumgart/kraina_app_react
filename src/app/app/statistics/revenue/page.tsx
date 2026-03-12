'use client'

import { useMemo, useState } from 'react'
import { useRentals } from '@/hooks/useRentals'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/lib/utils'
import { PAYMENT_TYPE_DISPLAY, MONTH_NAMES_SHORT, GRANULARITY_LABELS } from '@/lib/constants'
import type { PaymentType, Granularity } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function getMonday(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getWeekLabel(dateStr: string) {
  const mon = new Date(dateStr + 'T00:00:00')
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmtDay = (d: Date) => `${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]}`
  return `${fmtDay(mon)} – ${fmtDay(sun)}`
}

function formatDayLabel(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(d)} ${MONTH_NAMES_SHORT[parseInt(m) - 1]}`
}

export default function RevenuePage() {
  const { rentals } = useRentals()
  const { expenses } = useExpenses()
  const { user: currentUser } = useAuth()

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'owner'

  const [granularity, setGranularity] = useState<Granularity>('month')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-01-01`
  })
  const [dateTo, setDateTo] = useState(todayStr)

  const setQuick = (from: string, to: string, g: Granularity) => {
    setDateFrom(from)
    setDateTo(to)
    setGranularity(g)
  }

  const getBucketKey = (dateStr: string): string => {
    switch (granularity) {
      case 'day':
        return dateStr
      case 'week':
        return getMonday(dateStr)
      case 'month':
        return dateStr.substring(0, 7)
    }
  }

  const getBucketLabel = (key: string): string => {
    switch (granularity) {
      case 'day':
        return formatDayLabel(key)
      case 'week':
        return getWeekLabel(key)
      case 'month': {
        const [y, m] = key.split('-')
        return `${MONTH_NAMES_SHORT[parseInt(m) - 1]} ${y}`
      }
    }
  }

  const allBucketKeys = useMemo(() => {
    const keys: string[] = []
    if (granularity === 'day') {
      let cur = dateFrom
      while (cur <= dateTo) {
        keys.push(cur)
        cur = addDays(cur, 1)
      }
    } else if (granularity === 'week') {
      let cur = getMonday(dateFrom)
      while (cur <= dateTo) {
        keys.push(cur)
        cur = addDays(cur, 7)
      }
    } else {
      const [fy, fm] = dateFrom.split('-').map(Number)
      const [ty, tm] = dateTo.split('-').map(Number)
      let cy = fy, cm = fm
      while (cy < ty || (cy === ty && cm <= tm)) {
        keys.push(`${cy}-${String(cm).padStart(2, '0')}`)
        cm++
        if (cm > 12) { cm = 1; cy++ }
      }
    }
    return keys
  }, [dateFrom, dateTo, granularity])

  const groupedData = useMemo(() => {
    const map: Record<string, { revenue: number; expenses: number; count: number; invoices: number; receipts: number }> = {}
    for (const key of allBucketKeys) {
      map[key] = { revenue: 0, expenses: 0, count: 0, invoices: 0, receipts: 0 }
    }

    for (const r of rentals) {
      if (r.status === 'cancelled') continue
      if (r.date < dateFrom || r.date > dateTo) continue
      const key = getBucketKey(r.date)
      if (!map[key]) continue
      const cost = r.totalCost ?? r.rentalCost + r.deliveryCost
      map[key].revenue += cost
      map[key].count++
      if (r.hasInvoice) map[key].invoices++
      if (r.hasReceipt) map[key].receipts++
    }

    for (const e of expenses) {
      if (e.date < dateFrom || e.date > dateTo) continue
      const key = getBucketKey(e.date)
      if (!map[key]) continue
      map[key].expenses += e.amount
    }

    return allBucketKeys.map((key) => ({
      label: getBucketLabel(key),
      revenue: map[key].revenue,
      expenses: map[key].expenses,
      profit: map[key].revenue - map[key].expenses,
      count: map[key].count,
    }))
  }, [rentals, expenses, dateFrom, dateTo, allBucketKeys, granularity])

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = { cash: 0, blik: 0, transfer: 0, unknown: 0 }
    for (const r of rentals) {
      if (r.status === 'cancelled') continue
      if (r.date < dateFrom || r.date > dateTo) continue
      const cost = r.totalCost ?? r.rentalCost + r.deliveryCost
      const key = r.paymentType ?? 'unknown'
      map[key] = (map[key] || 0) + cost
    }
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([key, total]) => ({
        name: key === 'unknown' ? 'Nieokreślony' : PAYMENT_TYPE_DISPLAY[key as PaymentType],
        total,
      }))
  }, [rentals, dateFrom, dateTo])

  const totalRevenue = groupedData.reduce((s, m) => s + m.revenue, 0)
  const totalExpenses = groupedData.reduce((s, m) => s + m.expenses, 0)
  const totalProfit = totalRevenue - totalExpenses
  const totalRentals = groupedData.reduce((s, m) => s + m.count, 0)

  const revenueConfig: ChartConfig = {
    revenue: { label: 'Przychody', color: 'var(--chart-1)' },
    expenses: { label: 'Koszty', color: 'var(--chart-5)' },
    profit: { label: 'Zysk', color: 'var(--chart-2)' },
  }

  const paymentConfig: ChartConfig = {
    total: { label: 'Kwota', color: 'var(--chart-4)' },
  }

  if (!canManage) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Brak dostępu do tej strony.</p>
      </div>
    )
  }

  const now = new Date()
  const thisYearStart = `${now.getFullYear()}-01-01`
  const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const thisWeekMonday = getMonday(todayStr())

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={dateFrom === todayStr() && dateTo === todayStr() ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuick(todayStr(), todayStr(), 'day')}
        >
          Dziś
        </Button>
        <Button
          variant={dateFrom === thisWeekMonday && dateTo === todayStr() && granularity === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuick(thisWeekMonday, todayStr(), 'day')}
        >
          Ten tydzień
        </Button>
        <Button
          variant={dateFrom === thisMonthStart && dateTo === todayStr() && granularity === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuick(thisMonthStart, todayStr(), 'day')}
        >
          Ten miesiąc
        </Button>
        <Button
          variant={dateFrom === thisYearStart && dateTo === todayStr() && granularity === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuick(thisYearStart, todayStr(), 'month')}
        >
          Ten rok
        </Button>
        <div className="h-6 w-px bg-border" />
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
        <Select value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">{GRANULARITY_LABELS.day}</SelectItem>
            <SelectItem value="week">{GRANULARITY_LABELS.week}</SelectItem>
            <SelectItem value="month">{GRANULARITY_LABELS.month}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Przychody</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Koszty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatPrice(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zysk netto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatPrice(totalProfit)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rezerwacje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRentals}</p>
          </CardContent>
        </Card>
      </div>

      {groupedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Przychody vs Koszty — {GRANULARITY_LABELS[granularity].toLowerCase()}o</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="h-[350px] w-full">
              <BarChart data={groupedData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={granularity === 'week' ? 10 : 12}
                  angle={groupedData.length > 14 ? -35 : 0}
                  textAnchor={groupedData.length > 14 ? 'end' : 'middle'}
                  height={groupedData.length > 14 ? 70 : 30}
                />
                <YAxis tickFormatter={(v) => `${v} zł`} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => formatPrice(Number(value))} />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {groupedData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Zysk — trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="h-[250px] w-full">
              <AreaChart data={groupedData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={granularity === 'week' ? 10 : 12}
                  angle={groupedData.length > 14 ? -35 : 0}
                  textAnchor={groupedData.length > 14 ? 'end' : 'middle'}
                  height={groupedData.length > 14 ? 70 : 30}
                />
                <YAxis tickFormatter={(v) => `${v} zł`} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => formatPrice(Number(value))} />}
                />
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="var(--chart-2)"
                  fill="url(#profitGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {paymentBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Podział wg typu płatności</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={paymentConfig} className="h-[250px] w-full">
              <BarChart data={paymentBreakdown}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `${v} zł`} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => formatPrice(Number(value))} />}
                />
                <Bar dataKey="total" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
