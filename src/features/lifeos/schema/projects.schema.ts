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
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z.string().max(2000).nullable().optional(),
  domain_id: z.string().uuid('Invalid domain ID').nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').nullable().optional(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ============================================================================
// UPDATE PROJECT
// ============================================================================

export const updateProjectSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).nullable().optional(),
  domain_id: z.string().uuid().nullable().optional(),
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
  progress_percentage: z.number(),
  total_estimated_minutes: z.number(),
  total_actual_minutes: z.number(),
});

export type ProjectWithMetrics = z.infer<typeof projectWithMetricsSchema>;
