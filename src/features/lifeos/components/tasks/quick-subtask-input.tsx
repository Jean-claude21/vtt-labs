/**
 * Quick Subtask Input Component
 * 
 * Inline input for quickly adding subtasks.
 * 
 * @module lifeos/components/tasks
 */
'use client';

import * as React from 'react';
import { Loader2, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickSubtaskInputProps {
  onSubmit: (title: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function QuickSubtaskInput({
  onSubmit,
  onCancel,
  isSubmitting = false,
  placeholder = 'Nouvelle sous-tâche...',
  autoFocus = true,
  className,
}: Readonly<QuickSubtaskInputProps>) {
  const [title, setTitle] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    
    await onSubmit(trimmedTitle);
    setTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSubmitting}
        className="h-8 text-sm"
      />
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4 text-green-500" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
