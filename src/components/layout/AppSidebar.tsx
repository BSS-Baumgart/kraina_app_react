"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Zap,
  ClipboardList,
  BarChart3,
  Users,
  UserCheck,
  Settings,
  User,
  ChevronDown,
  LogOut,
} from "lucide-react"
import { useAuthStore } from "@/store/auth.store"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  key: string
  requiredRole?: 'admin' | 'owner'
  children?: NavItem[]
}

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/app/dashboard',
      icon: <LayoutDashboard className="h-6 w-6" />,
      key: 'dashboard',
    },
    {
      label: 'Terminarz',
      href: '/app/calendar',
      icon: <Calendar className="h-6 w-6" />,
      key: 'calendar',
    },
    {
      label: 'Atrakcje',
      href: '/app/attractions',
      icon: <Zap className="h-6 w-6" />,
      key: 'attractions',
    },
    {
      label: 'Rezerwacje',
      href: '/app/rentals',
      icon: <ClipboardList className="h-6 w-6" />,
      key: 'rentals',
    },
    {
      label: 'Statystyki',
      href: '/app/statistics',
      icon: <BarChart3 className="h-6 w-6" />,
      key: 'statistics',
      children: [
        {
          label: 'Przegląd',
          href: '/app/statistics',
          icon: null,
          key: 'stats-overview',
        },
        {
          label: 'Przychody',
          href: '/app/statistics/revenue',
          icon: null,
          key: 'stats-revenue',
          requiredRole: 'admin',
        },
        {
          label: 'Wypłaty',
          href: '/app/statistics/payroll',
          icon: null,
          key: 'stats-payroll',
        },
        {
          label: 'Analityka',
          href: '/app/statistics/analytics',
          icon: null,
          key: 'stats-analytics',
        },
        {
          label: 'Koszty',
          href: '/app/statistics/costs',
          icon: null,
          key: 'stats-costs',
          requiredRole: 'admin',
        },
      ],
    },
    {
      label: 'Klienci',
      href: '/app/clients',
      icon: <UserCheck className="h-6 w-6" />,
      key: 'clients',
    },
    ...(user?.role === 'owner'
      ? [
          {
            label: 'Użytkownicy',
            href: '/app/users',
            icon: <Users className="h-6 w-6" />,
            key: 'users',
          },
        ]
      : []),
    {
      label: 'Ustawienia',
      href: '/app/settings',
      icon: <Settings className="h-6 w-6" />,
      key: 'settings',
    },
    {
      label: 'Profil',
      href: '/app/profile',
      icon: <User className="h-6 w-6" />,
      key: 'profile',
    },
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const isItemActive = (item: NavItem) => {
    if (pathname === item.href) {
      return true
    }
    if (item.children) {
      return item.children.some(child => pathname === child.href)
    }
    return false
  }

  const isChildActive = (href: string) => {
    return pathname === href
  }

  const getDefaultOpen = (item: NavItem) => {
    if (item.children) {
      return item.children.some(child => pathname === child.href)
    }
    return false
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'owner': return 'Właściciel'
      case 'admin': return 'Administrator'
      case 'employee': return 'Pracownik'
      default: return 'Pracownik'
    }
  }

  const getUserInitials = () => {
    if (user?.initials) return user.initials
    if (user?.firstName && user?.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase()
    }
    if (!user?.email) return 'U'
    return user.email.substring(0, 2).toUpperCase()
  }

  const getUserDisplayName = () => {
    if (user?.fullName) return user.fullName
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`
    return user?.email?.split('@')[0] || 'Użytkownik'
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-6 w-6" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-base font-bold">Kraina App</span>
                <span className="text-sm text-muted-foreground">CRM System</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0
                const isActive = isItemActive(item)

                if (hasChildren) {
                  return (
                    <Collapsible
                      key={item.key}
                      defaultOpen={getDefaultOpen(item)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.label}
                            isActive={isActive}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children
                              ?.filter(child => 
                                !child.requiredRole || 
                                child.requiredRole === user?.role ||
                                (child.requiredRole === 'admin' && user?.role === 'owner')
                              )
                              .map((child) => (
                                <SidebarMenuSubItem key={child.key}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isChildActive(child.href)}
                                  >
                                    <a href={child.href}>
                                      <span>{child.label}</span>
                                    </a>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      isActive={isActive}
                    >
                      <a href={item.href}>
                        {item.icon}
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-16"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight ml-1">
                    <span className="truncate text-base font-bold">
                      {getUserDisplayName()}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {getRoleLabel(user?.role)}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto h-5 w-5 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                align="start"
                side="top"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => router.push('/app/profile')} className="py-2.5 text-base">
                  <User className="mr-3 h-5 w-5" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/app/settings')} className="py-2.5 text-base">
                  <Settings className="mr-3 h-5 w-5" />
                  <span>Ustawienia</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="py-2.5 text-base">
                  <LogOut className="mr-3 h-5 w-5" />
                  <span>Wyloguj</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
