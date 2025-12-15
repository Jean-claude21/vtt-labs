/**
 * LifeOS Tracking Media - Zod Validation Schemas
 * 
 * @module lifeos/schema/media
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const mediaCategorySchema = z.enum([
  'photo',
  'video',
  'audio',
  'document',
  'other',
]);

export const mediaEntityTypeSchema = z.enum([
  'routine_instance',
  'task',
]);

export type MediaCategory = z.infer<typeof mediaCategorySchema>;
export type MediaEntityType = z.infer<typeof mediaEntityTypeSchema>;

// ============================================================================
// UPLOAD MEDIA
// ============================================================================

export const uploadMediaSchema = z.object({
  entity_type: mediaEntityTypeSchema,
  entity_id: z.string().uuid({ message: 'Invalid entity ID' }),
  file_name: z.string().min(1, 'File name is required'),
  file_type: z.string().min(1, 'File type is required'),
  file_size: z.number().int().positive().optional(),
  media_category: mediaCategorySchema.optional(),
  caption: z.string().max(500).optional(),
  duration_seconds: z.number().int().nonnegative().optional(),
});

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;

// ============================================================================
// UPDATE MEDIA
// ============================================================================

export const updateMediaSchema = z.object({
  id: z.string().uuid({ message: 'Invalid media ID' }),
  caption: z.string().max(500).optional(),
});

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

// ============================================================================
// DELETE MEDIA
// ============================================================================

export const deleteMediaSchema = z.object({
  id: z.string().uuid({ message: 'Invalid media ID' }),
});

export type DeleteMediaInput = z.infer<typeof deleteMediaSchema>;

// ============================================================================
// OUTPUT TYPE
// ============================================================================

export const trackingMediaSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  entity_type: z.string(),
  entity_id: z.string().uuid(),
  file_path: z.string(),
  file_name: z.string(),
  file_type: z.string(),
  file_size: z.number().nullable(),
  media_category: mediaCategorySchema.nullable(),
  caption: z.string().nullable(),
  thumbnail_path: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string(),
});

export type TrackingMedia = z.infer<typeof trackingMediaSchema>;

// ============================================================================
// MEDIA FILTERS
// ============================================================================

export const mediaFiltersSchema = z.object({
  entity_type: mediaEntityTypeSchema.optional(),
  entity_id: z.string().uuid().optional(),
  media_category: mediaCategorySchema.optional(),
});

export type MediaFilters = z.infer<typeof mediaFiltersSchema>;
