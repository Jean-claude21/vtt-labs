/**
 * LifeOS Planning - Zod Validation Schemas
 * 
 * @module lifeos/schema/planning
 */

import { z } from 'zod';

// ============================================================================
// TIME SLOT CONFIG
// ============================================================================

export interface TimeSlotConfig {
  dayStart: string; // HH:MM
  dayEnd: string; // HH:MM
  slotDuration: number; // minutes
  minBreakBetweenSlots: number; // minutes
}

// ============================================================================
// ENUMS
// ============================================================================

export const planStatusSchema = z.enum(['draft', 'active', 'completed']);

export const slotTypeSchema = z.enum([
  'routine',
  'task',
  'break',
  'buffer',
  'event',
]);

export const entityTypeSchema = z.enum(['routine_instance', 'task']);

export type PlanStatus = z.infer<typeof planStatusSchema>;
export type SlotType = z.infer<typeof slotTypeSchema>;
export type EntityType = z.infer<typeof entityTypeSchema>;

// ============================================================================
// GENERATE PLAN INPUT
// ============================================================================

export const generatePlanInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  wake_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format').optional().default('07:00'),
  sleep_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format').optional().default('23:00'),
  include_tasks: z.boolean().optional().default(true),
  max_task_slots: z.number().int().positive().optional().default(5),
});

export type GeneratePlanInput = z.infer<typeof generatePlanInputSchema>;

// ============================================================================
// UPDATE PLAN SLOT
// ============================================================================

export const updatePlanSlotSchema = z.object({
  id: z.string().uuid('Invalid slot ID'),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format').optional(),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format').optional(),
  sort_order: z.number().int().nonnegative().optional(),
});

export type UpdatePlanSlotInput = z.infer<typeof updatePlanSlotSchema>;

// ============================================================================
// MOVE PLAN SLOT
// ============================================================================

export const movePlanSlotSchema = z.object({
  id: z.string().uuid('Invalid slot ID'),
  new_start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format'),
});

export type MovePlanSlotInput = z.infer<typeof movePlanSlotSchema>;

// ============================================================================
// OUTPUT TYPES
// ============================================================================

export const generatedPlanSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  date: z.string(),
  status: planStatusSchema,
  generation_params: z.record(z.string(), z.unknown()).nullable(),
  ai_model: z.string().nullable(),
  optimization_score: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type GeneratedPlan = z.infer<typeof generatedPlanSchema>;

export const planSlotSchema = z.object({
  id: z.string().uuid(),
  plan_id: z.string().uuid(),
  user_id: z.string().uuid(),
  start_time: z.string(),
  end_time: z.string(),
  slot_type: slotTypeSchema,
  entity_type: entityTypeSchema.nullable(),
  entity_id: z.string().uuid().nullable(),
  ai_reasoning: z.string().nullable(),
  sort_order: z.number(),
  is_locked: z.boolean(),
  was_executed: z.boolean(),
  created_at: z.string(),
});

export type PlanSlot = z.infer<typeof planSlotSchema>;

// Plan slot with entity details
export const planSlotWithDetailsSchema = planSlotSchema.extend({
  routine_instance: z.object({
    id: z.string().uuid(),
    template: z.object({
      id: z.string().uuid(),
      name: z.string(),
      domain_id: z.string().uuid().nullable(),
    }),
    status: z.string(),
    completion_score: z.number().nullable(),
  }).nullable().optional(),
  task: z.object({
    id: z.string().uuid(),
    title: z.string(),
    domain_id: z.string().uuid().nullable(),
    priority: z.string(),
    status: z.string(),
  }).nullable().optional(),
  domain: z.object({
    id: z.string().uuid(),
    name: z.string(),
    color: z.string(),
    icon: z.string(),
  }).nullable().optional(),
});

export type PlanSlotWithDetails = z.infer<typeof planSlotWithDetailsSchema>;

// ============================================================================
// AI SCHEDULING TYPES
// ============================================================================

export const schedulingInputSchema = z.object({
  date: z.string(),
  wake_time: z.string(),
  sleep_time: z.string(),
  routines: z.array(z.object({
    id: z.string().uuid(),
    instance_id: z.string().uuid(),
    name: z.string(),
    domain_name: z.string().nullable(),
    duration_minutes: z.number().nullable(),
    time_slot: z.object({
      required: z.boolean(),
      start_time: z.string().nullable(),
      end_time: z.string().nullable(),
    }).nullable(),
    is_flexible: z.boolean(),
    priority: z.string(),
  })),
  tasks: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    domain_name: z.string().nullable(),
    estimated_minutes: z.number().nullable(),
    priority: z.string(),
    due_date: z.string().nullable(),
    is_deadline_strict: z.boolean(),
  })),
});

export type SchedulingInput = z.infer<typeof schedulingInputSchema>;

export const schedulingOutputSchema = z.object({
  slots: z.array(z.object({
    start_time: z.string(),
    end_time: z.string(),
    slot_type: slotTypeSchema,
    entity_type: entityTypeSchema.nullable(),
    entity_id: z.string().uuid().nullable(),
    reasoning: z.string(),
    is_locked: z.boolean(),
  })),
  unplaced_items: z.array(z.object({
    entity_id: z.string().uuid(),
    entity_type: entityTypeSchema,
    reason: z.string(),
  })),
  optimization_score: z.number().min(0).max(100),
});

export type SchedulingOutput = z.infer<typeof schedulingOutputSchema>;

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export const dailyAnalyticsSchema = z.object({
  date: z.string(),
  total_routines: z.number(),
  completed_routines: z.number(),
  skipped_routines: z.number(),
  completion_rate: z.number(),
  avg_completion_score: z.number(),
  total_tasks_completed: z.number(),
  time_by_domain: z.array(z.object({
    domain_id: z.string().uuid(),
    domain_name: z.string(),
    domain_color: z.string(),
    actual_minutes: z.number(),
    planned_minutes: z.number(),
  })),
});

export type DailyAnalytics = z.infer<typeof dailyAnalyticsSchema>;

export const weeklyAnalyticsSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  days: z.array(dailyAnalyticsSchema),
  totals: z.object({
    total_routines: z.number(),
    completed_routines: z.number(),
    avg_completion_rate: z.number(),
    total_tasks_completed: z.number(),
  }),
});

export type WeeklyAnalytics = z.infer<typeof weeklyAnalyticsSchema>;
