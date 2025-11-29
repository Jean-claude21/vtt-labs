/**
 * Profile Actions
 * 
 * Server Actions for profile and module access operations.
 */

'use server';

import { createSSRSassClient } from '@/lib/supabase/server';
import { profileService, moduleAccessService } from '../services/profile.service';
import { updateProfileSchema, type UpdateProfileInput, type ModuleSlug } from '../schema/profile.schema';

// ============================================================================
// Profile Actions
// ============================================================================

export async function getProfile() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();
  
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  return profileService.getProfile(client, user.id);
}

export async function updateProfile(input: UpdateProfileInput) {
  const validated = updateProfileSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0]?.message ?? 'Validation failed' };
  }

  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();
  
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  return profileService.updateProfile(client, user.id, validated.data);
}

export async function getAllProfiles() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();
  
  // RLS will enforce admin-only access
  return profileService.getAllProfiles(client);
}

// ============================================================================
// Module Access Actions
// ============================================================================

export async function getUserModules() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();
  
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  return moduleAccessService.getUserModules(client, user.id);
}

export async function checkModuleAccess(moduleSlug: ModuleSlug) {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();
  
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return { data: false, error: 'Not authenticated' };
  }

  return moduleAccessService.hasModuleAccess(client, user.id, moduleSlug);
}

export async function grantModuleAccess(userId: string, moduleSlug: ModuleSlug) {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();
  
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  // RLS will enforce admin-only access
  return moduleAccessService.grantAccess(client, userId, moduleSlug, user.id);
}

export async function revokeModuleAccess(userId: string, moduleSlug: ModuleSlug) {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();
  
  // RLS will enforce admin-only access
  return moduleAccessService.revokeAccess(client, userId, moduleSlug);
}
