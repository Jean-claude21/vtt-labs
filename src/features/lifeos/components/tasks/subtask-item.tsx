/**
 * Subtask Item Component
 * 
 * Single subtask row with checkbox, title, and delete button.
 * 
 * @module lifeos/components/tasks
 */
'use client';

import * as React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '../../schema/tasks.schema';

interface SubtaskItemProps {
  subtask: Task;
  onToggle: () => Promise<void>;
  onDelete?: () => Promise<void>;
  className?: string;
}

export function SubtaskItem({
  subtask,
  onToggle,
  onDelete,
  className,
}: Readonly<SubtaskItemProps>) {
  const [isToggling, setIsToggling] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDelete, setShowDelete] = React.useState(false);

  const isDone = subtask.status === 'done';

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle();
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2 py-1 px-2 rounded-md hover:bg-muted/50 transition-colors',
        className
      )}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Checkbox */}
      <div className="relative flex items-center justify-center">
        {isToggling ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Checkbox
            checked={isDone}
            onCheckedChange={handleToggle}
            className="h-4 w-4"
          />
        )}
      </div>

      {/* Title */}
      <span
        className={cn(
          'flex-1 text-sm truncate',
          isDone && 'line-through text-muted-foreground'
        )}
      >
        {subtask.title}
      </span>

      {/* Priority indicator */}
      {subtask.priority === 'high' && (
        <span className="text-xs text-red-500">●</span>
      )}

      {/* Estimated time */}
      {subtask.estimated_minutes && !isDone && (
        <span className="text-xs text-muted-foreground">
          {subtask.estimated_minutes}m
        </span>
      )}

      {/* Delete button */}
      {onDelete && showDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          )}
        </Button>
      )}
    </div>
  );
}
