/**
 * Task Timer Component
 * 
 * Displays and controls a timer for task time tracking.
 * 
 * @module lifeos/components/tasks/task-timer
 */
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { 
  startTaskTimer, 
  pauseTaskTimer, 
  stopTaskTimer,
} from '@/features/lifeos/actions/tasks.actions';
import type { TimerState } from '@/features/lifeos/services/timer.service';
import { cn } from '@/lib/utils';

interface TaskTimerProps {
  taskId: string;
  initialState?: {
    isRunning: boolean;
    accumulatedSeconds: number;
    startedAt?: string | null;
  };
  compact?: boolean;
  onStateChange?: (state: TimerState) => void;
}

/**
 * Format seconds to HH:MM:SS or MM:SS
 */
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function TaskTimer({
  taskId,
  initialState,
  compact = false,
  onStateChange,
}: Readonly<TaskTimerProps>) {
  const [isRunning, setIsRunning] = React.useState(initialState?.isRunning ?? false);
  const [accumulatedSeconds, setAccumulatedSeconds] = React.useState(
    initialState?.accumulatedSeconds ?? 0
  );
  const [currentSessionSeconds, setCurrentSessionSeconds] = React.useState(0);
  const [isPending, setIsPending] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Calculate total display time
  const displaySeconds = accumulatedSeconds + currentSessionSeconds;

  // Initialize session time from startedAt if running
  React.useEffect(() => {
    if (initialState?.isRunning && initialState.startedAt) {
      const startedAt = new Date(initialState.startedAt);
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      setCurrentSessionSeconds(elapsed);
    }
  }, [initialState?.isRunning, initialState?.startedAt]);

  // Timer interval when running
  React.useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentSessionSeconds(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Handle start
  const handleStart = React.useCallback(async () => {
    setIsPending(true);
    const result = await startTaskTimer(taskId);
    setIsPending(false);

    if (result.error) {
      toast.error('Erreur', { description: result.error });
      return;
    }

    if (result.data) {
      setIsRunning(true);
      setCurrentSessionSeconds(0);
      onStateChange?.(result.data);
    }
  }, [taskId, onStateChange]);

  // Handle pause
  const handlePause = React.useCallback(async () => {
    setIsPending(true);
    const result = await pauseTaskTimer(taskId);
    setIsPending(false);

    if (result.error) {
      toast.error('Erreur', { description: result.error });
      return;
    }

    if (result.data) {
      setIsRunning(false);
      setAccumulatedSeconds(result.data.accumulatedSeconds);
      setCurrentSessionSeconds(0);
      onStateChange?.(result.data);
    }
  }, [taskId, onStateChange]);

  // Handle stop (reset timer)
  const handleStop = React.useCallback(async () => {
    setIsPending(true);
    const result = await stopTaskTimer(taskId);
    setIsPending(false);

    if (result.error) {
      toast.error('Erreur', { description: result.error });
      return;
    }

    if (result.data) {
      setIsRunning(false);
      setAccumulatedSeconds(result.data.accumulatedSeconds);
      setCurrentSessionSeconds(0);
      onStateChange?.(result.data);
      toast.success('Timer arrêté', {
        description: `Temps total: ${formatTime(result.data.accumulatedSeconds)}`,
      });
    }
  }, [taskId, onStateChange]);

  // Compact version for calendar events
  if (compact) {
    // Render timer badge based on state
    const renderCompactBadge = () => {
      if (isRunning) {
        return (
          <Badge 
            variant="default" 
            className="bg-green-500 animate-pulse gap-1 text-xs"
          >
            <Clock className="h-3 w-3" />
            {formatTime(displaySeconds)}
          </Badge>
        );
      }
      
      if (displaySeconds > 0) {
        return (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {formatTime(displaySeconds)}
          </Badge>
        );
      }
      
      return null;
    };

    return (
      <div className="flex items-center gap-1">
        {renderCompactBadge()}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Timer display */}
      <div 
        className={cn(
          "font-mono text-lg tabular-nums min-w-[80px] text-center",
          isRunning && "text-green-600 font-semibold"
        )}
      >
        {formatTime(displaySeconds)}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {isRunning ? (
          <Button
            variant="outline"
            size="icon"
            onClick={handlePause}
            disabled={isPending}
            title="Pause"
          >
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={handleStart}
            disabled={isPending}
            title="Démarrer"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleStop}
          disabled={isPending || (!isRunning && displaySeconds === 0)}
          title="Arrêter"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      {/* Running indicator */}
      {isRunning && (
        <span className="text-xs text-green-600 animate-pulse">
          En cours...
        </span>
      )}
    </div>
  );
}
