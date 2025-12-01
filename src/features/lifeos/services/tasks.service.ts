/**
 * LifeOS Tasks Service
 * 
 * Pure service functions for task CRUD operations and status management.
 * 
 * @module lifeos/services/tasks
 */

import type { DbClient } from '@/lib/types';
import type { 
  Task, 
  CreateTaskInput, 
  UpdateTaskInput,
  TaskFilters,
  TaskStatus,
} from '../schema/tasks.schema';

// Result type following ActionResult pattern
export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

// Valid status transitions
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  backlog: ['todo', 'cancelled', 'archived'],
  todo: ['in_progress', 'blocked', 'cancelled', 'archived', 'backlog'],
  in_progress: ['done', 'blocked', 'cancelled', 'todo'],
  blocked: ['todo', 'in_progress', 'cancelled'],
  done: ['archived', 'todo'], // Can reopen
  cancelled: ['archived', 'todo'], // Can reopen
  archived: [], // Terminal state
};

export const taskService = {
  /**
   * Get all tasks for a user with optional filters
   */
  async getAll(
    client: DbClient, 
    userId: string,
    filters?: TaskFilters
  ): Promise<ServiceResult<Task[]>> {
    let query = client
      .from('lifeos_tasks')
      .select('*')
      .eq('user_id', userId);

    // Apply filters
    if (filters?.domain_id) {
      query = query.eq('domain_id', filters.domain_id);
    }
    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.has_due_date !== undefined) {
      if (filters.has_due_date) {
        query = query.not('due_date', 'is', null);
      } else {
        query = query.is('due_date', null);
      }
    }
    if (filters?.due_before) {
      query = query.lte('due_date', filters.due_before);
    }
    if (filters?.due_after) {
      query = query.gte('due_date', filters.due_after);
    }

    // Sorting: priority tasks first, then by deadline, then by creation
    query = query
      .order('priority', { ascending: true }) // critical=1 first
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  },

  /**
   * Get a single task by ID
   */
  async getById(
    client: DbClient, 
    userId: string, 
    taskId: string
  ): Promise<ServiceResult<Task>> {
    const { data, error } = await client
      .from('lifeos_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Create a new task
   */
  async create(
    client: DbClient, 
    userId: string, 
    input: CreateTaskInput
  ): Promise<ServiceResult<Task>> {
    const { data, error } = await client
      .from('lifeos_tasks')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description ?? null,
        domain_id: input.domain_id ?? null,
        project_id: input.project_id ?? null,
        priority: input.priority ?? 'medium',
        status: 'todo',
        estimated_minutes: input.estimated_minutes ?? null,
        due_date: input.due_date ?? null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Update an existing task
   */
  async update(
    client: DbClient, 
    userId: string, 
    input: UpdateTaskInput
  ): Promise<ServiceResult<Task>> {
    const { id, ...updateData } = input;

    // Remove undefined fields
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined)
    );

    const { data, error } = await client
      .from('lifeos_tasks')
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
   * Update task status with validation
   */
  async updateStatus(
    client: DbClient, 
    userId: string, 
    taskId: string,
    newStatus: TaskStatus
  ): Promise<ServiceResult<Task>> {
    // Get current status
    const { data: current, error: fetchError } = await client
      .from('lifeos_tasks')
      .select('status')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError.message };
    }

    const currentStatus = current.status as TaskStatus;

    // Validate transition
    const validTransitions = VALID_TRANSITIONS[currentStatus];
    if (!validTransitions.includes(newStatus)) {
      return { 
        data: null, 
        error: `Transition invalide: ${currentStatus} → ${newStatus}` 
      };
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { status: newStatus };

    // Set completion date if done
    if (newStatus === 'done') {
      updateData.completed_at = new Date().toISOString();
    } else if (currentStatus === 'done') {
      // Reopening - clear completion date
      updateData.completed_at = null;
    }

    const { data, error } = await client
      .from('lifeos_tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Delete a task
   */
  async delete(
    client: DbClient, 
    userId: string, 
    taskId: string
  ): Promise<ServiceResult<{ success: boolean }>> {
    const { error } = await client
      .from('lifeos_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { success: true }, error: null };
  },

  /**
   * Get task statistics
   */
  async getStats(
    client: DbClient, 
    userId: string
  ): Promise<ServiceResult<{
    total: number;
    by_status: Record<TaskStatus, number>;
    overdue: number;
    due_today: number;
    due_this_week: number;
  }>> {
    const { data: tasks, error } = await client
      .from('lifeos_tasks')
      .select('status, due_date')
      .eq('user_id', userId)
      .not('status', 'in', '(done,cancelled)');

    if (error) {
      return { data: null, error: error.message };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

    const stats = {
      total: tasks.length,
      by_status: {
        todo: 0,
        in_progress: 0,
        blocked: 0,
        done: 0,
        cancelled: 0,
      } as Record<TaskStatus, number>,
      overdue: 0,
      due_today: 0,
      due_this_week: 0,
    };

    for (const task of tasks) {
      stats.by_status[task.status as TaskStatus]++;

      if (task.due_date) {
        const deadline = new Date(task.due_date);
        
        if (deadline < today) {
          stats.overdue++;
        } else if (deadline.toDateString() === today.toDateString()) {
          stats.due_today++;
        } else if (deadline <= endOfWeek) {
          stats.due_this_week++;
        }
      }
    }

    return { data: stats, error: null };
  },

  /**
   * Get tasks by project
   */
  async getByProject(
    client: DbClient, 
    userId: string, 
    projectId: string
  ): Promise<ServiceResult<Task[]>> {
    return this.getAll(client, userId, { project_id: projectId });
  },

  /**
   * Get tasks by domain
   */
  async getByDomain(
    client: DbClient, 
    userId: string, 
    domainId: string
  ): Promise<ServiceResult<Task[]>> {
    return this.getAll(client, userId, { domain_id: domainId });
  },

  /**
   * Get overdue tasks
   */
  async getOverdue(
    client: DbClient, 
    userId: string
  ): Promise<ServiceResult<Task[]>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await client
      .from('lifeos_tasks')
      .select('*')
      .eq('user_id', userId)
      .not('status', 'in', '(done,cancelled)')
      .lt('due_date', today.toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  },
};
