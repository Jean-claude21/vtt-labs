/**
 * LifeOS Analytics Service
 * 
 * Provides analytics data for routines, tasks, and time tracking.
 * 
 * @module lifeos/services/analytics
 */

import type { DbClient } from '@/lib/types';

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

// ============================================================================
// TYPES
// ============================================================================

export interface WeeklyStats {
  routineCompletionRate: number;
  tasksCompleted: number;
  totalTimeMinutes: number;
  byDomain: DomainStats[];
  byDay: DayStats[];
}

export interface DomainStats {
  domainId: string;
  domainName: string;
  domainColor: string;
  routinesCompleted: number;
  routinesTotal: number;
  tasksCompleted: number;
  timeMinutes: number;
}

export interface DayStats {
  date: string;
  dayName: string;
  routinesCompleted: number;
  routinesTotal: number;
  tasksCompleted: number;
  timeMinutes: number;
}

export interface StreakInfo {
  routineId: string;
  routineName: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

export interface OverviewStats {
  totalRoutines: number;
  totalTasks: number;
  totalProjects: number;
  weeklyCompletionRate: number;
  longestStreak: number;
  currentBestStreak: number;
}

// ============================================================================
// SERVICE
// ============================================================================

export const analyticsService = {
  /**
   * Get overview statistics
   */
  async getOverview(
    client: DbClient,
    userId: string
  ): Promise<ServiceResult<OverviewStats>> {
    try {
      // Get counts in parallel
      const [routinesResult, tasksResult, projectsResult, instancesResult] = await Promise.all([
        client.from('lifeos_routine_templates').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        client.from('lifeos_tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        client.from('lifeos_projects').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        // Get this week's routine instances
        client
          .from('lifeos_routine_instances')
          .select('id, status, template_id')
          .eq('user_id', userId)
          .gte('scheduled_date', getWeekStart())
          .lte('scheduled_date', getWeekEnd()),
      ]);

      const instances = instancesResult.data ?? [];
      const total = instances.length;
      const completed = instances.filter(i => i.status === 'completed').length;
      const weeklyCompletionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Get streaks
      const streaksResult = await this.getStreaks(client, userId);
      const streaks = streaksResult.data ?? [];
      const longestStreak = Math.max(0, ...streaks.map(s => s.longestStreak));
      const currentBestStreak = Math.max(0, ...streaks.map(s => s.currentStreak));

      return {
        data: {
          totalRoutines: routinesResult.count ?? 0,
          totalTasks: tasksResult.count ?? 0,
          totalProjects: projectsResult.count ?? 0,
          weeklyCompletionRate,
          longestStreak,
          currentBestStreak,
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  /**
   * Get weekly statistics with breakdown by domain and day
   */
  async getWeeklyStats(
    client: DbClient,
    userId: string,
    weekStartDate?: string
  ): Promise<ServiceResult<WeeklyStats>> {
    try {
      const weekStart = weekStartDate ?? getWeekStart();
      const weekEnd = getWeekEnd(weekStart);

      // Get routine instances for the week
      const { data: instances, error: instancesError } = await client
        .from('lifeos_routine_instances')
        .select(`
          id,
          status,
          scheduled_date,
          actual_start,
          actual_end,
          template:lifeos_routine_templates!template_id(
            id,
            name,
            domain_id,
            domain:lifeos_domains(id, name, color)
          )
        `)
        .eq('user_id', userId)
        .gte('scheduled_date', weekStart)
        .lte('scheduled_date', weekEnd);

      if (instancesError) {
        return { data: null, error: instancesError.message };
      }

      // Get completed tasks for the week
      const { data: tasks, error: tasksError } = await client
        .from('lifeos_tasks')
        .select(`
          id,
          status,
          updated_at,
          timer_accumulated_seconds,
          domain_id,
          domain:lifeos_domains(id, name, color)
        `)
        .eq('user_id', userId)
        .eq('status', 'done')
        .gte('updated_at', weekStart)
        .lte('updated_at', weekEnd);

      if (tasksError) {
        return { data: null, error: tasksError.message };
      }

      // Calculate stats
      const routineInstances = instances ?? [];
      const completedTasks = tasks ?? [];

      const totalInstances = routineInstances.length;
      const completedInstances = routineInstances.filter(i => i.status === 'completed').length;
      const routineCompletionRate = totalInstances > 0 
        ? Math.round((completedInstances / totalInstances) * 100) 
        : 0;

      // Time from routine instances + task timers
      const routineTimeMinutes = routineInstances.reduce(
        (sum, i) => {
          if (i.actual_start && i.actual_end) {
            const start = new Date(i.actual_start).getTime();
            const end = new Date(i.actual_end).getTime();
            return sum + Math.floor((end - start) / 60000);
          }
          return sum;
        }, 
        0
      );
      const taskTimeMinutes = completedTasks.reduce(
        (sum, t) => sum + Math.floor((t.timer_accumulated_seconds ?? 0) / 60),
        0
      );
      const totalTimeMinutes = routineTimeMinutes + taskTimeMinutes;

      // Build domain stats
      const domainMap = new Map<string, DomainStats>();
      
      for (const instance of routineInstances) {
        const template = instance.template as unknown as {
          domain_id: string | null;
          domain: { id: string; name: string; color: string } | null;
        };
        const domainId = template?.domain_id ?? 'none';
        const domain = template?.domain;
        
        if (!domainMap.has(domainId)) {
          domainMap.set(domainId, {
            domainId,
            domainName: domain?.name ?? 'Sans domaine',
            domainColor: domain?.color ?? '#888888',
            routinesCompleted: 0,
            routinesTotal: 0,
            tasksCompleted: 0,
            timeMinutes: 0,
          });
        }
        
        const stats = domainMap.get(domainId)!;
        stats.routinesTotal++;
        if (instance.status === 'completed') stats.routinesCompleted++;
        // Calculate time from actual_start/actual_end
        if (instance.actual_start && instance.actual_end) {
          const start = new Date(instance.actual_start).getTime();
          const end = new Date(instance.actual_end).getTime();
          stats.timeMinutes += Math.floor((end - start) / 60000);
        }
      }

      for (const task of completedTasks) {
        const domainId = task.domain_id ?? 'none';
        const domain = task.domain as unknown as { id: string; name: string; color: string } | null;
        
        if (!domainMap.has(domainId)) {
          domainMap.set(domainId, {
            domainId,
            domainName: domain?.name ?? 'Sans domaine',
            domainColor: domain?.color ?? '#888888',
            routinesCompleted: 0,
            routinesTotal: 0,
            tasksCompleted: 0,
            timeMinutes: 0,
          });
        }
        
        const stats = domainMap.get(domainId)!;
        stats.tasksCompleted++;
        stats.timeMinutes += Math.floor((task.timer_accumulated_seconds ?? 0) / 60);
      }

      // Build day stats
      const dayNames = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
      const dayMap = new Map<string, DayStats>();
      
      // Initialize all days of the week
      const startDate = new Date(weekStart);
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        dayMap.set(dateStr, {
          date: dateStr,
          dayName: dayNames[d.getDay()],
          routinesCompleted: 0,
          routinesTotal: 0,
          tasksCompleted: 0,
          timeMinutes: 0,
        });
      }

      for (const instance of routineInstances) {
        const dateStr = instance.scheduled_date;
        const stats = dayMap.get(dateStr);
        if (stats) {
          stats.routinesTotal++;
          if (instance.status === 'completed') stats.routinesCompleted++;
          // Calculate time from actual_start/actual_end
          if (instance.actual_start && instance.actual_end) {
            const start = new Date(instance.actual_start).getTime();
            const end = new Date(instance.actual_end).getTime();
            stats.timeMinutes += Math.floor((end - start) / 60000);
          }
        }
      }

      for (const task of completedTasks) {
        const dateStr = task.updated_at?.split('T')[0];
        if (dateStr) {
          const stats = dayMap.get(dateStr);
          if (stats) {
            stats.tasksCompleted++;
            stats.timeMinutes += Math.floor((task.timer_accumulated_seconds ?? 0) / 60);
          }
        }
      }

      return {
        data: {
          routineCompletionRate,
          tasksCompleted: completedTasks.length,
          totalTimeMinutes,
          byDomain: Array.from(domainMap.values()),
          byDay: Array.from(dayMap.values()),
        },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  /**
   * Get streak information for all routines
   */
  async getStreaks(
    client: DbClient,
    userId: string
  ): Promise<ServiceResult<StreakInfo[]>> {
    try {
      // Get all active routines with their instances
      const { data: routines, error: routinesError } = await client
        .from('lifeos_routine_templates')
        .select(`
          id,
          name,
          instances:lifeos_routine_instances(
            scheduled_date,
            status
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (routinesError) {
        return { data: null, error: routinesError.message };
      }

      const streaks: StreakInfo[] = [];
      const today = new Date().toISOString().split('T')[0];

      for (const routine of routines ?? []) {
        const instances = (routine.instances ?? []) as Array<{
          scheduled_date: string;
          status: string;
        }>;

        // Sort by date descending
        const sortedInstances = [...instances].sort(
          (a, b) => b.scheduled_date.localeCompare(a.scheduled_date)
        );

        // Calculate current streak (consecutive days from today or yesterday)
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let lastCompletedDate: string | null = null;

        for (const instance of sortedInstances) {
          if (instance.status === 'completed') {
            if (!lastCompletedDate) lastCompletedDate = instance.scheduled_date;
            tempStreak++;
          } else {
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            tempStreak = 0;
          }
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;

        // Current streak: count from most recent
        let expectedDate = today;
        for (const instance of sortedInstances) {
          if (instance.scheduled_date > today) continue;
          
          // Allow skipping one day for "streak" calculation
          const daysDiff = dateDiffDays(instance.scheduled_date, expectedDate);
          
          if (daysDiff <= 1 && instance.status === 'completed') {
            currentStreak++;
            expectedDate = instance.scheduled_date;
          } else {
            break;
          }
        }

        streaks.push({
          routineId: routine.id,
          routineName: routine.name,
          currentStreak,
          longestStreak,
          lastCompletedDate,
        });
      }

      // Sort by current streak descending
      streaks.sort((a, b) => b.currentStreak - a.currentStreak);

      return { data: streaks, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function getWeekStart(fromDate?: string): string {
  const d = fromDate ? new Date(fromDate) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getWeekEnd(weekStartDate?: string): string {
  const start = weekStartDate ? new Date(weekStartDate) : new Date(getWeekStart());
  start.setDate(start.getDate() + 6);
  return start.toISOString().split('T')[0];
}

function dateDiffDays(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs(Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}
