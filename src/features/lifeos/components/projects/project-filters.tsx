/**
 * Project Filters Component
 * 
 * Filter bar for projects list.
 * 
 * @module lifeos/components/projects
 */
'use client';

import * as React from 'react';
import { Search, Filter, X, CheckCircle2, Circle, Pause, Archive } from 'lucide-react';
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
import type { Domain } from '../../schema/domains.schema';
import type { ProjectStatus } from '../../schema/projects.schema';

export interface ProjectFiltersState {
  search: string;
  domain_id?: string;
  statuses: ProjectStatus[];
  dateFilter?: 'all' | 'overdue' | 'this_week' | 'this_month';
}

interface ProjectFiltersProps {
  domains: Domain[];
  value: ProjectFiltersState;
  onChange: (filters: ProjectFiltersState) => void;
  className?: string;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'active', label: 'Actif', icon: Circle, color: 'bg-green-500' },
  { value: 'paused', label: 'En pause', icon: Pause, color: 'bg-yellow-500' },
  { value: 'completed', label: 'Terminé', icon: CheckCircle2, color: 'bg-blue-500' },
  { value: 'archived', label: 'Archivé', icon: Archive, color: 'bg-gray-500' },
];

const DATE_OPTIONS = [
  { value: 'all', label: 'Toutes les dates' },
  { value: 'overdue', label: 'En retard' },
  { value: 'this_week', label: 'Cette semaine' },
  { value: 'this_month', label: 'Ce mois' },
];

export function ProjectFilters({
  domains,
  value,
  onChange,
  className,
}: Readonly<ProjectFiltersProps>) {
  const [statusPopoverOpen, setStatusPopoverOpen] = React.useState(false);

  const handleSearchChange = (search: string) => {
    onChange({ ...value, search });
  };

  const handleDomainChange = (domain_id: string) => {
    onChange({ 
      ...value, 
      domain_id: domain_id === '_all' ? undefined : domain_id 
    });
  };

  const handleStatusToggle = (status: ProjectStatus) => {
    const newStatuses = value.statuses.includes(status)
      ? value.statuses.filter(s => s !== status)
      : [...value.statuses, status];
    onChange({ ...value, statuses: newStatuses });
  };

  const handleDateFilterChange = (dateFilter: string) => {
    onChange({ 
      ...value, 
      dateFilter: dateFilter === 'all' ? undefined : dateFilter as ProjectFiltersState['dateFilter']
    });
  };

  const handleClearFilters = () => {
    onChange({
      search: '',
      domain_id: undefined,
      statuses: ['active', 'paused'],
      dateFilter: undefined,
    });
  };

  const activeFiltersCount = [
    value.domain_id,
    value.statuses.length !== 2, // Different from default
    value.dateFilter && value.dateFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet..."
            value={value.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
          {value.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => handleSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Domain filter */}
        <Select value={value.domain_id || '_all'} onValueChange={handleDomainChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les domaines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tous les domaines</SelectItem>
            {domains.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                <span className="flex items-center gap-2">
                  <span>{domain.icon}</span>
                  <span>{domain.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[130px] justify-start">
              <Filter className="mr-2 h-4 w-4" />
              Statut
              {value.statuses.length > 0 && value.statuses.length !== 4 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {value.statuses.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-3">
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isChecked = value.statuses.includes(option.value);
                
                return (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={() => handleStatusToggle(option.value)}
                    />
                    <Label
                      htmlFor={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className={cn('w-2 h-2 rounded-full', option.color)} />
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date filter */}
        <Select value={value.dateFilter || 'all'} onValueChange={handleDateFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Toutes les dates" />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Effacer ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active filters badges */}
      {(value.domain_id || value.dateFilter) && (
        <div className="flex flex-wrap gap-2">
          {value.domain_id && (
            <Badge variant="secondary" className="gap-1">
              {domains.find(d => d.id === value.domain_id)?.icon}
              {domains.find(d => d.id === value.domain_id)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => onChange({ ...value, domain_id: undefined })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {value.dateFilter && value.dateFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {DATE_OPTIONS.find(d => d.value === value.dateFilter)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => onChange({ ...value, dateFilter: undefined })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Default filter state
 */
export function getDefaultProjectFilters(): ProjectFiltersState {
  return {
    search: '',
    domain_id: undefined,
    statuses: ['active', 'paused'],
    dateFilter: undefined,
  };
}

/**
 * Apply filters to projects client-side
 */
export function applyProjectFilters<T extends {
  name: string;
  domain_id: string | null;
  status: ProjectStatus;
  target_date: string | null;
}>(
  projects: T[],
  filters: ProjectFiltersState
): T[] {
  let result = [...projects];

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(searchLower));
  }

  // Domain filter
  if (filters.domain_id) {
    result = result.filter(p => p.domain_id === filters.domain_id);
  }

  // Status filter
  if (filters.statuses.length > 0) {
    result = result.filter(p => filters.statuses.includes(p.status));
  }

  // Date filter
  if (filters.dateFilter && filters.dateFilter !== 'all') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    result = result.filter(p => {
      if (!p.target_date) return false;
      const targetDate = new Date(p.target_date);
      
      switch (filters.dateFilter) {
        case 'overdue':
          return targetDate < today;
        case 'this_week':
          return targetDate >= today && targetDate <= endOfWeek;
        case 'this_month':
          return targetDate >= today && targetDate <= endOfMonth;
        default:
          return true;
      }
    });
  }

  return result;
}
