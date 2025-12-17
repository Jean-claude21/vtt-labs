/**
 * LifeOS Project Detail Page
 * 
 * Single project view with Kanban, List, Gantt, and Timeline views.
 * 
 * @module app/planning/projects/[id]
 */

import { createSSRClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getProject, getProjectTasks } from '@/features/lifeos/actions/projects.actions';
import { ProjectDetailDashboard } from './project-detail-dashboard';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectResult = await getProject(id);
  
  return {
    title: projectResult.data ? `${projectResult.data.name} | Projets` : 'Projet | LifeOS',
    description: projectResult.data?.description || 'Détails du projet',
  };
}

export default async function ProjectDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const supabase = await createSSRClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch project and tasks in parallel
  const [projectResult, tasksResult] = await Promise.all([
    getProject(id),
    getProjectTasks(id),
  ]);

  if (projectResult.error || !projectResult.data) {
    notFound();
  }

  return (
    <ProjectDetailDashboard
      project={projectResult.data}
      initialTasks={tasksResult.data ?? []}
      error={tasksResult.error}
    />
  );
}
