/**
 * LifeOS Project Edit Page
 * 
 * Page for editing an existing project.
 * 
 * @module app/planning/projects/[id]/edit
 */

import { createSSRClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getProject } from '@/features/lifeos/actions/projects.actions';
import { getDomains } from '@/features/lifeos/actions/domains.actions';
import { EditProjectClient } from './edit-project-client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectResult = await getProject(id);
  
  return {
    title: projectResult.data ? `Modifier ${projectResult.data.name} | Projets` : 'Modifier le projet | LifeOS',
  };
}

export default async function EditProjectPage({ 
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

  // Fetch project and domains in parallel
  const [projectResult, domainsResult] = await Promise.all([
    getProject(id),
    getDomains(),
  ]);

  if (projectResult.error || !projectResult.data) {
    notFound();
  }

  return (
    <EditProjectClient
      project={projectResult.data}
      domains={domainsResult.data ?? []}
      error={projectResult.error}
    />
  );
}
