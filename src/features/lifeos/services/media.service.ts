/**
 * LifeOS Tracking Media Service
 * 
 * Handles media attachments for tracking/progress photos.
 * 
 * @module lifeos/services/media
 */

import type { DbClient } from '@/lib/types';
import type { 
  TrackingMedia, 
  UploadMediaInput, 
  UpdateMediaInput,
  MediaFilters,
} from '../schema/media.schema';

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export const mediaService = {
  /**
   * Get all media for a user with optional filters
   */
  async getAll(
    client: DbClient,
    userId: string,
    filters?: MediaFilters
  ): Promise<ServiceResult<TrackingMedia[]>> {
    let query = client
      .from('lifeos_tracking_media')
      .select('*')
      .eq('user_id', userId);

    // Apply filters
    if (filters?.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }
    if (filters?.entity_id) {
      query = query.eq('entity_id', filters.entity_id);
    }
    if (filters?.media_category) {
      query = query.eq('media_category', filters.media_category);
    }

    // Default order by created_at descending
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as TrackingMedia[], error: null };
  },

  /**
   * Get a single media by ID
   */
  async getById(
    client: DbClient,
    userId: string,
    mediaId: string
  ): Promise<ServiceResult<TrackingMedia>> {
    const { data, error } = await client
      .from('lifeos_tracking_media')
      .select('*')
      .eq('id', mediaId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as TrackingMedia, error: null };
  },

  /**
   * Create new tracking media record
   * Note: File upload should be handled separately via storage service
   */
  async create(
    client: DbClient,
    userId: string,
    input: UploadMediaInput,
    filePath: string
  ): Promise<ServiceResult<TrackingMedia>> {
    const { data, error } = await client
      .from('lifeos_tracking_media')
      .insert({
        user_id: userId,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        file_path: filePath,
        file_name: input.file_name,
        file_type: input.file_type,
        file_size: input.file_size ?? null,
        media_category: input.media_category ?? null,
        caption: input.caption ?? null,
        duration_seconds: input.duration_seconds ?? null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as TrackingMedia, error: null };
  },

  /**
   * Update tracking media metadata
   */
  async update(
    client: DbClient,
    userId: string,
    input: UpdateMediaInput
  ): Promise<ServiceResult<TrackingMedia>> {
    const { id, ...updateData } = input;

    const { data, error } = await client
      .from('lifeos_tracking_media')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as TrackingMedia, error: null };
  },

  /**
   * Delete tracking media
   * Note: File deletion should be handled separately via storage service
   */
  async delete(
    client: DbClient,
    userId: string,
    mediaId: string
  ): Promise<ServiceResult<{ file_path: string }>> {
    // First get the file path so we can delete from storage
    const { data: media, error: fetchError } = await client
      .from('lifeos_tracking_media')
      .select('file_path')
      .eq('id', mediaId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !media) {
      return { data: null, error: 'Media not found' };
    }

    // Delete the record
    const { error: deleteError } = await client
      .from('lifeos_tracking_media')
      .delete()
      .eq('id', mediaId)
      .eq('user_id', userId);

    if (deleteError) {
      return { data: null, error: deleteError.message };
    }

    return { data: { file_path: media.file_path }, error: null };
  },

  /**
   * Get media for a specific entity (routine instance or task)
   */
  async getForEntity(
    client: DbClient,
    userId: string,
    entityType: 'routine_instance' | 'task',
    entityId: string
  ): Promise<ServiceResult<TrackingMedia[]>> {
    const { data, error } = await client
      .from('lifeos_tracking_media')
      .select('*')
      .eq('user_id', userId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as TrackingMedia[], error: null };
  },

  /**
   * Get media grouped by entity type for gallery view
   */
  async getGroupedByEntityType(
    client: DbClient,
    userId: string
  ): Promise<ServiceResult<Record<string, TrackingMedia[]>>> {
    const { data, error } = await client
      .from('lifeos_tracking_media')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    // Group by entity_type
    const grouped: Record<string, TrackingMedia[]> = {
      routine_instance: [],
      task: [],
    };
    for (const media of data ?? []) {
      const entityType = media.entity_type as string;
      if (grouped[entityType]) {
        grouped[entityType].push(media as TrackingMedia);
      }
    }

    return { data: grouped, error: null };
  },

  /**
   * Get media timeline (for before/after comparisons)
   */
  async getTimeline(
    client: DbClient,
    userId: string,
    entityId?: string,
    limit: number = 50
  ): Promise<ServiceResult<TrackingMedia[]>> {
    let query = client
      .from('lifeos_tracking_media')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as TrackingMedia[], error: null };
  },
};
