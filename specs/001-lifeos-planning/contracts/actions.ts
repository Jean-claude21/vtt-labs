/**
 * LifeOS Planning V1 — Server Actions API Contracts
 * 
 * Ce fichier définit les signatures des Server Actions disponibles.
 * Utilisé comme référence pour l'implémentation dans src/features/lifeos/actions/
 * 
 * @module lifeos/contracts/actions
 */

import type {
  ActionResult,
  PaginatedResult,
  // Domains
  Domain,
  CreateDomainInput,
  UpdateDomainInput,
  // Projects
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilters,
  // Tasks
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskSortOptions,
  // Routines
  RoutineTemplate,
  CreateRoutineTemplateInput,
  UpdateRoutineTemplateInput,
  RoutineFilters,
  RoutineInstance,
  CompleteRoutineInstanceInput,
  SkipRoutineInstanceInput,
  LinkTaskToRoutineInput,
  RoutineInstanceTask,
  Streak,
  // Planning
  GeneratedPlan,
  GeneratePlanInput,
  PlanSlot,
  UpdatePlanSlotInput,
  // Analytics
  DailyAnalytics,
  WeeklyAnalytics,
} from './types';

// ============================================================================
// DOMAIN ACTIONS
// ============================================================================

/**
 * Récupère tous les domaines de l'utilisateur
 */
export type GetDomainsAction = () => Promise<ActionResult<Domain[]>>;

/**
 * Récupère un domaine par ID
 */
export type GetDomainAction = (id: string) => Promise<ActionResult<Domain>>;

/**
 * Crée un nouveau domaine
 */
export type CreateDomainAction = (input: CreateDomainInput) => Promise<ActionResult<Domain>>;

/**
 * Met à jour un domaine existant
 */
export type UpdateDomainAction = (input: UpdateDomainInput) => Promise<ActionResult<Domain>>;

/**
 * Supprime un domaine (si aucun élément lié)
 */
export type DeleteDomainAction = (id: string) => Promise<ActionResult<{ success: boolean }>>;

/**
 * Réordonne les domaines
 */
export type ReorderDomainsAction = (orderedIds: string[]) => Promise<ActionResult<Domain[]>>;

/**
 * Seed les domaines par défaut pour l'utilisateur courant
 */
export type SeedDefaultDomainsAction = () => Promise<ActionResult<Domain[]>>;

// ============================================================================
// PROJECT ACTIONS
// ============================================================================

/**
 * Récupère les projets avec filtres optionnels
 */
export type GetProjectsAction = (filters?: ProjectFilters) => Promise<ActionResult<Project[]>>;

/**
 * Récupère un projet par ID avec ses tâches
 */
export type GetProjectAction = (id: string) => Promise<ActionResult<Project>>;

/**
 * Crée un nouveau projet
 */
export type CreateProjectAction = (input: CreateProjectInput) => Promise<ActionResult<Project>>;

/**
 * Met à jour un projet existant
 */
export type UpdateProjectAction = (input: UpdateProjectInput) => Promise<ActionResult<Project>>;

/**
 * Archive un projet
 */
export type ArchiveProjectAction = (id: string) => Promise<ActionResult<Project>>;

/**
 * Supprime un projet (et détache ses tâches)
 */
export type DeleteProjectAction = (id: string) => Promise<ActionResult<{ success: boolean }>>;

// ============================================================================
// TASK ACTIONS
// ============================================================================

/**
 * Récupère les tâches avec filtres et pagination
 */
export type GetTasksAction = (
  filters?: TaskFilters,
  sort?: TaskSortOptions,
  page?: number,
  perPage?: number
) => Promise<ActionResult<PaginatedResult<Task>>>;

/**
 * Récupère une tâche par ID
 */
export type GetTaskAction = (id: string) => Promise<ActionResult<Task>>;

/**
 * Crée une nouvelle tâche
 */
export type CreateTaskAction = (input: CreateTaskInput) => Promise<ActionResult<Task>>;

/**
 * Met à jour une tâche existante
 */
export type UpdateTaskAction = (input: UpdateTaskInput) => Promise<ActionResult<Task>>;

