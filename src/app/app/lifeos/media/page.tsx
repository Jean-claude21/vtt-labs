/**
 * LifeOS Media Page
 * 
 * Tracking media gallery for before/after progress photos.
 * 
 * @module app/lifeos/media
 */

import { createSSRClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getMediaByEntityType } from '@/features/lifeos/actions/media.actions';
import { getDomains } from '@/features/lifeos/actions/domains.actions';
import { MediaDashboard } from './media-dashboard';

export const metadata = {
  title: 'LifeOS | Médias',
  description: 'Photos de suivi et progression',
};

export default async function LifeOSMediaPage() {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch media grouped by entity type
  const mediaResult = await getMediaByEntityType();
  const domainsResult = await getDomains();

  return (
    <MediaDashboard
      initialMedia={mediaResult.data ?? {}}
      domains={domainsResult.data ?? []}
      error={mediaResult.error}
    />
  );
}
