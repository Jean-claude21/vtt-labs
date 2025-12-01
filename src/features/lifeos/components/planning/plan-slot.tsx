// @ts-nocheck
/**
 * Plan Slot Component
 * 
 * Displays a single time slot in the timeline with domain coloring.
 * Integrates with RoutineInstanceTracker for routine completion.
 * 
 * @module lifeos/components/planning
 */
'use client';

import { useState } from 'react';
import { 
  CheckCircle2, 
  Repeat, 
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoutineInstanceTracker } from '../routines/routine-instance-tracker';
import type { PlanSlot } from '../../schema/planning.schema';
import type { RoutineInstance, RoutineTemplate, RoutineConstraints } from '../../schema/routines.schema';
import type { Task } from '../../schema/tasks.schema';
import type { Domain } from '../../schema/domains.schema';

interface PlanSlotProps {
  slot: PlanSlot & {
    routineInstance?: (RoutineInstance & { 
      template: RoutineTemplate & { 
        streak?: { current_streak: number; longest_streak: number } | null 
      }; 
      domain?: Domain 
    }) | null;
    task?: (Task & { domain?: Domain }) | null;
  };
  onCompleteRoutine?: (
    instanceId: string,
    actualValue?: number,
    mood?: number,
    energyLevel?: number,
    notes?: string
  ) => Promise<void>;
  onSkipRoutine?: (instanceId: string, reason?: string) => Promise<void>;
  onCompleteTask?: (taskId: string) => Promise<void>;
  onSkipTask?: (taskId: string) => Promise<void>;
  onShowDetails?: (slot: PlanSlotProps['slot']) => void;
}

// Helper to calculate slot height based on duration
function calculateHeight(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const durationMinutes = endMinutes - startMinutes;
  
  // 1 minute = 1px, minimum 60px
  return Math.max(60, durationMinutes);
}

export function PlanSlotItem({
  slot,
  onCompleteRoutine,
  onSkipRoutine,
  onCompleteTask,
  onSkipTask,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onShowDetails,
}: PlanSlotProps) {
  const [showAiReasoning, setShowAiReasoning] = useState(false);

  const item = slot.routineInstance || slot.task;
  if (!item) return null;

  const isRoutine = slot.slot_type === 'routine';
  const routineInstance = slot.routineInstance;
  const task = slot.task;
  
  // Get domain info
  const domain = isRoutine 
    ? routineInstance?.domain 
    : task?.domain;
  
  // Get item details
  const name = isRoutine 
    ? routineInstance?.template?.name ?? 'Routine'
    : task?.title ?? 'Tâche';
  
  const constraints = isRoutine 
    ? routineInstance?.template?.constraints as RoutineConstraints | null
    : null;
  
  // Status checks
  const isCompleted = isRoutine 
    ? routineInstance?.status === 'completed'
    : task?.status === 'done';
  
  const isSkipped = isRoutine 
    ? routineInstance?.status === 'skipped'
    : task?.status === 'cancelled';

  // Get streak for routines
  const streak = isRoutine ? routineInstance?.template?.streak?.current_streak ?? 0 : 0;

  // Calculate visual height
  const height = calculateHeight(slot.start_time ?? '00:00', slot.end_time ?? '00:30');

  return (
    <div
      className={`
        relative rounded-lg border-l-4 p-3 transition-all
        ${isCompleted ? 'bg-green-500/10 border-green-500' : 
          isSkipped ? 'bg-gray-500/10 border-gray-400' :
          'bg-card hover:bg-accent/50'}
      `}
      style={{
        borderLeftColor: !isCompleted && !isSkipped && domain?.color ? domain.color : undefined,
        minHeight: `${Math.min(height, 120)}px`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Time badge */}
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs font-mono">
              {slot.start_time} - {slot.end_time}
            </Badge>
            {slot.is_fixed && (
              <Badge variant="secondary" className="text-xs">
                Fixe
              </Badge>
            )}
            {isCompleted && (
              <Badge className="text-xs bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Fait
              </Badge>
            )}
            {isSkipped && (
              <Badge variant="outline" className="text-xs">
                Passé
              </Badge>
            )}
          </div>
          
          {/* Item name */}
          <h4 className={`font-medium ${isCompleted || isSkipped ? 'line-through text-muted-foreground' : ''}`}>
            {isRoutine ? <Repeat className="h-4 w-4 inline mr-1 text-muted-foreground" /> : null}
            {name}
          </h4>
          
          {/* Domain & Details */}
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
            {domain && (
              <span style={{ color: domain.color }}>
                {domain.icon} {domain.name}
              </span>
            )}
            {constraints?.targetValue && (
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {typeof constraints.targetValue === 'number'
                  ? constraints.targetValue
                  : `${constraints.targetValue.value} ${constraints.targetValue.unit || ''}`
                }
              </span>
            )}
            {streak > 0 && (
              <span className="flex items-center gap-1 text-orange-500">
                <Flame className="h-3 w-3" />
                {streak}
              </span>
            )}
          </div>
          
          {/* AI Reasoning toggle */}
          {slot.ai_reasoning && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-6 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowAiReasoning(!showAiReasoning)}
            >
              <Sparkles className="h-3 w-3 mr-1 text-yellow-500" />
              Raisonnement IA
              {showAiReasoning ? (
                <ChevronUp className="h-3 w-3 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </Button>
          )}
          
          {showAiReasoning && slot.ai_reasoning && (
            <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
              {slot.ai_reasoning}
            </p>
          )}
        </div>
        
        {/* Actions */}
        {!isCompleted && !isSkipped && (
          <div className="flex flex-col gap-1">
            {isRoutine && routineInstance && onCompleteRoutine && onSkipRoutine ? (
              // Use the full tracker for routines
              <RoutineInstanceTracker
                instance={routineInstance as RoutineInstance & { 
                  template: RoutineTemplate & { 
                    streak?: { current_streak: number; longest_streak: number } | null 
                  } 
                }}
                onComplete={onCompleteRoutine}
                onSkip={onSkipRoutine}
                compact
              />
            ) : task ? (
              // Simple buttons for tasks
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onCompleteTask?.(task.id)}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Fait
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => onSkipTask?.(task.id)}
                >
                  Passer
                </Button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}


