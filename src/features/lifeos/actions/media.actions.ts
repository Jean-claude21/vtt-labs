/**
 * LifeOS Media Server Actions
 * 
 * Server Actions for tracking media (progress photos).
 * 
 * @module lifeos/actions/media
 */
'use server';

import { createSSRClient } from '@/lib/supabase/server';
import { mediaService } from '../services/media.service';
import { 
  uploadMediaSchema,
  updateMediaSchema,
  mediaFiltersSchema,
  deleteMediaSchema,
  type TrackingMedia,
  type MediaFilters,
} from '../schema/media.schema';
import type { ActionResult } from '@/lib/types';

/**
 * Get all tracking media for current user
 */
export async function getTrackingMedia(
  filters?: MediaFilters
): Promise<ActionResult<TrackingMedia[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate filters if provided
  if (filters) {
    const parsed = mediaFiltersSchema.safeParse(filters);
    if (!parsed.success) {
      return { data: null, error: 'Filtres invalides' };
    }
  }

  const result = await mediaService.getAll(supabase, user.id, filters);
  return result;
}

/**
 * Get a single tracking media by ID
 */
export async function getTrackingMediaById(
  mediaId: string
): Promise<ActionResult<TrackingMedia>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await mediaService.getById(supabase, user.id, mediaId);
  return result;
}

/**
 * Create tracking media record (after file upload)
 */
export async function createTrackingMedia(
  input: {
    entity_type: 'routine_instance' | 'task';
    entity_id: string;
    file_name: string;
    file_type: string;
    file_size?: number;
    media_category?: 'photo' | 'video' | 'audio' | 'document' | 'other';
    caption?: string;
    duration_seconds?: number;
  },
  filePath: string
): Promise<ActionResult<TrackingMedia>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate input
  const parsed = uploadMediaSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { data: null, error: firstError?.message || 'Données invalides' };
  }

  const result = await mediaService.create(supabase, user.id, parsed.data, filePath);
  return result;
}

/**
 * Update tracking media metadata
 */
export async function updateTrackingMedia(
  input: {
    id: string;
    caption?: string;
  }
): Promise<ActionResult<TrackingMedia>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate input
  const parsed = updateMediaSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { data: null, error: firstError?.message || 'Données invalides' };
  }

  const result = await mediaService.update(supabase, user.id, parsed.data);
  return result;
}

/**
 * Delete tracking media
 * Returns file_path so caller can also delete from storage
 */
export async function deleteTrackingMedia(
  mediaId: string
): Promise<ActionResult<{ file_path: string }>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate
  const parsed = deleteMediaSchema.safeParse({ id: mediaId });
  if (!parsed.success) {
    return { data: null, error: 'ID invalide' };
  }

  const result = await mediaService.delete(supabase, user.id, mediaId);
  return result;
}

/**
 * Get media grouped by entity type
 */
export async function getMediaByEntityType(): Promise<ActionResult<Record<string, TrackingMedia[]>>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await mediaService.getGroupedByEntityType(supabase, user.id);
  return result;
}

/**
 * Get media for a specific entity
 */
export async function getMediaForEntity(
  entityType: 'routine_instance' | 'task',
  entityId: string
): Promise<ActionResult<TrackingMedia[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await mediaService.getForEntity(supabase, user.id, entityType, entityId);
  return result;
}

/**
 * Get media timeline for before/after comparisons
 */
export async function getMediaTimeline(
  entityId?: string,
  limit: number = 50
): Promise<ActionResult<TrackingMedia[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await mediaService.getTimeline(supabase, user.id, entityId, limit);
  return result;
}
