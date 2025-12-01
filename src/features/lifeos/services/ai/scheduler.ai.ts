// @ts-nocheck
/**
 * LifeOS AI Scheduler Service
 * 
 * Uses OpenAI to intelligently place routines and tasks in time slots.
 * Considers constraints, priorities, and user preferences.
 * 
 * @module lifeos/services/ai/scheduler
 */

import OpenAI from 'openai';
import type { 
  RoutineTemplate,
  RoutineInstance,
  RoutineConstraints,
} from '../../schema/routines.schema';
import type { Task } from '../../schema/tasks.schema';
import type { Domain } from '../../schema/domains.schema';
import type { 
  PlanSlot,
  TimeSlotConfig,
} from '../../schema/planning.schema';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type for scheduling input
export interface SchedulingInput {
  date: string; // ISO date string
  routineInstances: (RoutineInstance & { 
    template: RoutineTemplate;
    domain?: Domain | null;
  })[];
  tasks: (Task & { domain?: Domain | null })[];
  existingSlots: PlanSlot[];
  timeConfig: TimeSlotConfig;
  preferences?: {
    preferredWakeTime?: string; // HH:MM
    preferredSleepTime?: string; // HH:MM
    lunchBreakStart?: string; // HH:MM
    lunchBreakDuration?: number; // minutes
  };
}

// Type for scheduling output
export interface SchedulingOutput {
  slots: {
    type: 'routine' | 'task';
    itemId: string;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    aiReasoning: string;
    isFixed: boolean;
  }[];
  unscheduled: {
    itemId: string;
    type: 'routine' | 'task';
    reason: string;
  }[];
  summary: string;
}

/**
 * Generate time slots for a day (kept for potential future use)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateTimeSlots(
  startHour: number,
  endHour: number,
  slotDuration: number
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const startMinute = minute;
      let endMinute = minute + slotDuration;
      let endHourAdjusted = hour;
      
      if (endMinute >= 60) {
        endMinute -= 60;
        endHourAdjusted += 1;
      }
      
      if (endHourAdjusted > endHour || (endHourAdjusted === endHour && endMinute > 0)) {
        break;
      }
      
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
        end: `${endHourAdjusted.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
      });
    }
  }
  
  return slots;
}

/**
 * Convert time string to minutes from midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to time string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get duration in minutes from constraints (handles old and new formats)
 */
function getDurationMinutes(constraints: RoutineConstraints | null | undefined): number {
  if (!constraints?.duration) return 30;
  // New format: { required: boolean, minutes: number }
  if (typeof constraints.duration === 'object' && 'minutes' in constraints.duration) {
    return constraints.duration.minutes;
  }
  // Old format: direct number
  if (typeof constraints.duration === 'number') {
    return constraints.duration;
  }
  return 30;
}

/**
 * Get time slot bounds from constraints (handles old and new formats)
 */
function getTimeSlotFromConstraints(
  constraints: RoutineConstraints | null | undefined
): { start: number; end: number } | null {
  if (!constraints?.timeSlot) return null;
  
  // New format: { required: boolean, startTime: "HH:MM", endTime: "HH:MM" }
  if (typeof constraints.timeSlot === 'object' && 'startTime' in constraints.timeSlot) {
    return {
      start: timeToMinutes(constraints.timeSlot.startTime),
      end: timeToMinutes(constraints.timeSlot.endTime),
    };
  }
  
  // Old format: string like "morning", "afternoon", etc.
  if (typeof constraints.timeSlot === 'string') {
    return getTimeSlotBounds(constraints.timeSlot);
  }
  
  return null;
}

/**
 * Get preferred time slot bounds (for old string format)
 */
function getTimeSlotBounds(slot: string): { start: number; end: number } {
  const bounds: Record<string, { start: number; end: number }> = {
    morning: { start: 6 * 60, end: 12 * 60 },
    afternoon: { start: 12 * 60, end: 18 * 60 },
    evening: { start: 18 * 60, end: 22 * 60 },
    night: { start: 22 * 60, end: 24 * 60 },
  };
  return bounds[slot] ?? { start: 0, end: 24 * 60 };
}

/**
 * Simple scheduling algorithm (fallback if AI fails)
 */
