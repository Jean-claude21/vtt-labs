/**
 * LifeOS Routines - Zod Validation Schemas
 * 
 * @module lifeos/schema/routines
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const categoryMomentSchema = z.enum([
  'morning',
  'noon', 
  'afternoon',
  'evening',
  'night',
]);

export const categoryTypeSchema = z.enum([
  'professional',
  'personal',
  'spiritual',
  'health',
  'learning',
  'leisure',
  'energy',
]);

export const routineInstanceStatusSchema = z.enum([
  'pending',
  'completed',
  'partial',
  'skipped',
]);

export const prioritySchema = z.enum(['high', 'medium', 'low']);

export type CategoryMoment = z.infer<typeof categoryMomentSchema>;
export type CategoryType = z.infer<typeof categoryTypeSchema>;
export type RoutineInstanceStatus = z.infer<typeof routineInstanceStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;

// ============================================================================
// CONSTRAINTS SCHEMA (JSONB)
// ============================================================================

export const durationConstraintSchema = z.object({
  required: z.boolean(),
  minutes: z.number().int().positive(),
});

export const timeSlotConstraintSchema = z.object({
  required: z.boolean(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
});

export const targetValueConstraintSchema = z.object({
  required: z.boolean(),
  value: z.number().positive(),
  unit: z.string().min(1).max(20),
});

export const routineConstraintsSchema = z.object({
  duration: durationConstraintSchema.optional(),
  timeSlot: timeSlotConstraintSchema.optional(),
  targetValue: targetValueConstraintSchema.optional(),
});

export type RoutineConstraints = z.infer<typeof routineConstraintsSchema>;

// ============================================================================
// RECURRENCE CONFIG SCHEMA (JSONB)
// ============================================================================

export const recurrenceConfigSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  interval: z.number().int().positive().optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
  daysOfMonth: z.array(z.number().int().min(1).max(31)).optional(),
  excludeWeekends: z.boolean().optional(),
});

export type RecurrenceConfig = z.infer<typeof recurrenceConfigSchema>;

// ============================================================================
// CREATE ROUTINE TEMPLATE
// ============================================================================

export const createRoutineTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500).nullable().optional(),
  domain_id: z.string().uuid('Invalid domain ID').nullable().optional(),
  category_moment: categoryMomentSchema.nullable().optional(),
  category_type: categoryTypeSchema.nullable().optional(),
  constraints: routineConstraintsSchema.optional().default({}),
  recurrence_rule: z.string().min(1, 'Recurrence rule is required'), // RRULE format
  recurrence_config: recurrenceConfigSchema.optional().default({ type: 'daily' }),
  priority: prioritySchema.optional().default('medium'),
  is_flexible: z.boolean().optional().default(true),
});

export type CreateRoutineTemplateInput = z.infer<typeof createRoutineTemplateSchema>;

// ============================================================================
// UPDATE ROUTINE TEMPLATE
// ============================================================================

export const updateRoutineTemplateSchema = z.object({
  id: z.string().uuid('Invalid routine ID'),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  domain_id: z.string().uuid().nullable().optional(),
  category_moment: categoryMomentSchema.nullable().optional(),
  category_type: categoryTypeSchema.nullable().optional(),
  constraints: routineConstraintsSchema.optional(),
  recurrence_rule: z.string().min(1).optional(),
  recurrence_config: recurrenceConfigSchema.optional(),
  priority: prioritySchema.optional(),
  is_flexible: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateRoutineTemplateInput = z.infer<typeof updateRoutineTemplateSchema>;

// ============================================================================
// COMPLETE ROUTINE INSTANCE
// ============================================================================

export const completeRoutineInstanceSchema = z.object({
  id: z.string().uuid('Invalid instance ID'),
  actual_start: z.string().datetime().optional(),
  actual_end: z.string().datetime().optional(),
  actual_value: z.number().optional(),
  completion_score: z.number().int().min(0).max(100).optional(),
  mood_before: z.number().int().min(1).max(5).optional(),
  mood_after: z.number().int().min(1).max(5).optional(),
  energy_level: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(1000).optional(),
});

export type CompleteRoutineInstanceInput = z.infer<typeof completeRoutineInstanceSchema>;

// ============================================================================
// SKIP ROUTINE INSTANCE
// ============================================================================

export const skipRoutineInstanceSchema = z.object({
  id: z.string().uuid('Invalid instance ID'),
  skip_reason: z.string().min(1, 'Skip reason is required').max(200),
});

export type SkipRoutineInstanceInput = z.infer<typeof skipRoutineInstanceSchema>;

// ============================================================================
// ROUTINE FILTERS
// ============================================================================

export const routineFiltersSchema = z.object({
  domain_id: z.string().uuid().optional(),
  category_moment: categoryMomentSchema.optional(),
  category_type: categoryTypeSchema.optional(),
  is_active: z.boolean().optional(),
  priority: prioritySchema.optional(),
});

export type RoutineFilters = z.infer<typeof routineFiltersSchema>;

// ============================================================================
// OUTPUT TYPES
// ============================================================================

export const routineTemplateSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  domain_id: z.string().uuid().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  category_moment: categoryMomentSchema.nullable(),
  category_type: categoryTypeSchema.nullable(),
  constraints: routineConstraintsSchema,
  recurrence_rule: z.string(),
  recurrence_config: recurrenceConfigSchema,
  priority: prioritySchema,
  is_flexible: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type RoutineTemplate = z.infer<typeof routineTemplateSchema>;

export const routineInstanceSchema = z.object({
  id: z.string().uuid(),
  template_id: z.string().uuid(),
  user_id: z.string().uuid(),
  scheduled_date: z.string(),
  scheduled_start: z.string().nullable(),
  scheduled_end: z.string().nullable(),
  actual_start: z.string().nullable(),
  actual_end: z.string().nullable(),
  actual_value: z.number().nullable(),
  status: routineInstanceStatusSchema,
  skip_reason: z.string().nullable(),
  completion_score: z.number().nullable(),
  mood_before: z.number().nullable(),
  mood_after: z.number().nullable(),
  energy_level: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type RoutineInstance = z.infer<typeof routineInstanceSchema>;

export const streakSchema = z.object({
  id: z.string().uuid(),
  template_id: z.string().uuid(),
  user_id: z.string().uuid(),
  current_streak: z.number(),
  longest_streak: z.number(),
  last_completed_date: z.string().nullable(),
  updated_at: z.string(),
});

export type Streak = z.infer<typeof streakSchema>;
