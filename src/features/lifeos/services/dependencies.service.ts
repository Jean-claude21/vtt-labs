/**
 * LifeOS Task Dependencies Service
 * 
 * Handles task dependencies for Gantt chart functionality.
 * 
 * @module lifeos/services/dependencies
 */

import type { DbClient } from '@/lib/types';
import type { 
  TaskDependency, 
  CreateTaskDependencyInput,
  GanttTask,
  GanttData,
} from '../schema/projects.schema';

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export const dependenciesService = {
  /**
   * Get all dependencies for tasks in a project
   */
  async getByProject(
    client: DbClient,
    userId: string,
    projectId: string
  ): Promise<ServiceResult<TaskDependency[]>> {
    // Get all tasks in the project first
    const { data: tasks, error: tasksError } = await client
      .from('lifeos_tasks')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (tasksError) {
      return { data: null, error: tasksError.message };
    }

    const taskIds = (tasks || []).map(t => t.id);

    if (taskIds.length === 0) {
      return { data: [], error: null };
    }

    // Get dependencies where predecessor or successor is in the project
    const { data: deps, error: depsError } = await client
      .from('lifeos_task_dependencies')
      .select('*')
      .or(`predecessor_task_id.in.(${taskIds.join(',')}),successor_task_id.in.(${taskIds.join(',')})`);

    if (depsError) {
      return { data: null, error: depsError.message };
    }

    return { data: deps as TaskDependency[], error: null };
  },

  /**
   * Get dependencies for a specific task
   */
  async getByTask(
    client: DbClient,
    taskId: string
  ): Promise<ServiceResult<{ predecessors: TaskDependency[]; successors: TaskDependency[] }>> {
    const { data: predecessors, error: predError } = await client
      .from('lifeos_task_dependencies')
      .select('*')
      .eq('successor_task_id', taskId);

    if (predError) {
      return { data: null, error: predError.message };
    }

    const { data: successors, error: succError } = await client
      .from('lifeos_task_dependencies')
      .select('*')
      .eq('predecessor_task_id', taskId);

    if (succError) {
      return { data: null, error: succError.message };
    }

    return {
      data: {
        predecessors: predecessors as TaskDependency[],
        successors: successors as TaskDependency[],
      },
      error: null,
    };
  },

  /**
   * Create a new dependency
   */
  async create(
    client: DbClient,
    userId: string,
    input: CreateTaskDependencyInput
  ): Promise<ServiceResult<TaskDependency>> {
    // Verify both tasks belong to the user
    const { data: tasks, error: verifyError } = await client
      .from('lifeos_tasks')
      .select('id')
      .eq('user_id', userId)
      .in('id', [input.predecessor_task_id, input.successor_task_id]);

    if (verifyError) {
      return { data: null, error: verifyError.message };
    }

    if (tasks?.length !== 2) {
      return { data: null, error: 'One or both tasks not found' };
    }

    // Check for circular dependency
    const hasCircular = await this.wouldCreateCircularDependency(
      client,
      input.predecessor_task_id,
      input.successor_task_id
    );

    if (hasCircular) {
      return { data: null, error: 'This would create a circular dependency' };
    }

    // Create the dependency
    const { data, error } = await client
      .from('lifeos_task_dependencies')
      .insert({
        predecessor_task_id: input.predecessor_task_id,
        successor_task_id: input.successor_task_id,
        dependency_type: input.dependency_type || 'finish_to_start',
        lag_days: input.lag_days || 0,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as TaskDependency, error: null };
  },

  /**
   * Delete a dependency
   */
  async delete(
    client: DbClient,
    userId: string,
    dependencyId: string
  ): Promise<ServiceResult<void>> {
    // Verify the dependency exists and user owns the tasks
    const { data: dep, error: fetchError } = await client
      .from('lifeos_task_dependencies')
      .select(`
        *,
        predecessor:lifeos_tasks!predecessor_task_id(user_id),
        successor:lifeos_tasks!successor_task_id(user_id)
      `)
      .eq('id', dependencyId)
      .single();

    if (fetchError || !dep) {
      return { data: null, error: 'Dependency not found' };
    }

    // Type assertion for nested objects
    const predecessor = dep.predecessor as { user_id: string } | null;
    const successor = dep.successor as { user_id: string } | null;

    if (predecessor?.user_id !== userId || successor?.user_id !== userId) {
      return { data: null, error: 'Unauthorized' };
    }

    const { error: deleteError } = await client
      .from('lifeos_task_dependencies')
      .delete()
      .eq('id', dependencyId);

    if (deleteError) {
      return { data: null, error: deleteError.message };
    }

    return { data: undefined, error: null };
  },

  /**
   * Check if creating a dependency would create a circular reference
   */
  async wouldCreateCircularDependency(
    client: DbClient,
    predecessorId: string,
    successorId: string
  ): Promise<boolean> {
    // Simple DFS to check for cycles
    const visited = new Set<string>();
    const stack = [predecessorId];

    // Get all existing dependencies
    const { data: allDeps } = await client
      .from('lifeos_task_dependencies')
      .select('predecessor_task_id, successor_task_id');

    const deps = allDeps || [];

    // Add the new dependency to check
    deps.push({
      predecessor_task_id: predecessorId,
      successor_task_id: successorId,
    });

    // Build adjacency list (task -> tasks that depend on it)
    const graph: Record<string, string[]> = {};
    for (const dep of deps) {
      if (!graph[dep.successor_task_id]) {
        graph[dep.successor_task_id] = [];
      }
      graph[dep.successor_task_id].push(dep.predecessor_task_id);
    }

    // DFS from successor to see if we can reach predecessor
    while (stack.length > 0) {
      const current = stack.pop()!;
      
      if (current === successorId) {
        return true; // Found cycle
      }

      if (visited.has(current)) continue;
      visited.add(current);

      const predecessors = graph[current] || [];
      stack.push(...predecessors);
    }

    return false;
  },

  /**
   * Get Gantt chart data for a project
   */
  async getGanttData(
    client: DbClient,
    userId: string,
    projectId: string
  ): Promise<ServiceResult<GanttData>> {
    // Get project info
    const { data: project, error: projectError } = await client
      .from('lifeos_projects')
      .select('id, name, start_date, target_date')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return { data: null, error: 'Project not found' };
    }

    // Get tasks with domain info
    const { data: tasks, error: tasksError } = await client
      .from('lifeos_tasks')
      .select(`
        id, name, status, priority, 
        start_date, scheduled_date, due_date,
        estimated_minutes,
        domain:lifeos_domains(name, color)
      `)
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('start_date', { ascending: true, nullsFirst: false });

    if (tasksError) {
      return { data: null, error: tasksError.message };
    }

    // Get dependencies
    const depsResult = await this.getByProject(client, userId, projectId);
    if (depsResult.error) {
      return { data: null, error: depsResult.error };
    }

    const dependencies = depsResult.data!;

    // Build dependency map for each task
    const predecessorMap: Record<string, string[]> = {};
    for (const dep of dependencies) {
      if (!predecessorMap[dep.successor_task_id]) {
        predecessorMap[dep.successor_task_id] = [];
      }
      predecessorMap[dep.successor_task_id].push(dep.predecessor_task_id);
    }

    // Convert tasks to Gantt format
    const ganttTasks: GanttTask[] = (tasks || []).map((task) => {
      const domainData = task.domain as unknown as { name: string; color: string } | null;
      
      // Calculate start (prefer start_date, then scheduled_date, then due_date - estimated time)
      const startDate = task.start_date || task.scheduled_date || task.due_date;
      
      // Calculate duration in days (from estimated_minutes, minimum 1 day)
      const durationMinutes = task.estimated_minutes || 60;
      const durationDays = Math.max(1, Math.ceil(durationMinutes / (8 * 60))); // 8 hours per day
      
      // Calculate end date
      let endDate: string | null = null;
      if (startDate) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + durationDays);
        endDate = start.toISOString().split('T')[0];
      }

      // Calculate progress based on status
      let progress: number;
      switch (task.status) {
        case 'done': progress = 100; break;
        case 'in_progress': progress = 50; break;
        case 'todo': progress = 10; break;
        default: progress = 0;
      }

      return {
        id: task.id,
        name: task.name,
        start: startDate,
        end: task.due_date || endDate,
        duration: durationDays,
        progress,
        status: task.status,
        priority: task.priority,
        dependencies: predecessorMap[task.id] || [],
        domainColor: domainData?.color || null,
        domainName: domainData?.name || null,
      };
    });

    // Calculate date range
    const allDates = ganttTasks
      .flatMap(t => [t.start, t.end])
      .filter(Boolean) as string[];
    
    const sortedDates = [...allDates].sort((a, b) => a.localeCompare(b));
    
    const startRange = sortedDates.length > 0 
      ? sortedDates[0] 
      : project.start_date || new Date().toISOString().split('T')[0];
    
    const endRange = sortedDates.length > 0 
      ? sortedDates.at(-1)! 
      : project.target_date || new Date().toISOString().split('T')[0];

    return {
      data: {
        projectId: project.id,
        projectName: project.name,
        tasks: ganttTasks,
        dependencies,
        dateRange: {
          start: startRange,
          end: endRange,
        },
      },
      error: null,
    };
  },
};