function simpleSchedule(input: SchedulingInput): SchedulingOutput {
  const slots: SchedulingOutput['slots'] = [];
  const unscheduled: SchedulingOutput['unscheduled'] = [];
  
  const dayStart = timeToMinutes(input.preferences?.preferredWakeTime ?? '07:00');
  const dayEnd = timeToMinutes(input.preferences?.preferredSleepTime ?? '22:00');
  
  // Track occupied time
  const occupiedSlots: { start: number; end: number }[] = [];
  
  // Reserve lunch break if configured
  if (input.preferences?.lunchBreakStart && input.preferences?.lunchBreakDuration) {
    const lunchStart = timeToMinutes(input.preferences.lunchBreakStart);
    const lunchEnd = lunchStart + input.preferences.lunchBreakDuration;
    occupiedSlots.push({ start: lunchStart, end: lunchEnd });
  }
  
  // Add existing slots to occupied
  for (const slot of input.existingSlots) {
    if (slot.start_time && slot.end_time) {
      occupiedSlots.push({
        start: timeToMinutes(slot.start_time),
        end: timeToMinutes(slot.end_time),
      });
    }
  }
  
  // Helper to check if time is available
  const isTimeAvailable = (start: number, end: number): boolean => {
    return !occupiedSlots.some(
      (slot) => !(end <= slot.start || start >= slot.end)
    );
  };
  
  // Helper to find next available slot
  const findAvailableSlot = (
    duration: number,
    preferredStart?: number,
    preferredEnd?: number
  ): { start: number; end: number } | null => {
    const searchStart = preferredStart ?? dayStart;
    const searchEnd = preferredEnd ?? dayEnd;
    
    for (let time = searchStart; time + duration <= searchEnd; time += 15) {
      if (isTimeAvailable(time, time + duration)) {
        return { start: time, end: time + duration };
      }
    }
    
    // If no slot in preferred time, search whole day
    if (preferredStart !== undefined || preferredEnd !== undefined) {
      for (let time = dayStart; time + duration <= dayEnd; time += 15) {
        if (isTimeAvailable(time, time + duration)) {
          return { start: time, end: time + duration };
        }
      }
    }
    
    return null;
  };
  
  // Schedule non-flexible routines first (fixed times)
  const fixedRoutines = input.routineInstances.filter((r) => !r.template.is_flexible);
  const flexibleRoutines = input.routineInstances.filter((r) => r.template.is_flexible);
  
  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  
  fixedRoutines.sort((a, b) => 
    priorityOrder[a.template.priority] - priorityOrder[b.template.priority]
  );
  
  flexibleRoutines.sort((a, b) => 
    priorityOrder[a.template.priority] - priorityOrder[b.template.priority]
  );
  
  // Schedule fixed routines
  for (const routine of fixedRoutines) {
    const constraints = routine.template.constraints as RoutineConstraints | null;
    const duration = getDurationMinutes(constraints);
    
    let preferredStart: number | undefined;
    let preferredEnd: number | undefined;
    
    const timeSlotBounds = getTimeSlotFromConstraints(constraints);
    if (timeSlotBounds) {
      preferredStart = timeSlotBounds.start;
      preferredEnd = timeSlotBounds.end;
    }
    
    const slot = findAvailableSlot(duration, preferredStart, preferredEnd);
    
    if (slot) {
      occupiedSlots.push(slot);
      slots.push({
        type: 'routine',
        itemId: routine.id,
        startTime: minutesToTime(slot.start),
        endTime: minutesToTime(slot.end),
        aiReasoning: `Routine prioritaire "${routine.template.name}" planifiée${timeSlotBounds ? ` (${minutesToTime(timeSlotBounds.start)}-${minutesToTime(timeSlotBounds.end)})` : ''}.`,
        isFixed: true,
      });
    } else {
      unscheduled.push({
        itemId: routine.id,
        type: 'routine',
        reason: 'Aucun créneau disponible correspondant aux contraintes',
      });
    }
  }
  
  // Schedule flexible routines
  for (const routine of flexibleRoutines) {
    const constraints = routine.template.constraints as RoutineConstraints | null;
    const duration = getDurationMinutes(constraints);
    
    let preferredStart: number | undefined;
    let preferredEnd: number | undefined;
    
    const timeSlotBounds = getTimeSlotFromConstraints(constraints);
    if (timeSlotBounds) {
      preferredStart = timeSlotBounds.start;
      preferredEnd = timeSlotBounds.end;
    }
    
    const slot = findAvailableSlot(duration, preferredStart, preferredEnd);
    
    if (slot) {
      occupiedSlots.push(slot);
      slots.push({
        type: 'routine',
        itemId: routine.id,
        startTime: minutesToTime(slot.start),
        endTime: minutesToTime(slot.end),
        aiReasoning: `Routine flexible "${routine.template.name}" placée${timeSlotBounds ? ` (${minutesToTime(timeSlotBounds.start)}-${minutesToTime(timeSlotBounds.end)})` : ' au premier créneau disponible'}.`,
        isFixed: false,
      });
    } else {
      unscheduled.push({
        itemId: routine.id,
        type: 'routine',
        reason: 'Journée chargée, pas de créneau disponible',
      });
    }
  }
  
  // Schedule tasks
  const sortedTasks = [...input.tasks]
    .filter((t) => t.status !== 'done' && t.status !== 'cancelled')
    .sort((a, b) => {
      // Priority first
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - 
                          priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then deadline
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      
      return 0;
    });
  
  for (const task of sortedTasks) {
    const duration = task.estimated_minutes ?? 30;
    const slot = findAvailableSlot(duration);
    
    if (slot) {
      occupiedSlots.push(slot);
      
      let reasoning = `Tâche "${task.title}"`;
      if (task.due_date) {
        const deadline = new Date(task.due_date);
        const today = new Date(input.date);
        if (deadline.toDateString() === today.toDateString()) {
          reasoning += ' - échéance aujourd\'hui, priorité haute';
        } else if (deadline < today) {
          reasoning += ' - EN RETARD, à traiter en urgence';
        }
      }
      reasoning += ` - priorité ${task.priority}`;
      
      slots.push({
        type: 'task',
        itemId: task.id,
        startTime: minutesToTime(slot.start),
        endTime: minutesToTime(slot.end),
        aiReasoning: reasoning,
        isFixed: false,
      });
    } else {
      unscheduled.push({
        itemId: task.id,
        type: 'task',
        reason: 'Plus de créneaux disponibles',
      });
    }
  }
  
  return {
    slots,
    unscheduled,
    summary: `Planning généré: ${slots.length} éléments planifiés, ${unscheduled.length} non planifiés.`,
  };
}

