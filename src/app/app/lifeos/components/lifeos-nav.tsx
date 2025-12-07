/**
 * LifeOS Sub-Navigation Component
 * 
 * Internal navigation for LifeOS module sections.
 * Calendar-centric approach with supporting sections.
 * 
 * @module app/lifeos/components
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Calendar,
  ListTodo,
  Repeat,
  FolderKanban,
  Image,
  Settings2,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  description?: string;
}

const navItems: NavItem[] = [
  {
    name: 'Calendrier',
    href: '/app/lifeos',
    icon: Calendar,
    description: 'Vue calendrier centralisée',
  },
  {
    name: 'Tâches',
    href: '/app/lifeos/tasks',
    icon: ListTodo,
    description: 'Gérer vos tâches',
  },
  {
    name: 'Routines',
    href: '/app/lifeos/routines',
    icon: Repeat,
    description: 'Templates de routines récurrentes',
  },
  {
    name: 'Projets',
    href: '/app/lifeos/projects',
    icon: FolderKanban,
    description: 'Projets avec vue Gantt',
  },
  {
    name: 'Médias',
    href: '/app/lifeos/media',
    icon: Image,
    description: 'Photos de suivi (avant/après)',
  },
  {
    name: 'Configuration',
    href: '/app/lifeos/settings',
    icon: Settings2,
    description: 'Domaines et préférences',
  },
];

// Shared function to check if nav item is active
function checkIsActive(pathname: string, href: string) {
  if (href === '/app/lifeos') {
    // Exact match for calendar (main page)
    return pathname === '/app/lifeos';
  }
  return pathname.startsWith(href);
}

export function LifeOSNav() {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <nav className="flex items-center gap-1 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2">
        {/* Logo/Module indicator */}
        <div className="flex items-center gap-2 mr-4 pr-4 border-r">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm hidden sm:inline">LifeOS</span>
        </div>

        {/* Navigation items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = checkIsActive(pathname, item.href);

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Button
                    variant={active ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'gap-2',
                      active && 'bg-primary/10 text-primary'
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4" />
                      <span className="hidden md:inline">{item.name}</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="md:hidden">
                  <p>{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </nav>
    </TooltipProvider>
  );
}

/**
 * Compact navigation for mobile
 */
export function LifeOSNavCompact() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 py-1 sm:hidden">
      <div className="flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = checkIsActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors',
                active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
