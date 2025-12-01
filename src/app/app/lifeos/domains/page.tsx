/**
 * LifeOS Domains Page
 * 
 * Manage life domains with auto-seeding of defaults on first visit.
 * 
 * @module app/lifeos/domains
 */

import { Suspense } from 'react';
import { DomainsPageClient } from './domains-client';
import { getDomains, seedDefaultDomains } from '@/features/lifeos/actions/domains.actions';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Domains | LifeOS',
  description: 'Manage your life domains',
};

async function DomainsContent() {
  // Get existing domains
  let { data: domains, error } = await getDomains();

  // If no domains exist, seed defaults
  if (!error && (!domains || domains.length === 0)) {
    const seedResult = await seedDefaultDomains();
    if (seedResult.data) {
      domains = seedResult.data;
    }
    error = seedResult.error;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Error loading domains: {error}</p>
      </div>
    );
  }

  return <DomainsPageClient initialDomains={domains ?? []} />;
}

function DomainsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

export default function DomainsPage() {
  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Life Domains</h1>
        <p className="text-muted-foreground">
          Organize your activities into meaningful areas of your life.
        </p>
      </div>

      <Suspense fallback={<DomainsLoading />}>
        <DomainsContent />
      </Suspense>
    </div>
  );
}
