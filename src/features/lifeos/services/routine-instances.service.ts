/**
 * LifeOS Routine Instances Service
 * 
 * Handles routine instance generation based on templates and RRULE patterns.
 * Also manages instance completion and tracking.
 * 
 * @module lifeos/services/routine-instances
 */

import type { DbClient } from '@/lib/types';
import type { 
  RoutineInstance,
  RecurrenceConfig, 
} from '../schema/routines.schema';

// Result type following ActionResult pattern
export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Check if a routine should occur on a given date based on recurrence config
 */
function shouldOccurOnDate(
  config: RecurrenceConfig,
  date: Date,
  templateCreatedAt: Date
): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday
  const dayOfMonth = date.getDate();
  
  // Calculate days since template creation for interval calculation
  const daysSinceCreation = Math.floor(
    (date.getTime() - templateCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  switch (config.type) {
    case 'daily':
      // Check interval
      if (config.interval && config.interval > 1) {
        if (daysSinceCreation % config.interval !== 0) return false;
      }
      // Check weekend exclusion
      if (config.excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        return false;
      }
      return true;

    case 'weekly':
      // Check interval (weeks)
      if (config.interval && config.interval > 1) {
        const weeksSinceCreation = Math.floor(daysSinceCreation / 7);
        if (weeksSinceCreation % config.interval !== 0) return false;
      }
      // Check days of week
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        return config.daysOfWeek.includes(dayOfWeek);
      }
      // Default to same day of week as creation
      return dayOfWeek === templateCreatedAt.getDay();

    case 'monthly':
      // Check interval (months)
      if (config.interval && config.interval > 1) {
        const monthsSinceCreation = 
          (date.getFullYear() - templateCreatedAt.getFullYear()) * 12 +
          (date.getMonth() - templateCreatedAt.getMonth());
        if (monthsSinceCreation % config.interval !== 0) return false;
      }
      // Check days of month
      if (config.daysOfMonth && config.daysOfMonth.length > 0) {
        return config.daysOfMonth.includes(dayOfMonth);
      }
      // Default to same day of month as creation
      return dayOfMonth === templateCreatedAt.getDate();

    case 'custom':
      // Custom patterns - default to daily with interval
      if (config.interval && config.interval > 1) {
        return daysSinceCreation % config.interval === 0;
      }
      return true;

    default:
      return true;
  }
}