/**
 * Change le statut d'une tâche
 */
export type UpdateTaskStatusAction = (
  id: string,
  status: Task['status']
) => Promise<ActionResult<Task>>;

/**
 * Ajoute du temps à une tâche
 */
export type AddTaskTimeAction = (
  id: string,
  minutes: number
) => Promise<ActionResult<Task>>;

/**
 * Supprime une tâche
 */
export type DeleteTaskAction = (id: string) => Promise<ActionResult<{ success: boolean }>>;

// ============================================================================
// ROUTINE TEMPLATE ACTIONS
// ============================================================================

/**
 * Récupère les templates de routine avec filtres
 */
export type GetRoutineTemplatesAction = (
  filters?: RoutineFilters
) => Promise<ActionResult<RoutineTemplate[]>>;

/**
 * Récupère un template par ID avec streak
 */
export type GetRoutineTemplateAction = (id: string) => Promise<ActionResult<RoutineTemplate>>;

/**
 * Crée un nouveau template de routine
 */
export type CreateRoutineTemplateAction = (
  input: CreateRoutineTemplateInput
) => Promise<ActionResult<RoutineTemplate>>;

/**
 * Met à jour un template existant
 */
export type UpdateRoutineTemplateAction = (
  input: UpdateRoutineTemplateInput
) => Promise<ActionResult<RoutineTemplate>>;

/**
 * Active/désactive un template
 */
export type ToggleRoutineTemplateAction = (
  id: string,
  isActive: boolean
) => Promise<ActionResult<RoutineTemplate>>;

/**
 * Supprime un template (garde l'historique des instances)
 */
export type DeleteRoutineTemplateAction = (id: string) => Promise<ActionResult<{ success: boolean }>>;

// ============================================================================
// ROUTINE INSTANCE ACTIONS
// ============================================================================

/**
 * Récupère les instances de routine pour une date
 */
export type GetRoutineInstancesForDateAction = (
  date: string
) => Promise<ActionResult<RoutineInstance[]>>;

/**
 * Récupère une instance par ID
 */
export type GetRoutineInstanceAction = (id: string) => Promise<ActionResult<RoutineInstance>>;

/**
 * Génère les instances manquantes pour une date
 */
export type EnsureRoutineInstancesAction = (date: string) => Promise<ActionResult<RoutineInstance[]>>;

/**
 * Marque une instance comme complétée
 */
export type CompleteRoutineInstanceAction = (
  input: CompleteRoutineInstanceInput
) => Promise<ActionResult<RoutineInstance>>;

/**
 * Marque une instance comme skippée
 */
export type SkipRoutineInstanceAction = (
  input: SkipRoutineInstanceInput
) => Promise<ActionResult<RoutineInstance>>;

/**
 * Lie des tâches à une instance de routine
 */
export type LinkTasksToRoutineAction = (
  inputs: LinkTaskToRoutineInput[]
) => Promise<ActionResult<RoutineInstanceTask[]>>;

/**
 * Récupère l'historique d'une routine (dernières N instances)
 */
export type GetRoutineHistoryAction = (
  templateId: string,
  limit?: number
) => Promise<ActionResult<RoutineInstance[]>>;

// ============================================================================
// STREAK ACTIONS
// ============================================================================

/**
 * Récupère tous les streaks de l'utilisateur
 */
export type GetStreaksAction = () => Promise<ActionResult<Streak[]>>;

/**
 * Récupère le streak d'une routine spécifique
 */
export type GetStreakAction = (templateId: string) => Promise<ActionResult<Streak>>;

// ============================================================================
// PLANNING ACTIONS
// ============================================================================

/**
 * Génère un nouveau planning pour une date
 */
export type GeneratePlanAction = (input: GeneratePlanInput) => Promise<ActionResult<GeneratedPlan>>;

/**
 * Récupère le planning pour une date
 */
export type GetPlanForDateAction = (date: string) => Promise<ActionResult<GeneratedPlan | null>>;

/**
 * Met à jour un slot du planning
 */
export type UpdatePlanSlotAction = (input: UpdatePlanSlotInput) => Promise<ActionResult<PlanSlot>>;

