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
