/**
 * LifeOS Projects Server Actions
 * 
 * Server Actions for project CRUD and Gantt chart data.
 * 
 * @module lifeos/actions/projects
 */
'use server';

import { createSSRClient } from '@/lib/supabase/server';
import { dependenciesService } from '../services/dependencies.service';
import { 
  createProjectSchema, 
  updateProjectSchema,
  projectFiltersSchema,
  createTaskDependencySchema,
  deleteTaskDependencySchema,
  type Project,
  type ProjectWithMetrics,
  type ProjectFilters,
  type TaskDependency,
  type GanttData,
} from '../schema/projects.schema';
import type { ActionResult } from '@/lib/types';

// ============================================================================
// PROJECT CRUD
// ============================================================================

/**
 * Get all projects for current user
 */
export async function getProjects(
  filters?: ProjectFilters
): Promise<ActionResult<Project[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate filters if provided
  if (filters) {
    const parsed = projectFiltersSchema.safeParse(filters);
    if (!parsed.success) {
      return { data: null, error: 'Filtres invalides' };
    }
  }

  let query = supabase
    .from('lifeos_projects')
    .select('*')
    .eq('user_id', user.id);

  if (filters?.domain_id) {
    query = query.eq('domain_id', filters.domain_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.statuses && filters.statuses.length > 0) {
    query = query.in('status', filters.statuses);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Project[], error: null };
}

/**
 * Get a single project by ID
 */
export async function getProject(
  projectId: string
): Promise<ActionResult<Project>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const { data, error } = await supabase
    .from('lifeos_projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Project, error: null };
}

/**
 * Get project with metrics (task counts, progress)
 */
export async function getProjectWithMetrics(
  projectId: string
): Promise<ActionResult<ProjectWithMetrics>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Get project
  const { data: project, error: projectError } = await supabase
    .from('lifeos_projects')
    .select(`
      *,
      domain:lifeos_domains(id, name, color, icon)
    `)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectError || !project) {
    return { data: null, error: 'Projet non trouvé' };
  }

  // Get task metrics
  // Note: Type assertion needed until Supabase types are regenerated
  const { data: tasksData, error: tasksError } = await supabase
    .from('lifeos_tasks')
    .select('status, estimated_minutes, actual_minutes')
    .eq('project_id', projectId)
    .eq('user_id', user.id);

  if (tasksError) {
    return { data: null, error: tasksError.message };
  }

  const tasks = tasksData as { status: string; estimated_minutes: number | null; actual_minutes: number | null }[] | null;
  const totalTasks = tasks?.length ?? 0;
  const completedTasks = tasks?.filter(t => t.status === 'done').length ?? 0;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalEstimatedMinutes = tasks?.reduce((sum, t) => sum + (t.estimated_minutes ?? 0), 0) ?? 0;
  const totalActualMinutes = tasks?.reduce((sum, t) => sum + (t.actual_minutes ?? 0), 0) ?? 0;

  const projectData = project as unknown as Project;
  return {
    data: {
      ...projectData,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      progress_percentage: progressPercentage,
      total_estimated_minutes: totalEstimatedMinutes,
      total_actual_minutes: totalActualMinutes,
    } as ProjectWithMetrics,
    error: null,
  };
}

/**
 * Create a new project
 */
export async function createProject(
  input: {
    name: string;
    description?: string | null;
    domain_id?: string | null;
    start_date?: string | null;
    target_date?: string | null;
  }
): Promise<ActionResult<Project>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate input
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { data: null, error: firstError?.message || 'Données invalides' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase types not regenerated
  const { data, error } = await (supabase as any)
    .from('lifeos_projects')
    .insert({
      user_id: user.id,
      ...parsed.data,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as Project, error: null };
}

/**
 * Update a project
 */
export async function updateProject(
  input: {
    id: string;
    name?: string;
    description?: string | null;
    domain_id?: string | null;
    status?: 'active' | 'paused' | 'completed' | 'archived';
    start_date?: string | null;
    target_date?: string | null;
  }
): Promise<ActionResult<Project>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate input
  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { data: null, error: firstError?.message || 'Données invalides' };
  }

  const { id, ...updateData } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase types not regenerated
  const { data, error } = await (supabase as any)
    .from('lifeos_projects')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Project, error: null };
}

/**
 * Delete a project
 */
export async function deleteProject(
  projectId: string
): Promise<ActionResult<void>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const { error } = await supabase
    .from('lifeos_projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: undefined, error: null };
}

// ============================================================================
// TASK DEPENDENCIES (GANTT)
// ============================================================================

/**
 * Get Gantt chart data for a project
 */
export async function getGanttData(
  projectId: string
): Promise<ActionResult<GanttData>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await dependenciesService.getGanttData(supabase, user.id, projectId);
  return result;
}

/**
 * Create task dependency
 */
export async function createTaskDependency(
  input: {
    predecessor_task_id: string;
    successor_task_id: string;
    dependency_type?: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
    lag_days?: number;
  }
): Promise<ActionResult<TaskDependency>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate input
  const parsed = createTaskDependencySchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { data: null, error: firstError?.message || 'Données invalides' };
  }

  const result = await dependenciesService.create(supabase, user.id, parsed.data);
  return result;
}

/**
 * Delete task dependency
 */
export async function deleteTaskDependency(
  dependencyId: string
): Promise<ActionResult<void>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate
  const parsed = deleteTaskDependencySchema.safeParse({ id: dependencyId });
  if (!parsed.success) {
    return { data: null, error: 'ID invalide' };
  }

  const result = await dependenciesService.delete(supabase, user.id, dependencyId);
  return result;
}

/**
 * Get dependencies for a specific task
 */
export async function getTaskDependencies(
  taskId: string
): Promise<ActionResult<{ predecessors: TaskDependency[]; successors: TaskDependency[] }>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Verify task belongs to user
  const { data: task, error: taskError } = await supabase
    .from('lifeos_tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single();

  if (taskError || !task) {
    return { data: null, error: 'Tâche non trouvée' };
  }

  const result = await dependenciesService.getByTask(supabase, taskId);
  return result;
}
