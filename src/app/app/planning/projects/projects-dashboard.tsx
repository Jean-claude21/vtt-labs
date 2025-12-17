/**
 * LifeOS Projects Dashboard Component
 * 
 * @module app/planning/projects
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  FolderKanban, 
  Calendar, 
  Target,
  MoreHorizontal,
  GanttChartSquare,
  CheckCircle2,
  ListTodo,
  ArrowRight,
} from 'lucide-react';
import { ProjectForm } from '@/features/lifeos/components/projects/project-form';
import { createProject } from '@/features/lifeos/actions/projects.actions';
import type { ProjectWithMetrics } from '@/features/lifeos/schema/projects.schema';
import type { Domain } from '@/features/lifeos/schema/domains.schema';
import { toast } from 'sonner';

interface ProjectsDashboardProps {
  initialProjects: ProjectWithMetrics[];
  domains: Domain[];
  error: string | null;
}

export function ProjectsDashboard({ initialProjects, domains, error }: Readonly<ProjectsDashboardProps>) {
  const router = useRouter();
  const [projects] = React.useState(initialProjects);
  const [viewMode, setViewMode] = React.useState<'cards' | 'gantt'>('cards');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCreateProject = async (data: {
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
      const result = await createProject({
        name: data.name,
        description: data.description,
        domain_id: data.domain_id,
        color: data.color,
        start_date: data.start_date,
        target_date: data.target_date,
      });

      if (result.error) {
        toast.error('Erreur lors de la création du projet', {
          description: result.error,
        });
        return;
      }

      toast.success('Projet créé avec succès');
      setIsFormOpen(false);
      router.refresh();
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="container py-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-destructive">Erreur: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projets</h1>
          <p className="text-muted-foreground">
            Gérez vos projets et visualisez les dépendances de tâches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <FolderKanban className="h-4 w-4 mr-2" />
            Cartes
          </Button>
          <Button
            variant={viewMode === 'gantt' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('gantt')}
          >
            <GanttChartSquare className="h-4 w-4 mr-2" />
            Gantt
          </Button>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
        </div>
      </div>

      {/* View content */}
      {viewMode === 'cards' ? (
        <ProjectsCardsView projects={projects} onCreateClick={() => setIsFormOpen(true)} />
      ) : (
        <ProjectsGanttView projects={projects} />
      )}

      {/* Create Project Modal */}
      <ProjectForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        project={null}
        domains={domains}
        onSubmit={handleCreateProject}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

function ProjectsCardsView({ projects, onCreateClick }: Readonly<{ projects: ProjectWithMetrics[]; onCreateClick: () => void }>) {
  if (projects.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucun projet</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-4">
          Créez votre premier projet pour organiser vos tâches avec des deadlines et des dépendances.
        </p>
        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Créer un projet
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectCard({ project }: Readonly<{ project: ProjectWithMetrics }>) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-green-500', label: 'Actif' },
    paused: { color: 'bg-yellow-500', label: 'En pause' },
    completed: { color: 'bg-blue-500', label: 'Terminé' },
    archived: { color: 'bg-gray-500', label: 'Archivé' },
  };

  const status = statusConfig[project.status] ?? statusConfig.active;

  return (
    <Link href={`/app/planning/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer group h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {project.color && (
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: project.color }}
                  />
                )}
                <CardTitle className="text-lg truncate">{project.name}</CardTitle>
              </div>
              {project.description && (
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Open actions menu
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status and domain */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1.5">
              <span className={`w-2 h-2 rounded-full ${status.color}`} />
              {status.label}
            </Badge>
            {project.domain && (
              <Badge 
                variant="secondary" 
                className="gap-1"
                style={{ 
                  backgroundColor: `${project.domain.color}20`,
                  color: project.domain.color,
                  borderColor: project.domain.color
                }}
              >
                {project.domain.icon} {project.domain.name}
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  {project.completed_tasks}
                </span>
                <span className="flex items-center gap-1">
                  <ListTodo className="h-3.5 w-3.5" />
                  {project.total_tasks}
                </span>
              </div>
              <span className="font-medium">{project.progress_percentage}%</span>
            </div>
            <Progress 
              value={project.progress_percentage} 
              className="h-2"
            />
          </div>

          {/* Dates */}
          {(project.start_date || project.target_date) && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                {project.start_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(project.start_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                )}
                {project.start_date && project.target_date && <span>→</span>}
                {project.target_date && (
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>
                      {new Date(project.target_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                )}
              </div>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </div>
          )}

          {/* If no dates, show arrow at bottom */}
          {!project.start_date && !project.target_date && (
            <div className="flex justify-end">
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function ProjectsGanttView({ projects }: Readonly<{ projects: ProjectWithMetrics[] }>) {
  if (projects.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <GanttChartSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucun projet pour le Gantt</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Créez des projets et ajoutez des tâches pour visualiser le diagramme de Gantt.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GanttChartSquare className="h-5 w-5" />
          Vue Gantt Globale
        </CardTitle>
        <CardDescription>
          Cliquez sur un projet pour voir son Gantt détaillé avec les tâches.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {projects.map((project) => (
            <Link 
              key={project.id} 
              href={`/app/planning/projects/${project.id}?view=gantt`}
              className="block"
            >
              <div className="flex items-center gap-4 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-colors group">
                <div 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: project.color ?? '#6366f1' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{project.name}</span>
                    <span className="text-sm text-muted-foreground shrink-0">
                      {project.completed_tasks}/{project.total_tasks} tâches
                    </span>
                  </div>
                  <Progress 
                    value={project.progress_percentage} 
                    className="h-1.5 mt-2"
                  />
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
