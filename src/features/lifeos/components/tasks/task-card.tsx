// @ts-nocheck
/**
 * Task Card Component
 * 
 * Displays a task with priority badge, status, and deadline info.
 * 
 * @module lifeos/components/tasks
 */
'use client';

import { useState } from 'react';
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Circle,
  Pause,
  XCircle,
  ArrowRight,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { Task, TaskStatus } from '../../schema/tasks.schema';
import type { Domain } from '../../schema/domains.schema';

interface TaskCardProps {
  task: Task;
  domain?: Domain | null;
  projectName?: string | null;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  draggable?: boolean;
}

// Helper to format duration
function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
}

// Helper to format deadline
function formatDeadline(deadline: string | null | undefined): { text: string; isOverdue: boolean; isDueToday: boolean } {
  if (!deadline) return { text: '', isOverdue: false, isDueToday: false };
  
  const date = new Date(deadline);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isOverdue = date < today;
  const isDueToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  let text = '';
  if (isOverdue) {
    const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    text = daysAgo === 1 ? 'Hier' : `Il y a ${daysAgo} jours`;
  } else if (isDueToday) {
    text = "Aujourd'hui";
  } else if (isTomorrow) {
    text = 'Demain';
  } else {
    text = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
  
  return { text, isOverdue, isDueToday };
}

// Status configuration
const statusConfig: Record<TaskStatus, { 
  icon: React.ElementType; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  todo: { 
    icon: Circle, 
    label: 'À faire', 
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
  },
  in_progress: { 
    icon: ArrowRight, 
    label: 'En cours', 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  blocked: { 
    icon: Pause, 
    label: 'Bloqué', 
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  done: { 
    icon: CheckCircle2, 
    label: 'Terminé', 
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  cancelled: { 
    icon: XCircle, 
    label: 'Annulé', 
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
  },
};

// Priority badge colors
const priorityColors: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const priorityLabels: Record<string, string> = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

// Valid status transitions
const validTransitions: Record<TaskStatus, TaskStatus[]> = {
  todo: ['in_progress', 'cancelled'],
  in_progress: ['done', 'blocked', 'cancelled', 'todo'],
  blocked: ['todo', 'in_progress', 'cancelled'],
  done: ['todo'],
  cancelled: ['todo'],
};

export function TaskCard({
  task,
  domain,
  projectName,
  onEdit,
  onDelete,
  onStatusChange,
  draggable = false,
}: TaskCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const status = statusConfig[task.status as TaskStatus];
  const StatusIcon = status.icon;
  const deadline = formatDeadline(task.due_date);
  const availableTransitions = validTransitions[task.status as TaskStatus];

  const isCompleted = task.status === 'done' || task.status === 'cancelled';

  return (
    <>
      <Card 
        className={`group relative transition-all duration-200 hover:shadow-md ${
          isCompleted ? 'opacity-60' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              {draggable && (
                <button 
                  className="mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity active:cursor-grabbing"
                  aria-label="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              
              {/* Status button */}
              <button
                className={`mt-0.5 p-1 rounded-full transition-colors ${status.bgColor} hover:opacity-80`}
                onClick={() => {
                  // Quick toggle: todo -> in_progress -> done
                  const quickNext: Record<TaskStatus, TaskStatus> = {
                    todo: 'in_progress',
                    in_progress: 'done',
                    blocked: 'in_progress',
                    done: 'todo',
                    cancelled: 'todo',
                  };
                  onStatusChange?.(task.id, quickNext[task.status as TaskStatus]);
                }}
                title={`Statut: ${status.label}`}
              >
                <StatusIcon className={`h-4 w-4 ${status.color}`} />
              </button>

              <div className="flex-1 min-w-0">
                <CardTitle className={`text-base ${isCompleted ? 'line-through' : ''}`}>
                  {task.title}
                </CardTitle>
                {task.description && (
                  <CardDescription className="line-clamp-2 mt-1">
                    {task.description}
                  </CardDescription>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Status submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <StatusIcon className={`mr-2 h-4 w-4 ${status.color}`} />
                    Changer le statut
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {availableTransitions.map((nextStatus) => {
                      const nextConfig = statusConfig[nextStatus];
                      const NextIcon = nextConfig.icon;
                      return (
                        <DropdownMenuItem 
                          key={nextStatus}
                          onClick={() => onStatusChange?.(task.id, nextStatus)}
                        >
                          <NextIcon className={`mr-2 h-4 w-4 ${nextConfig.color}`} />
                          {nextConfig.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => onEdit?.(task)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Domain, Project & Priority */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {domain && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  borderColor: domain.color,
                  color: domain.color,
                  backgroundColor: `${domain.color}10`,
                }}
              >
                {domain.icon} {domain.name}
              </Badge>
            )}
            {projectName && (
              <Badge variant="secondary" className="text-xs">
                📁 {projectName}
              </Badge>
            )}
            <Badge 
              variant="outline" 
              className={`text-xs ${priorityColors[task.priority]}`}
            >
              {priorityLabels[task.priority]}
            </Badge>
          </div>

          {/* Duration & Deadline */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {task.estimated_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDuration(task.estimated_minutes)}</span>
              </div>
            )}
            
            {deadline.text && (
              <div className={`flex items-center gap-1 ${
                deadline.isOverdue ? 'text-red-500 font-medium' : 
                deadline.isDueToday ? 'text-orange-500 font-medium' : ''
              }`}>
                {deadline.isOverdue ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  <Calendar className="h-3.5 w-3.5" />
                )}
                <span>{deadline.text}</span>
              </div>
            )}
          </div>

          {/* Completion date */}
          {task.completed_at && (
            <div className="mt-2 text-xs text-muted-foreground">
              Terminé le {new Date(task.completed_at).toLocaleDateString('fr-FR')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette tâche ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La tâche &quot;{task.title}&quot; sera 
              définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(task.id);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


