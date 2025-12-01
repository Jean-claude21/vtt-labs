/**
 * LifeOS Routines Service
 * 
 * Pure service functions for routine template CRUD operations.
 * Handles RRULE generation and constraints parsing.
 * 
 * @module lifeos/services/routines
 */

import type { DbClient } from '@/lib/types';
import type { 
  RoutineTemplate, 
  CreateRoutineTemplateInput, 
  UpdateRoutineTemplateInput,
  RoutineFilters,
  RecurrenceConfig,
} from '../schema/routines.schema';

// Result type following ActionResult pattern
export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Generate RRULE string from config
 */
function generateRRule(config: RecurrenceConfig): string {
  let rule = 'RRULE:FREQ=';
  
  switch (config.type) {
    case 'daily':
      rule += 'DAILY';
      if (config.interval && config.interval > 1) {
        rule += `;INTERVAL=${config.interval}`;
      }
      if (config.excludeWeekends) {
        rule += ';BYDAY=MO,TU,WE,TH,FR';
      }
      break;
      
    case 'weekly':
      rule += 'WEEKLY';
      if (config.interval && config.interval > 1) {
        rule += `;INTERVAL=${config.interval}`;
      }
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const days = config.daysOfWeek.map(d => dayNames[d]).join(',');
        rule += `;BYDAY=${days}`;
      }
      break;
      
    case 'monthly':
      rule += 'MONTHLY';
      if (config.interval && config.interval > 1) {
        rule += `;INTERVAL=${config.interval}`;
      }
      if (config.daysOfMonth && config.daysOfMonth.length > 0) {
        rule += `;BYMONTHDAY=${config.daysOfMonth.join(',')}`;
      }
      break;
      
    case 'custom':
      // For custom, expect the rule to be passed directly or use daily as default
      rule += 'DAILY';
      if (config.interval) {
        rule += `;INTERVAL=${config.interval}`;
      }
      break;
      
    default:
      rule += 'DAILY';
  }
  
  return rule;
}

export const routineService = {
  /**
   * Get all routine templates for a user with optional filters
   */
  async getAll(
    client: DbClient, 
    userId: string,
    filters?: RoutineFilters
  ): Promise<ServiceResult<RoutineTemplate[]>> {
    let query = client
      .from('lifeos_routine_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.domain_id) {
      query = query.eq('domain_id', filters.domain_id);
    }
    if (filters?.category_moment) {
      query = query.eq('category_moment', filters.category_moment);
    }
    if (filters?.category_type) {
      query = query.eq('category_type', filters.category_type);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  },

  /**
   * Get a single routine template by ID
   */
  async getById(
    client: DbClient, 
    userId: string, 
    routineId: string
  ): Promise<ServiceResult<RoutineTemplate>> {
    const { data, error } = await client
      .from('lifeos_routine_templates')
      .select('*')
      .eq('id', routineId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Create a new routine template
   */
  async create(
    client: DbClient, 
    userId: string, 
    input: CreateRoutineTemplateInput
  ): Promise<ServiceResult<RoutineTemplate>> {
    // Generate RRULE if not provided
    const recurrenceRule = input.recurrence_rule || generateRRule(input.recurrence_config ?? { type: 'daily' });

    const { data, error } = await client
      .from('lifeos_routine_templates')
      .insert({
        user_id: userId,
        name: input.name,
        description: input.description ?? null,
        domain_id: input.domain_id ?? null,
        category_moment: input.category_moment ?? null,
        category_type: input.category_type ?? null,
        constraints: input.constraints ?? {},
        recurrence_rule: recurrenceRule,
        recurrence_config: input.recurrence_config ?? { type: 'daily' },
        priority: input.priority ?? 'medium',
        is_flexible: input.is_flexible ?? true,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Create initial streak record
    await client.from('lifeos_streaks').insert({
      template_id: data.id,
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
    });

    return { data, error: null };
  },

  /**
   * Update an existing routine template
   */
  async update(
    client: DbClient, 
    userId: string, 
    input: UpdateRoutineTemplateInput
  ): Promise<ServiceResult<RoutineTemplate>> {
    const { id, ...updateData } = input;

    // Regenerate RRULE if recurrence_config changed
    if (updateData.recurrence_config && !updateData.recurrence_rule) {
      updateData.recurrence_rule = generateRRule(updateData.recurrence_config);
    }

    // Remove undefined fields
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined)
    );

    const { data, error } = await client
      .from('lifeos_routine_templates')
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
   * Delete a routine template
   * Also removes associated instances and streak data
   */
  async delete(
    client: DbClient, 
    userId: string, 
    routineId: string
  ): Promise<ServiceResult<{ success: boolean }>> {
    // Delete cascade will handle instances and streaks
    const { error } = await client
      .from('lifeos_routine_templates')
      .delete()
      .eq('id', routineId)
      .eq('user_id', userId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { success: true }, error: null };
  },

  /**
   * Toggle routine active status
   */
  async toggleActive(
    client: DbClient, 
    userId: string, 
    routineId: string
  ): Promise<ServiceResult<RoutineTemplate>> {
    // Get current status
    const { data: current, error: fetchError } = await client
      .from('lifeos_routine_templates')
      .select('is_active')
      .eq('id', routineId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError.message };
    }

    // Toggle
    const { data, error } = await client
      .from('lifeos_routine_templates')
      .update({ is_active: !current.is_active })
      .eq('id', routineId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Get routine with its streak info
   */
  async getWithStreak(
    client: DbClient,
    userId: string,
    routineId: string
  ): Promise<ServiceResult<RoutineTemplate & { streak: { current_streak: number; longest_streak: number } | null }>> {
    const { data: routine, error: routineError } = await client
      .from('lifeos_routine_templates')
      .select('*')
      .eq('id', routineId)
      .eq('user_id', userId)
      .single();

    if (routineError) {
      return { data: null, error: routineError.message };
    }

    const { data: streak } = await client
      .from('lifeos_streaks')
      .select('current_streak, longest_streak')
      .eq('template_id', routineId)
      .single();

    return {
      data: {
        ...routine,
        streak: streak ?? null,
      },
      error: null,
    };
  },

  /**
   * Get all routines with their streaks
   */
  async getAllWithStreaks(
    client: DbClient,
    userId: string,
    filters?: RoutineFilters
  ): Promise<ServiceResult<(RoutineTemplate & { streak: { current_streak: number; longest_streak: number } | null })[]>> {
    // Get routines first
    const routinesResult = await this.getAll(client, userId, filters);
    
    if (routinesResult.error || !routinesResult.data) {
      return routinesResult as ServiceResult<never>;
    }

    // Get all streaks for user
    const { data: streaks } = await client
      .from('lifeos_streaks')
      .select('template_id, current_streak, longest_streak')
      .eq('user_id', userId);

    // Map streaks to routines
    const streakMap = new Map(
      (streaks ?? []).map(s => [s.template_id, { 
        current_streak: s.current_streak, 
        longest_streak: s.longest_streak 
      }])
    );

    const routinesWithStreaks = routinesResult.data.map(routine => ({
      ...routine,
      streak: streakMap.get(routine.id) ?? null,
    }));

    return { data: routinesWithStreaks, error: null };
  },
};
