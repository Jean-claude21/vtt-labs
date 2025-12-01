/**
 * LifeOS Domains Server Actions
 * 
 * Server Actions for domain CRUD operations.
 * Handles authentication, validation, and calls service layer.
 * 
 * @module lifeos/actions/domains
 */

'use server';

import { createSSRClient } from '@/lib/supabase/server';
import { domainService } from '../services/domains.service';
import { 
  createDomainSchema, 
  updateDomainSchema,
  reorderDomainsSchema,
  type Domain,
  type CreateDomainInput,
  type UpdateDomainInput,
} from '../schema/domains.schema';

// Action result type
export type ActionResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Get all domains for the current user
 */
export async function getDomains(): Promise<ActionResult<Domain[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  return domainService.getAll(supabase, user.id);
}

/**
 * Get a single domain by ID
 */
export async function getDomain(id: string): Promise<ActionResult<Domain>> {
  const supabase = await createSSRClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  return domainService.getById(supabase, user.id, id);
}

/**
 * Create a new domain
 */
export async function createDomain(input: CreateDomainInput): Promise<ActionResult<Domain>> {
  // Validate input
  const validated = createDomainSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createSSRClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  return domainService.create(supabase, user.id, validated.data);
}

/**
 * Update an existing domain
 */
export async function updateDomain(input: UpdateDomainInput): Promise<ActionResult<Domain>> {
  // Validate input
  const validated = updateDomainSchema.safeParse(input);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createSSRClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  return domainService.update(supabase, user.id, validated.data);
}

/**
 * Delete a domain (only if no linked items)
 */
export async function deleteDomain(id: string): Promise<ActionResult<{ success: boolean }>> {
  if (!id) {
    return { data: null, error: 'Domain ID is required' };
  }

  const supabase = await createSSRClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  return domainService.delete(supabase, user.id, id);
}

/**
 * Reorder domains
 */
export async function reorderDomains(orderedIds: string[]): Promise<ActionResult<Domain[]>> {
  // Validate input
  const validated = reorderDomainsSchema.safeParse({ orderedIds });
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createSSRClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  return domainService.reorder(supabase, user.id, validated.data.orderedIds);
}

/**
 * Seed default domains for the current user
 */
export async function seedDefaultDomains(): Promise<ActionResult<Domain[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  return domainService.seedDefaults(supabase, user.id);
}

/**
 * Check if a domain has linked items
 */
export async function checkDomainLinkedItems(id: string): Promise<ActionResult<{ hasItems: boolean; counts: { routines: number; tasks: number; projects: number } }>> {
  if (!id) {
    return { data: null, error: 'Domain ID is required' };
  }

  const supabase = await createSSRClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  return domainService.hasLinkedItems(supabase, user.id, id);
}