/**
 * Main scheduling function using OpenAI
 */
export async function scheduleDay(
  input: SchedulingInput
): Promise<SchedulingOutput> {
  // Check if we have items to schedule
  if (input.routineInstances.length === 0 && input.tasks.length === 0) {
    return {
      slots: [],
      unscheduled: [],
      summary: 'Aucun élément à planifier.',
    };
  }

  // If OpenAI key is not configured, use simple algorithm
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, using simple scheduler');
    return simpleSchedule(input);
  }

  try {
    // Prepare data for AI
    const routinesData = input.routineInstances.map((r) => ({
      id: r.id,
      name: r.template.name,
      domain: r.domain?.name ?? 'Sans domaine',
      priority: r.template.priority,
      isFlexible: r.template.is_flexible,
      duration: (r.template.constraints as RoutineConstraints | null)?.duration ?? 30,
      preferredTimeSlot: (r.template.constraints as RoutineConstraints | null)?.timeSlot,
      targetValue: (r.template.constraints as RoutineConstraints | null)?.targetValue,
      targetUnit: (r.template.constraints as RoutineConstraints | null)?.targetUnit,
    }));

    const tasksData = input.tasks
      .filter((t) => t.status !== 'done' && t.status !== 'cancelled')
      .map((t) => ({
        id: t.id,
        title: t.title,
        domain: t.domain?.name ?? 'Sans domaine',
        priority: t.priority,
        estimatedDuration: t.estimated_minutes ?? 30,
        deadline: t.due_date,
        status: t.status,
      }));

    const prompt = `Tu es un assistant de planification intelligent. Génère un planning optimisé pour la journée du ${input.date}.

CONTRAINTES:
- Journée de ${input.preferences?.preferredWakeTime ?? '07:00'} à ${input.preferences?.preferredSleepTime ?? '22:00'}
- Pause déjeuner: ${input.preferences?.lunchBreakStart ?? '12:00'} pendant ${input.preferences?.lunchBreakDuration ?? 60} minutes
- Les créneaux occupés sont: ${JSON.stringify(input.existingSlots.map(s => ({ start: s.start_time, end: s.end_time })))}

ROUTINES À PLANIFIER:
${JSON.stringify(routinesData, null, 2)}

TÂCHES À PLANIFIER:
${JSON.stringify(tasksData, null, 2)}

RÈGLES DE PLANIFICATION:
1. Routines non-flexibles (isFlexible=false) sont prioritaires et doivent être placées selon leur créneau préféré
2. Routines flexibles peuvent être déplacées mais respectent les préférences de créneau
3. Les tâches critiques et avec deadline proche sont prioritaires
4. Garde un équilibre entre les domaines de vie
5. Ne surcharge pas la journée, laisse des temps de transition (5-10min)

Réponds UNIQUEMENT avec un JSON valide au format:
{
  "slots": [
    {
      "type": "routine" | "task",
      "itemId": "uuid",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "aiReasoning": "Explication courte en français",
      "isFixed": boolean
    }
  ],
  "unscheduled": [
    {
      "itemId": "uuid",
      "type": "routine" | "task",
      "reason": "Raison en français"
    }
  ],
  "summary": "Résumé de la journée en français"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant de planification. Tu réponds uniquement avec du JSON valide, sans commentaires ni explications supplémentaires.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent output
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('Empty OpenAI response');
      return simpleSchedule(input);
    }

    // Parse AI response
    try {
      const result = JSON.parse(content) as SchedulingOutput;
      return result;
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, content);
      return simpleSchedule(input);
    }
  } catch (error) {
    console.error('OpenAI scheduling error:', error);
    return simpleSchedule(input);
  }
}

