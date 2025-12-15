/**
 * LifeOS Calendar - Zod Validation Schemas
 * 
 * @module lifeos/schema/calendar
 */

import { z } from 'zod';
import { routineInstanceSchema } from './routines.schema';
import { taskSchema } from './tasks.schema';

// ============================================================================
// CALENDAR EVENT TYPES
// ============================================================================

export const calendarEventTypeSchema = z.enum([
  'routine',
  'task',
  'event', // Future: external events
]);

export type CalendarEventType = z.infer<typeof calendarEventTypeSchema>;

// ============================================================================
// CALENDAR VIEW TYPES
// ============================================================================

export const calendarViewSchema = z.enum(['day', 'week', 'month']);

export type CalendarView = z.infer<typeof calendarViewSchema>;

// ============================================================================
// CALENDAR EVENT (Unified view for display)
// ============================================================================

export const calendarEventSchema = z.object({
  id: z.string().uuid(),
  type: calendarEventTypeSchema,
  title: z.string(),
  start: z.date(),
  end: z.date(),
  allDay: z.boolean().default(false),
  
  // Styling
  color: z.string().optional(), // Domain color
  icon: z.string().optional(),  // Domain icon
  
  // Status
  status: z.string().optional(),
  isCompleted: z.boolean().default(false),
  
  // Domain info
  domainId: z.string().uuid().nullable(),
  domainName: z.string().nullable(),
  domainColor: z.string().nullable(),
  
  // Original entity reference
  entityType: z.enum(['routine_instance', 'task']),
  entityId: z.string().uuid(),
  
  // Additional data for display
  priority: z.enum(['high', 'medium', 'low']).optional(),
  isFlexible: z.boolean().default(true),
  projectName: z.string().nullable().optional(),
  
  // Routine-task linkage
  linkedTaskId: z.string().uuid().nullable().optional(),
  
  // Timer (for tasks)
  timerIsRunning: z.boolean().optional(),
  timerAccumulatedSeconds: z.number().optional(),
  
  // Actual time tracking (for AI stats)
  actualStart: z.date().nullable().optional(),
  actualEnd: z.date().nullable().optional(),
  
  // Checklist progress (for routines)
  checklistTotal: z.number().optional(),
  checklistCompleted: z.number().optional(),
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;

// ============================================================================
// CALENDAR DATA RANGE REQUEST
// ============================================================================

export const calendarRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

export type CalendarRange = z.infer<typeof calendarRangeSchema>;

// ============================================================================
// CALENDAR DATA RESPONSE
// ============================================================================

export const calendarDataSchema = z.object({
  routineInstances: z.array(routineInstanceSchema.extend({
    template: z.object({
      name: z.string(),
      category_moment: z.string().nullable(),
      category_type: z.string().nullable(),
      is_flexible: z.boolean(),
      priority: z.string(),
    }),
    domain: z.object({
      id: z.string().uuid(),
      name: z.string(),
      color: z.string(),
      icon: z.string(),
    }).nullable(),
  })),
  tasks: z.array(taskSchema.extend({
    domain: z.object({
      id: z.string().uuid(),
      name: z.string(),
      color: z.string(),
      icon: z.string(),
    }).nullable(),
    project: z.object({
      id: z.string().uuid(),
      name: z.string(),
    }).nullable(),
  })),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

export type CalendarData = z.infer<typeof calendarDataSchema>;

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

export const conflictSchema = z.object({
  id: z.string(),
  event1: calendarEventSchema,
  event2: calendarEventSchema,
  overlapMinutes: z.number(),
  date: z.string(),
});

export type Conflict = z.infer<typeof conflictSchema>;

// ============================================================================
// MOVE EVENT (Drag & Drop)
// ============================================================================

export const moveEventSchema = z.object({
  eventId: z.string().uuid({ message: 'Invalid event ID' }),
  entityType: z.enum(['routine_instance', 'task']),
  newStart: z.string(), // ISO datetime or time string
  newEnd: z.string().optional(),
});

export type MoveEventInput = z.infer<typeof moveEventSchema>;
