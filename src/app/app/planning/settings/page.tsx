/**
 * LifeOS Settings Page
 * 
 * Configuration section for domains, preferences, and module settings.
 * Domains moved here from main navigation per V2 spec.
 * 
 * @module app/lifeos/settings
 */

import { createSSRClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getDomains } from '@/features/lifeos/actions/domains.actions';
import { getPreferences } from '@/features/lifeos/actions/preferences.actions';
import { SettingsDashboard } from './settings-dashboard';


export const metadata = {
  title: 'LifeOS | Configuration',
  description: 'Gérer vos domaines et préférences',
};

export default async function LifeOSSettingsPage() {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch domains and preferences in parallel
  const [domainsResult, preferencesResult] = await Promise.all([
    getDomains(),
    getPreferences(),
  ]);

  return (
    <SettingsDashboard
      initialDomains={domainsResult.data ?? []}
      initialPreferences={preferencesResult.data ?? null}
      error={domainsResult.error || preferencesResult.error}
    />
  );
}
