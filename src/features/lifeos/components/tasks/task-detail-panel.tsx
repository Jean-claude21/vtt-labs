/**
 * Task Detail Panel Component
 * 
 * Side panel or dialog showing full task details with subtasks.
 * 
 * @module lifeos/components/tasks
 */
'use client';

import * as React from 'react';
import { 
  X, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar, 
  Target,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  ListTodo,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SubtaskList } from './subtask-list';
import { 
  getSubtasks, 
  createSubtask, 
  toggleSubtaskStatus, 
  deleteTask 
} from '../../actions/tasks.actions';
import type { Task, TaskStatus } from '../../schema/tasks.schema';

interface TaskDetailPanelProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onUpdate?: () => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ElementType; color: string }> = {
  backlog: { label: 'Backlog', icon: Circle, color: 'text-gray-500' },
  todo: { label: 'À faire', icon: Circle, color: 'text-blue-500' },
  in_progress: { label: 'En cours', icon: Clock, color: 'text-yellow-500' },
  blocked: { label: 'Bloqué', icon: AlertCircle, color: 'text-red-500' },
  done: { label: 'Terminé', icon: CheckCircle2, color: 'text-green-500' },
  cancelled: { label: 'Annulé', icon: X, color: 'text-gray-400' },
  archived: { label: 'Archivé', icon: Circle, color: 'text-gray-400' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: 'Haute', color: 'text-red-500 bg-red-500/10' },
  medium: { label: 'Moyenne', color: 'text-yellow-500 bg-yellow-500/10' },
  low: { label: 'Basse', color: 'text-green-500 bg-green-500/10' },
};

export function TaskDetailPanel({
  task,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onUpdate,
}: Readonly<TaskDetailPanelProps>) {
  const [subtasks, setSubtasks] = React.useState<Task[]>([]);
  const [isLoadingSubtasks, setIsLoadingSubtasks] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Load subtasks when task changes
  React.useEffect(() => {
    if (task && open) {
      loadSubtasks();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, open]);

  const loadSubtasks = async () => {
    if (!task) return;
    
    setIsLoadingSubtasks(true);
    try {
      const result = await getSubtasks(task.id);
      if (result.data) {
        setSubtasks(result.data);
      }
    } catch {
      toast.error('Erreur lors du chargement des sous-tâches');
    } finally {
      setIsLoadingSubtasks(false);
    }
  };

  const handleAddSubtask = async (title: string) => {
    if (!task) return;
    
    const result = await createSubtask(task.id, { title });
    if (result.error) {
      toast.error('Erreur', { description: result.error });
      return;
    }
    
    if (result.data) {
      setSubtasks(prev => [...prev, result.data!]);
      toast.success('Sous-tâche créée');
      onUpdate?.();
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const result = await toggleSubtaskStatus(subtaskId);
    if (result.error) {
      toast.error('Erreur', { description: result.error });
      return;
    }
    
    if (result.data) {
      setSubtasks(prev => prev.map(s => s.id === subtaskId ? result.data! : s));
      onUpdate?.();
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const result = await deleteTask(subtaskId);
    if (result.error) {
      toast.error('Erreur', { description: result.error });
      return;
    }
    
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
    toast.success('Sous-tâche supprimée');
    onUpdate?.();
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteTask(task.id);
      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }
      
      toast.success('Tâche supprimée');
      setShowDeleteDialog(false);
      onOpenChange(false);
      onDelete?.(task.id);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!task) return null;

  const statusConfig = STATUS_CONFIG[task.status];
  const StatusIcon = statusConfig?.icon || Circle;
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-5 w-5 ${statusConfig?.color}`} />
                <Badge variant="outline" className={priorityConfig?.color}>
                  {priorityConfig?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(task)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <SheetTitle className="text-xl text-left">{task.title}</SheetTitle>
            
            {task.description && (
              <SheetDescription className="text-left">
                {task.description}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Task info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Status */}
              <div>
                <span className="text-muted-foreground">Statut</span>
                <div className="flex items-center gap-2 mt-1">
                  <StatusIcon className={`h-4 w-4 ${statusConfig?.color}`} />
                  <span>{statusConfig?.label}</span>
                </div>
              </div>

              {/* Priority */}
              <div>
                <span className="text-muted-foreground">Priorité</span>
                <div className="mt-1">
                  <Badge variant="outline" className={priorityConfig?.color}>
                    {priorityConfig?.label}
                  </Badge>
                </div>
              </div>

              {/* Due date */}
              {task.due_date && (
                <div>
                  <span className="text-muted-foreground">Échéance</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(task.due_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* Estimated time */}
              {task.estimated_minutes && (
                <div>
                  <span className="text-muted-foreground">Estimation</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {task.estimated_minutes < 60
                        ? `${task.estimated_minutes}min`
                        : `${Math.floor(task.estimated_minutes / 60)}h${task.estimated_minutes % 60 > 0 ? task.estimated_minutes % 60 : ''}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Actual time */}
              {task.actual_minutes > 0 && (
                <div>
                  <span className="text-muted-foreground">Temps passé</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {task.actual_minutes < 60
                        ? `${task.actual_minutes}min`
                        : `${Math.floor(task.actual_minutes / 60)}h${task.actual_minutes % 60 > 0 ? task.actual_minutes % 60 : ''}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Subtasks */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ListTodo className="h-5 w-5" />
                <h3 className="font-medium">Sous-tâches</h3>
              </div>
              
              {isLoadingSubtasks ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <SubtaskList
                  parentTaskId={task.id}
                  subtasks={subtasks}
                  onSubtaskToggle={handleToggleSubtask}
                  onAddSubtask={handleAddSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  isCollapsible={false}
                />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la tâche</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{task.title}&quot; ?
              {subtasks.length > 0 && (
                <span className="block mt-2 text-destructive">
                  Cette tâche contient {subtasks.length} sous-tâche(s) qui seront également supprimée(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
