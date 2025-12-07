/**
 * LifeOS Tasks Loading State
 */

import { TaskListSkeleton } from '@/features/lifeos/components/ui/loading-skeletons';

export default function TasksLoading() {
  return (
    <div className="container py-6">
      <TaskListSkeleton />
    </div>
  );
}
