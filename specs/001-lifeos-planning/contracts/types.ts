/**
 * LifeOS Planning V1 — TypeScript Contracts
 * 
 * Ce fichier définit les types TypeScript pour toutes les entités LifeOS.
 * Ces types sont la source de vérité pour les Server Actions et les composants.
 * 
 * @module lifeos/contracts
 */

// ============================================================================
// ENUMS
// ============================================================================

export const CATEGORY_MOMENTS = ['morning', 'noon', 'afternoon', 'evening', 'night'] as const;
export type CategoryMoment = typeof CATEGORY_MOMENTS[number];

export const CATEGORY_TYPES = ['professional', 'personal', 'spiritual', 'health', 'learning', 'leisure', 'energy'] as const;
export type CategoryType = typeof CATEGORY_TYPES[number];

export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'blocked', 'done', 'cancelled', 'archived'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export const TASK_PRIORITIES = ['high', 'medium', 'low'] as const;
export type TaskPriority = typeof TASK_PRIORITIES[number];

export const PROJECT_STATUSES = ['active', 'paused', 'completed', 'archived'] as const;
export type ProjectStatus = typeof PROJECT_STATUSES[number];

export const ROUTINE_INSTANCE_STATUSES = ['pending', 'completed', 'partial', 'skipped'] as const;
export type RoutineInstanceStatus = typeof ROUTINE_INSTANCE_STATUSES[number];

export const PLAN_STATUSES = ['draft', 'active', 'completed'] as const;
export type PlanStatus = typeof PLAN_STATUSES[number];

export const SLOT_TYPES = ['routine', 'task', 'break', 'buffer', 'event'] as const;
export type SlotType = typeof SLOT_TYPES[number];

export const ENTITY_TYPES = ['routine_instance', 'task'] as const;
export type EntityType = typeof ENTITY_TYPES[number];

// ============================================================================
// CONSTRAINTS (JSONB Types)
// ============================================================================

export interface DurationConstraint {
  required: boolean;
  minutes: number;
}

export interface TimeSlotConstraint {
  required: boolean;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface TargetValueConstraint {
  required: boolean;
  value: number;
  unit: string;
}

export interface RoutineConstraints {
  duration?: DurationConstraint | null;
  timeSlot?: TimeSlotConstraint | null;
  targetValue?: TargetValueConstraint | null;
}

export interface RecurrenceConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'interval' | 'custom';
  days?: string[];       // ['monday', 'tuesday', ...]
  interval?: number;     // Every N days
  monthDays?: number[];  // [1, 15] for monthly
  exceptions?: string[]; // ISO dates to skip
}

// ============================================================================
// DOMAIN
// ============================================================================

