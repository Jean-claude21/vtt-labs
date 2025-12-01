/**
 * LifeOS Domains Service
 * 
 * Pure service functions for domain CRUD operations.
 * No Next.js dependencies - can be tested independently.
 * 
 * @module lifeos/services/domains
 */

import type { DbClient } from '@/lib/types';
import type { 
  Domain, 
  CreateDomainInput, 
  UpdateDomainInput 
} from '../schema/domains.schema';

// Result type following ActionResult pattern
export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

// Default domains to seed for new users
const DEFAULT_DOMAINS: Omit<CreateDomainInput, 'user_id'>[] = [
  { name: 'Spiritualité', icon: '🙏', color: '#8B5CF6', vision: 'Cultiver ma connexion spirituelle et ma paix intérieure' },
  { name: 'Santé & Bien-être', icon: '💪', color: '#10B981', vision: 'Maintenir une santé optimale et un bien-être durable' },
  { name: 'Carrière & Business', icon: '💼', color: '#F59E0B', vision: 'Développer ma carrière et atteindre mes objectifs professionnels' },
  { name: 'Développement Personnel', icon: '📚', color: '#3B82F6', vision: 'Apprendre constamment et développer mes compétences' },
  { name: 'Relations & Social', icon: '👥', color: '#EC4899', vision: 'Cultiver des relations authentiques et significatives' },
  { name: 'Loisirs & Détente', icon: '🎮', color: '#14B8A6', vision: 'Prendre du temps pour me détendre et me ressourcer' },
  { name: 'Finance & Patrimoine', icon: '💰', color: '#EAB308', vision: 'Construire ma sécurité financière et mon patrimoine' },
  { name: 'Environnement & Cadre de vie', icon: '🏠', color: '#6366F1', vision: 'Créer un environnement propice à mon épanouissement' },
];

export const domainService = {
  /**
   * Get all domains for a user, ordered by sort_order
   */
  async getAll(client: DbClient, userId: string): Promise<ServiceResult<Domain[]>> {
    const { data, error } = await client
      .from('lifeos_domains')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  },

  /**
   * Get a single domain by ID
   */
  async getById(client: DbClient, userId: string, domainId: string): Promise<ServiceResult<Domain>> {
    const { data, error } = await client
      .from('lifeos_domains')
      .select('*')
      .eq('id', domainId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Create a new domain
   */
  async create(client: DbClient, userId: string, input: CreateDomainInput): Promise<ServiceResult<Domain>> {
    // Get current max sort_order
    const { data: existing } = await client
      .from('lifeos_domains')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (existing?.sort_order ?? -1) + 1;

    const { data, error } = await client
      .from('lifeos_domains')
      .insert({
        user_id: userId,
        name: input.name,
        icon: input.icon ?? '📌',
        color: input.color ?? '#6B7280',
        vision: input.vision ?? null,
        daily_target_minutes: input.daily_target_minutes ?? null,
        weekly_target_minutes: input.weekly_target_minutes ?? null,
        sort_order: nextSortOrder,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Update an existing domain
   */
  async update(client: DbClient, userId: string, input: UpdateDomainInput): Promise<ServiceResult<Domain>> {
    const { id, ...updateData } = input;

    // Remove undefined fields
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined)
    );

    const { data, error } = await client
      .from('lifeos_domains')
      .update(cleanData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Delete a domain (only if no linked items)
   */
  async delete(client: DbClient, userId: string, domainId: string): Promise<ServiceResult<{ success: boolean }>> {
    // Check for linked routines
    const { count: routineCount } = await client
      .from('lifeos_routine_templates')
      .select('id', { count: 'exact', head: true })
      .eq('domain_id', domainId)
      .eq('user_id', userId);

    if (routineCount && routineCount > 0) {
      return { data: null, error: `Cannot delete domain: ${routineCount} routines are linked to it` };
    }

    // Check for linked tasks
    const { count: taskCount } = await client
      .from('lifeos_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('domain_id', domainId)
      .eq('user_id', userId);

    if (taskCount && taskCount > 0) {
      return { data: null, error: `Cannot delete domain: ${taskCount} tasks are linked to it` };
    }

    // Check for linked projects
    const { count: projectCount } = await client
      .from('lifeos_projects')
      .select('id', { count: 'exact', head: true })
      .eq('domain_id', domainId)
      .eq('user_id', userId);

    if (projectCount && projectCount > 0) {
      return { data: null, error: `Cannot delete domain: ${projectCount} projects are linked to it` };
    }

    // Safe to delete
    const { error } = await client
      .from('lifeos_domains')
      .delete()
      .eq('id', domainId)
      .eq('user_id', userId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { success: true }, error: null };
  },

  /**
   * Reorder domains by providing an array of IDs in the desired order
   */
  async reorder(client: DbClient, userId: string, orderedIds: string[]): Promise<ServiceResult<Domain[]>> {
    // Update sort_order for each domain
    const updates = orderedIds.map((id, index) => 
      client
        .from('lifeos_domains')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('user_id', userId)
    );

    const results = await Promise.all(updates);
    
    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      return { data: null, error: 'Failed to reorder some domains' };
    }

    // Return updated list
    return this.getAll(client, userId);
  },

  /**
   * Seed default domains for a new user
   */
  async seedDefaults(client: DbClient, userId: string): Promise<ServiceResult<Domain[]>> {
    // Check if user already has domains
    const { data: existing } = await client
      .from('lifeos_domains')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existing && existing.length > 0) {
      // User already has domains, return them
      return this.getAll(client, userId);
    }

    // Insert default domains
    const domainsToInsert = DEFAULT_DOMAINS.map((domain, index) => ({
      user_id: userId,
      name: domain.name,
      icon: domain.icon ?? '📌',
      color: domain.color ?? '#6B7280',
      vision: domain.vision ?? null,
      daily_target_minutes: null,
      weekly_target_minutes: null,
      sort_order: index,
      is_default: true,
    }));

    const { data, error } = await client
      .from('lifeos_domains')
      .insert(domainsToInsert)
      .select();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  },

  /**
   * Check if a domain has any linked items
   */
  async hasLinkedItems(client: DbClient, userId: string, domainId: string): Promise<ServiceResult<{ hasItems: boolean; counts: { routines: number; tasks: number; projects: number } }>> {
    const [routines, tasks, projects] = await Promise.all([
      client
        .from('lifeos_routine_templates')
        .select('id', { count: 'exact', head: true })
        .eq('domain_id', domainId)
        .eq('user_id', userId),
      client
        .from('lifeos_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('domain_id', domainId)
        .eq('user_id', userId),
      client
        .from('lifeos_projects')
        .select('id', { count: 'exact', head: true })
        .eq('domain_id', domainId)
        .eq('user_id', userId),
    ]);

    const counts = {
      routines: routines.count ?? 0,
      tasks: tasks.count ?? 0,
      projects: projects.count ?? 0,
    };

    return {
      data: {
        hasItems: counts.routines > 0 || counts.tasks > 0 || counts.projects > 0,
        counts,
      },
      error: null,
    };
  },
};
