/**
 * LifeOS Timer Server Actions
 * 
 * Server Actions for task timer management.
 * 
 * @module lifeos/actions/timer
 */
'use server';

import { createSSRClient } from '@/lib/supabase/server';
import { timerService, type TimerState } from '../services/timer.service';
import type { ActionResult } from '@/lib/types';

/**
 * Start timer for a task
 */
export async function startTimer(
  taskId: string
): Promise<ActionResult<TimerState>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!taskId) {
    return { data: null, error: 'ID de tâche requis' };
  }

  const result = await timerService.start(supabase, user.id, taskId);
  return result;
}

/**
 * Pause timer for a task
 */
export async function pauseTimer(
  taskId: string
): Promise<ActionResult<TimerState>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!taskId) {
    return { data: null, error: 'ID de tâche requis' };
  }

  const result = await timerService.pause(supabase, user.id, taskId);
  return result;
}

/**
 * Stop timer for a task and optionally save to actual_minutes
 */
export async function stopTimer(
  taskId: string,
  saveToActualMinutes: boolean = true
): Promise<ActionResult<{ savedMinutes: number }>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!taskId) {
    return { data: null, error: 'ID de tâche requis' };
  }

  const result = await timerService.stop(supabase, user.id, taskId, saveToActualMinutes);
  return result;
}

/**
 * Get timer state for a task
 */
export async function getTimerState(
  taskId: string
): Promise<ActionResult<TimerState>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!taskId) {
    return { data: null, error: 'ID de tâche requis' };
  }

  const result = await timerService.getState(supabase, user.id, taskId);
  return result;
}

/**
 * Get all running timers for current user
 */
export async function getRunningTimers(): Promise<ActionResult<TimerState[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await timerService.getRunningTimers(supabase, user.id);
  return result;
}

/**
 * Toggle timer (start if stopped, pause if running)
 */
export async function toggleTimer(
  taskId: string
): Promise<ActionResult<TimerState>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!taskId) {
    return { data: null, error: 'ID de tâche requis' };
  }

  // Get current state
  const stateResult = await timerService.getState(supabase, user.id, taskId);
  
  if (stateResult.error) {
    return stateResult;
  }

  // Toggle based on current state
  if (stateResult.data!.isRunning) {
    return timerService.pause(supabase, user.id, taskId);
  } else {
    return timerService.start(supabase, user.id, taskId);
  }
}
