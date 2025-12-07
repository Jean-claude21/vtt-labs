/**
 * LifeOS Main Page (Calendar View)
 * 
 * Calendar-centric view showing routines and tasks.
 * This is the main entry point for LifeOS.
 * 
 * @module app/lifeos
 */

import { createSSRClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCalendarEvents } from '@/features/lifeos/actions/calendar.actions';
import { getDomains } from '@/features/lifeos/actions/domains.actions';
import { getUnscheduledTasks } from '@/features/lifeos/actions/tasks.actions';
import { CalendarDashboard } from './calendar-dashboard';

export const metadata = {
  title: 'LifeOS | Calendrier',
  description: 'Vue calendrier de vos routines et tâches',
};

export default async function LifeOSPage() {
  const supabase = await createSSRClient();
  
  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Get current week range
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // Fetch events, domains, and unscheduled tasks in parallel
  const [eventsResult, domainsResult, unscheduledResult] = await Promise.all([
    getCalendarEvents(
      weekStart.toISOString().split('T')[0],
      weekEnd.toISOString().split('T')[0]
    ),
    getDomains(),
    getUnscheduledTasks(),
  ]);

  return (
    <CalendarDashboard
      initialEvents={eventsResult.data ?? []}
      initialDomains={domainsResult.data ?? []}
      initialUnscheduledTasks={unscheduledResult.data ?? []}
      error={eventsResult.error}
    />
  );
}

// Helper to get Monday of current week
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
