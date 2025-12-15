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

/**
 * Reschedule a routine instance to a new time
 */
export async function rescheduleRoutineInstance(
  instanceId: string,
  newStart: string, // ISO datetime or HH:mm time
  newEnd: string    // ISO datetime or HH:mm time
): Promise<ActionResult<RoutineInstance>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!instanceId) {
    return { data: null, error: 'ID d\'instance requis' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('lifeos_routine_instances')
    .update({
      scheduled_start: newStart,
      scheduled_end: newEnd,
    })
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Create a task from a routine instance for tracking
 * Uses the database function for atomic operation
 */
export async function createTaskFromRoutine(
  instanceId: string
): Promise<ActionResult<{ taskId: string }>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!instanceId) {
    return { data: null, error: 'ID d\'instance requis' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .rpc('lifeos_create_task_from_routine', {
      p_instance_id: instanceId,
      p_user_id: user.id,
    });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { taskId: data }, error: null };
}

/**
 * Toggle a checklist item for a routine instance
 */
export async function toggleChecklistItem(
  instanceId: string,
  itemId: string,
  completed: boolean
): Promise<ActionResult<string[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!instanceId || !itemId) {
    return { data: null, error: 'IDs requis' };
  }

  // First, get current completed items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: instance, error: fetchError } = await (supabase as any)
    .from('lifeos_routine_instances')
    .select('completed_checklist_items')
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError.message };
  }

  const currentItems: string[] = instance?.completed_checklist_items || [];
  let newItems: string[];

  if (completed) {
    // Add item if not already present
    newItems = currentItems.includes(itemId) ? currentItems : [...currentItems, itemId];
  } else {
    // Remove item
    newItems = currentItems.filter(id => id !== itemId);
  }

  // Update the instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('lifeos_routine_instances')
    .update({
      completed_checklist_items: newItems,
      updated_at: new Date().toISOString(),
    })
    .eq('id', instanceId)
    .eq('user_id', user.id);

  if (updateError) {
    return { data: null, error: updateError.message };
  }

  return { data: newItems, error: null };
}

/**
 * Get checklist items for a routine instance (with template data)
 */
export async function getRoutineChecklist(
  instanceId: string
): Promise<ActionResult<{
  items: { id: string; label: string; order: number }[];
  completedIds: string[];
}>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('lifeos_routine_instances')
    .select(`
      completed_checklist_items,
      template:lifeos_routine_templates!inner(checklist_items)
    `)
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  const template = data.template as { checklist_items: { id: string; label: string; order: number }[] };
  const items = template?.checklist_items || [];
  const completedIds = (data.completed_checklist_items as string[]) || [];

  // Sort by order
  items.sort((a, b) => a.order - b.order);

  return { data: { items, completedIds }, error: null };
}

/**
 * Add a new checklist item to a routine template (via instance)
 * This adds the item to the template so it appears for all future instances
 */
export async function addChecklistItem(
  instanceId: string,
  label: string
): Promise<ActionResult<{ id: string; label: string; order: number }>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Get the instance to find the template_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: instance, error: instanceError } = await (supabase as any)
    .from('lifeos_routine_instances')
    .select('template_id')
    .eq('id', instanceId)
    .eq('user_id', user.id)
    .single();

  if (instanceError || !instance) {
    return { data: null, error: 'Instance non trouvée' };
  }

  // Get current checklist from template
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: template, error: templateError } = await (supabase as any)
    .from('lifeos_routine_templates')
    .select('checklist_items')
    .eq('id', instance.template_id)
    .eq('user_id', user.id)
    .single();

  if (templateError) {
    return { data: null, error: templateError.message };
  }

  const currentItems = (template?.checklist_items as { id: string; label: string; order: number }[]) || [];
  
  // Create new item
  const newItem = {
    id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    label: label.trim(),
    order: currentItems.length + 1
  };

  const updatedItems = [...currentItems, newItem];

  // Update template
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('lifeos_routine_templates')
    .update({ checklist_items: updatedItems })
    .eq('id', instance.template_id)
    .eq('user_id', user.id);

  if (updateError) {
    return { data: null, error: updateError.message };
  }

  return { data: newItem, error: null };
}

/**
 * Update actual start/end times for a routine instance
 * Used for tracking when the user actually performed the routine
 */
export async function updateRoutineActualTimes(
  instanceId: string,
  actualStart: string | null,
  actualEnd: string | null
): Promise<ActionResult<boolean>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Build update object only with provided values
  const updates: { actual_start?: string | null; actual_end?: string | null; updated_at: string } = {
    updated_at: new Date().toISOString()
  };
  
  if (actualStart !== undefined) {
    updates.actual_start = actualStart;
  }
  if (actualEnd !== undefined) {
    updates.actual_end = actualEnd;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('lifeos_routine_instances')
    .update(updates)
    .eq('id', instanceId)
    .eq('user_id', user.id);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: true, error: null };
}

/**
 * Start a routine instance (record actual_start = now)
 */
export async function startRoutineInstance(
  instanceId: string
): Promise<ActionResult<boolean>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('lifeos_routine_instances')
    .update({ 
      actual_start: new Date().toISOString(),
      status: 'in_progress',
      updated_at: new Date().toISOString()
    })
    .eq('id', instanceId)
    .eq('user_id', user.id);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: true, error: null };
}
