/**
 * LifeOS Calendar Service
 * 
 * Aggregates routine instances and tasks for calendar display.
 * Provides unified view across day/week/month.
 * 
 * @module lifeos/services/calendar
 */

import type { DbClient } from '@/lib/types';
import type { CalendarEvent, CalendarData, Conflict } from '../schema/calendar.schema';

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export const calendarService = {
  /**
   * Get all calendar events for a date range
   * Aggregates routine instances and tasks with time slots
   */
  async getEventsForRange(
    client: DbClient,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResult<CalendarData>> {
    try {
      // Fetch routine instances for the range with template and domain info
      const { data: routineInstances, error: routineError } = await client
        .from('lifeos_routine_instances')
        .select(`
          *,
          template:lifeos_routine_templates(
            name,
            category_moment,
            category_type,
            is_flexible,
            priority,
            domain_id,
            domain:lifeos_domains(id, name, color, icon)
          )
        `)
        .eq('user_id', userId)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true });

      if (routineError) {
        return { data: null, error: routineError.message };
      }

      // Fetch tasks for the range
      // V2: Include tasks with scheduled_date OR due_date in range
      const { data: tasks, error: tasksError } = await client
        .from('lifeos_tasks')
        .select(`
          *,
          domain:lifeos_domains(id, name, color, icon),
          project:lifeos_projects(id, name)
        `)
        .eq('user_id', userId)
        .not('status', 'in', '(archived,cancelled)')
        .or(`and(scheduled_date.gte.${startDate},scheduled_date.lte.${endDate}),and(due_date.gte.${startDate},due_date.lte.${endDate},scheduled_date.is.null)`)
        .order('scheduled_date', { ascending: true, nullsFirst: false });

      if (tasksError) {
        return { data: null, error: tasksError.message };
      }

      // Transform routine instances to include domain from template
      const transformedInstances = (routineInstances || []).map((instance) => {
        const template = instance.template as {
          name: string;
          category_moment: string | null;
          category_type: string | null;
          is_flexible: boolean;
          priority: string;
          domain_id: string | null;
          domain: { id: string; name: string; color: string; icon: string } | null;
        };

        return {
          ...instance,
          template: {
            name: template?.name || 'Unknown',
            category_moment: template?.category_moment,
            category_type: template?.category_type,
            is_flexible: template?.is_flexible ?? true,
            priority: template?.priority || 'medium',
          },
          domain: template?.domain || null,
        };
      });

      return {
        data: {
          routineInstances: transformedInstances,
          tasks: tasks || [],
          dateRange: { start: startDate, end: endDate },
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
   * Convert raw calendar data to unified CalendarEvent array
   */
  toCalendarEvents(data: CalendarData): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    // Convert routine instances
    for (const instance of data.routineInstances) {
      const template = instance.template as {
        name: string;
        category_moment: string | null;
        category_type: string | null;
        is_flexible: boolean;
        priority: string;
      };
      const domain = instance.domain as {
        id: string;
        name: string;
        color: string;
        icon: string;
      } | null;

      // Calculate start/end times from scheduled_start/scheduled_end
      const scheduledDate = instance.scheduled_date;
      // Use scheduled_start if available, otherwise default to 09:00
      const startTimeStr = instance.scheduled_start 
        ? instance.scheduled_start.split('T').pop()?.substring(0, 5) || '09:00'
        : '09:00';
      
      // Calculate duration from scheduled_start and scheduled_end
      let durationMinutes = 60; // Default
      if (instance.scheduled_start && instance.scheduled_end) {
        const startDate = new Date(instance.scheduled_start);
        const endDate = new Date(instance.scheduled_end);
        durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      }
      
      const start = new Date(`${scheduledDate}T${startTimeStr}`);
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

      events.push({
        id: `routine-${instance.id}`,
        type: 'routine',
        title: template?.name || 'Routine',
        start,
        end,
        allDay: false,
        color: domain?.color || '#6B7280',
        icon: domain?.icon,
        status: instance.status,
        isCompleted: instance.status === 'completed',
        domainId: domain?.id || null,
        domainName: domain?.name || null,
        domainColor: domain?.color || null,
        entityType: 'routine_instance',
        entityId: instance.id,
        priority: template?.priority as 'high' | 'medium' | 'low',
        isFlexible: template?.is_flexible ?? true,
        projectName: null,
      });
    }

    // Convert tasks
    for (const task of data.tasks) {
      const domain = task.domain as {
        id: string;
        name: string;
        color: string;
        icon: string;
      } | null;
      const project = task.project as { id: string; name: string } | null;

      // V2: Prefer scheduled_date/time over due_date/time for calendar placement
      // scheduled_* = when I PLAN to work on it
      // due_* = deadline (when it MUST be done)
      const dateStr = task.scheduled_date || task.due_date;
      if (!dateStr) continue; // Skip tasks without dates for calendar view

      // Use scheduled_time first, then due_time, then null for all-day
      const startTime = task.scheduled_time || task.due_time;
      const durationMinutes = task.estimated_minutes || 30;
      
      // If no time specified, show as all-day
      const isAllDay = !startTime;
      const effectiveStartTime = startTime || '00:00';
      
      const start = new Date(`${dateStr}T${effectiveStartTime}`);
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

      events.push({
        id: `task-${task.id}`,
        type: 'task',
        title: task.title,
        start,
        end,
        allDay: isAllDay,
        color: domain?.color || '#3B82F6',
        icon: domain?.icon,
        status: task.status,
        isCompleted: task.status === 'done',
        domainId: domain?.id || null,
        domainName: domain?.name || null,
        domainColor: domain?.color || null,
        entityType: 'task',
        entityId: task.id,
        priority: task.priority as 'high' | 'medium' | 'low' | undefined,
        isFlexible: true, // Tasks are always draggable
        projectName: project?.name || null,
        timerIsRunning: task.timer_is_running,
        timerAccumulatedSeconds: task.timer_accumulated_seconds,
      });
    }

    // Sort by start time
    events.sort((a, b) => a.start.getTime() - b.start.getTime());

    return events;
  },

  /**
   * Detect scheduling conflicts (overlapping events)
   */
  detectConflicts(events: CalendarEvent[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

    for (let i = 0; i < sortedEvents.length; i++) {
      for (let j = i + 1; j < sortedEvents.length; j++) {
        const event1 = sortedEvents[i];
        const event2 = sortedEvents[j];

        // Skip all-day events
        if (event1.allDay || event2.allDay) continue;

        // Check for overlap
        if (event1.end > event2.start && event1.start < event2.end) {
          const overlapStart = Math.max(event1.start.getTime(), event2.start.getTime());
          const overlapEnd = Math.min(event1.end.getTime(), event2.end.getTime());
          const overlapMinutes = Math.round((overlapEnd - overlapStart) / 60000);

          conflicts.push({
            id: `conflict-${event1.id}-${event2.id}`,
            event1,
            event2,
            overlapMinutes,
            date: event1.start.toISOString().split('T')[0],
          });
        }

        // If event2 starts after event1 ends, no more conflicts possible
        if (event2.start >= event1.end) break;
      }
    }

    return conflicts;
  },

  /**
   * Update event time (for drag-and-drop)
   * Note: For routine instances, we update scheduled_start/scheduled_end
   * For tasks, we update scheduled_date/scheduled_time (V2 calendar placement)
   */
  async updateEventTime(
    client: DbClient,
    userId: string,
    entityType: 'routine_instance' | 'task',
    entityId: string,
    newStartTime: string, // HH:mm format
    newDate?: string // YYYY-MM-DD format (optional, if changing date)
  ): Promise<ServiceResult<void>> {
    try {
      if (entityType === 'routine_instance') {
        // For routine instances, update scheduled_start and optionally scheduled_date
        const updateData: Record<string, string> = { 
          scheduled_start: newStartTime,
        };
        if (newDate) {
          updateData.scheduled_date = newDate;
        }

        const { error } = await client
          .from('lifeos_routine_instances')
          .update(updateData)
          .eq('id', entityId)
          .eq('user_id', userId);

        if (error) {
          return { data: null, error: error.message };
        }
      } else {
        // For tasks, update scheduled_time and optionally scheduled_date (V2)
        // This places the task on the calendar without changing the deadline
        const updateData: Record<string, string | null> = { 
          scheduled_time: newStartTime 
        };
        if (newDate) {
          updateData.scheduled_date = newDate;
        }

        const { error } = await client
          .from('lifeos_tasks')
          .update(updateData)
          .eq('id', entityId)
          .eq('user_id', userId);

        if (error) {
          return { data: null, error: error.message };
        }
      }

      return { data: undefined, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  /**
   * Get events for a single day (optimized query)
   */
  async getEventsForDay(
    client: DbClient,
    userId: string,
    date: string
  ): Promise<ServiceResult<CalendarEvent[]>> {
    const result = await this.getEventsForRange(client, userId, date, date);
    
    if (result.error) {
      return { data: null, error: result.error };
    }

    const events = this.toCalendarEvents(result.data!);
    return { data: events, error: null };
  },

  /**
   * Get events for a week (Monday to Sunday)
   */
  async getEventsForWeek(
    client: DbClient,
    userId: string,
    weekStartDate: string // Monday
  ): Promise<ServiceResult<CalendarEvent[]>> {
    // Calculate Sunday (end of week)
    const monday = new Date(weekStartDate);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const sundayStr = sunday.toISOString().split('T')[0];

    const result = await this.getEventsForRange(client, userId, weekStartDate, sundayStr);
    
    if (result.error) {
      return { data: null, error: result.error };
    }

    const events = this.toCalendarEvents(result.data!);
    return { data: events, error: null };
  },

  /**
   * Get events for a month
   */
  async getEventsForMonth(
    client: DbClient,
    userId: string,
    year: number,
    month: number // 1-12
  ): Promise<ServiceResult<CalendarEvent[]>> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const result = await this.getEventsForRange(client, userId, startDate, endDate);
    
    if (result.error) {
      return { data: null, error: result.error };
    }

    const events = this.toCalendarEvents(result.data!);
    return { data: events, error: null };
  },
};
