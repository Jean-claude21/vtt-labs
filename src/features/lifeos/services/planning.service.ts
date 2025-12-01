// @ts-nocheck
/**
 * LifeOS Planning Service
 * 
 * Orchestrates plan generation by combining routine instances and tasks
 * into time slots using AI scheduling.
 * 
 * @module lifeos/services/planning
 */

import type { DbClient } from '@/lib/types';
import { routineInstanceService } from './routine-instances.service';
import { taskService } from './tasks.service';
import { scheduleDay, type SchedulingInput, type TimeSlotConfig } from './ai/scheduler.ai';
import type { 
  GeneratedPlan, 
  PlanSlot,
} from '../schema/planning.schema';
import type { RoutineInstance, RoutineTemplate } from '../schema/routines.schema';
import type { Task } from '../schema/tasks.schema';
import type { Domain } from '../schema/domains.schema';

// Result type following ActionResult pattern
export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

// User preferences for plan generation
export interface PlanPreferences {
  wakeTime: string;
  sleepTime: string;
  lunchBreakStart: string;
  lunchBreakDuration: number;
}

// Default time configuration
const DEFAULT_TIME_CONFIG: TimeSlotConfig = {
  dayStart: '07:00',
  dayEnd: '22:00',
  slotDuration: 30,
  minBreakBetweenSlots: 5,
};

