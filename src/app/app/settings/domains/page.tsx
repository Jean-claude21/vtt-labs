/**
 * Settings - Domains Page
 * 
 * Redirects to Planning settings where domains are managed.
 * 
 * @module app/settings/domains
 */

import { redirect } from 'next/navigation';

export default function DomainsSettingsPage() {
  redirect('/app/planning/settings');
}
