/**
 * LifeOS Tasks - Zod Validation Schemas
 * 
 * @module lifeos/schema/tasks
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const taskStatusSchema = z.enum([
  'backlog',
  'todo',
  'in_progress',
  'blocked',
  'done',
  'cancelled',
  'archived',
]);

export const taskPrioritySchema = z.enum(['high', 'medium', 'low']);

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

// Valid status transitions
export const VALID_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  backlog: ['todo', 'cancelled', 'archived'],
  todo: ['in_progress', 'blocked', 'cancelled', 'archived', 'backlog'],
  in_progress: ['done', 'blocked', 'cancelled', 'todo'],
  blocked: ['todo', 'in_progress', 'cancelled'],
  done: ['archived', 'todo'], // Allow reopening
  cancelled: ['archived', 'todo'], // Allow reopening
  archived: [], // Terminal state
};

// ============================================================================
// CREATE TASK
// ============================================================================

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z.string().max(2000).nullable().optional(),
  domain_id: z.string().uuid('Invalid domain ID').nullable().optional(),
  project_id: z.string().uuid('Invalid project ID').nullable().optional(),
  parent_task_id: z.string().uuid('Invalid parent task ID').nullable().optional(),
  priority: taskPrioritySchema.optional().default('medium'),
  estimated_minutes: z.number().int().positive().nullable().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').nullable().optional(),
  due_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)').nullable().optional(),
  is_deadline_strict: z.boolean().optional().default(false),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// ============================================================================
// UPDATE TASK
// ============================================================================

export const updateTaskSchema = z.object({
  id: z.string().uuid('Invalid task ID'),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  domain_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  parent_task_id: z.string().uuid().nullable().optional(),
  priority: taskPrioritySchema.optional(),
  estimated_minutes: z.number().int().positive().nullable().optional(),
  actual_minutes: z.number().int().nonnegative().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  due_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional(),
  is_deadline_strict: z.boolean().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ============================================================================
// UPDATE TASK STATUS
// ============================================================================

export const updateTaskStatusSchema = z.object({
  id: z.string().uuid('Invalid task ID'),
  status: taskStatusSchema,
});

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

// ============================================================================
// TASK FILTERS
// ============================================================================

export const taskFiltersSchema = z.object({
  domain_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  status: taskStatusSchema.optional(),
  statuses: z.array(taskStatusSchema).optional(),
  priority: taskPrioritySchema.optional(),
  has_due_date: z.boolean().optional(),
  due_before: z.string().optional(),
  due_after: z.string().optional(),
  is_deadline_strict: z.boolean().optional(),
  parent_task_id: z.string().uuid().nullable().optional(),
});

export type TaskFilters = z.infer<typeof taskFiltersSchema>;

// ============================================================================
// TASK SORT OPTIONS
// ============================================================================

export const taskSortOptionsSchema = z.object({
  field: z.enum(['created_at', 'updated_at', 'due_date', 'priority', 'title']),
  direction: z.enum(['asc', 'desc']),
});

export type TaskSortOptions = z.infer<typeof taskSortOptionsSchema>;

// ============================================================================
// ADD TIME TO TASK
// ============================================================================

export const addTimeToTaskSchema = z.object({
  id: z.string().uuid('Invalid task ID'),
  minutes: z.number().int().positive('Minutes must be positive'),
});

export type AddTimeToTaskInput = z.infer<typeof addTimeToTaskSchema>;

// ============================================================================
// OUTPUT TYPE
// ============================================================================

export const taskSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  domain_id: z.string().uuid().nullable(),
  project_id: z.string().uuid().nullable(),
  parent_task_id: z.string().uuid().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  estimated_minutes: z.number().nullable(),
  actual_minutes: z.number(),
  due_date: z.string().nullable(),
  due_time: z.string().nullable(),
  is_deadline_strict: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Task = z.infer<typeof taskSchema>;

// Task with optional relations
export const taskWithRelationsSchema = taskSchema.extend({
  domain: z.object({
    id: z.string().uuid(),
    name: z.string(),
    color: z.string(),
    icon: z.string(),
  }).nullable().optional(),
  project: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).nullable().optional(),
  subtasks: z.array(taskSchema).optional(),
});

export type TaskWithRelations = z.infer<typeof taskWithRelationsSchema>;
