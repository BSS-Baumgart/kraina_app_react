'use client'

import { Fragment, useMemo, useState } from 'react'
import { useRentals } from '@/hooks/useRentals'
import { useUsers } from '@/hooks/useUsers'
import { useAttractions } from '@/hooks/useAttractions'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/lib/utils'
import { MONTH_NAMES_SHORT } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { Button } from '@/components/ui/button'
import {
  Wallet,
  Wrench,
  Package,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  MapPin,
  X,
} from 'lucide-react'
import type { Rental, EmployeeAssignment } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'

interface EmployeePayrollRow {
  employeeId: string
  employeeName: string
  totalEarnings: number
  assemblyCount: number
  disassemblyCount: number
  rentalCount: number
  details: RentalDetail[]
}

interface RentalDetail {
  rentalId: string
  date: string
  clientName: string
  address: string
  attractionNames: string[]
  didAssembly: boolean
  didDisassembly: boolean
  assemblyEarnings: number
  disassemblyEarnings: number
  totalEarnings: number
}

export default function PayrollPage() {
  const { rentals } = useRentals()
  const { users } = useUsers()
  const { attractions } = useAttractions()
  const { user: currentUser } = useAuth()

  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'owner'
  const isMobile = useIsMobile()

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return rentals.filter((r) => {
      if (dateFrom && r.date < dateFrom) return false
      if (dateTo && r.date > dateTo) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })
  }, [rentals, dateFrom, dateTo, statusFilter])

  const buildDetail = (r: Rental, a: EmployeeAssignment): RentalDetail => {
    const attractionCount = r.attractionIds.length
    const assemblyEarnings = a.didAssembly ? attractionCount * (a.assemblyRateSnapshot ?? 0) : 0
    const disassemblyEarnings = a.didDisassembly ? attractionCount * (a.disassemblyRateSnapshot ?? 0) : 0
    const attractionNames = r.attractionIds.map(
      (id) => attractions.find((at) => at.id === id)?.name ?? 'Nieznana'
    )
    return {
      rentalId: r.id,
      date: r.date,
      clientName: r.clientName,
      address: r.address,
      attractionNames,
      didAssembly: a.didAssembly,
      didDisassembly: a.didDisassembly,
      assemblyEarnings,
      disassemblyEarnings,
      totalEarnings: assemblyEarnings + disassemblyEarnings,
    }
  }

  const payrollData = useMemo(() => {
    const map: Record<string, EmployeePayrollRow> = {}
    const targetEmployees = isManager
      ? null // all employees
      : [currentUser?.id] // only current user

    for (const r of filtered) {
      for (const a of r.assignedEmployees || []) {
        if (targetEmployees && !targetEmployees.includes(a.employeeId)) continue
        if (!a.didAssembly && !a.didDisassembly) continue

        if (!map[a.employeeId]) {
          const emp = users.find((u) => u.id === a.employeeId)
          map[a.employeeId] = {
            employeeId: a.employeeId,
            employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Nieznany',
            totalEarnings: 0,
            assemblyCount: 0,
            disassemblyCount: 0,
            rentalCount: 0,
            details: [],
          }
        }

        const detail = buildDetail(r, a)
        const row = map[a.employeeId]
        row.totalEarnings += detail.totalEarnings
        if (a.didAssembly) row.assemblyCount++
        if (a.didDisassembly) row.disassemblyCount++
        row.rentalCount++
        row.details.push(detail)
      }
    }

    for (const row of Object.values(map)) {
      row.details.sort((a, b) => a.date.localeCompare(b.date))
    }

    return Object.values(map).sort((a, b) => b.totalEarnings - a.totalEarnings)
  }, [filtered, users, attractions, currentUser, isManager])

  const summary = useMemo(() => {
    let totalToPay = 0
    let totalAssemblies = 0
    let totalDisassemblies = 0
    let totalRentals = 0
    for (const row of payrollData) {
      totalToPay += row.totalEarnings
      totalAssemblies += row.assemblyCount
      totalDisassemblies += row.disassemblyCount
      totalRentals += row.rentalCount
    }
    return { totalToPay, totalAssemblies, totalDisassemblies, totalRentals }
  }, [payrollData])

  const monthlyEarnings = useMemo(() => {
    if (isManager) return []
    const map: Record<string, number> = {}
    for (const row of payrollData) {
      for (const d of row.details) {
        const month = d.date.substring(0, 7) // "YYYY-MM"
        map[month] = (map[month] || 0) + d.totalEarnings
      }
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => {
        const [y, m] = month.split('-')
        const label = `${MONTH_NAMES_SHORT[parseInt(m, 10) - 1]} ${y}`
        return { month: label, total }
      })
  }, [payrollData, isManager])

  const dailyBreakdown = useMemo(() => {
    if (!isManager) return []
    const map: Record<string, { date: string; total: number; employees: Set<string> }> = {}
    for (const row of payrollData) {
      for (const d of row.details) {
        if (!map[d.date]) map[d.date] = { date: d.date, total: 0, employees: new Set() }
        map[d.date].total += d.totalEarnings
        map[d.date].employees.add(row.employeeId)
      }
    }
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        rawDate: d.date,
        date: formatDateLabel(d.date),
        total: d.total,
        employees: d.employees.size,
      }))
  }, [payrollData, isManager])

  const displayedPayroll = useMemo(() => {
    if (!selectedDay) return payrollData
    return payrollData
      .map((row) => {
        const filteredDetails = row.details.filter((d) => d.date === selectedDay)
        if (filteredDetails.length === 0) return null
        return {
          ...row,
          details: filteredDetails,
          totalEarnings: filteredDetails.reduce((s, d) => s + d.totalEarnings, 0),
          assemblyCount: filteredDetails.filter((d) => d.didAssembly).length,
          disassemblyCount: filteredDetails.filter((d) => d.didDisassembly).length,
          rentalCount: filteredDetails.length,
        }
      })
      .filter(Boolean) as EmployeePayrollRow[]
  }, [payrollData, selectedDay])

  const handleBarClick = (data: { rawDate?: string }) => {
    if (!data?.rawDate) return
    setSelectedDay((prev) => (prev === data.rawDate ? null : data.rawDate!))
    setExpandedEmployee(null)
  }

  const setQuickDate = (from: string, to: string) => {
    setDateFrom(from)
    setDateTo(to)
    setSelectedDay(null)
    setExpandedEmployee(null)
  }

  const earningsConfig: ChartConfig = {
    total: { label: isManager ? 'Do wypłaty' : 'Zarobki', color: 'var(--chart-1)' },
  }

  const toggleExpand = (id: string) => {
    setExpandedEmployee((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={isToday(dateFrom, dateTo) ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            const t = todayStr()
            setQuickDate(t, t)
          }}
        >
          Dziś
        </Button>
        <Button
          variant={isYesterday(dateFrom, dateTo) ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            const y = yesterdayStr()
            setQuickDate(y, y)
          }}
        >
          Wczoraj
        </Button>
        <Button
          variant={isCurrentMonth(dateFrom) && dateTo === todayStr() && !isToday(dateFrom, dateTo) && !isYesterday(dateFrom, dateTo) ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            const d = new Date()
            const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
            setQuickDate(from, todayStr())
          }}
        >
          Ten miesiąc
        </Button>
        <div className="h-6 w-px bg-border" />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setSelectedDay(null) }}
          className="w-40"
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setSelectedDay(null) }}
          className="w-40"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setSelectedDay(null) }}>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {isManager ? 'Do wypłaty łącznie' : 'Zarobione łącznie'}
            </CardTitle>
            <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{formatPrice(summary.totalToPay)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Montaże</CardTitle>
            <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{summary.totalAssemblies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Demontaże</CardTitle>
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{summary.totalDisassemblies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {isManager ? 'Rez. z pracownikami' : 'Moje rezerwacje'}
            </CardTitle>
            <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{summary.totalRentals}</div>
          </CardContent>
        </Card>
      </div>

      {!isManager && monthlyEarnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Zarobki miesięczne</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={earningsConfig} className="h-[300px] w-full">
              <BarChart data={monthlyEarnings}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickFormatter={(v) => `${v} zł`} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatPrice(Number(value))}
                    />
                  }
                />
                <Bar dataKey="total" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {isManager && dailyBreakdown.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Wypłaty dzienne</CardTitle>
            {selectedDay && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSelectedDay(null); setExpandedEmployee(null) }}
                className="gap-1"
              >
                <X className="h-3 w-3" />
                {formatDateLabel(selectedDay)}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Kliknij słupek, aby przefiltrować tabelę poniżej</p>
            <ChartContainer config={earningsConfig} className="h-[300px] w-full">
              <BarChart data={dailyBreakdown}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickFormatter={(v) => `${v} zł`} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatPrice(Number(value))}
                    />
                  }
                />
                <Bar
                  dataKey="total"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(_: unknown, index: number) => handleBarClick(dailyBreakdown[index])}
                >
                  {dailyBreakdown.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={selectedDay === entry.rawDate ? 'var(--chart-2)' : 'var(--chart-1)'}
                      opacity={selectedDay && selectedDay !== entry.rawDate ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {displayedPayroll.length > 0 ? (
        isMobile ? (
          /* ===== Mobile: card list ===== */
          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold">
              {isManager
                ? selectedDay
                  ? `Wypłaty — ${formatDateLabel(selectedDay)}`
                  : 'Wypłaty pracowników'
                : 'Moje zlecenia'}
            </h3>
            {isManager
              ? displayedPayroll.map((row) => (
                  <Card key={row.employeeId}>
                    <CardContent className="p-3">
                      {/* Header */}
                      <div
                        className="flex items-center justify-between mb-2 pb-2 border-b cursor-pointer"
                        onClick={() => toggleExpand(row.employeeId)}
                      >
                        <div className="flex items-center gap-1.5">
                          {expandedEmployee === row.employeeId ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-semibold text-sm">{row.employeeName}</span>
                        </div>
                        <span className="font-bold text-sm">{formatPrice(row.totalEarnings)}</span>
                      </div>
                      {/* Key-value rows */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Montaże</span>
                          <span>{row.assemblyCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Demontaże</span>
                          <span>{row.disassemblyCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Rezerwacje</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {row.rentalCount}
                          </Badge>
                        </div>
                      </div>
                      {/* Expanded details */}
                      {expandedEmployee === row.employeeId && row.details.length > 0 && (
                        <div className="mt-3 pt-2 border-t space-y-2">
                          {row.details.map((d) => (
                            <div key={d.rentalId} className="bg-muted/30 rounded-md p-2 space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{formatDateLabel(d.date)}</span>
                                <span className="font-semibold">{formatPrice(d.totalEarnings)}</span>
                              </div>
                              <div className="text-muted-foreground">{d.clientName}</div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{d.address}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {d.attractionNames.map((name, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px]">
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                {d.didAssembly && (
                                  <Badge variant="default" className="bg-green-600 text-[10px]">
                                    M: {formatPrice(d.assemblyEarnings)}
                                  </Badge>
                                )}
                                {d.didDisassembly && (
                                  <Badge variant="default" className="bg-blue-600 text-[10px]">
                                    D: {formatPrice(d.disassemblyEarnings)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              : displayedPayroll.flatMap((row) =>
                  row.details.map((d) => (
                    <Card key={d.rentalId}>
                      <CardContent className="p-3">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2 pb-2 border-b">
                          <span className="font-semibold text-sm">{formatDateLabel(d.date)}</span>
                          <span className="font-bold text-sm">{formatPrice(d.totalEarnings)}</span>
                        </div>
                        {/* Key-value rows */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Klient</span>
                            <span className="font-medium">{d.clientName}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {d.attractionNames.map((name, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">
                                {name}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Montaż</span>
                            {d.didAssembly ? (
                              <Badge variant="default" className="bg-green-600 text-[10px]">
                                ✓ {formatPrice(d.assemblyEarnings)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Demontaż</span>
                            {d.didDisassembly ? (
                              <Badge variant="default" className="bg-blue-600 text-[10px]">
                                ✓ {formatPrice(d.disassemblyEarnings)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
          </div>
        ) : (
          /* ===== Desktop: table ===== */
          <Card>
            <CardHeader>
              <CardTitle>
                {isManager
                  ? selectedDay
                    ? `Wypłaty — ${formatDateLabel(selectedDay)}`
                    : 'Wypłaty pracowników'
                  : 'Moje zlecenia'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {isManager && <TableHead className="w-8"></TableHead>}
                    {isManager && <TableHead>Pracownik</TableHead>}
                    {!isManager && <TableHead>Data</TableHead>}
                    {!isManager && <TableHead>Klient</TableHead>}
                    {!isManager && <TableHead>Atrakcje</TableHead>}
                    <TableHead className="text-center">Montaż</TableHead>
                    <TableHead className="text-center">Demontaż</TableHead>
                    {isManager && <TableHead className="text-center">Rezerwacje</TableHead>}
                    <TableHead className="text-right">Kwota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isManager
                    ? displayedPayroll.map((row) => (
                        <Fragment key={row.employeeId}>
                          <TableRow
                            key={row.employeeId}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleExpand(row.employeeId)}
                          >
                            <TableCell>
                              {expandedEmployee === row.employeeId ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{row.employeeName}</TableCell>
                            <TableCell className="text-center">{row.assemblyCount}</TableCell>
                            <TableCell className="text-center">{row.disassemblyCount}</TableCell>
                            <TableCell className="text-center">{row.rentalCount}</TableCell>
                            <TableCell className="text-right font-bold">
                              {formatPrice(row.totalEarnings)}
                            </TableCell>
                          </TableRow>
                          {expandedEmployee === row.employeeId &&
                            row.details.map((d) => (
                              <TableRow
                                key={`${row.employeeId}-${d.rentalId}`}
                                className="bg-muted/30"
                              >
                                <TableCell />
                                <TableCell>
                                  <div className="pl-4 space-y-1">
                                    <div className="text-sm font-medium">
                                      {formatDateLabel(d.date)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {d.clientName}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      {d.address}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {d.attractionNames.map((name, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                          {name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {d.didAssembly ? (
                                    <Badge variant="default" className="bg-green-600 text-xs">
                                      ✓ {formatPrice(d.assemblyEarnings)}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {d.didDisassembly ? (
                                    <Badge variant="default" className="bg-blue-600 text-xs">
                                      ✓ {formatPrice(d.disassemblyEarnings)}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                  )}
                                </TableCell>
                                <TableCell />
                                <TableCell className="text-right text-sm">
                                  {formatPrice(d.totalEarnings)}
                                </TableCell>
                              </TableRow>
                            ))}
                        </Fragment>
                      ))
                    : displayedPayroll.flatMap((row) =>
                        row.details.map((d) => (
                          <TableRow key={d.rentalId}>
                            <TableCell>{formatDateLabel(d.date)}</TableCell>
                            <TableCell>{d.clientName}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {d.attractionNames.map((name, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {d.didAssembly ? (
                                <Badge variant="default" className="bg-green-600 text-xs">
                                  ✓ {formatPrice(d.assemblyEarnings)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {d.didDisassembly ? (
                                <Badge variant="default" className="bg-blue-600 text-xs">
                                  ✓ {formatPrice(d.disassemblyEarnings)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatPrice(d.totalEarnings)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Brak danych w wybranym okresie.
        </div>
      )}
    </div>
  )
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${parseInt(d, 10)} ${MONTH_NAMES_SHORT[parseInt(m, 10) - 1]} ${y}`
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

function isToday(from: string, to: string): boolean {
  const t = todayStr()
  return from === t && to === t
}

function isYesterday(from: string, to: string): boolean {
  const y = yesterdayStr()
  return from === y && to === y
}

function isCurrentMonth(from: string): boolean {
  const d = new Date()
  return from === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
