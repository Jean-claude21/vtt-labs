/**
 * LifeOS Routines Loading State
 */

import { RoutineListSkeleton } from '@/features/lifeos/components/ui/loading-skeletons';

export default function RoutinesLoading() {
  return (
    <div className="container py-6">
      <RoutineListSkeleton />
    </div>
  );
}
