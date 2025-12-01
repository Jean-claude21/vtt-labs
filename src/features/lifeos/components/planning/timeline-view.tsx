/**
 * Timeline View Component
 * 
 * Displays the daily plan as a vertical timeline with hours grid.
 * 
 * @module lifeos/components/planning
 */
'use client';

import { useMemo } from 'react';
import { PlanSlotItem } from './plan-slot';
import { CurrentTimeIndicator } from './current-time-indicator';
import type { PlanSlot } from '../../schema/planning.schema';
import type { RoutineInstance, RoutineTemplate } from '../../schema/routines.schema';
import type { Task } from '../../schema/tasks.schema';
import type { Domain } from '../../schema/domains.schema';

interface TimelineViewProps {
  slots: (PlanSlot & {
    routineInstance?: (RoutineInstance & { 
      template: RoutineTemplate & { 
        streak?: { current_streak: number; longest_streak: number } | null 
      }; 
      domain?: Domain 
    }) | null;
    task?: (Task & { domain?: Domain }) | null;
  })[];
  date: Date;
  dayStart?: number; // Hour (default: 7)
  dayEnd?: number; // Hour (default: 22)
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
  onShowDetails?: (slot: TimelineViewProps['slots'][0]) => void;
  showCurrentTime?: boolean;
}

const PIXELS_PER_HOUR = 80;

export function TimelineView({
  slots,
  date,
  dayStart = 7,
  dayEnd = 22,
  onCompleteRoutine,
  onSkipRoutine,
  onCompleteTask,
  onSkipTask,
  onShowDetails,
  showCurrentTime = true,
}: TimelineViewProps) {
  // Generate hour labels
  const hours = useMemo(() => {
    const result: number[] = [];
    for (let h = dayStart; h <= dayEnd; h++) {
      result.push(h);
    }
    return result;
  }, [dayStart, dayEnd]);

  // Calculate slot positions
  const positionedSlots = useMemo(() => {
    return slots.map((slot) => {
      if (!slot.start_time) return { ...slot, top: 0, height: PIXELS_PER_HOUR };
      
      const [startHour, startMin] = slot.start_time.split(':').map(Number);
      const [endHour, endMin] = (slot.end_time ?? slot.start_time).split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const dayStartMinutes = dayStart * 60;
      
      const top = ((startMinutes - dayStartMinutes) / 60) * PIXELS_PER_HOUR;
      const height = ((endMinutes - startMinutes) / 60) * PIXELS_PER_HOUR;
      
      return {
        ...slot,
        top,
        height: Math.max(height, 40), // Minimum height
      };
    });
  }, [slots, dayStart]);

  // Check if date is today
  const isToday = useMemo(() => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, [date]);

  // Total timeline height
  const timelineHeight = (dayEnd - dayStart) * PIXELS_PER_HOUR;

  return (
    <div className="relative flex">
      {/* Hour labels column */}
      <div className="w-16 flex-shrink-0 border-r">
        {hours.map((hour) => (
          <div
            key={hour}
            className="relative text-sm text-muted-foreground"
            style={{ height: `${PIXELS_PER_HOUR}px` }}
          >
            <span className="absolute -top-2 right-2">
              {hour.toString().padStart(2, '0')}:00
            </span>
          </div>
        ))}
      </div>

      {/* Timeline content */}
      <div 
        className="flex-1 relative"
        style={{ height: `${timelineHeight}px` }}
      >
        {/* Hour grid lines */}
        {hours.map((hour, index) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-dashed border-muted"
            style={{ top: `${index * PIXELS_PER_HOUR}px` }}
          />
        ))}

        {/* Half-hour grid lines */}
        {hours.slice(0, -1).map((hour, index) => (
          <div
            key={`${hour}-half`}
            className="absolute left-0 right-0 border-t border-dotted border-muted/50"
            style={{ top: `${index * PIXELS_PER_HOUR + PIXELS_PER_HOUR / 2}px` }}
          />
        ))}

        {/* Current time indicator */}
        {showCurrentTime && isToday && (
          <CurrentTimeIndicator
            dayStart={dayStart}
            dayEnd={dayEnd}
            pixelsPerHour={PIXELS_PER_HOUR}
          />
        )}

        {/* Plan slots */}
        <div className="absolute inset-0 pl-2 pr-4">
          {positionedSlots.map((slot) => (
            <div
              key={slot.id}
              className="absolute left-2 right-4"
              style={{
                top: `${slot.top}px`,
                minHeight: `${slot.height}px`,
              }}
            >
              <PlanSlotItem
                slot={slot}
                onCompleteRoutine={onCompleteRoutine}
                onSkipRoutine={onSkipRoutine}
                onCompleteTask={onCompleteTask}
                onSkipTask={onSkipTask}
                onShowDetails={onShowDetails}
              />
            </div>
          ))}

          {/* Empty state */}
          {slots.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">📅</p>
                <p>Aucun créneau planifié</p>
                <p className="text-sm">Générez un planning pour commencer</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
