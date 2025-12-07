/**
 * LifeOS Projects Dashboard Component
 * 
 * @module app/lifeos/projects
 */
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FolderKanban, 
  Calendar, 
  Target,
  MoreHorizontal,
  GanttChartSquare,
} from 'lucide-react';
import type { Project } from '@/features/lifeos/schema/projects.schema';

interface ProjectsDashboardProps {
  initialProjects: Project[];
  error: string | null;
}

export function ProjectsDashboard({ initialProjects, error }: Readonly<ProjectsDashboardProps>) {
  const [projects] = React.useState(initialProjects);
  const [viewMode, setViewMode] = React.useState<'cards' | 'gantt'>('cards');

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
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
        </div>
      </div>

      {/* View content */}
      {viewMode === 'cards' ? (
        <ProjectsCardsView projects={projects} />
      ) : (
        <ProjectsGanttView projects={projects} />
      )}
    </div>
  );
}

function ProjectsCardsView({ projects }: Readonly<{ projects: Project[] }>) {
  if (projects.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucun projet</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-4">
          Créez votre premier projet pour organiser vos tâches avec des deadlines et des dépendances.
        </p>
        <Button>
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

function ProjectCard({ project }: Readonly<{ project: Project }>) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    completed: 'bg-blue-500',
    archived: 'bg-gray-500',
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            {project.description && (
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status and dates */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <span className={`w-2 h-2 rounded-full ${statusColors[project.status]}`} />
            {project.status}
          </Badge>
          {project.target_date && (
            <Badge variant="secondary" className="gap-1">
              <Target className="h-3 w-3" />
              {new Date(project.target_date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })}
            </Badge>
          )}
        </div>

        {/* Progress placeholder */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">0%</span>
          </div>
          {/* Progress bar placeholder */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '0%' }} />
          </div>
        </div>

        {/* Dates */}
        {(project.start_date || project.target_date) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {project.start_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(project.start_date).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            {project.start_date && project.target_date && <span>→</span>}
            {project.target_date && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>
                  {new Date(project.target_date).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectsGanttView({ projects }: Readonly<{ projects: Project[] }>) {
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
          Vue Gantt
        </CardTitle>
        <CardDescription>
          Sélectionnez un projet pour afficher son diagramme de Gantt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p>Composant Gantt en cours de développement...</p>
          <p className="text-sm mt-2">
            Kibo-UI Gantt sera intégré ici pour afficher les tâches et leurs dépendances.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
