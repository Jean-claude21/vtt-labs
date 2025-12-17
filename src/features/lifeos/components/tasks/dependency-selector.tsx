/**
 * Dependency Selector Component
 * 
 * Allows selecting task dependencies (predecessors) for a task.
 * 
 * @module lifeos/components/tasks
 */
'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Link2, Link2Off, Loader2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  getTaskDependencies, 
  createTaskDependency, 
  deleteTaskDependency 
} from '../../actions/projects.actions';
import type { Task } from '../../schema/tasks.schema';
import type { TaskDependency } from '../../schema/projects.schema';

interface DependencySelectorProps {
  taskId: string;
  availableTasks: Task[];
  onUpdate?: () => void;
  className?: string;
}

export function DependencySelector({
  taskId,
  availableTasks,
  onUpdate,
  className,
}: Readonly<DependencySelectorProps>) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [predecessors, setPredecessors] = React.useState<TaskDependency[]>([]);
  const [successors, setSuccessors] = React.useState<TaskDependency[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  // Load dependencies
  React.useEffect(() => {
    loadDependencies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const loadDependencies = async () => {
    setIsLoading(true);
    try {
      const result = await getTaskDependencies(taskId);
      if (result.data) {
        setPredecessors(result.data.predecessors);
        setSuccessors(result.data.successors);
      }
    } catch {
      toast.error('Erreur lors du chargement des dépendances');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out already selected predecessors and the current task
  const selectableTasks = availableTasks.filter(t => 
    t.id !== taskId && 
    !predecessors.some(p => p.predecessor_task_id === t.id)
  );

  // Check if adding a dependency would create a cycle
  const wouldCreateCycle = (predecessorId: string): boolean => {
    // Simple check: if the predecessor has this task as a predecessor, it would create a cycle
    // A more robust implementation would do a full graph traversal
    return successors.some(s => s.successor_task_id === predecessorId);
  };

  const handleAddDependency = async (predecessorId: string) => {
    // Check for cycle
    if (wouldCreateCycle(predecessorId)) {
      toast.error('Cette dépendance créerait un cycle', {
        description: 'Une tâche ne peut pas dépendre d\'elle-même directement ou indirectement.',
      });
      return;
    }

    setIsAdding(true);
    try {
      const result = await createTaskDependency({
        predecessor_task_id: predecessorId,
        successor_task_id: taskId,
      });

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      if (result.data) {
        setPredecessors(prev => [...prev, result.data!]);
        toast.success('Dépendance ajoutée');
        onUpdate?.();
      }
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setIsAdding(false);
      setOpen(false);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    setRemovingId(dependencyId);
    try {
      const result = await deleteTaskDependency(dependencyId);

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      setPredecessors(prev => prev.filter(p => p.id !== dependencyId));
      toast.success('Dépendance supprimée');
      onUpdate?.();
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setRemovingId(null);
    }
  };

  // Get task title by ID
  const getTaskTitle = (id: string) => {
    return availableTasks.find(t => t.id === id)?.title || 'Tâche inconnue';
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Chargement des dépendances...</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Current dependencies */}
      {predecessors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link2 className="h-4 w-4" />
            <span>Bloquée par :</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {predecessors.map((dep) => {
              const predecessorTask = availableTasks.find(t => t.id === dep.predecessor_task_id);
              const isBlocking = predecessorTask?.status !== 'done';
              
              return (
                <Badge
                  key={dep.id}
                  variant="outline"
                  className={cn(
                    'flex items-center gap-1 pr-1',
                    isBlocking && 'border-orange-500 text-orange-500'
                  )}
                >
                  {isBlocking && <AlertTriangle className="h-3 w-3" />}
                  <span className="truncate max-w-[150px]">
                    {getTaskTitle(dep.predecessor_task_id)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveDependency(dep.id)}
                    disabled={removingId === dep.id}
                  >
                    {removingId === dep.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Successors (tasks that depend on this one) */}
      {successors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link2Off className="h-4 w-4" />
            <span>Bloque :</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {successors.map((dep) => (
              <Badge
                key={dep.id}
                variant="secondary"
                className="truncate max-w-[200px]"
              >
                {getTaskTitle(dep.successor_task_id)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add dependency button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            disabled={isAdding || selectableTasks.length === 0}
          >
            {isAdding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            {selectableTasks.length === 0 
              ? 'Aucune tâche disponible'
              : 'Ajouter une dépendance...'
            }
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher une tâche..." />
            <CommandList>
              <CommandEmpty>Aucune tâche trouvée.</CommandEmpty>
              <CommandGroup>
                {selectableTasks.map((task) => {
                  const isCycleRisk = wouldCreateCycle(task.id);
                  
                  return (
                    <CommandItem
                      key={task.id}
                      value={task.title}
                      onSelect={() => handleAddDependency(task.id)}
                      disabled={isCycleRisk}
                      className={cn(isCycleRisk && 'opacity-50')}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div 
                          className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            task.status === 'done' ? 'bg-green-500' :
                            task.status === 'in_progress' ? 'bg-yellow-500' :
                            task.status === 'blocked' ? 'bg-red-500' :
                            'bg-blue-500'
                          )}
                        />
                        <span className="truncate flex-1">{task.title}</span>
                        {isCycleRisk && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Empty state */}
      {predecessors.length === 0 && successors.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucune dépendance. Cette tâche peut être démarrée immédiatement.
        </p>
      )}
    </div>
  );
}

/**
 * Compact dependency badge for task cards
 */
interface DependencyBadgeProps {
  taskId: string;
  predecessorCount: number;
  hasBlockingPredecessors: boolean;
  className?: string;
}

export function DependencyBadge({
  taskId,
  predecessorCount,
  hasBlockingPredecessors,
  className,
}: Readonly<DependencyBadgeProps>) {
  if (predecessorCount === 0) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs gap-1',
        hasBlockingPredecessors 
          ? 'border-orange-500 text-orange-500' 
          : 'border-green-500 text-green-500',
        className
      )}
    >
      {hasBlockingPredecessors ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Check className="h-3 w-3" />
      )}
      {predecessorCount} dép.
    </Badge>
  );
}
