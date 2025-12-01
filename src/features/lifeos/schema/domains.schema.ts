/**
 * LifeOS Domains - Zod Validation Schemas
 * 
 * @module lifeos/schema/domains
 */

import { z } from 'zod';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const domainIdSchema = z.string().uuid('Invalid domain ID');

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #14B8A6)');

// ============================================================================
// CREATE DOMAIN
// ============================================================================

export const createDomainSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be 50 characters or less'),
  icon: z.string().min(1).max(10).default('📌'),
  color: hexColorSchema.default('#6B7280'),
  vision: z.string().max(500, 'Vision must be 500 characters or less').nullable().optional(),
  daily_target_minutes: z.number().int().positive().nullable().optional(),
  weekly_target_minutes: z.number().int().positive().nullable().optional(),
});

export type CreateDomainInput = z.infer<typeof createDomainSchema>;

// ============================================================================
// UPDATE DOMAIN
// ============================================================================

export const updateDomainSchema = z.object({
  id: domainIdSchema,
  name: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(10).optional(),
  color: hexColorSchema.optional(),
  vision: z.string().max(500).nullable().optional(),
  daily_target_minutes: z.number().int().positive().nullable().optional(),
  weekly_target_minutes: z.number().int().positive().nullable().optional(),
  sort_order: z.number().int().nonnegative().optional(),
});

export type UpdateDomainInput = z.infer<typeof updateDomainSchema>;

// ============================================================================
// REORDER DOMAINS
// ============================================================================

export const reorderDomainsSchema = z.object({
  orderedIds: z.array(domainIdSchema).min(1, 'At least one domain ID is required'),
});

export type ReorderDomainsInput = z.infer<typeof reorderDomainsSchema>;

// ============================================================================
// DOMAIN OUTPUT TYPE
// ============================================================================

export const domainSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  vision: z.string().nullable(),
  daily_target_minutes: z.number().nullable(),
  weekly_target_minutes: z.number().nullable(),
  sort_order: z.number(),
  is_default: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Domain = z.infer<typeof domainSchema>;