export interface Domain {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  vision: string | null;
  daily_target_minutes: number | null;
  weekly_target_minutes: number | null;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDomainInput {
  name: string;
  icon?: string;
  color?: string;
  vision?: string | null;
  daily_target_minutes?: number | null;
  weekly_target_minutes?: number | null;
}

export interface UpdateDomainInput {
  id: string;
  name?: string;
  icon?: string;
  color?: string;
  vision?: string | null;
  daily_target_minutes?: number | null;
  weekly_target_minutes?: number | null;
  sort_order?: number;
}

// ============================================================================
// PROJECT
// ============================================================================

export interface Project {
  id: string;
  user_id: string;
  domain_id: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
  // Computed (from joins)
  domain?: Domain | null;
  tasks_count?: number;
  completed_tasks_count?: number;
  total_time_minutes?: number;
}

export interface CreateProjectInput {
  name: string;
  domain_id?: string | null;
  description?: string | null;
  start_date?: string | null;
  target_date?: string | null;
}

export interface UpdateProjectInput {
  id: string;
  name?: string;
  domain_id?: string | null;
  description?: string | null;
  status?: ProjectStatus;
  start_date?: string | null;
  target_date?: string | null;
}

// ============================================================================
// TASK
// ============================================================================

export interface Task {
  id: string;
  user_id: string;
  domain_id: string | null;
  project_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  estimated_minutes: number | null;
  actual_minutes: number;
  due_date: string | null;
  due_time: string | null;
  is_deadline_strict: boolean;
  created_at: string;
  updated_at: string;
  // Computed (from joins)
  domain?: Domain | null;
  project?: Project | null;
  subtasks?: Task[];
}

export interface CreateTaskInput {
  title: string;
  domain_id?: string | null;
  project_id?: string | null;
  parent_task_id?: string | null;
  description?: string | null;
  priority?: TaskPriority;
  estimated_minutes?: number | null;
  due_date?: string | null;
  due_time?: string | null;
  is_deadline_strict?: boolean;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  domain_id?: string | null;
  project_id?: string | null;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimated_minutes?: number | null;
  actual_minutes?: number;
  due_date?: string | null;
  due_time?: string | null;
  is_deadline_strict?: boolean;
}

// ============================================================================
// ROUTINE TEMPLATE
// ============================================================================

export interface RoutineTemplate {
  id: string;
  user_id: string;
  domain_id: string | null;
  name: string;
  description: string | null;
  category_moment: CategoryMoment | null;
  category_type: CategoryType | null;
  constraints: RoutineConstraints;
  recurrence_rule: string;
  recurrence_config: RecurrenceConfig;
  priority: TaskPriority;
  is_flexible: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed (from joins)
  domain?: Domain | null;
  streak?: Streak | null;
}

export interface CreateRoutineTemplateInput {
  name: string;
  domain_id?: string | null;
  description?: string | null;
  category_moment?: CategoryMoment | null;
  category_type?: CategoryType | null;
  constraints?: RoutineConstraints;
  recurrence_rule: string;
  recurrence_config: RecurrenceConfig;
  priority?: TaskPriority;
  is_flexible?: boolean;
}

export interface UpdateRoutineTemplateInput {
  id: string;
  name?: string;
  domain_id?: string | null;
  description?: string | null;
  category_moment?: CategoryMoment | null;
  category_type?: CategoryType | null;
  constraints?: RoutineConstraints;
  recurrence_rule?: string;
  recurrence_config?: RecurrenceConfig;
  priority?: TaskPriority;
  is_flexible?: boolean;
  is_active?: boolean;
}

// ============================================================================
// ROUTINE INSTANCE
// ============================================================================

export interface RoutineInstance {
  id: string;
  template_id: string;
  user_id: string;
  scheduled_date: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  actual_value: number | null;
  status: RoutineInstanceStatus;
  skip_reason: string | null;
  completion_score: number | null;
  mood_before: number | null;
  mood_after: number | null;
  energy_level: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Computed (from joins)
  template?: RoutineTemplate | null;
  linked_tasks?: RoutineInstanceTask[];
}

export interface CompleteRoutineInstanceInput {
  id: string;
  actual_start?: string | null;
  actual_end?: string | null;
  actual_value?: number | null;
  status: 'completed' | 'partial';
  mood_before?: number | null;
  mood_after?: number | null;
  energy_level?: number | null;
  notes?: string | null;
}

export interface SkipRoutineInstanceInput {
  id: string;
  skip_reason: string;
}

// ============================================================================
// ROUTINE INSTANCE TASK (Junction)
// ============================================================================

export interface RoutineInstanceTask {
  id: string;
  routine_instance_id: string;
  task_id: string;
  time_spent_minutes: number;
  notes: string | null;
  created_at: string;
  // Computed
  task?: Task;
}

export interface LinkTaskToRoutineInput {
  routine_instance_id: string;
  task_id: string;
  time_spent_minutes: number;
  notes?: string | null;
}

// ============================================================================
// STREAK
// ============================================================================

export interface Streak {
  id: string;
  routine_template_id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}

// ============================================================================
// GENERATED PLAN
// ============================================================================

export interface GeneratedPlan {
  id: string;
  user_id: string;
  date: string;
  status: PlanStatus;
  generation_params: Record<string, unknown> | null;
  ai_model: string | null;
  optimization_score: number | null;
  created_at: string;
  updated_at: string;
  // Computed
  slots?: PlanSlot[];
}

export interface GeneratePlanInput {
  date: string;
  wake_time?: string; // "HH:mm", default "06:00"
  sleep_time?: string; // "HH:mm", default "23:00"
  include_tasks?: boolean; // default true
}

// ============================================================================
// PLAN SLOT
// ============================================================================

export interface PlanSlot {
  id: string;
  plan_id: string;
  user_id: string;
  start_time: string; // "HH:mm"
  end_time: string;   // "HH:mm"
  slot_type: SlotType;
  entity_type: EntityType | null;
  entity_id: string | null;
  ai_reasoning: string | null;
  sort_order: number;
  is_locked: boolean;
  was_executed: boolean;
  created_at: string;
  // Computed
  entity?: RoutineInstance | Task | null;
}

export interface UpdatePlanSlotInput {
  id: string;
  start_time?: string;
  end_time?: string;
  sort_order?: number;
  was_executed?: boolean;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface DailyAnalytics {
  date: string;
  routines: {
    total: number;
    completed: number;
    partial: number;
    skipped: number;
    completion_rate: number;
  };
  tasks: {
    total: number;
    completed: number;
  };
  time_by_domain: Array<{
    domain_id: string;
    domain_name: string;
    domain_color: string;
    planned_minutes: number;
    actual_minutes: number;
  }>;
}

export interface WeeklyAnalytics {
  start_date: string;
  end_date: string;
  daily_completion_rates: Array<{
    date: string;
    rate: number;
  }>;
  routines: {
    total_instances: number;
    completed: number;
    completion_rate: number;
  };
  time_by_domain: Array<{
    domain_id: string;
    domain_name: string;
    domain_color: string;
    target_minutes: number;
    actual_minutes: number;
    variance_percent: number;
  }>;
  top_streaks: Array<{
    routine_id: string;
    routine_name: string;
    current_streak: number;
    longest_streak: number;
  }>;
}

// ============================================================================
// AI SCHEDULING TYPES
// ============================================================================

export interface SchedulingInput {
  date: string;
  wake_time: string;
  sleep_time: string;
  routines: Array<{
    id: string;
    instance_id: string;
    name: string;
    domain_name: string;
    domain_color: string;
    constraints: RoutineConstraints;
    is_flexible: boolean;
    priority: TaskPriority;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    domain_name: string;
    domain_color: string;
    priority: TaskPriority;
    estimated_minutes: number;
    deadline: string | null;
    is_deadline_strict: boolean;
  }>;
}

export interface SchedulingOutput {
  slots: Array<{
    start_time: string;
    end_time: string;
    slot_type: SlotType;
    entity_type: EntityType | null;
    entity_id: string | null;
    reasoning: string;
    is_locked: boolean;
  }>;
  unplaced_items: Array<{
    entity_id: string;
    entity_type: EntityType;
    reason: string;
  }>;
  optimization_score: number;
}

// ============================================================================
// ACTION RESULTS
// ============================================================================

export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================================================
// FILTER & SORT OPTIONS
// ============================================================================

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  domain_id?: string;
  project_id?: string;
  due_before?: string;
  due_after?: string;
  search?: string;
}

export interface TaskSortOptions {
  field: 'created_at' | 'due_date' | 'priority' | 'title' | 'status';
  direction: 'asc' | 'desc';
}

export interface RoutineFilters {
  is_active?: boolean;
  domain_id?: string;
  category_moment?: CategoryMoment;
  category_type?: CategoryType;
  search?: string;
}

export interface ProjectFilters {
  status?: ProjectStatus | ProjectStatus[];
  domain_id?: string;
  search?: string;
}
