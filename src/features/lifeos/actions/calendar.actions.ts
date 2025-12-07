/**
 * LifeOS Calendar Server Actions
 * 
 * Server Actions for calendar data retrieval and event management.
 * 
 * @module lifeos/actions/calendar
 */
'use server';

import { createSSRClient } from '@/lib/supabase/server';
import { calendarService } from '../services/calendar.service';
import { routineInstanceService } from '../services/routine-instances.service';
import { 
  calendarRangeSchema,
  moveEventSchema,
  type CalendarEvent,
  type CalendarData,
  type Conflict,
} from '../schema/calendar.schema';
import type { ActionResult } from '@/lib/types';

/**
 * Get calendar events for a date range
 * Automatically generates routine instances if missing
 */
export async function getCalendarEvents(
  startDate: string,
  endDate: string
): Promise<ActionResult<CalendarEvent[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate date range
  const parsed = calendarRangeSchema.safeParse({ startDate, endDate });
  if (!parsed.success) {
    return { data: null, error: 'Format de date invalide' };
  }

  // Generate routine instances for this range if missing
  // This ensures routines appear on the calendar
  await routineInstanceService.generateForDateRange(
    supabase,
    user.id,
    startDate,
    endDate
  );

  const result = await calendarService.getEventsForRange(
    supabase, 
    user.id, 
    startDate, 
    endDate
  );

  if (result.error) {
    return { data: null, error: result.error };
  }

  const events = calendarService.toCalendarEvents(result.data!);
  return { data: events, error: null };
}

/**
 * Get calendar events for today
 */
export async function getTodayEvents(): Promise<ActionResult<CalendarEvent[]>> {
  const today = new Date().toISOString().split('T')[0];
  return getCalendarEvents(today, today);
}

/**
 * Get calendar events for current week
 */
export async function getCurrentWeekEvents(): Promise<ActionResult<CalendarEvent[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Calculate Monday of current week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const mondayStr = monday.toISOString().split('T')[0];

  const result = await calendarService.getEventsForWeek(supabase, user.id, mondayStr);
  return result;
}

/**
 * Get calendar events for current month
 */
export async function getCurrentMonthEvents(): Promise<ActionResult<CalendarEvent[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const now = new Date();
  const result = await calendarService.getEventsForMonth(
    supabase, 
    user.id, 
    now.getFullYear(), 
    now.getMonth() + 1
  );
  return result;
}

/**
 * Get events for a specific month
 */
export async function getMonthEvents(
  year: number,
  month: number
): Promise<ActionResult<CalendarEvent[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  if (month < 1 || month > 12) {
    return { data: null, error: 'Mois invalide' };
  }

  const result = await calendarService.getEventsForMonth(supabase, user.id, year, month);
  return result;
}

/**
 * Get events for a specific week
 */
export async function getWeekEvents(
  weekStartDate: string
): Promise<ActionResult<CalendarEvent[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await calendarService.getEventsForWeek(supabase, user.id, weekStartDate);
  return result;
}

/**
 * Get raw calendar data (for custom rendering)
 */
export async function getCalendarData(
  startDate: string,
  endDate: string
): Promise<ActionResult<CalendarData>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const parsed = calendarRangeSchema.safeParse({ startDate, endDate });
  if (!parsed.success) {
    return { data: null, error: 'Format de date invalide' };
  }

  const result = await calendarService.getEventsForRange(
    supabase, 
    user.id, 
    startDate, 
    endDate
  );
  return result;
}

/**
 * Detect scheduling conflicts for a date range
 */
export async function detectConflicts(
  startDate: string,
  endDate: string
): Promise<ActionResult<Conflict[]>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const eventsResult = await getCalendarEvents(startDate, endDate);
  
  if (eventsResult.error) {
    return { data: null, error: eventsResult.error };
  }

  const conflicts = calendarService.detectConflicts(eventsResult.data!);
  return { data: conflicts, error: null };
}

/**
 * Move an event (drag & drop)
 */
export async function moveCalendarEvent(
  entityType: 'routine_instance' | 'task',
  entityId: string,
  newStartTime: string,
  newDate?: string
): Promise<ActionResult<void>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const parsed = moveEventSchema.safeParse({
    eventId: entityId,
    entityType,
    newStart: newStartTime,
  });

  if (!parsed.success) {
    return { data: null, error: 'Données invalides' };
  }

  const result = await calendarService.updateEventTime(
    supabase,
    user.id,
    entityType,
    entityId,
    newStartTime,
    newDate
  );

  if (result.error) {
    return { data: null, error: result.error };
  }

  return { data: undefined, error: null };
}
