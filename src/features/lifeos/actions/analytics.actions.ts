/**
 * LifeOS Analytics Server Actions
 * 
 * Server Actions for retrieving analytics and statistics data.
 * 
 * @module lifeos/actions/analytics
 */
'use server';

import { createSSRClient } from '@/lib/supabase/server';
import { 
  analyticsService, 
  type OverviewStats, 
  type WeeklyStats, 
  type StreakInfo,
} from '../services/analytics.service';
import type { ActionResult } from '@/lib/types';

/**
 * Get overview statistics for the current user
 */
export async function getOverviewStats(): Promise<ActionResult<OverviewStats>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await analyticsService.getOverview(supabase, user.id);
  return result;
}

/**
 * Get weekly statistics with breakdown by domain and day
 */
export async function getWeeklyStats(
  weekStartDate?: string
): Promise<ActionResult<WeeklyStats>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await analyticsService.getWeeklyStats(supabase, user.id, weekStartDate);
  return result;
}

/**
 * Get streak information for all routines
 */
export async function getStreaks(): Promise<ActionResult<StreakInfo[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await analyticsService.getStreaks(supabase, user.id);
  return result;
}
