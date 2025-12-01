/**
 * LifeOS Planning Server Actions
 * 
 * Server Actions for plan generation and retrieval.
 * 
 * @module lifeos/actions/planning
 */
'use server';

import { createSSRClient } from '@/lib/supabase/server';
import { planningService } from '../services/planning.service';
import type { 
  GeneratedPlan, 
  PlanSlot,
} from '../schema/planning.schema';
import type { ActionResult } from '@/lib/types';
import type { RoutineInstance, RoutineTemplate } from '../schema/routines.schema';
import type { Task } from '../schema/tasks.schema';
import type { Domain } from '../schema/domains.schema';

/**
 * Generate a plan for a specific date
 */
export async function generatePlan(
  dateStr: string,
  regenerate: boolean = false
): Promise<ActionResult<GeneratedPlan & { slots: PlanSlot[] }>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Parse and validate date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { data: null, error: 'Date invalide' };
  }

  const result = await planningService.generatePlan(
    supabase, 
    user.id, 
    date, 
    regenerate
  );
  
  return result;
}

/**
 * Regenerate plan for a date (forces new generation)
 */
export async function regeneratePlan(
  dateStr: string
): Promise<ActionResult<GeneratedPlan & { slots: PlanSlot[] }>> {
  return generatePlan(dateStr, true);
}

/**
 * Get existing plan for a date (without generating)
 */
export async function getPlanForDate(
  dateStr: string
): Promise<ActionResult<(GeneratedPlan & { slots: PlanSlot[] }) | null>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Parse and validate date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { data: null, error: 'Date invalide' };
  }

  const result = await planningService.getPlanForDate(supabase, user.id, date);
  return result;
}

/**
 * Get plan slots with full details
 */
export async function getPlanSlotsWithDetails(
  planId: string
): Promise<ActionResult<(PlanSlot & { 
  routineInstance?: (RoutineInstance & { template: RoutineTemplate; domain?: Domain }) | null;
  task?: (Task & { domain?: Domain }) | null;
})[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!planId) {
    return { data: null, error: 'ID de plan requis' };
  }

  const result = await planningService.getPlanSlotsWithDetails(
    supabase, 
    user.id, 
    planId
  );
  
  return result;
}

/**
 * Mark plan as stale (needs regeneration)
 */
export async function markPlanStale(
  dateStr: string
): Promise<ActionResult<{ success: boolean }>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Parse and validate date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { data: null, error: 'Date invalide' };
  }

  const result = await planningService.markPlanStale(supabase, user.id, date);
  return result;
}

/**
 * Generate plan for today
 */
export async function generateTodayPlan(): Promise<ActionResult<GeneratedPlan & { slots: PlanSlot[] }>> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  return generatePlan(dateStr);
}