export const planningService = {
  /**
   * Generate a plan for a specific date
   */
  async generatePlan(
    client: DbClient,
    userId: string,
    date: Date,
    regenerate: boolean = false,
    preferences?: PlanPreferences
  ): Promise<ServiceResult<GeneratedPlan & { slots: PlanSlot[] }>> {
    const dateStr = date.toISOString().split('T')[0];
    
    console.log('[PlanningService] generatePlan called:', { dateStr, regenerate, hasPreferences: !!preferences });

    // Check for existing plan
    const { data: existingPlan, error: existingError } = await client
      .from('lifeos_generated_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .single();

    console.log('[PlanningService] Existing plan check:', { 
      hasExisting: !!existingPlan, 
      regenerate,
      willReturnExisting: existingPlan && !regenerate 
    });

    if (existingError && existingError.code !== 'PGRST116') {
      return { data: null, error: existingError.message };
    }

    if (existingPlan && !regenerate) {
      console.log('[PlanningService] Returning existing plan without regeneration');
      // Return existing plan with slots
      const { data: slots, error: slotsError } = await client
        .from('lifeos_plan_slots')
        .select('*')
        .eq('plan_id', existingPlan.id)
        .order('start_time', { ascending: true });

      if (slotsError) {
        return { data: null, error: slotsError.message };
      }

      return {
        data: {
          ...existingPlan,
          slots: slots ?? [],
        },
        error: null,
      };
    }

    // Generate routine instances for the date
    const instancesResult = await routineInstanceService.generateForDate(
      client,
      userId,
      date
    );

    if (instancesResult.error) {
      return { data: null, error: instancesResult.error };
    }

    // Get routine instances with templates
    const { data: routineInstances, error: routineError } = await client
      .from('lifeos_routine_instances')
      .select(`
        *,
        template:lifeos_routine_templates(*)
      `)
      .eq('user_id', userId)
      .eq('scheduled_date', dateStr);

    if (routineError) {
      return { data: null, error: routineError.message };
    }

    // Get domains for all templates
    const domainIds = new Set(
      (routineInstances ?? [])
        .map((r) => (r.template as RoutineTemplate)?.domain_id)
        .filter((id): id is string => !!id)
    );

    let domains: Domain[] = [];
    if (domainIds.size > 0) {
      const { data: domainData } = await client
        .from('lifeos_domains')
        .select('*')
        .in('id', Array.from(domainIds));
      domains = domainData ?? [];
    }

    const domainMap = new Map(domains.map((d) => [d.id, d]));

    // Get active tasks
    const tasksResult = await taskService.getAll(client, userId, {
      statuses: ['todo', 'in_progress'],
    });

    if (tasksResult.error) {
      return { data: null, error: tasksResult.error };
    }

    // Get domains for tasks
    const taskDomainIds = new Set(
      (tasksResult.data ?? [])
        .map((t) => t.domain_id)
        .filter((id): id is string => !!id)
    );

    if (taskDomainIds.size > 0) {
      const { data: taskDomainData } = await client
        .from('lifeos_domains')
        .select('*')
        .in('id', Array.from(taskDomainIds));
      (taskDomainData ?? []).forEach((d) => domainMap.set(d.id, d));
    }

    // Build time config from preferences
    const timeConfig: TimeSlotConfig = preferences
      ? {
          dayStart: preferences.wakeTime,
          dayEnd: preferences.sleepTime,
          slotDuration: DEFAULT_TIME_CONFIG.slotDuration,
          minBreakBetweenSlots: DEFAULT_TIME_CONFIG.minBreakBetweenSlots,
        }
      : DEFAULT_TIME_CONFIG;

    // Prepare scheduling input
    const schedulingInput: SchedulingInput = {
      date: dateStr,
      routineInstances: (routineInstances ?? []).map((r) => ({
        ...r,
        template: r.template as RoutineTemplate,
        domain: (r.template as RoutineTemplate)?.domain_id 
          ? domainMap.get((r.template as RoutineTemplate).domain_id!)
          : null,
      })) as (RoutineInstance & { template: RoutineTemplate; domain?: Domain | null })[],
      tasks: (tasksResult.data ?? []).map((t) => ({
        ...t,
        domain: t.domain_id ? domainMap.get(t.domain_id) : null,
      })) as (Task & { domain?: Domain | null })[],
      existingSlots: [],
      timeConfig,
      preferences: preferences
        ? {
            preferredWakeTime: preferences.wakeTime,
            preferredSleepTime: preferences.sleepTime,
            lunchBreakStart: preferences.lunchBreakStart,
            lunchBreakDuration: preferences.lunchBreakDuration,
          }
        : undefined,
    };

    console.log('[Planning] Scheduling input:', {
      date: schedulingInput.date,
      routineInstancesCount: schedulingInput.routineInstances.length,
      tasksCount: schedulingInput.tasks.length,
      timeConfig: schedulingInput.timeConfig,
      preferences: schedulingInput.preferences,
    });

    // Run AI scheduling
    const schedulingResult = await scheduleDay(schedulingInput);

    console.log('[Planning] Scheduling result:', {
      slotsCount: schedulingResult.slots.length,
      unscheduledCount: schedulingResult.unscheduled.length,
      score: schedulingResult.optimizationScore,
    });

    // Create or update plan
    let planId: string;

    if (existingPlan && regenerate) {
      // Delete existing slots
      await client
        .from('lifeos_plan_slots')
        .delete()
        .eq('plan_id', existingPlan.id);

      // Update plan
      const { data: updatedPlan, error: updateError } = await client
        .from('lifeos_generated_plans')
        .update({
          status: 'draft',
        })
        .eq('id', existingPlan.id)
        .select()
        .single();

      if (updateError) {
        return { data: null, error: updateError.message };
      }

      planId = updatedPlan.id;
    } else {
      // Create new plan
      const { data: newPlan, error: createError } = await client
        .from('lifeos_generated_plans')
        .insert({
          user_id: userId,
          date: dateStr,
          status: 'draft',
        })
        .select()
        .single();

      if (createError) {
        return { data: null, error: createError.message };
      }

      planId = newPlan.id;
    }

    // Create plan slots
    // Filter out slots with invalid itemIds (non-UUID) and validate the data
    const isValidUUID = (str: string | null | undefined): boolean => {
      if (!str) return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    const slotsToCreate = schedulingResult.slots
      .filter((slot) => {
        // Only include slots that have valid UUIDs for routine/task types
        if (slot.type === 'routine' || slot.type === 'task') {
          return isValidUUID(slot.itemId);
        }
        // Include break/buffer slots without entity_id
        return true;
      })
      .map((slot) => {
        const isRoutineOrTask = slot.type === 'routine' || slot.type === 'task';
        const hasValidId = isValidUUID(slot.itemId);
        
        return {
          plan_id: planId,
          user_id: userId,
          slot_type: slot.type === 'routine' ? 'routine' : slot.type === 'task' ? 'task' : 'break',
          entity_type: isRoutineOrTask && hasValidId
            ? (slot.type === 'routine' ? 'routine_instance' as const : 'task' as const)
            : null,
          entity_id: isRoutineOrTask && hasValidId ? slot.itemId : null,
          start_time: slot.startTime,
          end_time: slot.endTime,
          is_locked: slot.isFixed ?? false,
          ai_reasoning: slot.aiReasoning ?? null,
          sort_order: 0,
          was_executed: false,
        };
      });

    if (slotsToCreate.length > 0) {
      const { error: slotsInsertError } = await client
        .from('lifeos_plan_slots')
        .insert(slotsToCreate);

      if (slotsInsertError) {
        return { data: null, error: slotsInsertError.message };
      }
    }

    // Fetch the complete plan with slots
    const { data: finalPlan, error: finalError } = await client
      .from('lifeos_generated_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (finalError) {
      return { data: null, error: finalError.message };
    }

    const { data: finalSlots, error: finalSlotsError } = await client
      .from('lifeos_plan_slots')
      .select('*')
      .eq('plan_id', planId)
      .order('start_time', { ascending: true });

    if (finalSlotsError) {
      return { data: null, error: finalSlotsError.message };
    }

    return {
      data: {
        ...finalPlan,
        slots: finalSlots ?? [],
      },
      error: null,
    };
  },

  /**
   * Get plan for a specific date (without generating)
   */
  async getPlanForDate(
    client: DbClient,
    userId: string,
    date: Date
  ): Promise<ServiceResult<(GeneratedPlan & { slots: PlanSlot[] }) | null>> {
    const dateStr = date.toISOString().split('T')[0];

    const { data: plan, error: planError } = await client
      .from('lifeos_generated_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateStr)
      .single();

    if (planError) {
      if (planError.code === 'PGRST116') {
        // No plan exists
        return { data: null, error: null };
      }
      return { data: null, error: planError.message };
    }

    const { data: slots, error: slotsError } = await client
      .from('lifeos_plan_slots')
      .select('*')
      .eq('plan_id', plan.id)
      .order('start_time', { ascending: true });

    if (slotsError) {
      return { data: null, error: slotsError.message };
    }

    return {
      data: {
        ...plan,
        slots: slots ?? [],
      },
      error: null,
    };
  },

  /**
   * Mark plan as stale (needs regeneration)
   */
  async markPlanStale(
    client: DbClient,
    userId: string,
    date: Date
  ): Promise<ServiceResult<{ success: boolean }>> {
    const dateStr = date.toISOString().split('T')[0];

    const { error } = await client
      .from('lifeos_generated_plans')
      .update({ status: 'draft' })
      .eq('user_id', userId)
      .eq('date', dateStr);

    if (error && error.code !== 'PGRST116') {
      return { data: null, error: error.message };
    }

    return { data: { success: true }, error: null };
  },

  /**
   * Get plan slots with full item details
   */
  async getPlanSlotsWithDetails(
    client: DbClient,
    userId: string,
    planId: string
  ): Promise<ServiceResult<(PlanSlot & { 
    routineInstance?: RoutineInstance & { template: RoutineTemplate; domain?: Domain } | null;
    task?: Task & { domain?: Domain } | null;
  })[]>> {
    // Get slots
    const { data: slots, error: slotsError } = await client
      .from('lifeos_plan_slots')
      .select('*')
      .eq('plan_id', planId)
      .order('start_time', { ascending: true });

    if (slotsError) {
      return { data: null, error: slotsError.message };
    }

    if (!slots || slots.length === 0) {
      return { data: [], error: null };
    }

    // Get routine instance IDs
    const routineInstanceIds = slots
      .filter((s) => s.entity_type === 'routine_instance' && s.entity_id)
      .map((s) => s.entity_id!);

    // Get task IDs
    const taskIds = slots
      .filter((s) => s.entity_type === 'task' && s.entity_id)
      .map((s) => s.entity_id!);

    // Fetch routine instances with templates
    let routineInstances: (RoutineInstance & { template: RoutineTemplate })[] = [];
    if (routineInstanceIds.length > 0) {
      const { data } = await client
        .from('lifeos_routine_instances')
        .select(`
          *,
          template:lifeos_routine_templates(*)
        `)
        .in('id', routineInstanceIds);
      routineInstances = (data ?? []) as (RoutineInstance & { template: RoutineTemplate })[];
    }

    // Fetch tasks
    let tasks: Task[] = [];
    if (taskIds.length > 0) {
      const { data } = await client
        .from('lifeos_tasks')
        .select('*')
        .in('id', taskIds);
      tasks = (data ?? []) as Task[];
    }

    // Get all domain IDs
    const domainIds = new Set<string>();
    routineInstances.forEach((r) => {
      if (r.template?.domain_id) domainIds.add(r.template.domain_id);
    });
    tasks.forEach((t) => {
      if (t.domain_id) domainIds.add(t.domain_id);
    });

    // Fetch domains
    let domains: Domain[] = [];
    if (domainIds.size > 0) {
      const { data } = await client
        .from('lifeos_domains')
        .select('*')
        .in('id', Array.from(domainIds));
      domains = (data ?? []) as Domain[];
    }

    const domainMap = new Map(domains.map((d) => [d.id, d]));
    const routineMap = new Map(routineInstances.map((r) => [r.id, r]));
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    // Combine data
    const slotsWithDetails = slots.map((slot) => {
      const routineInstance = slot.entity_type === 'routine_instance' && slot.entity_id
        ? routineMap.get(slot.entity_id) 
        : null;
      const task = slot.entity_type === 'task' && slot.entity_id 
        ? taskMap.get(slot.entity_id) 
        : null;

      return {
        ...slot,
        routineInstance: routineInstance ? {
          ...routineInstance,
          domain: routineInstance.template?.domain_id 
            ? domainMap.get(routineInstance.template.domain_id)
            : undefined,
        } : null,
        task: task ? {
          ...task,
          domain: task.domain_id ? domainMap.get(task.domain_id) : undefined,
        } : null,
      };
    });

    return { data: slotsWithDetails, error: null };
  },
};

