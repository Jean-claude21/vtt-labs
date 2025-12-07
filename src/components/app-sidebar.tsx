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
  Image,
  HardDrive,
  CheckSquare,
  Palette,
  ChevronRight,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, profile, isAdmin } = useGlobal()
  const pathname = usePathname()

  const userData = {
    name: profile?.full_name || user?.email?.split('@')[0] || "User",
    email: user?.email || "",
    avatar: profile?.avatar_url || "",
  }

  // Check if we're in LifeOS section
  const isInLifeOS = pathname.startsWith('/app/lifeos')

  // LifeOS sub-navigation
  const lifeosItems = [
    { name: "Calendrier", url: "/app/lifeos", icon: CalendarDays },
    { name: "Tâches", url: "/app/lifeos/tasks", icon: ListTodo },
    { name: "Routines", url: "/app/lifeos/routines", icon: Repeat },
    { name: "Projets", url: "/app/lifeos/projects", icon: FolderKanban },
    { name: "Médias", url: "/app/lifeos/media", icon: Image },
    { name: "Statistiques", url: "/app/lifeos/stats", icon: BarChart3 },
  ]

  // Other modules
  const otherModules = [
    { name: "Storage", url: "/app/storage", icon: HardDrive },
    { name: "Todo List", url: "/app/table", icon: CheckSquare },
  ]

  // Configuration items
  const configItems = [
    { name: "Configuration LifeOS", url: "/app/lifeos/settings", icon: Palette },
    { name: "Paramètres compte", url: "/app/user-settings", icon: Settings },
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
                  <span className="truncate text-xs text-muted-foreground">Workspace</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/app'}>
                <Link href="/app">
                  <Home />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* LifeOS Section */}
        <SidebarGroup>
          <SidebarGroupLabel>LifeOS</SidebarGroupLabel>
          <SidebarMenu>
            <Collapsible defaultOpen={isInLifeOS} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={isInLifeOS}>
                    <CalendarDays />
                    <span>Planning</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {lifeosItems.map((item) => (
                      <SidebarMenuSubItem key={item.name}>
                        <SidebarMenuSubButton 
                          asChild 
                          isActive={
                            item.url === '/app/lifeos' 
                              ? pathname === '/app/lifeos'
                              : pathname.startsWith(item.url)
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
          </SidebarMenu>
        </SidebarGroup>

        {/* Other Modules */}
        <SidebarGroup>
          <SidebarGroupLabel>Autres Modules</SidebarGroupLabel>
          <SidebarMenu>
            {otherModules.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Configuration */}
        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarMenu>
            {configItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={pathname === item.url}>
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
