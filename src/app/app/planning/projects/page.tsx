/**
 * LifeOS Projects Page
 * 
 * Project management with Gantt view for task dependencies.
 * 
 * @module app/planning/projects
 */

import { createSSRClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getProjectsWithProgress } from '@/features/lifeos/actions/projects.actions';
import { getDomains } from '@/features/lifeos/actions/domains.actions';
import { ProjectsDashboard } from './projects-dashboard';


export const metadata = {
  title: 'Planning | Projets',
  description: 'Gérer vos projets avec vue Gantt',
};

export default async function ProjectsPage() {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch projects and domains in parallel
  const [projectsResult, domainsResult] = await Promise.all([
    getProjectsWithProgress({ statuses: ['active', 'paused'] }),
    getDomains(),
  ]);

  return (
    <ProjectsDashboard
      initialProjects={projectsResult.data ?? []}
      domains={domainsResult.data ?? []}
      error={projectsResult.error}
    />
  );
}
