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

// ============================================================================
// Admin Actions
// ============================================================================

export async function updateUserRole(userId: string, role: 'admin' | 'user') {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();
  
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  // Prevent self-demotion
  if (user.id === userId && role !== 'admin') {
    return { data: null, error: 'Cannot demote yourself' };
  }

  const { data, error } = await client
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function deleteUser(userId: string) {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();
  
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  // Prevent self-deletion
  if (user.id === userId) {
    return { data: null, error: 'Cannot delete yourself' };
  }

  // Delete module access first
  await client
    .from('user_module_access')
    .delete()
    .eq('user_id', userId);

  // Delete profile (cascades from auth.users via trigger if needed)
  const { error } = await client
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: true, error: null };
}

export async function inviteUser(email: string, role: 'admin' | 'user' = 'user') {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();
  
  // Use Supabase admin invite (requires service role or admin API)
  // For now, we'll create a profile placeholder that will be linked on signup
  // This is a simplified approach - in production, use Supabase Admin API
  
  const { data: existingUser } = await client
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return { data: null, error: 'User already exists' };
  }

  // In a real scenario, you'd use supabase.auth.admin.inviteUserByEmail()
  // For now, return info that invite should be done manually
  return { 
    data: { email, role, message: 'User should register with this email' }, 
    error: null 
  };
}

export async function grantAllModules(userId: string) {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();
  
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const moduleSlugs: ModuleSlug[] = ['tasks', 'okr', 'finance', 'ai-agents', 'chat', 'health', 'notes', 'learning'];
  
  const results = await Promise.all(
    moduleSlugs.map(slug => moduleAccessService.grantAccess(client, userId, slug, user.id))
  );

  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    return { data: null, error: 'Some modules failed to grant' };
  }

  return { data: true, error: null };
}

export async function revokeAllModules(userId: string) {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();
  
  const { error } = await client
    .from('user_module_access')
    .delete()
    .eq('user_id', userId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: true, error: null };
}
