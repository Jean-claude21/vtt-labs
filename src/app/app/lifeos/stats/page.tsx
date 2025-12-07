/**
 * LifeOS Statistics Page
 * 
 * Dashboard displaying key metrics and insights.
 * 
 * @module app/lifeos/stats
 */

import { createSSRClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  getOverviewStats, 
  getWeeklyStats, 
  getStreaks,
} from '@/features/lifeos/actions/analytics.actions';
import { StatsDashboard } from './stats-dashboard';


export const metadata = {
  title: 'LifeOS | Statistiques',
  description: 'Métriques et insights de vos habitudes',
};

export default async function LifeOSStatsPage() {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch all analytics data in parallel
  const [overviewResult, weeklyResult, streaksResult] = await Promise.all([
    getOverviewStats(),
    getWeeklyStats(),
    getStreaks(),
  ]);

  return (
    <StatsDashboard 
      initialOverview={overviewResult.data}
      initialWeeklyStats={weeklyResult.data}
      initialStreaks={streaksResult.data ?? []}
      error={overviewResult.error ?? weeklyResult.error ?? streaksResult.error}
    />
  );
}
