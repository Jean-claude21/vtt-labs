/**
 * LifeOS Empty State Components
 * 
 * Reusable empty state components with consistent styling.
 * 
 * @module lifeos/components/ui/empty-states
 */
'use client';

import { Button } from '@/components/ui/button';
import { 
  CalendarDays, 
  CheckCircle2, 
  Target, 
  FolderOpen,
  BarChart3,
  Plus,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

/**
 * Generic empty state component
 */
export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <Button asChild>
            <Link href={action.href}>
              <Plus className="h-4 w-4 mr-2" />
              {action.label}
            </Link>
          </Button>
        ) : (
          <Button onClick={action.onClick}>
            <Plus className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}

/**
 * Empty state for no tasks
 */
export function NoTasksState({ onCreateTask }: { onCreateTask?: () => void }) {
  return (
    <EmptyState
      icon={CheckCircle2}
      title="Aucune tâche"
      description="Vous n'avez pas encore de tâches. Créez votre première tâche pour commencer à organiser votre travail."
      action={
        onCreateTask 
          ? { label: 'Créer une tâche', onClick: onCreateTask }
          : { label: 'Créer une tâche', href: '/app/planning/tasks/new' }
      }
    />
  );
}

/**
 * Empty state for no routines
 */
export function NoRoutinesState({ onCreateRoutine }: { onCreateRoutine?: () => void }) {
  return (
    <EmptyState
      icon={Target}
      title="Aucune routine"
      description="Les routines vous aident à maintenir des habitudes régulières. Créez votre première routine pour construire des habitudes durables."
      action={
        onCreateRoutine
          ? { label: 'Créer une routine', onClick: onCreateRoutine }
          : { label: 'Créer une routine', href: '/app/planning/routines/new' }
      }
    />
  );
}

/**
 * Empty state for no domains
 */
export function NoDomainsState({ onCreateDomain }: { onCreateDomain?: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Aucun domaine"
      description="Les domaines vous permettent d'organiser vos tâches et routines par catégorie. Créez votre premier domaine pour mieux structurer votre vie."
      action={
        onCreateDomain
          ? { label: 'Créer un domaine', onClick: onCreateDomain }
          : { label: 'Créer un domaine', href: '/app/planning/settings' }
      }
    />
  );
}

/**
 * Empty state for no calendar events
 */
export function NoEventsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <CalendarDays className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Aucun événement</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-4">
        Aucun événement prévu pour cette période. Vos routines et tâches planifiées apparaîtront ici.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/app/planning/tasks">
            Voir les tâches
          </Link>
        </Button>
        <Button asChild>
          <Link href="/app/planning/routines">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle routine
          </Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * Empty state for no stats data
 */
export function NoStatsState() {
  return (
    <EmptyState
      icon={BarChart3}
      title="Pas encore de statistiques"
      description="Complétez des tâches et routines pour commencer à voir vos statistiques de productivité."
      action={{ label: 'Aller au calendrier', href: '/app/planning' }}
    />
  );
}

/**
 * Empty state for no search results
 */
export function NoSearchResultsState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
      <p className="text-muted-foreground text-sm max-w-sm">
        Aucun élément ne correspond à &quot;{query}&quot;. Essayez avec d&apos;autres termes de recherche.
      </p>
    </div>
  );
}

/**
 * Empty state for completed tasks view
 */
export function AllTasksCompletedState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4">
        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">🎉 Tout est fait !</h3>
      <p className="text-muted-foreground text-sm max-w-sm">
        Félicitations ! Vous avez terminé toutes vos tâches. Profitez de votre temps libre ou planifiez de nouveaux objectifs.
      </p>
    </div>
  );
}

/**
 * Empty state for filtered view with no results
 */
export function NoFilteredResultsState({ 
  entityType,
  onClearFilters 
}: { 
  entityType: 'tâches' | 'routines' | 'domaines' | 'événements';
  onClearFilters?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FolderOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-4">
        Aucun(e) {entityType} ne correspond aux filtres sélectionnés.
      </p>
      {onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Effacer les filtres
        </Button>
      )}
    </div>
  );
}
