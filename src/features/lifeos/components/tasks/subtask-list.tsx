/**
 * Subtask List Component
 * 
 * Displays a collapsible list of subtasks with checkboxes and progress.
 * 
 * @module lifeos/components/tasks
 */
'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight, Plus, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { SubtaskItem } from './subtask-item';
import { QuickSubtaskInput } from './quick-subtask-input';
import type { Task } from '../../schema/tasks.schema';

interface SubtaskListProps {
  parentTaskId: string;
  subtasks: Task[];
  onSubtaskToggle: (subtaskId: string) => Promise<void>;
  onAddSubtask: (title: string) => Promise<void>;
  onDeleteSubtask?: (subtaskId: string) => Promise<void>;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  showAddButton?: boolean;
  className?: string;
}

export function SubtaskList({
  parentTaskId,
  subtasks,
  onSubtaskToggle,
  onAddSubtask,
  onDeleteSubtask,
  isCollapsible = true,
  defaultExpanded = true,
  showAddButton = true,
  className,
}: Readonly<SubtaskListProps>) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const [isAdding, setIsAdding] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Calculate progress
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(t => t.status === 'done').length;
  const progressPercent = totalSubtasks > 0 
    ? Math.round((completedSubtasks / totalSubtasks) * 100) 
    : 0;

  const handleAddSubtask = async (title: string) => {
    setIsSubmitting(true);
    try {
      await onAddSubtask(title);
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (subtaskId: string) => {
    await onSubtaskToggle(subtaskId);
  };

  // No subtasks and not adding
  if (totalSubtasks === 0 && !isAdding && !showAddButton) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header with toggle and progress */}
      <div className="flex items-center gap-2">
        {isCollapsible && totalSubtasks > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        
        <div className="flex items-center gap-2 flex-1">
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Sous-tâches
          </span>
          {totalSubtasks > 0 && (
            <span className="text-sm text-muted-foreground">
              ({completedSubtasks}/{totalSubtasks})
            </span>
          )}
        </div>

        {showAddButton && !isAdding && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {totalSubtasks > 0 && (
        <Progress value={progressPercent} className="h-1.5" />
      )}

      {/* Subtask items */}
      {isExpanded && (
        <div className="space-y-1 pl-2">
          {subtasks.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onToggle={() => handleToggle(subtask.id)}
              onDelete={onDeleteSubtask ? () => onDeleteSubtask(subtask.id) : undefined}
            />
          ))}

          {/* Quick add input */}
          {isAdding && (
            <QuickSubtaskInput
              onSubmit={handleAddSubtask}
              onCancel={() => setIsAdding(false)}
              isSubmitting={isSubmitting}
              placeholder="Nouvelle sous-tâche..."
            />
          )}
        </div>
      )}

      {/* Empty state with add button */}
      {totalSubtasks === 0 && !isAdding && showAddButton && (
        <div className="pl-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une sous-tâche
          </Button>
        </div>
      )}
    </div>
  );
}
