/**
 * Routines Page - Server Component
 * 
 * Fetches initial data and renders the routines client component.
 * 
 * @module lifeos/pages/routines
 */

import { createSSRClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getRoutinesWithStreaks } from '@/features/lifeos/actions/routines.actions';
import { getDomains } from '@/features/lifeos/actions/domains.actions';
import { RoutinesClient } from './routines-client';

export default async function RoutinesPage() {
  const supabase = await createSSRClient();
  
  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch routines and domains in parallel
  const [routinesResult, domainsResult] = await Promise.all([
    getRoutinesWithStreaks(),
    getDomains(),
  ]);

  return (
    <div className="container py-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Routines
        </h1>
        <p className="text-muted-foreground">
          Gérez vos habitudes récurrentes et suivez vos séries
        </p>
      </div>

      {/* Main Content */}
      <RoutinesClient
        initialRoutines={routinesResult.data ?? []}
        initialDomains={domainsResult.data ?? []}
        error={routinesResult.error ?? domainsResult.error ?? null}
      />
    </div>
  );
}
