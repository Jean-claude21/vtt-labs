"use client"

import * as React from "react"
import {
  Database,
  Home,
  Settings2,
  SquareTerminal,
  Table,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useGlobal } from "@/lib/context/GlobalContext"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, profile } = useGlobal()

  const userData = {
    name: profile?.full_name || user?.email || "User",
    email: user?.email || "",
    avatar: profile?.avatar_url || "",
  }

  const teams = [
    {
      name: "VTT Labs",
      logo: SquareTerminal,
      plan: "Pro",
    },
  ]

  const navItems = [
    {
      name: "Homepage",
      url: "/app",
      icon: Home,
    },
    {
      name: "Example Storage",
      url: "/app/storage",
      icon: Database,
    },
    {
      name: "Table",
      url: "/app/table",
      icon: Table,
    },
  ]

  const navSettings = [
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "User Settings",
          url: "/app/user-settings",
        },
      ],
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={navItems} title="Application" />
        <NavMain items={navSettings} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
