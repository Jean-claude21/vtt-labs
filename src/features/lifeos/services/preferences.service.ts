/**
 * LifeOS User Preferences Service
 * 
 * Handles user preferences including calendar view settings.
 * 
 * @module lifeos/services/preferences
 */

import type { DbClient } from '@/lib/types';
import type { 
  UserPreferences, 
  UpdatePreferencesInput,
  CalendarView,
} from '../schema/preferences.schema';

export type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

// Default preferences (matches schema)
const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  default_calendar_view: 'week',
  week_starts_on: 1, // Monday
  show_routines: true,
  show_tasks: true,
  show_external_events: true,
  hidden_domain_ids: [],
  time_blocks: {
    morning: { start: '06:00', end: '12:00' },
    noon: { start: '12:00', end: '14:00' },
    afternoon: { start: '14:00', end: '18:00' },
    evening: { start: '18:00', end: '21:00' },
    night: { start: '21:00', end: '23:59' },
  },
  auto_position_routines: true,
  auto_position_tasks: false,
  routine_generation_horizon_days: 14,
  preferences: {},
};

export const preferencesService = {
  /**
   * Get or create preferences for a user
   */
  async getOrCreate(
    client: DbClient,
    userId: string
  ): Promise<ServiceResult<UserPreferences>> {
    try {
      // Try to get existing preferences
      const { data: existing, error: fetchError } = await client
        .from('lifeos_user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing) {
        return { data: existing as UserPreferences, error: null };
      }

      // Create default preferences if not found
      if (fetchError?.code === 'PGRST116') { // Not found
        const { data: created, error: createError } = await client
          .from('lifeos_user_preferences')
          .insert({
            user_id: userId,
            ...DEFAULT_PREFERENCES,
          })
          .select()
          .single();

        if (createError) {
          return { data: null, error: createError.message };
        }

        return { data: created as UserPreferences, error: null };
      }

      return { data: null, error: fetchError?.message || 'Failed to fetch preferences' };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  /**
   * Update user preferences
   */
  async update(
    client: DbClient,
    userId: string,
    input: UpdatePreferencesInput
  ): Promise<ServiceResult<UserPreferences>> {
    try {
      // Ensure preferences exist first
      const { error: ensureError } = await this.getOrCreate(client, userId);
      if (ensureError) {
        return { data: null, error: ensureError };
      }

      const { data, error } = await client
        .from('lifeos_user_preferences')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as UserPreferences, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  /**
   * Get default calendar view for user
   */
  async getDefaultCalendarView(
    client: DbClient,
    userId: string
  ): Promise<ServiceResult<CalendarView>> {
    const result = await this.getOrCreate(client, userId);
    
    if (result.error) {
      return { data: 'week', error: null }; // Fallback to default
    }

    return { data: result.data!.default_calendar_view, error: null };
  },

  /**
   * Set default calendar view
   */
  async setDefaultCalendarView(
    client: DbClient,
    userId: string,
    view: CalendarView
  ): Promise<ServiceResult<void>> {
    const result = await this.update(client, userId, { default_calendar_view: view });
    
    if (result.error) {
      return { data: null, error: result.error };
    }

    return { data: undefined, error: null };
  },

  /**
   * Toggle show routines
   */
  async toggleShowRoutines(
    client: DbClient,
    userId: string
  ): Promise<ServiceResult<boolean>> {
    const prefs = await this.getOrCreate(client, userId);
    
    if (prefs.error) {
      return { data: null, error: prefs.error };
    }

    const newValue = !prefs.data!.show_routines;
    const result = await this.update(client, userId, { show_routines: newValue });
    
    if (result.error) {
      return { data: null, error: result.error };
    }

    return { data: newValue, error: null };
  },

  /**
   * Get display preferences for calendar rendering
   */
  async getCalendarDisplayPrefs(
    client: DbClient,
    userId: string
  ): Promise<ServiceResult<{
    view: CalendarView;
    weekStartDay: number;
    showRoutines: boolean;
    showTasks: boolean;
    showExternalEvents: boolean;
    hiddenDomainIds: string[];
  }>> {
    const result = await this.getOrCreate(client, userId);
    
    if (result.error) {
      // Return defaults
      return {
        data: {
          view: 'week',
          weekStartDay: 1,
          showRoutines: true,
          showTasks: true,
          showExternalEvents: true,
          hiddenDomainIds: [],
        },
        error: null,
      };
    }

    const prefs = result.data!;
    return {
      data: {
        view: prefs.default_calendar_view,
        weekStartDay: prefs.week_starts_on,
        showRoutines: prefs.show_routines,
        showTasks: prefs.show_tasks,
        showExternalEvents: prefs.show_external_events,
        hiddenDomainIds: prefs.hidden_domain_ids,
      },
      error: null,
    };
  },
};
