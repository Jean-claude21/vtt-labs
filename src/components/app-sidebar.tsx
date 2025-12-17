"use client"

import * as React from "react"
import {
  CalendarDays,
  Home,
  Settings,
  Shield,
  ListTodo,
  Repeat,
  FolderKanban,
  BarChart3,
  Palette,
  ChevronRight,
  Target,
  Lock,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { useGlobal } from "@/lib/context/GlobalContext"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, profile, isAdmin } = useGlobal()
  const pathname = usePathname()

  const userData = {
    name: profile?.full_name || user?.email?.split('@')[0] || "User",
    email: user?.email || "",
    avatar: profile?.avatar_url || "",
  }

  // Check if we're in Planning section (supports both old /lifeos and new /planning)
  const isInPlanning = pathname.startsWith('/app/planning') || pathname.startsWith('/app/lifeos')
  
  // Check if we're in OKR section (future)
  const isInOKR = pathname.startsWith('/app/okr')

  // Planning sub-navigation
  const planningItems = [
    { name: "Calendrier", url: "/app/planning", icon: CalendarDays },
    { name: "Tâches", url: "/app/planning/tasks", icon: ListTodo },
    { name: "Routines", url: "/app/planning/routines", icon: Repeat },
    { name: "Projets", url: "/app/planning/projects", icon: FolderKanban },
    { name: "Statistiques", url: "/app/planning/stats", icon: BarChart3 },
  ]

  // OKR sub-navigation (future - disabled)
  const okrItems = [
    { name: "Vue globale", url: "/app/okr", icon: Target },
    { name: "Check-ins", url: "/app/okr/check-ins", icon: ListTodo },
  ]

  // System/Configuration items
  const systemItems = [
    { name: "Domaines de vie", url: "/app/settings/domains", icon: Palette },
    { name: "Paramètres", url: "/app/user-settings", icon: Settings },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/app">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-red-500 text-white font-bold">
                  V
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">VTT Labs</span>
                  <span className="truncate text-xs text-muted-foreground">LifeOS</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Accueil */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/app'}>
                <Link href="/app">
                  <Home />
                  <span>Accueil</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Modules Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarMenu>
            {/* Planning Module */}
            <Collapsible defaultOpen={isInPlanning} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={isInPlanning}>
                    <CalendarDays />
                    <span>Planning</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {planningItems.map((item) => (
                      <SidebarMenuSubItem key={item.name}>
                        <SidebarMenuSubButton 
                          asChild 
                          isActive={
                            item.url === '/app/planning' 
                              ? pathname === '/app/planning' || pathname === '/app/lifeos'
                              : pathname.startsWith(item.url) || pathname.startsWith(item.url.replace('/planning', '/lifeos'))
                          }
                        >
                          <Link href={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            {/* OKR Module - Coming Soon */}
            <Collapsible defaultOpen={isInOKR} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    isActive={isInOKR} 
                    className="opacity-60 cursor-not-allowed"
                    disabled
                  >
                    <Target />
                    <span>OKR</span>
                    <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                      Bientôt
                    </Badge>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {okrItems.map((item) => (
                      <SidebarMenuSubItem key={item.name}>
                        <SidebarMenuSubButton 
                          className="opacity-50 cursor-not-allowed"
                        >
                          <Lock className="h-3 w-3" />
                          <span>{item.name}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>

        {/* System Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Système</SidebarGroupLabel>
          <SidebarMenu>
            {systemItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={pathname === item.url || pathname.startsWith(item.url)}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Admin (if admin) */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/app/admin')}>
                  <Link href="/app/admin">
                    <Shield />
                    <span>Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
