/**
 * Task Filters Toolbar Component
 * 
 * Compact filter bar for task lists within projects.
 * 
 * @module lifeos/components/tasks
 */
'use client';

import * as React from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { TaskStatus, TaskPriority } from '../../schema/tasks.schema';

export interface TaskFiltersState {
  search: string;
  statuses: TaskStatus[];
  priority?: TaskPriority;
  hasDueDate?: boolean;
  hasSubtasks?: boolean;
}

interface TaskFiltersToolbarProps {
  value: TaskFiltersState;
  onChange: (filters: TaskFiltersState) => void;
  totalCount: number;
  filteredCount: number;
  className?: string;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'backlog', label: 'Backlog', color: 'bg-gray-500' },
  { value: 'todo', label: 'À faire', color: 'bg-blue-500' },
  { value: 'in_progress', label: 'En cours', color: 'bg-yellow-500' },
  { value: 'blocked', label: 'Bloqué', color: 'bg-red-500' },
  { value: 'done', label: 'Terminé', color: 'bg-green-500' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'high', label: 'Haute', color: 'bg-red-500' },
  { value: 'medium', label: 'Moyenne', color: 'bg-yellow-500' },
  { value: 'low', label: 'Basse', color: 'bg-green-500' },
];

export function TaskFiltersToolbar({
  value,
  onChange,
  totalCount,
  filteredCount,
  className,
}: Readonly<TaskFiltersToolbarProps>) {
  const [moreFiltersOpen, setMoreFiltersOpen] = React.useState(false);

  const handleSearchChange = (search: string) => {
    onChange({ ...value, search });
  };

  const handleStatusToggle = (status: TaskStatus) => {
    const newStatuses = value.statuses.includes(status)
      ? value.statuses.filter(s => s !== status)
      : [...value.statuses, status];
    onChange({ ...value, statuses: newStatuses });
  };

  const handlePriorityChange = (priority: string) => {
    onChange({ 
      ...value, 
      priority: priority === '_all' ? undefined : priority as TaskPriority 
    });
  };

  const handleClearFilters = () => {
    onChange(getDefaultTaskFilters());
  };

  const hasActiveFilters = 
    value.search ||
    value.statuses.length !== 5 ||
    value.priority ||
    value.hasDueDate !== undefined ||
    value.hasSubtasks !== undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[150px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={value.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Quick status toggles */}
        <div className="flex items-center gap-1">
          {STATUS_OPTIONS.slice(0, 4).map((option) => {
            const isActive = value.statuses.includes(option.value);
            return (
              <Button
                key={option.value}
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => handleStatusToggle(option.value)}
              >
                <span className={cn('w-2 h-2 rounded-full mr-1', option.color)} />
                {option.label}
              </Button>
            );
          })}
        </div>

        {/* Priority filter */}
        <Select value={value.priority || '_all'} onValueChange={handlePriorityChange}>
          <SelectTrigger className="w-[120px] h-8 text-sm">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Toutes</SelectItem>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', option.color)} />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* More filters */}
        <Popover open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              Plus
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-3">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasDueDate"
                  checked={value.hasDueDate === true}
                  onCheckedChange={(checked) => 
                    onChange({ 
                      ...value, 
                      hasDueDate: checked ? true : undefined 
                    })
                  }
                />
                <Label htmlFor="hasDueDate" className="text-sm cursor-pointer">
                  Avec échéance
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasSubtasks"
                  checked={value.hasSubtasks === true}
                  onCheckedChange={(checked) => 
                    onChange({ 
                      ...value, 
                      hasSubtasks: checked ? true : undefined 
                    })
                  }
                />
                <Label htmlFor="hasSubtasks" className="text-sm cursor-pointer">
                  Avec sous-tâches
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="statusDone"
                  checked={value.statuses.includes('done')}
                  onCheckedChange={() => handleStatusToggle('done')}
                />
                <Label htmlFor="statusDone" className="text-sm cursor-pointer">
                  Afficher terminées
                </Label>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Effacer
          </Button>
        )}

        {/* Count indicator */}
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredCount === totalCount ? (
            `${totalCount} tâche${totalCount > 1 ? 's' : ''}`
          ) : (
            `${filteredCount}/${totalCount} tâches`
          )}
        </span>
      </div>
    </div>
  );
}

/**
 * Default filter state
 */
export function getDefaultTaskFilters(): TaskFiltersState {
  return {
    search: '',
    statuses: ['backlog', 'todo', 'in_progress', 'blocked', 'done'],
    priority: undefined,
    hasDueDate: undefined,
    hasSubtasks: undefined,
  };
}

/**
 * Apply filters to tasks client-side
 */
export function applyTaskFilters(
  tasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    parent_task_id: string | null;
  }>,
  filters: TaskFiltersState,
  subtaskCounts?: Map<string, number>
): typeof tasks {
  let result = [...tasks];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(t => t.title.toLowerCase().includes(searchLower));
  }

  // Status filter
  if (filters.statuses.length > 0 && filters.statuses.length < 5) {
    result = result.filter(t => filters.statuses.includes(t.status));
  }

  // Priority filter
  if (filters.priority) {
    result = result.filter(t => t.priority === filters.priority);
  }

  // Has due date filter
  if (filters.hasDueDate !== undefined) {
    result = result.filter(t => filters.hasDueDate ? !!t.due_date : !t.due_date);
  }

  // Has subtasks filter
  if (filters.hasSubtasks !== undefined && subtaskCounts) {
    result = result.filter(t => {
      const count = subtaskCounts.get(t.id) || 0;
      return filters.hasSubtasks ? count > 0 : count === 0;
    });
  }

  // Only show main tasks (not subtasks) unless explicitly searching
  if (!filters.search) {
    result = result.filter(t => !t.parent_task_id);
  }

  return result;
}
