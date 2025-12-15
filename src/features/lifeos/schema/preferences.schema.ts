/**
 * LifeOS User Preferences - Zod Validation Schemas
 * 
 * @module lifeos/schema/preferences
 */

import { z } from 'zod';
import { calendarViewSchema } from './calendar.schema';

// ============================================================================
// TIME BLOCKS - User-defined time ranges for category moments
// ============================================================================

export const timeRangeSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:mm requis'),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:mm requis'),
});

export const timeBlocksSchema = z.object({
  morning: timeRangeSchema.default({ start: '06:00', end: '12:00' }),
  noon: timeRangeSchema.default({ start: '12:00', end: '14:00' }),
  afternoon: timeRangeSchema.default({ start: '14:00', end: '18:00' }),
  evening: timeRangeSchema.default({ start: '18:00', end: '21:00' }),
  night: timeRangeSchema.default({ start: '21:00', end: '23:59' }),
});

export type TimeRange = z.infer<typeof timeRangeSchema>;
export type TimeBlocks = z.infer<typeof timeBlocksSchema>;

// ============================================================================
// PREFERENCES
// ============================================================================

export const userPreferencesSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  
  // Calendar
  default_calendar_view: calendarViewSchema.default('week'),
  week_starts_on: z.number().int().min(0).max(6).default(1), // 0=Sunday, 1=Monday
  
  // Display filters
  show_routines: z.boolean().default(true),
  show_tasks: z.boolean().default(true),
  show_external_events: z.boolean().default(true),
  hidden_domain_ids: z.array(z.string().uuid()).default([]),
  
  // Time blocks for category moments (dynamic, user-defined)
  time_blocks: timeBlocksSchema.default({
    morning: { start: '06:00', end: '12:00' },
    noon: { start: '12:00', end: '14:00' },
    afternoon: { start: '14:00', end: '18:00' },
    evening: { start: '18:00', end: '21:00' },
    night: { start: '21:00', end: '23:59' },
  }),
  
  // Auto-positioning settings
  auto_position_routines: z.boolean().default(true), // Use constraints/category_moment to auto-position
  auto_position_tasks: z.boolean().default(false),   // Tasks stay in "to plan" by default
  
  // Planning
  routine_generation_horizon_days: z.number().int().min(7).max(90).default(14),
  
  // Extensible
  preferences: z.record(z.string(), z.unknown()).default({}),
  
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// ============================================================================
// UPDATE PREFERENCES
// ============================================================================

export const updatePreferencesSchema = z.object({
  default_calendar_view: calendarViewSchema.optional(),
  week_starts_on: z.number().int().min(0).max(6).optional(),
  show_routines: z.boolean().optional(),
  show_tasks: z.boolean().optional(),
  show_external_events: z.boolean().optional(),
  hidden_domain_ids: z.array(z.string().uuid()).optional(),
  time_blocks: timeBlocksSchema.partial().optional(),
  auto_position_routines: z.boolean().optional(),
  auto_position_tasks: z.boolean().optional(),
  routine_generation_horizon_days: z.number().int().min(7).max(90).optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

// ============================================================================
// CALENDAR FILTERS (Runtime state, not persisted)
// ============================================================================

export const calendarFiltersSchema = z.object({
  showRoutines: z.boolean().default(true),
  showTasks: z.boolean().default(true),
  showExternalEvents: z.boolean().default(true),
  hiddenDomainIds: z.array(z.string().uuid()).default([]),
});

export type CalendarFilters = z.infer<typeof calendarFiltersSchema>;
