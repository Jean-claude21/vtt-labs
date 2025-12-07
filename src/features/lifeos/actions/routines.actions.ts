/**
 * LifeOS Routines Server Actions
 * 
 * Server Actions for routine template CRUD operations.
 * 
 * @module lifeos/actions/routines
 */
'use server';

import { createSSRClient } from '@/lib/supabase/server';
import { routineService } from '../services/routines.service';
import { routineInstanceService } from '../services/routine-instances.service';
import { streakService } from '../services/streaks.service';
import { 
  createRoutineTemplateSchema, 
  updateRoutineTemplateSchema,
  routineFiltersSchema,
  type RoutineTemplate,
  type RoutineFilters,
  type RoutineInstance,
} from '../schema/routines.schema';
import type { ActionResult } from '@/lib/types';
import type { StreakStats } from '../services/streaks.service';

/**
 * Get all routine templates for the current user
 */
export async function getRoutines(
  filters?: RoutineFilters
): Promise<ActionResult<RoutineTemplate[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate filters if provided
  if (filters) {
    const parsed = routineFiltersSchema.safeParse(filters);
    if (!parsed.success) {
      return { data: null, error: 'Filtres invalides' };
    }
  }

  const result = await routineService.getAll(supabase, user.id, filters);
  return result;
}

/**
 * Get all routine templates with their streak information
 */
export async function getRoutinesWithStreaks(
  filters?: RoutineFilters
): Promise<ActionResult<(RoutineTemplate & { streak: { current_streak: number; longest_streak: number } | null })[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate filters if provided
  if (filters) {
    const parsed = routineFiltersSchema.safeParse(filters);
    if (!parsed.success) {
      return { data: null, error: 'Filtres invalides' };
    }
  }

  const result = await routineService.getAllWithStreaks(supabase, user.id, filters);
  return result;
}

/**
 * Get a single routine template by ID
 */
export async function getRoutine(
  routineId: string
): Promise<ActionResult<RoutineTemplate>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!routineId) {
    return { data: null, error: 'ID de routine requis' };
  }

  const result = await routineService.getById(supabase, user.id, routineId);
  return result;
}

/**
 * Get a routine with its streak info
 */
export async function getRoutineWithStreak(
  routineId: string
): Promise<ActionResult<RoutineTemplate & { streak: { current_streak: number; longest_streak: number } | null }>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!routineId) {
    return { data: null, error: 'ID de routine requis' };
  }

  const result = await routineService.getWithStreak(supabase, user.id, routineId);
  return result;
}

/**
 * Create a new routine template
 */
export async function createRoutine(
  input: unknown
): Promise<ActionResult<RoutineTemplate>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate input
  const parsed = createRoutineTemplateSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map(e => e.message).join(', ');
    return { data: null, error: `Données invalides: ${errors}` };
  }

  const result = await routineService.create(supabase, user.id, parsed.data);
  return result;
}

/**
 * Update an existing routine template
 */
export async function updateRoutine(
  input: unknown
): Promise<ActionResult<RoutineTemplate>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate input
  const parsed = updateRoutineTemplateSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map(e => e.message).join(', ');
    return { data: null, error: `Données invalides: ${errors}` };
  }

  const result = await routineService.update(supabase, user.id, parsed.data);
  return result;
}

/**
 * Delete a routine template
 */
export async function deleteRoutine(
  routineId: string
): Promise<ActionResult<{ success: boolean }>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!routineId) {
    return { data: null, error: 'ID de routine requis' };
  }

  const result = await routineService.delete(supabase, user.id, routineId);
  return result;
}

/**
 * Toggle routine active status
 */
export async function toggleRoutineActive(
  routineId: string
): Promise<ActionResult<RoutineTemplate>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!routineId) {
    return { data: null, error: 'ID de routine requis' };
  }

  const result = await routineService.toggleActive(supabase, user.id, routineId);
  return result;
}

// =============================================================================
// ROUTINE INSTANCE TRACKING ACTIONS
// =============================================================================

/**
 * Complete a routine instance
 */
export async function completeRoutineInstance(
  input: {
    id: string;
    actual_value?: number;
    mood_before?: number;
    mood_after?: number;
    energy_level?: number;
    notes?: string;
  }
): Promise<ActionResult<RoutineInstance>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!input.id) {
    return { data: null, error: 'ID de routine instance requis' };
  }

  const result = await routineInstanceService.complete(
    supabase, 
    user.id, 
    input.id,
    {
      actual_value: input.actual_value,
      mood_before: input.mood_before,
      mood_after: input.mood_after,
      energy_level: input.energy_level,
      notes: input.notes,
      status: 'completed',
    }
  );
  return result;
}

/**
 * Mark a routine instance as partially completed
 */
export async function partialRoutineInstance(
  input: {
    id: string;
    actual_value?: number;
    mood_before?: number;
    mood_after?: number;
    energy_level?: number;
    notes?: string;
  }
): Promise<ActionResult<RoutineInstance>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!input.id) {
    return { data: null, error: 'ID de routine instance requis' };
  }

  const result = await routineInstanceService.complete(
    supabase, 
    user.id, 
    input.id,
    {
      actual_value: input.actual_value,
      mood_before: input.mood_before,
      mood_after: input.mood_after,
      energy_level: input.energy_level,
      notes: input.notes,
      status: 'partial',
    }
  );
  return result;
}

/**
 * Skip a routine instance with reason
 */
export async function skipRoutineInstance(
  input: {
    id: string;
    skip_reason: string;
  }
): Promise<ActionResult<RoutineInstance>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!input.id) {
    return { data: null, error: 'ID de routine instance requis' };
  }

  const result = await routineInstanceService.skip(supabase, user.id, input.id, input.skip_reason);
  return result;
}

/**
 * Get routine instance by ID with template details
 */
export async function getRoutineInstance(
  instanceId: string
): Promise<ActionResult<RoutineInstance & { template: unknown }>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!instanceId) {
    return { data: null, error: 'ID de routine instance requis' };
  }

  const result = await routineInstanceService.getById(supabase, user.id, instanceId);
  return result;
}

/**
 * Get streak stats for a routine
 */
export async function getRoutineStreakStats(
  routineTemplateId: string,
  days: number = 30
): Promise<ActionResult<StreakStats>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!routineTemplateId) {
    return { data: null, error: 'ID de routine template requis' };
  }

  const result = await streakService.calculateCompletionRate(
    supabase, 
    user.id, 
    routineTemplateId, 
    days
  );
  return result;
}

/**
 * Get top streaks for current user
 */
export async function getTopStreaks(
  limit: number = 5
): Promise<ActionResult<{ routine_name: string; current_streak: number; longest_streak: number }[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await streakService.getTopStreaks(supabase, user.id, limit);
  
  if (result.error || !result.data) {
    return { data: null, error: result.error };
  }

  return {
    data: result.data.map(s => ({
      routine_name: s.routine_name,
      current_streak: s.current_streak,
      longest_streak: s.longest_streak,
    })),
    error: null,
  };
}
