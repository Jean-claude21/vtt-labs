/**
 * LifeOS Projects - Zod Validation Schemas
 * 
 * @module lifeos/schema/projects
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const projectStatusSchema = z.enum([
  'active',
  'paused',
  'completed',
  'archived',
]);

export type ProjectStatus = z.infer<typeof projectStatusSchema>;

// ============================================================================
// CREATE PROJECT
// ============================================================================

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom doit faire 100 caractères maximum'),
  description: z.string().max(2000).nullable().optional(),
  domain_id: z.string().uuid({ message: 'ID de domaine invalide' }).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format de couleur invalide').nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').nullable().optional(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ============================================================================
// UPDATE PROJECT
// ============================================================================

export const updateProjectSchema = z.object({
  id: z.string().uuid({ message: 'ID de projet invalide' }),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).nullable().optional(),
  domain_id: z.string().uuid().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  status: projectStatusSchema.optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ============================================================================
// PROJECT FILTERS
// ============================================================================

export const projectFiltersSchema = z.object({
  domain_id: z.string().uuid().optional(),
  status: projectStatusSchema.optional(),
  statuses: z.array(projectStatusSchema).optional(),
});

export type ProjectFilters = z.infer<typeof projectFiltersSchema>;

// ============================================================================
// OUTPUT TYPE
// ============================================================================

export const projectSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  domain_id: z.string().uuid().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  status: projectStatusSchema,
  color: z.string().nullable().optional(),
  start_date: z.string().nullable(),
  target_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Project = z.infer<typeof projectSchema>;

// Project with computed metrics
export const projectWithMetricsSchema = projectSchema.extend({
  domain: z.object({
    id: z.string().uuid(),
    name: z.string(),
    color: z.string(),
    icon: z.string(),
  }).nullable().optional(),
  total_tasks: z.number(),
  completed_tasks: z.number(),
  in_progress_tasks: z.number().optional(),
  progress_percentage: z.number(),
  total_estimated_minutes: z.number(),
  total_actual_minutes: z.number(),
});

export type ProjectWithMetrics = z.infer<typeof projectWithMetricsSchema>;

// ============================================================================
// TASK DEPENDENCIES (For Gantt)
// ============================================================================

export const dependencyTypeSchema = z.enum([
  'finish_to_start',  // Default: Task B starts after Task A finishes
  'start_to_start',   // Task B starts when Task A starts
  'finish_to_finish', // Task B finishes when Task A finishes
  'start_to_finish',  // Task B finishes when Task A starts
]);

export type DependencyType = z.infer<typeof dependencyTypeSchema>;

export const taskDependencySchema = z.object({
  id: z.string().uuid(),
  predecessor_task_id: z.string().uuid(),
  successor_task_id: z.string().uuid(),
  dependency_type: dependencyTypeSchema,
  lag_days: z.number().default(0), // Delay between tasks
  created_at: z.string(),
});

export type TaskDependency = z.infer<typeof taskDependencySchema>;

export const createTaskDependencySchema = z.object({
  predecessor_task_id: z.string().uuid('Invalid predecessor task ID'),
  successor_task_id: z.string().uuid('Invalid successor task ID'),
  dependency_type: dependencyTypeSchema.default('finish_to_start'),
  lag_days: z.number().int().min(-30).max(365).default(0),
});

export type CreateTaskDependencyInput = z.infer<typeof createTaskDependencySchema>;

export const deleteTaskDependencySchema = z.object({
  id: z.string().uuid('Invalid dependency ID'),
});

export type DeleteTaskDependencyInput = z.infer<typeof deleteTaskDependencySchema>;

// ============================================================================
// GANTT DATA
// ============================================================================

export const ganttTaskSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  start: z.string().nullable(), // start_date or scheduled_date
  end: z.string().nullable(),   // end_date calculated from duration
  duration: z.number().nullable(), // In days
  progress: z.number().min(0).max(100).default(0), // Percentage
  status: z.string(),
  priority: z.string().nullable(),
  dependencies: z.array(z.string().uuid()).default([]), // Predecessor IDs
  domainColor: z.string().nullable(),
  domainName: z.string().nullable(),
});

export type GanttTask = z.infer<typeof ganttTaskSchema>;

export const ganttDataSchema = z.object({
  projectId: z.string().uuid(),
  projectName: z.string(),
  tasks: z.array(ganttTaskSchema),
  dependencies: z.array(taskDependencySchema),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

export type GanttData = z.infer<typeof ganttDataSchema>;
