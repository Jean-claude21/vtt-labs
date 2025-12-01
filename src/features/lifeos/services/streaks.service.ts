/**
 * LifeOS Streaks Service
 * 
 * Handles streak calculation, updates, and resets for routine tracking.
 * Streaks are automatically maintained when routines are completed or skipped.
 * 
 * @module lifeos/services/streaks
 */

import type { DbClient } from '@/lib/types';

// Result type following ActionResult pattern
export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

// Streak type matching database schema
export interface Streak {
  id: string;
  user_id: string;
  template_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  created_at: string;
  updated_at: string;
}

// Streak stats for display
export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: string | null;
  completionRate: number;
  totalCompletions: number;
  totalScheduled: number;
}

export const streakService = {
  /**
   * Get streak for a specific routine template
   */
  async getForRoutine(
    client: DbClient,
    userId: string,
    routineTemplateId: string
  ): Promise<ServiceResult<Streak>> {
    const { data, error } = await client
      .from('lifeos_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('template_id', routineTemplateId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is okay
      return { data: null, error: error.message };
    }

    if (!data) {
      // Create a new streak record if none exists
      return this.createStreak(client, userId, routineTemplateId);
    }

    return { data, error: null };
  },

  /**
   * Get all streaks for a user
   */
  async getAllForUser(
    client: DbClient,
    userId: string
  ): Promise<ServiceResult<Streak[]>> {
    const { data, error } = await client
      .from('lifeos_streaks')
      .select('*')
      .eq('user_id', userId)
      .order('current_streak', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ?? [], error: null };
  },

  /**
   * Create a new streak record
   */
  async createStreak(
    client: DbClient,
    userId: string,
    routineTemplateId: string
  ): Promise<ServiceResult<Streak>> {
    const { data, error } = await client
      .from('lifeos_streaks')
      .insert({
        user_id: userId,
        template_id: routineTemplateId,
        current_streak: 0,
        longest_streak: 0,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Update streak when a routine is completed
   * This is typically called via RPC for atomic updates
   */
  async updateOnCompletion(
    client: DbClient,
    userId: string,
    routineTemplateId: string
  ): Promise<ServiceResult<Streak>> {
    // Use RPC function for atomic streak update
    const { error: rpcError } = await client.rpc('update_routine_streak', {
      p_template_id: routineTemplateId,
      p_user_id: userId,
    });

    if (rpcError) {
      return { data: null, error: rpcError.message };
    }

    // Fetch the updated streak
    return this.getForRoutine(client, userId, routineTemplateId);
  },

  /**
   * Reset streak when a routine is skipped or missed
   */
  async resetStreak(
    client: DbClient,
    userId: string,
    routineTemplateId: string
  ): Promise<ServiceResult<Streak>> {
    const { data, error } = await client
      .from('lifeos_streaks')
      .update({ current_streak: 0 })
      .eq('user_id', userId)
      .eq('template_id', routineTemplateId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  /**
   * Calculate completion rate for a routine
   */
  async calculateCompletionRate(
    client: DbClient,
    userId: string,
    routineTemplateId: string,
    days: number = 30
  ): Promise<ServiceResult<StreakStats>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get all instances for this routine in the period
    const { data: instances, error: instancesError } = await client
      .from('lifeos_routine_instances')
      .select('status')
      .eq('user_id', userId)
      .eq('template_id', routineTemplateId)
      .gte('scheduled_date', startDateStr);

    if (instancesError) {
      return { data: null, error: instancesError.message };
    }

    const totalScheduled = instances?.length ?? 0;
    const totalCompletions = instances?.filter(i => i.status === 'completed').length ?? 0;
    const completionRate = totalScheduled > 0 
      ? Math.round((totalCompletions / totalScheduled) * 100) 
      : 0;

    // Get streak data
    const { data: streak, error: streakError } = await this.getForRoutine(
      client,
      userId,
      routineTemplateId
    );

    if (streakError) {
      return { data: null, error: streakError };
    }

    return {
      data: {
        currentStreak: streak?.current_streak ?? 0,
        longestStreak: streak?.longest_streak ?? 0,
        lastCompletedAt: streak?.last_completed_date ?? null,
        completionRate,
        totalCompletions,
        totalScheduled,
      },
      error: null,
    };
  },

  /**
   * Get top streaks for a user (leaderboard-style)
   */
  async getTopStreaks(
    client: DbClient,
    userId: string,
    limit: number = 5
  ): Promise<ServiceResult<(Streak & { routine_name: string })[]>> {
    const { data, error } = await client
      .from('lifeos_streaks')
      .select(`
        *,
        routine:lifeos_routine_templates(name)
      `)
      .eq('user_id', userId)
      .gt('current_streak', 0)
      .order('current_streak', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    // Transform to include routine_name
    const transformed = (data ?? []).map(item => ({
      ...item,
      routine_name: (item.routine as { name?: string })?.name ?? 'Unknown',
    }));

    return { data: transformed, error: null };
  },

  /**
   * Check and reset missed streaks
   * This should be called by a scheduled job
   */
  async checkMissedStreaks(
    client: DbClient,
    userId: string
  ): Promise<ServiceResult<number>> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get all streaks that have a positive current streak
    const { data: activeStreaks, error: streaksError } = await client
      .from('lifeos_streaks')
      .select('template_id')
      .eq('user_id', userId)
      .gt('current_streak', 0);

    if (streaksError) {
      return { data: null, error: streaksError.message };
    }

    if (!activeStreaks || activeStreaks.length === 0) {
      return { data: 0, error: null };
    }

    // Check for missed instances (pending status from yesterday or earlier)
    const { data: missedInstances, error: missedError } = await client
      .from('lifeos_routine_instances')
      .select('template_id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lte('scheduled_date', yesterdayStr)
      .in('template_id', activeStreaks.map(s => s.template_id));

    if (missedError) {
      return { data: null, error: missedError.message };
    }

    if (!missedInstances || missedInstances.length === 0) {
      return { data: 0, error: null };
    }

    // Reset streaks for routines with missed instances
    const missedTemplateIds = [...new Set(missedInstances.map(i => i.template_id))];
    
    const { error: resetError } = await client
      .from('lifeos_streaks')
      .update({ current_streak: 0 })
      .eq('user_id', userId)
      .in('template_id', missedTemplateIds);

    if (resetError) {
      return { data: null, error: resetError.message };
    }

    // Mark missed instances as skipped
    await client
      .from('lifeos_routine_instances')
      .update({ status: 'skipped', notes: 'Automatically marked as missed' })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lte('scheduled_date', yesterdayStr);

    return { data: missedTemplateIds.length, error: null };
  },
};
