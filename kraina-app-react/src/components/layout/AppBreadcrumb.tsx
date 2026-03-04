'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const labelMap: Record<string, string> = {
  app: 'Panel',
  calendar: 'Terminarz',
  attractions: 'Atrakcje',
  rentals: 'Rezerwacje',
  statistics: 'Statystyki',
  revenue: 'Przychody',
  performance: 'Performance',
  costs: 'Analiza kosztów',
  employees: 'Pracownicy',
  users: 'Użytkownicy',
  settings: 'Ustawienia',
  profile: 'Profil',
  new: 'Nowa',
}

function toLabel(segment: string) {
  return labelMap[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function AppBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`
          const isLast = index === segments.length - 1

          return (
            <Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{toLabel(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{toLabel(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}