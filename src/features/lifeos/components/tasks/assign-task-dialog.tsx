/**
 * Assign Task to Project Dialog
 * 
 * Dialog to assign an existing orphan task (without project) to a project.
 * 
 * @module lifeos/components/tasks
 */
'use client';

import * as React from 'react';
import { Loader2, Search, FolderOpen, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Task } from '../../schema/tasks.schema';
import type { Project } from '../../schema/projects.schema';
import { updateTask, getOrphanTasks } from '../../actions/tasks.actions';

interface AssignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onTaskAssigned?: () => void;
}

export function AssignTaskDialog({
  open,
  onOpenChange,
  project,
  onTaskAssigned,
}: Readonly<AssignTaskDialogProps>) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [orphanTasks, setOrphanTasks] = React.useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState('');

  // Load orphan tasks when dialog opens
  React.useEffect(() => {
    if (open) {
      loadOrphanTasks();
      setSelectedTaskIds(new Set());
      setSearchQuery('');
    }
  }, [open]);

  const loadOrphanTasks = async () => {
    setIsLoading(true);
    try {
      const result = await getOrphanTasks();
      if (!result.error && result.data) {
        setOrphanTasks(result.data);
      } else {
        toast.error(result.error || 'Erreur lors du chargement des tâches');
      }
    } catch (error) {
      console.error('Error loading orphan tasks:', error);
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tasks based on search query
  const filteredTasks = React.useMemo(() => {
    if (!searchQuery.trim()) return orphanTasks;
    const query = searchQuery.toLowerCase();
    return orphanTasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    );
  }, [orphanTasks, searchQuery]);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleAssignTasks = async () => {
    if (selectedTaskIds.size === 0) {
      toast.error('Sélectionnez au moins une tâche');
      return;
    }

    setIsAssigning(true);
    try {
      const promises = Array.from(selectedTaskIds).map(taskId =>
        updateTask({ id: taskId, project_id: project.id })
      );
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => !r.error).length;
      const failCount = results.filter(r => r.error).length;

      if (failCount === 0) {
        toast.success(`${successCount} tâche(s) affectée(s) au projet`);
      } else if (successCount > 0) {
        toast.warning(`${successCount} affectée(s), ${failCount} échouée(s)`);
      } else {
        toast.error('Erreur lors de l\'affectation des tâches');
      }

      onOpenChange(false);
      onTaskAssigned?.();
    } catch (error) {
      console.error('Error assigning tasks:', error);
      toast.error('Erreur lors de l\'affectation des tâches');
    } finally {
      setIsAssigning(false);
    }
  };

  const priorityColors = {
    high: 'border-red-500 text-red-500',
    medium: 'border-blue-500 text-blue-500',
    low: 'border-gray-400 text-gray-400',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Affecter des tâches au projet
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les tâches orphelines à affecter au projet &quot;{project.name}&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une tâche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Task list */}
          <ScrollArea className="h-[300px] border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <FolderOpen className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Aucune tâche correspondante' : 'Aucune tâche orpheline disponible'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les tâches orphelines sont celles sans projet assigné.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredTasks.map(task => {
                  const isSelected = selectedTaskIds.has(task.id);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      className={cn(
                        "w-full text-left p-3 hover:bg-muted/50 transition-colors",
                        isSelected && "bg-primary/10"
                      )}
                      onClick={() => toggleTaskSelection(task.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{task.title}</span>
                            {task.priority && (
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", priorityColors[task.priority])}
                              >
                                {task.priority}
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {task.description}
                            </p>
                          )}
                          {task.due_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Échéance: {new Date(task.due_date).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Selection count */}
          {selectedTaskIds.size > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedTaskIds.size} tâche(s) sélectionnée(s)
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAssigning}
          >
            Annuler
          </Button>
          <Button
            onClick={handleAssignTasks}
            disabled={isAssigning || selectedTaskIds.size === 0}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Affectation...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Affecter ({selectedTaskIds.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
