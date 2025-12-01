/**
 * LifeOS Main Page (Planning Dashboard)
 * 
 * Central hub for daily planning and timeline view.
 * 
 * @module app/lifeos
 */

import { createSSRClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getPlanForDate } from '@/features/lifeos/actions/planning.actions';
import { PlanningDashboard } from './planning-dashboard';

export const metadata = {
  title: 'LifeOS | Planning Dashboard',
  description: 'Your intelligent life planning system',
};

export default async function LifeOSPage() {
  const supabase = await createSSRClient();
  
  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Get today's date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Fetch today's plan if it exists
  const planResult = await getPlanForDate(todayStr);

  return (
    <PlanningDashboard
      initialDate={todayStr}
      initialPlan={planResult.data ?? null}
      error={planResult.error}
    />
  );
}
