/**
 * LifeOS Timer Service
 * 
 * Handles task timer operations: start, pause, stop, and time tracking.
 * 
 * @module lifeos/services/timer
 */

import type { DbClient } from '@/lib/types';

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export interface TimerState {
  taskId: string;
  isRunning: boolean;
  startedAt: string | null;
  accumulatedSeconds: number;
  currentSessionSeconds: number; // Calculated from startedAt
}

export const timerService = {
  /**
   * Start timer for a task
   * If timer was already running, does nothing
   */
  async start(
    client: DbClient,
    userId: string,
    taskId: string
  ): Promise<ServiceResult<TimerState>> {
    try {
      // First check if task exists and belongs to user
      const { data: task, error: fetchError } = await client
        .from('lifeos_tasks')
        .select('id, timer_is_running, timer_started_at, timer_accumulated_seconds')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !task) {
        return { data: null, error: 'Task not found' };
      }

      // If already running, return current state
      if (task.timer_is_running) {
        const startedAt = new Date(task.timer_started_at);
        const currentSessionSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);

        return {
          data: {
            taskId,
            isRunning: true,
            startedAt: task.timer_started_at,
            accumulatedSeconds: task.timer_accumulated_seconds || 0,
            currentSessionSeconds,
          },
          error: null,
        };
      }

      // Start the timer
      const now = new Date().toISOString();
      const { error: updateError } = await client
        .from('lifeos_tasks')
        .update({
          timer_is_running: true,
          timer_started_at: now,
        })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (updateError) {
        return { data: null, error: updateError.message };
      }

      return {
        data: {
          taskId,
          isRunning: true,
          startedAt: now,
          accumulatedSeconds: task.timer_accumulated_seconds || 0,
          currentSessionSeconds: 0,
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
   * Pause timer for a task
   * Accumulates the elapsed time since start
   */
  async pause(
    client: DbClient,
    userId: string,
    taskId: string
  ): Promise<ServiceResult<TimerState>> {
    try {
      // Fetch current state
      const { data: task, error: fetchError } = await client
        .from('lifeos_tasks')
        .select('id, timer_is_running, timer_started_at, timer_accumulated_seconds')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !task) {
        return { data: null, error: 'Task not found' };
      }

      // If not running, return current state
      if (!task.timer_is_running) {
        return {
          data: {
            taskId,
            isRunning: false,
            startedAt: null,
            accumulatedSeconds: task.timer_accumulated_seconds || 0,
            currentSessionSeconds: 0,
          },
          error: null,
        };
      }

      // Calculate elapsed time
      const startedAt = new Date(task.timer_started_at);
      const elapsedSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      const newAccumulated = (task.timer_accumulated_seconds || 0) + elapsedSeconds;

      // Pause the timer
      const { error: updateError } = await client
        .from('lifeos_tasks')
        .update({
          timer_is_running: false,
          timer_started_at: null,
          timer_accumulated_seconds: newAccumulated,
        })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (updateError) {
        return { data: null, error: updateError.message };
      }

      return {
        data: {
          taskId,
          isRunning: false,
          startedAt: null,
          accumulatedSeconds: newAccumulated,
          currentSessionSeconds: 0,
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
   * Stop and reset timer for a task
   * Saves accumulated time to actual_minutes
   */
  async stop(
    client: DbClient,
    userId: string,
    taskId: string,
    saveToActualMinutes: boolean = true
  ): Promise<ServiceResult<{ savedMinutes: number }>> {
    try {
      // Fetch current state
      const { data: task, error: fetchError } = await client
        .from('lifeos_tasks')
        .select('id, timer_is_running, timer_started_at, timer_accumulated_seconds, actual_minutes')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !task) {
        return { data: null, error: 'Task not found' };
      }

      // Calculate total time including current session
      let totalSeconds = task.timer_accumulated_seconds || 0;
      if (task.timer_is_running && task.timer_started_at) {
        const startedAt = new Date(task.timer_started_at);
        const elapsedSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
        totalSeconds += elapsedSeconds;
      }

      const totalMinutes = Math.ceil(totalSeconds / 60);

      // Build update
      const updateData: Record<string, unknown> = {
        timer_is_running: false,
        timer_started_at: null,
        timer_accumulated_seconds: 0,
      };

      if (saveToActualMinutes) {
        updateData.actual_minutes = (task.actual_minutes || 0) + totalMinutes;
      }

      const { error: updateError } = await client
        .from('lifeos_tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', userId);

      if (updateError) {
        return { data: null, error: updateError.message };
      }

      return {
        data: { savedMinutes: totalMinutes },
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
   * Get current timer state for a task
   */
  async getState(
    client: DbClient,
    userId: string,
    taskId: string
  ): Promise<ServiceResult<TimerState>> {
    try {
      const { data: task, error: fetchError } = await client
        .from('lifeos_tasks')
        .select('id, timer_is_running, timer_started_at, timer_accumulated_seconds')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !task) {
        return { data: null, error: 'Task not found' };
      }

      let currentSessionSeconds = 0;
      if (task.timer_is_running && task.timer_started_at) {
        const startedAt = new Date(task.timer_started_at);
        currentSessionSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      }

      return {
        data: {
          taskId,
          isRunning: task.timer_is_running || false,
          startedAt: task.timer_started_at,
          accumulatedSeconds: task.timer_accumulated_seconds || 0,
          currentSessionSeconds,
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
   * Get all running timers for a user
   * Useful for displaying active timer indicator
   */
  async getRunningTimers(
    client: DbClient,
    userId: string
  ): Promise<ServiceResult<TimerState[]>> {
    try {
      const { data: tasks, error } = await client
        .from('lifeos_tasks')
        .select('id, name, timer_is_running, timer_started_at, timer_accumulated_seconds')
        .eq('user_id', userId)
        .eq('timer_is_running', true);

      if (error) {
        return { data: null, error: error.message };
      }

      const timers: TimerState[] = (tasks || []).map((task) => {
        const startedAt = task.timer_started_at 
          ? new Date(task.timer_started_at) 
          : new Date();
        const currentSessionSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);

        return {
          taskId: task.id,
          isRunning: true,
          startedAt: task.timer_started_at,
          accumulatedSeconds: task.timer_accumulated_seconds || 0,
          currentSessionSeconds,
        };
      });

      return { data: timers, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },
};
