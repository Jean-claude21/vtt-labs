/**
 * Profile Service
 * 
 * Business logic for profile and module access operations.
 * No Next.js dependencies - pure functions.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile, UpdateProfileInput, ModuleAccess, ModuleSlug } from '../schema/profile.schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

// ============================================================================
// Profile Operations
// ============================================================================

export const profileService = {
  /**
   * Get current user's profile
   */
  async getProfile(client: Client, userId: string): Promise<ServiceResult<Profile>> {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { data: data as Profile, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to fetch profile',
      };
    }
  },

  /**
   * Update current user's profile
   */
  async updateProfile(
    client: Client,
    userId: string,
    input: UpdateProfileInput
  ): Promise<ServiceResult<Profile>> {
    try {
      const { data, error } = await client
        .from('profiles')
        .update({
          full_name: input.full_name,
          avatar_url: input.avatar_url,
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as Profile, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to update profile',
      };
    }
  },

  /**
   * Get all profiles (admin only)
   */
  async getAllProfiles(client: Client): Promise<ServiceResult<Profile[]>> {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data: data as Profile[], error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to fetch profiles',
      };
    }
  },
};

// ============================================================================
// Module Access Operations
// ============================================================================

export const moduleAccessService = {
  /**
   * Get user's module access list
   */
  async getUserModules(client: Client, userId: string): Promise<ServiceResult<ModuleAccess[]>> {
    try {
      const { data, error } = await client
        .from('user_module_access')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return { data: data as ModuleAccess[], error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to fetch module access',
      };
    }
  },

  /**
   * Check if user has access to a specific module
   */
  async hasModuleAccess(
    client: Client,
    userId: string,
    moduleSlug: ModuleSlug
  ): Promise<ServiceResult<boolean>> {
    try {
      const { data, error } = await client.rpc('user_has_module_access', {
        p_user_id: userId,
        p_module_slug: moduleSlug,
      });

      if (error) throw error;

      return { data: data as boolean, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to check module access',
      };
    }
  },

  /**
   * Grant module access to user (admin only)
   */
  async grantAccess(
    client: Client,
    userId: string,
    moduleSlug: ModuleSlug,
    grantedBy: string
  ): Promise<ServiceResult<ModuleAccess>> {
    try {
      const { data, error } = await client
        .from('user_module_access')
        .upsert({
          user_id: userId,
          module_slug: moduleSlug,
          enabled: true,
          granted_by: grantedBy,
          granted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return { data: data as ModuleAccess, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to grant access',
      };
    }
  },

  /**
   * Revoke module access from user (admin only)
   */
  async revokeAccess(
    client: Client,
    userId: string,
    moduleSlug: ModuleSlug
  ): Promise<ServiceResult<{ success: boolean }>> {
    try {
      const { error } = await client
        .from('user_module_access')
        .update({ enabled: false })
        .eq('user_id', userId)
        .eq('module_slug', moduleSlug);

      if (error) throw error;

      return { data: { success: true }, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Failed to revoke access',
      };
    }
  },
};