/**
 * Supprime un slot du planning
 */
export type DeletePlanSlotAction = (id: string) => Promise<ActionResult<{ success: boolean }>>;

/**
 * Régénère le planning (supprime l'ancien et en crée un nouveau)
 */
export type RegeneratePlanAction = (input: GeneratePlanInput) => Promise<ActionResult<GeneratedPlan>>;

/**
 * Marque le planning comme actif
 */
export type ActivatePlanAction = (id: string) => Promise<ActionResult<GeneratedPlan>>;

/**
 * Marque le planning comme complété
 */
export type CompletePlanAction = (id: string) => Promise<ActionResult<GeneratedPlan>>;

// ============================================================================
// ANALYTICS ACTIONS
// ============================================================================

/**
 * Récupère les analytics pour une date
 */
export type GetDailyAnalyticsAction = (date: string) => Promise<ActionResult<DailyAnalytics>>;

/**
 * Récupère les analytics pour une semaine
 */
export type GetWeeklyAnalyticsAction = (
  startDate: string
) => Promise<ActionResult<WeeklyAnalytics>>;

/**
 * Récupère le temps par domaine pour une période
 */
export type GetTimeByDomainAction = (
  startDate: string,
  endDate: string
) => Promise<ActionResult<Array<{
  domain_id: string;
  domain_name: string;
  domain_color: string;
  target_minutes: number;
  actual_minutes: number;
}>>>;

// ============================================================================
// ACTION REGISTRY (for documentation)
// ============================================================================

export interface LifeOSActions {
  // Domains
  getDomains: GetDomainsAction;
  getDomain: GetDomainAction;
  createDomain: CreateDomainAction;
  updateDomain: UpdateDomainAction;
  deleteDomain: DeleteDomainAction;
  reorderDomains: ReorderDomainsAction;
  seedDefaultDomains: SeedDefaultDomainsAction;
  
  // Projects
  getProjects: GetProjectsAction;
  getProject: GetProjectAction;
  createProject: CreateProjectAction;
  updateProject: UpdateProjectAction;
  archiveProject: ArchiveProjectAction;
  deleteProject: DeleteProjectAction;
  
  // Tasks
  getTasks: GetTasksAction;
  getTask: GetTaskAction;
  createTask: CreateTaskAction;
  updateTask: UpdateTaskAction;
  updateTaskStatus: UpdateTaskStatusAction;
  addTaskTime: AddTaskTimeAction;
  deleteTask: DeleteTaskAction;
  
  // Routine Templates
  getRoutineTemplates: GetRoutineTemplatesAction;
  getRoutineTemplate: GetRoutineTemplateAction;
  createRoutineTemplate: CreateRoutineTemplateAction;
  updateRoutineTemplate: UpdateRoutineTemplateAction;
  toggleRoutineTemplate: ToggleRoutineTemplateAction;
  deleteRoutineTemplate: DeleteRoutineTemplateAction;
  
  // Routine Instances
  getRoutineInstancesForDate: GetRoutineInstancesForDateAction;
  getRoutineInstance: GetRoutineInstanceAction;
  ensureRoutineInstances: EnsureRoutineInstancesAction;
  completeRoutineInstance: CompleteRoutineInstanceAction;
  skipRoutineInstance: SkipRoutineInstanceAction;
  linkTasksToRoutine: LinkTasksToRoutineAction;
  getRoutineHistory: GetRoutineHistoryAction;
  
  // Streaks
  getStreaks: GetStreaksAction;
  getStreak: GetStreakAction;
  
  // Planning
  generatePlan: GeneratePlanAction;
  getPlanForDate: GetPlanForDateAction;
  updatePlanSlot: UpdatePlanSlotAction;
  deletePlanSlot: DeletePlanSlotAction;
  regeneratePlan: RegeneratePlanAction;
  activatePlan: ActivatePlanAction;
  completePlan: CompletePlanAction;
  
  // Analytics
  getDailyAnalytics: GetDailyAnalyticsAction;
  getWeeklyAnalytics: GetWeeklyAnalyticsAction;
  getTimeByDomain: GetTimeByDomainAction;
}
