/**
 * Tasks Page - Server Component
 * 
 * Fetches initial data and renders the tasks client component.
 * 
 * @module lifeos/pages/tasks
 */

import { createSSRClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTasks } from '@/features/lifeos/actions/tasks.actions';
import { getDomains } from '@/features/lifeos/actions/domains.actions';
import { TasksClient } from './tasks-client';

export default async function TasksPage() {
  const supabase = await createSSRClient();
  
  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch tasks and domains in parallel
  // TODO: Also fetch projects when that feature is implemented
  const [tasksResult, domainsResult] = await Promise.all([
    getTasks(),
    getDomains(),
  ]);

  return (
    <div className="container py-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tâches
        </h1>
        <p className="text-muted-foreground">
          Gérez vos tâches et suivez votre avancement
        </p>
      </div>

      {/* Main Content */}
      <TasksClient
        initialTasks={tasksResult.data ?? []}
        initialDomains={domainsResult.data ?? []}
        initialProjects={[]} // TODO: Add when projects feature is implemented
        error={tasksResult.error ?? domainsResult.error ?? null}
      />
    </div>
  );
}
