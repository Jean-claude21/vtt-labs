/**
 * LifeOS Stats Loading State
 */

import { StatsSkeleton } from '@/features/lifeos/components/ui/loading-skeletons';

export default function StatsLoading() {
  return (
    <div className="container py-6">
      <StatsSkeleton />
    </div>
  );
}
