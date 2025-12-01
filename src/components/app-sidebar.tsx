"use client"

import * as React from "react"
import {
  CalendarDays,
  Home,
  Settings,
  Shield,
} from "lucide-react"

import { NavProjects } from "@/components/nav-projects"
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
} from "@/components/ui/sidebar"
import { useGlobal } from "@/lib/context/GlobalContext"
import Link from "next/link"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, profile, isAdmin } = useGlobal()

  const userData = {
    name: profile?.full_name || user?.email?.split('@')[0] || "User",
    email: user?.email || "",
    avatar: profile?.avatar_url || "",
  }

  const navItems = [
    {
      name: "Dashboard",
      url: "/app",
      icon: Home,
    },
    {
      name: "LifeOS",
      url: "/app/lifeos",
      icon: CalendarDays,
    },
    {
      name: "Settings",
      url: "/app/user-settings",
      icon: Settings,
    },
  ]

  // Add admin link if user is admin
  if (isAdmin) {
    navItems.push({
      name: "Admin",
      url: "/app/admin",
      icon: Shield,
    })
  }

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
        <NavProjects projects={navItems} title="Navigation" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
