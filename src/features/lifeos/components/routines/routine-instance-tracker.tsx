/**
 * LifeOS Routine Instance Tracker Component
 * 
 * Displays tracking controls for a routine instance (complete/skip buttons)
 * with current streak information.
 * 
 * @module lifeos/components/routines/routine-instance-tracker
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Flame,
  Loader2,
} from 'lucide-react';
import { CompletionModal } from './completion-modal';
import type { RoutineInstance, RoutineTemplate } from '../../schema/routines.schema';

export interface RoutineInstanceTrackerProps {
  instance: RoutineInstance & { 
    template: RoutineTemplate & { 
      streak?: { current_streak: number; longest_streak: number } | null 
    } 
  };
  onComplete: (
    instanceId: string,
    actualValue?: number,
    mood?: number,
    energyLevel?: number,
    notes?: string
  ) => Promise<void>;
  onSkip: (instanceId: string, reason?: string) => Promise<void>;
  compact?: boolean;
}

export function RoutineInstanceTracker({
  instance,
  onComplete,
  onSkip,
  compact = false,
}: RoutineInstanceTrackerProps) {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'complete' | 'skip' | null>(null);

  const { template } = instance;
  const streak = template.streak?.current_streak ?? 0;
  const hasTargetValue = template.constraints?.targetValue?.value !== undefined;
  const isPending = instance.status === 'pending';

  const handleQuickComplete = async () => {
    if (hasTargetValue) {
      // Show modal for value input
      setShowCompletionModal(true);
    } else {
      // Quick complete without modal
      setIsLoading(true);
      setLoadingAction('complete');
      try {
        await onComplete(instance.id);
      } finally {
        setIsLoading(false);
        setLoadingAction(null);
      }
    }
  };

  const handleCompletionSubmit = async (
    actualValue?: number,
    mood?: number,
    energyLevel?: number,
    notes?: string
  ) => {
    setIsLoading(true);
    setLoadingAction('complete');
    try {
      await onComplete(instance.id, actualValue, mood, energyLevel, notes);
      setShowCompletionModal(false);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleSkip = async (reason?: string) => {
    setIsLoading(true);
    setLoadingAction('skip');
    try {
      await onSkip(instance.id, reason);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  // Completed state
  if (instance.status === 'completed') {
    return (
      <div className={`flex items-center gap-2 ${compact ? '' : 'p-2 bg-green-50 dark:bg-green-950/20 rounded-lg'}`}>
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
          <Check className="h-3 w-3 mr-1" />
          Fait
        </Badge>
        {instance.completion_score !== null && instance.completion_score !== 100 && (
          <span className="text-xs text-muted-foreground">
            {instance.completion_score}%
          </span>
        )}
        {streak > 0 && (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/50">
            <Flame className="h-3 w-3 mr-1" />
            {streak}
          </Badge>
        )}
      </div>
    );
  }

  // Skipped state
  if (instance.status === 'skipped') {
    return (
      <div className={`flex items-center gap-2 ${compact ? '' : 'p-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg'}`}>
        <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <X className="h-3 w-3 mr-1" />
          Sauté
        </Badge>
        {instance.notes && (
          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
            {instance.notes}
          </span>
        )}
      </div>
    );
  }

  // Pending state - show action buttons
  return (
    <>
      <div className={`flex items-center gap-2 ${compact ? '' : 'p-2'}`}>
        {/* Streak indicator */}
        {streak > 0 && (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 mr-1">
            <Flame className="h-3 w-3 mr-1" />
            {streak}
          </Badge>
        )}

        {/* Complete button */}
        <Button
          size={compact ? 'icon' : 'sm'}
          variant="outline"
          className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950/20 dark:hover:bg-green-950/40 dark:border-green-800 dark:text-green-400"
          onClick={handleQuickComplete}
          disabled={isLoading || !isPending}
        >
          {loadingAction === 'complete' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Check className="h-4 w-4" />
              {!compact && <span className="ml-1">Fait</span>}
            </>
          )}
        </Button>

        {/* Skip button */}
        <Button
          size={compact ? 'icon' : 'sm'}
          variant="outline"
          className="bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-900/20 dark:hover:bg-gray-900/40 dark:border-gray-700 dark:text-gray-400"
          onClick={() => handleSkip()}
          disabled={isLoading || !isPending}
        >
          {loadingAction === 'skip' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <X className="h-4 w-4" />
              {!compact && <span className="ml-1">Sauter</span>}
            </>
          )}
        </Button>
      </div>

      {/* Completion Modal for routines with target values */}
      {showCompletionModal && (
        <CompletionModal
          open={showCompletionModal}
          onOpenChange={setShowCompletionModal}
          routineName={template.name}
          targetValue={template.constraints?.targetValue?.value}
          targetUnit={template.constraints?.targetValue?.unit}
          onSubmit={handleCompletionSubmit}
          onSkip={handleSkip}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
