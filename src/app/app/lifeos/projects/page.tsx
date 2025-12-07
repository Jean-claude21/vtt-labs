/**
 * LifeOS Projects Page
 * 
 * Project management with Gantt view for task dependencies.
 * 
 * @module app/lifeos/projects
 */

import { createSSRClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getProjects } from '@/features/lifeos/actions/projects.actions';
import { ProjectsDashboard } from './projects-dashboard';


export const metadata = {
  title: 'LifeOS | Projets',
  description: 'Gérer vos projets avec vue Gantt',
};

export default async function LifeOSProjectsPage() {
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch projects (active and paused)
  const projectsResult = await getProjects({ 
    statuses: ['active', 'paused'] 
  });

  return (
    <ProjectsDashboard
      initialProjects={projectsResult.data ?? []}
      error={projectsResult.error}
    />
  );
}
