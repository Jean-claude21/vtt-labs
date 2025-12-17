/**
 * LifeOS Calendar Loading State
 */

import { CalendarSkeleton } from '@/features/lifeos/components/ui/loading-skeletons';

export default function LifeOSLoading() {
  return (
    <div className="p-6 h-full">
      <CalendarSkeleton />
    </div>
  );
}
