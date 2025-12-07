/**
 * LifeOS Domains Loading State
 */

import { DomainListSkeleton } from '@/features/lifeos/components/ui/loading-skeletons';

export default function DomainsLoading() {
  return (
    <div className="container py-6">
      <DomainListSkeleton />
    </div>
  );
}