export const routineInstanceService = {
  /**
   * Generate routine instances for a specific date
   * This creates instances for all active routine templates that should occur on that date
   */
  async generateForDate(
    client: DbClient,
    userId: string,
    date: Date
  ): Promise<ServiceResult<RoutineInstance[]>> {
    // Normalize date to start of day
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const dateStr = targetDate.toISOString().split('T')[0];

    // Get all active routine templates
    const { data: templates, error: templatesError } = await client
      .from('lifeos_routine_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (templatesError) {
      return { data: null, error: templatesError.message };
    }

    if (!templates || templates.length === 0) {
      return { data: [], error: null };
    }

    // Check which templates should have instances for this date
    const templatesToGenerate = templates.filter((template) => {
      const config = template.recurrence_config as RecurrenceConfig;
      const createdAt = new Date(template.created_at);
      return shouldOccurOnDate(config, targetDate, createdAt);
    });

    if (templatesToGenerate.length === 0) {
      return { data: [], error: null };
    }

    // Check for existing instances on this date
    const { data: existingInstances, error: existingError } = await client
      .from('lifeos_routine_instances')
      .select('template_id')
      .eq('user_id', userId)
      .eq('scheduled_date', dateStr);

    if (existingError) {
      return { data: null, error: existingError.message };
    }

    const existingTemplateIds = new Set(
      (existingInstances ?? []).map((i) => i.template_id)
    );

    // Filter out templates that already have instances
    const newTemplates = templatesToGenerate.filter(
      (t) => !existingTemplateIds.has(t.id)
    );

    if (newTemplates.length === 0) {
      // Return existing instances
      const { data: instances, error: fetchError } = await client
        .from('lifeos_routine_instances')
        .select('*')
        .eq('user_id', userId)
        .eq('scheduled_date', dateStr);

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      return { data: instances ?? [], error: null };
    }

    // Create new instances
    const instancesToCreate = newTemplates.map((template) => ({
      user_id: userId,
      template_id: template.id,
      scheduled_date: dateStr,
      status: 'pending' as const,
    }));

    const { error: insertError } = await client
      .from('lifeos_routine_instances')
      .insert(instancesToCreate);

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    // Fetch all instances for the date
    const { data: allInstances, error: finalError } = await client
      .from('lifeos_routine_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('scheduled_date', dateStr);

    if (finalError) {
      return { data: null, error: finalError.message };
    }

    return { data: allInstances ?? [], error: null };
  },

  /**
   * Get routine instances for a date with template details
   */
  async getForDate(
    client: DbClient,
    userId: string,
    date: Date
  ): Promise<ServiceResult<(RoutineInstance & { template: unknown })[]>> {
    const dateStr = date.toISOString().split('T')[0];

    const { data, error } = await client
      .from('lifeos_routine_instances')
      .select(`
        *,
        template:lifeos_routine_templates(*)
      `)
      .eq('user_id', userId)
      .eq('scheduled_date', dateStr);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  },

  /**
   * Complete a routine instance
   */
  async complete(
    client: DbClient,
    userId: string,
    instanceId: string,
    actualValue?: number,
    mood?: number,
    energyLevel?: number,
    notes?: string
  ): Promise<ServiceResult<RoutineInstance>> {
    // Get instance with template to calculate score
    const { data: instance, error: fetchError } = await client
      .from('lifeos_routine_instances')
      .select(`
        *,
        template:lifeos_routine_templates(constraints)
      `)
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError.message };
    }

    // Calculate completion score
    let completionScore = 100; // Default full score
    const constraints = (instance.template as { constraints?: { targetValue?: number } })?.constraints;
    
    if (constraints?.targetValue && actualValue !== undefined) {
      completionScore = Math.min(100, Math.round((actualValue / constraints.targetValue) * 100));
    }

    // Update instance
    const { data: updated, error: updateError } = await client
      .from('lifeos_routine_instances')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        actual_value: actualValue ?? null,
        completion_score: completionScore,
        mood: mood ?? null,
        energy_level: energyLevel ?? null,
        notes: notes ?? null,
      })
      .eq('id', instanceId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    // Update streak using RPC function
    const { error: streakError } = await client.rpc('update_routine_streak', {
      p_template_id: instance.template_id,
      p_user_id: userId,
    });

    if (streakError) {
      console.error('Failed to update streak:', streakError);
      // Don't fail the completion, just log the error
    }

    return { data: updated, error: null };
  },

  /**
   * Skip a routine instance
   */
  async skip(
    client: DbClient,
    userId: string,
    instanceId: string,
    reason?: string
  ): Promise<ServiceResult<RoutineInstance>> {
    const { data, error } = await client
      .from('lifeos_routine_instances')
      .update({
        status: 'skipped',
        completed_at: new Date().toISOString(),
        notes: reason ?? null,
        completion_score: 0,
      })
      .eq('id', instanceId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Reset streak for this routine
    const { data: instance } = await client
      .from('lifeos_routine_instances')
      .select('template_id')
      .eq('id', instanceId)
      .single();

    if (instance) {
      await client
        .from('lifeos_streaks')
        .update({ current_streak: 0 })
        .eq('template_id', instance.template_id)
        .eq('user_id', userId);
    }

    return { data, error: null };
  },

  /**
   * Get instance by ID
   */
  async getById(
    client: DbClient,
    userId: string,
    instanceId: string
  ): Promise<ServiceResult<RoutineInstance & { template: unknown }>> {
    const { data, error } = await client
      .from('lifeos_routine_instances')
      .select(`
        *,
        template:lifeos_routine_templates(*)
      `)
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },
};
