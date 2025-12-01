/**
 * Routines List Component
 * 
 * Displays a list of routine templates with filtering options.
 * 
 * @module lifeos/components/routines
 */
'use client';

import { useState, useMemo } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RoutineCard } from './routine-card';
import type { RoutineTemplate } from '../../schema/routines.schema';
import type { Domain } from '../../schema/domains.schema';

interface RoutinesListProps {
  routines: (RoutineTemplate & { 
    streak?: { current_streak: number; longest_streak: number } | null 
  })[];
  domains: Domain[];
  onAdd?: () => void;
  onEdit?: (routine: RoutineTemplate) => void;
  onDelete?: (routineId: string) => void;
  onToggleActive?: (routineId: string) => void;
  isLoading?: boolean;
}

type FilterState = {
  search: string;
  domain_id: string | null;
  priority: string | null;
  status: 'all' | 'active' | 'paused';
  category_moment: string | null;
};

export function RoutinesList({
  routines,
  domains,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  isLoading = false,
}: RoutinesListProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    domain_id: null,
    priority: null,
    status: 'all',
    category_moment: null,
  });

  // Create domain lookup map
  const domainMap = useMemo(() => 
    new Map(domains.map(d => [d.id, d])),
    [domains]
  );

  // Filter routines
  const filteredRoutines = useMemo(() => {
    return routines.filter((routine) => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesName = routine.name.toLowerCase().includes(search);
        const matchesDesc = routine.description?.toLowerCase().includes(search);
        if (!matchesName && !matchesDesc) return false;
      }

      // Domain filter
      if (filters.domain_id && routine.domain_id !== filters.domain_id) {
        return false;
      }

      // Priority filter
      if (filters.priority && routine.priority !== filters.priority) {
        return false;
      }

      // Status filter
      if (filters.status === 'active' && !routine.is_active) return false;
      if (filters.status === 'paused' && routine.is_active) return false;

      // Category moment filter
      if (filters.category_moment && routine.category_moment !== filters.category_moment) {
        return false;
      }

      return true;
    });
  }, [routines, filters]);

  // Group by domain
  const groupedRoutines = useMemo(() => {
    const groups = new Map<string | null, typeof filteredRoutines>();
    
    for (const routine of filteredRoutines) {
      const key = routine.domain_id;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(routine);
    }
    
    // Sort groups: domains by sort_order, then null (uncategorized) at end
    const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === null) return 1;
      if (b === null) return -1;
      const domainA = domainMap.get(a);
      const domainB = domainMap.get(b);
      return (domainA?.sort_order ?? 999) - (domainB?.sort_order ?? 999);
    });
    
    return sortedGroups;
  }, [filteredRoutines, domainMap]);

  const hasActiveFilters = 
    filters.search || 
    filters.domain_id || 
    filters.priority || 
    filters.status !== 'all' ||
    filters.category_moment;

  const clearFilters = () => {
    setFilters({
      search: '',
      domain_id: null,
      priority: null,
      status: 'all',
      category_moment: null,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="h-40 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une routine..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle routine
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg border bg-muted/50">
          <Select
            value={filters.domain_id ?? 'all'}
            onValueChange={(v) => setFilters(f => ({ ...f, domain_id: v === 'all' ? null : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Domaine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les domaines</SelectItem>
              {domains.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  {domain.icon} {domain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority ?? 'all'}
            onValueChange={(v) => setFilters(f => ({ ...f, priority: v === 'all' ? null : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              <SelectItem value="critical">🔴 Critique</SelectItem>
              <SelectItem value="high">🟠 Haute</SelectItem>
              <SelectItem value="medium">🔵 Moyenne</SelectItem>
              <SelectItem value="low">⚪ Basse</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(v) => setFilters(f => ({ ...f, status: v as FilterState['status'] }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="paused">En pause</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.category_moment ?? 'all'}
            onValueChange={(v) => setFilters(f => ({ ...f, category_moment: v === 'all' ? null : v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Moment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous moments</SelectItem>
              <SelectItem value="morning">🌅 Matin</SelectItem>
              <SelectItem value="midday">☀️ Midi</SelectItem>
              <SelectItem value="evening">🌆 Soir</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <div className="col-span-2 sm:col-span-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      {hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          {filteredRoutines.length} routine{filteredRoutines.length !== 1 ? 's' : ''} trouvée{filteredRoutines.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Empty state */}
      {routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">🔄</div>
          <h3 className="text-lg font-medium mb-1">
            Aucune routine créée
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Créez vos premières routines pour organiser vos habitudes et les inclure 
            dans votre planning quotidien.
          </p>
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Créer une routine
          </Button>
        </div>
      ) : filteredRoutines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium mb-1">
            Aucun résultat
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Aucune routine ne correspond à vos critères de recherche.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Effacer les filtres
          </Button>
        </div>
      ) : (
        /* Grouped list */
        <div className="space-y-6">
          {groupedRoutines.map(([domainId, domainRoutines]) => {
            const domain = domainId ? domainMap.get(domainId) : null;
            
            return (
              <div key={domainId ?? 'uncategorized'}>
                {/* Domain header */}
                <div className="flex items-center gap-2 mb-3">
                  {domain ? (
                    <>
                      <span className="text-lg">{domain.icon}</span>
                      <h3 
                        className="font-medium"
                        style={{ color: domain.color }}
                      >
                        {domain.name}
                      </h3>
                    </>
                  ) : (
                    <h3 className="font-medium text-muted-foreground">
                      Sans domaine
                    </h3>
                  )}
                  <span className="text-xs text-muted-foreground">
                    ({domainRoutines.length})
                  </span>
                </div>
                
                {/* Routines grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {domainRoutines.map((routine) => (
                    <RoutineCard
                      key={routine.id}
                      routine={routine}
                      domain={domain}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleActive={onToggleActive}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

