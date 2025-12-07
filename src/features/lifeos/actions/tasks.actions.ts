/**
 * LifeOS Tasks Server Actions
 * 
 * Server Actions for task CRUD and status management.
 * 
 * @module lifeos/actions/tasks
 */
'use server';

import { createSSRClient } from '@/lib/supabase/server';
import { taskService } from '../services/tasks.service';
import { timerService, type TimerState } from '../services/timer.service';
import { 
  createTaskSchema, 
  updateTaskSchema,
  taskFiltersSchema,
  taskStatusSchema,
  type Task,
  type TaskFilters,
  type TaskStatus,
} from '../schema/tasks.schema';
import type { ActionResult } from '@/lib/types';

/**
 * Get all tasks for the current user
 */
export async function getTasks(
  filters?: TaskFilters
): Promise<ActionResult<Task[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate filters if provided
  if (filters) {
    const parsed = taskFiltersSchema.safeParse(filters);
    if (!parsed.success) {
      return { data: null, error: 'Filtres invalides' };
    }
  }

  const result = await taskService.getAll(supabase, user.id, filters);
  return result;
}

/**
 * Get a single task by ID
 */
export async function getTask(
  taskId: string
): Promise<ActionResult<Task>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!taskId) {
    return { data: null, error: 'ID de tâche requis' };
  }

  const result = await taskService.getById(supabase, user.id, taskId);
  return result;
}

/**
 * Create a new task
 */
export async function createTask(
  input: unknown
): Promise<ActionResult<Task>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate input
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((e) => e.message).join(', ');
    return { data: null, error: `Données invalides: ${errors}` };
  }

  const result = await taskService.create(supabase, user.id, parsed.data);
  return result;
}

/**
 * Update an existing task
 */
export async function updateTask(
  input: unknown
): Promise<ActionResult<Task>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate input
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((e) => e.message).join(', ');
    return { data: null, error: `Données invalides: ${errors}` };
  }

  const result = await taskService.update(supabase, user.id, parsed.data);
  return result;
}

/**
 * Complete a task (shortcut for updateTaskStatus with 'completed')
 */
export async function completeTask(
  taskId: string
): Promise<ActionResult<Task>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!taskId) {
    return { data: null, error: 'ID de tâche requis' };
  }

  const result = await taskService.complete(supabase, user.id, taskId);
  return result;
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus
): Promise<ActionResult<Task>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!taskId) {
    return { data: null, error: 'ID de tâche requis' };
  }

  // Validate status
  const parsed = taskStatusSchema.safeParse(newStatus);
  if (!parsed.success) {
    return { data: null, error: 'Statut invalide' };
  }

  const result = await taskService.updateStatus(supabase, user.id, taskId, parsed.data);
  return result;
}

/**
 * Delete a task
 */
export async function deleteTask(
  taskId: string
): Promise<ActionResult<{ success: boolean }>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!taskId) {
    return { data: null, error: 'ID de tâche requis' };
  }

  const result = await taskService.delete(supabase, user.id, taskId);
  return result;
}

/**
 * Get task statistics
 */
export async function getTaskStats(): Promise<ActionResult<{
  total: number;
  by_status: Record<TaskStatus, number>;
  overdue: number;
  due_today: number;
  due_this_week: number;
}>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await taskService.getStats(supabase, user.id);
  return result;
}

/**
 * Get overdue tasks
 */
export async function getOverdueTasks(): Promise<ActionResult<Task[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await taskService.getOverdue(supabase, user.id);
  return result;
}

/**
 * Get unscheduled tasks (tasks without scheduled_date)
 * These are tasks that can be dragged to the calendar
 */
export async function getUnscheduledTasks(): Promise<ActionResult<Task[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const { data, error } = await supabase
    .from('lifeos_tasks')
    .select('*')
    .eq('user_id', user.id)
    .is('scheduled_date', null)
    .not('status', 'in', '(done,archived,cancelled)')
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}

/**
 * Schedule a task on the calendar
 * Sets scheduled_date and scheduled_time for a task
 */
export async function scheduleTask(
  taskId: string,
  scheduledDate: string,
  scheduledTime?: string
): Promise<ActionResult<Task>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!taskId) {
    return { data: null, error: 'ID de tâche requis' };
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    return { data: null, error: 'Format de date invalide (YYYY-MM-DD)' };
  }

  // Validate time format if provided
  if (scheduledTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(scheduledTime)) {
    return { data: null, error: 'Format d\'heure invalide (HH:mm)' };
  }

  const { data, error } = await supabase
    .from('lifeos_tasks')
    .update({
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime || null,
    })
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Unschedule a task (remove from calendar)
 * Clears scheduled_date and scheduled_time
 */
export async function unscheduleTask(
  taskId: string
): Promise<ActionResult<Task>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (!taskId) {
    return { data: null, error: 'ID de tâche requis' };
  }

  const { data, error } = await supabase
    .from('lifeos_tasks')
    .update({
      scheduled_date: null,
      scheduled_time: null,
    })
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// ============================================================================
// TIMER ACTIONS
// ============================================================================

/**
 * Start timer for a task
 */
export async function startTaskTimer(
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
 * Accumulates the elapsed time since start
 */
export async function pauseTaskTimer(
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
 * Stop timer for a task
 * Resets the timer but keeps the total accumulated time
 */
export async function stopTaskTimer(
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

  const result = await timerService.stop(supabase, user.id, taskId);
  return result;
}

/**
 * Get current timer state for a task
 */
export async function getTaskTimerState(
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
