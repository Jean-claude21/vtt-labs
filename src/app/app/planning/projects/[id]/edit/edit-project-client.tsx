/**
 * Edit Project Client Component
 * 
 * Client component for editing a project with form.
 * 
 * @module app/planning/projects/[id]/edit
 */
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectForm } from '@/features/lifeos/components/projects/project-form';
import { updateProject } from '@/features/lifeos/actions/projects.actions';
import type { Project } from '@/features/lifeos/schema/projects.schema';
import type { Domain } from '@/features/lifeos/schema/domains.schema';

interface EditProjectClientProps {
  project: Project;
  domains: Domain[];
  error: string | null;
}

export function EditProjectClient({ project, domains, error }: Readonly<EditProjectClientProps>) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(true);

  React.useEffect(() => {
    if (error) {
      toast.error('Erreur de chargement', { description: error });
    }
  }, [error]);

  const handleUpdateProject = async (data: {
    name: string;
    description?: string | null;
    domain_id?: string | null;
    color?: string | null;
    status?: 'active' | 'paused' | 'completed' | 'archived';
    start_date?: string | null;
    target_date?: string | null;
  }) => {
    setIsSubmitting(true);
    try {
      const result = await updateProject({
        id: project.id,
        ...data,
      });

      if (result.error) {
        toast.error('Erreur lors de la mise à jour', {
          description: result.error,
        });
        return;
      }

      toast.success('Projet mis à jour avec succès');
      router.push(`/app/planning/projects/${project.id}`);
      router.refresh();
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      router.push(`/app/planning/projects/${project.id}`);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link 
            href={`/app/planning/projects/${project.id}`}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au projet
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Modifier le projet</h1>
        <p className="text-muted-foreground">
          Modifiez les informations du projet &quot;{project.name}&quot;.
        </p>
      </div>

      {/* Form Dialog */}
      <ProjectForm
        open={isFormOpen}
        onOpenChange={handleOpenChange}
        project={project}
        domains={domains}
        onSubmit={handleUpdateProject}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
