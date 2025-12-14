/**
 * LifeOS Preferences Server Actions
 * 
 * Server Actions for user preferences management.
 * 
 * @module lifeos/actions/preferences
 */
'use server';

import { createSSRClient } from '@/lib/supabase/server';
import { preferencesService } from '../services/preferences.service';
import { 
  updatePreferencesSchema,
  calendarViewSchema,
  type UserPreferences,
  type CalendarView,
  type UpdatePreferencesInput,
} from '../schema/preferences.schema';
import type { ActionResult } from '@/lib/types';

/**
 * Get user preferences (creates defaults if not exists)
 */
export async function getPreferences(): Promise<ActionResult<UserPreferences>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await preferencesService.getOrCreate(supabase, user.id);
  return result;
}

/**
 * Update user preferences
 */
export async function updatePreferences(
  input: UpdatePreferencesInput
): Promise<ActionResult<UserPreferences>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate input
  const parsed = updatePreferencesSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { data: null, error: firstError?.message || 'Données invalides' };
  }

  const result = await preferencesService.update(supabase, user.id, parsed.data);
  return result;
}

/**
 * Get default calendar view
 */
export async function getDefaultCalendarView(): Promise<ActionResult<CalendarView>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await preferencesService.getDefaultCalendarView(supabase, user.id);
  return result;
}

/**
 * Set default calendar view
 */
export async function setDefaultCalendarView(
  view: CalendarView
): Promise<ActionResult<void>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  // Validate
  const parsed = calendarViewSchema.safeParse(view);
  if (!parsed.success) {
    return { data: null, error: 'Vue invalide' };
  }

  const result = await preferencesService.setDefaultCalendarView(supabase, user.id, view);
  return result;
}

/**
 * Toggle show routines
 */
export async function toggleShowRoutines(): Promise<ActionResult<boolean>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await preferencesService.toggleShowRoutines(supabase, user.id);
  return result;
}

/**
 * Get calendar display preferences
 */
export async function getCalendarDisplayPreferences(): Promise<ActionResult<{
  view: CalendarView;
  weekStartDay: number;
  showRoutines: boolean;
  showTasks: boolean;
  showExternalEvents: boolean;
  hiddenDomainIds: string[];
}>> {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'Non authentifié' };
  }

  const result = await preferencesService.getCalendarDisplayPrefs(supabase, user.id);
  return result;
}
