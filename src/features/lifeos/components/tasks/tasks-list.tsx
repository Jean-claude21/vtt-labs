// @ts-nocheck
/**
 * Tasks List Component
 * 
 * Displays a list of tasks with filtering and sorting options.
 * 
 * @module lifeos/components/tasks
 */
'use client';

import { useState, useMemo } from 'react';
import { Plus, Filter, Search, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskCard } from './task-card';
import type { Task, TaskStatus } from '../../schema/tasks.schema';
import type { Domain } from '../../schema/domains.schema';

interface Project {
  id: string;
  name: string;
  domain_id: string | null;
}

interface TasksListProps {
  tasks: Task[];
  domains: Domain[];
  projects?: Project[];
  onAdd?: () => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  isLoading?: boolean;
}

type FilterState = {
  search: string;
  domain_id: string | null;
  project_id: string | null;
  priority: string | null;
  status: TaskStatus | 'all' | 'active';
};

type ViewMode = 'list' | 'board';

export function TasksList({
  tasks,
  domains,
  projects = [],
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
  isLoading = false,
}: TasksListProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    domain_id: null,
    project_id: null,
    priority: null,
    status: 'active', // Default to active (not done/cancelled)
  });

  // Create domain and project lookup maps
  const domainMap = useMemo(() => 
    new Map(domains.map(d => [d.id, d])),
    [domains]
  );
  
  const projectMap = useMemo(() => 
    new Map(projects.map(p => [p.id, p])),
    [projects]
  );

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(search);
        const matchesDesc = task.description?.toLowerCase().includes(search);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Domain filter
      if (filters.domain_id && task.domain_id !== filters.domain_id) {
        return false;
      }

      // Project filter
      if (filters.project_id && task.project_id !== filters.project_id) {
        return false;
      }

      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // Status filter
      if (filters.status === 'active') {
        if (task.status === 'done' || task.status === 'cancelled') return false;
      } else if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [tasks, filters]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    return [...filteredTasks].sort((a, b) => {
      // First by status (active first)
      const statusOrder = { in_progress: 0, todo: 1, blocked: 2, done: 3, cancelled: 4 };
      const statusDiff = statusOrder[a.status as TaskStatus] - statusOrder[b.status as TaskStatus];
      if (statusDiff !== 0) return statusDiff;
      
      // Then by priority
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - 
                          priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by deadline (closer first, null last)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      
      // Finally by creation date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredTasks]);

  // Group tasks by status for board view
  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      blocked: [],
      done: [],
      cancelled: [],
    };
    
    for (const task of sortedTasks) {
      groups[task.status as TaskStatus].push(task);
    }
    
    return groups;
  }, [sortedTasks]);

  const hasActiveFilters = 
    filters.search || 
    filters.domain_id || 
    filters.project_id ||
    filters.priority || 
    (filters.status !== 'all' && filters.status !== 'active');

  const clearFilters = () => {
    setFilters({
      search: '',
      domain_id: null,
      project_id: null,
      priority: null,
      status: 'active',
    });
  };

  // Stats
  const stats = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
    const overdue = active.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date(new Date().setHours(0, 0, 0, 0));
    });
    const today = new Date();
    const dueToday = active.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date).toDateString() === today.toDateString();
    });
    
    return {
      total: active.length,
      overdue: overdue.length,
      dueToday: dueToday.length,
      inProgress: active.filter(t => t.status === 'in_progress').length,
    };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="h-32 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      {tasks.length > 0 && (
        <div className="flex flex-wrap gap-4 p-4 rounded-lg bg-muted/50">
          <div className="text-sm">
            <span className="font-medium">{stats.total}</span>
            <span className="text-muted-foreground ml-1">tâche{stats.total > 1 ? 's' : ''} active{stats.total > 1 ? 's' : ''}</span>
          </div>
          {stats.inProgress > 0 && (
            <div className="text-sm text-blue-500">
              <span className="font-medium">{stats.inProgress}</span>
              <span className="ml-1">en cours</span>
            </div>
          )}
          {stats.dueToday > 0 && (
            <div className="text-sm text-orange-500">
              <span className="font-medium">{stats.dueToday}</span>
              <span className="ml-1">pour aujourd&apos;hui</span>
            </div>
          )}
          {stats.overdue > 0 && (
            <div className="text-sm text-red-500">
              <span className="font-medium">{stats.overdue}</span>
              <span className="ml-1">en retard</span>
            </div>
          )}
        </div>
      )}

      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une tâche..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {/* View mode toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-9">
              <TabsTrigger value="list" className="px-2">
                <List className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="board" className="px-2">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
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
            Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-lg border bg-muted/50">
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters(f => ({ ...f, status: v as FilterState['status'] }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="todo">À faire</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="blocked">Bloquées</SelectItem>
              <SelectItem value="done">Terminées</SelectItem>
              <SelectItem value="cancelled">Annulées</SelectItem>
            </SelectContent>
          </Select>

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

          {projects.length > 0 && (
            <Select
              value={filters.project_id ?? 'all'}
              onValueChange={(v) => setFilters(f => ({ ...f, project_id: v === 'all' ? null : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    📁 {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="self-center">
              Effacer
            </Button>
          )}
        </div>
      )}

      {/* Results count */}
      {hasActiveFilters && filteredTasks.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''} trouvée{filteredTasks.length > 1 ? 's' : ''}
        </p>
      )}

      {/* Empty state */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-medium mb-1">
            Aucune tâche créée
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Créez vos premières tâches pour organiser votre travail et suivre votre progression.
          </p>
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Créer une tâche
          </Button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium mb-1">
            Aucun résultat
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Aucune tâche ne correspond à vos critères.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Effacer les filtres
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        /* List view */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              domain={task.domain_id ? domainMap.get(task.domain_id) : null}
              projectName={task.project_id ? projectMap.get(task.project_id)?.name : null}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      ) : (
        /* Board view */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {(['todo', 'in_progress', 'blocked', 'done'] as TaskStatus[]).map((status) => {
            const statusConfig: Record<string, { label: string; color: string }> = {
              todo: { label: 'À faire', color: 'border-gray-300' },
              in_progress: { label: 'En cours', color: 'border-blue-500' },
              blocked: { label: 'Bloqué', color: 'border-orange-500' },
              done: { label: 'Terminé', color: 'border-green-500' },
            };
            const config = statusConfig[status];
            const statusTasks = tasksByStatus[status];
            
            return (
              <div 
                key={status} 
                className={`flex-shrink-0 w-80 rounded-lg border-t-4 ${config.color} bg-muted/30 p-3`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{config.label}</h3>
                  <span className="text-sm text-muted-foreground">
                    {statusTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {statusTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      domain={task.domain_id ? domainMap.get(task.domain_id) : null}
                      projectName={task.project_id ? projectMap.get(task.project_id)?.name : null}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                    />
                  ))}
                  {statusTasks.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Aucune tâche
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


