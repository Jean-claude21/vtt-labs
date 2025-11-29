/**
 * Profile Schemas
 * 
 * Zod validation schemas for profile-related operations.
 */

import { z } from 'zod';

// ============================================================================
// Profile Types
// ============================================================================

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  full_name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  role: z.enum(['admin', 'user']),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type Profile = z.infer<typeof profileSchema>;

// ============================================================================
// Update Profile
// ============================================================================

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  avatar_url: z.string().url('Invalid URL').optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================================================
// Module Access
// ============================================================================

export const moduleAccessSchema = z.object({
  user_id: z.string().uuid(),
  module_slug: z.string(),
  enabled: z.boolean(),
  granted_at: z.string().nullable(),
  granted_by: z.string().uuid().nullable(),
});

export type ModuleAccess = z.infer<typeof moduleAccessSchema>;

// Known module slugs
export const MODULE_SLUGS = [
  'core',
  'tasks',
  'okr',
  'finance',
  'ai-agents',
  'chat',
  'health',
  'notes',
  'learning',
] as const;

export type ModuleSlug = typeof MODULE_SLUGS[number];

export const moduleSlugSchema = z.enum(MODULE_SLUGS);
