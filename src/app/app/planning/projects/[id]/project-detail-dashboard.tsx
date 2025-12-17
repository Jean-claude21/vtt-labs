/**
 * Project Detail Dashboard Component
 * 
 * Single project view with Kanban, List, Gantt, and Timeline views.
 * 
 * @module app/planning/projects/[id]
 */
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  ArrowLeft,
  MoreHorizontal,
  Calendar,
  Target,
  Kanban,
  List,
  GanttChartSquare,
  Clock,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Pause,
  Table2,
  Link2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  KanbanProvider, 
  KanbanBoard, 
  KanbanHeader, 
  KanbanCards, 
  KanbanCard,
  type DragEndEvent,
} from '@/components/kibo-ui/kanban';
import type { Project } from '@/features/lifeos/schema/projects.schema';
import type { Task } from '@/features/lifeos/schema/tasks.schema';
import { updateTask, createTask, deleteTask } from '@/features/lifeos/actions/tasks.actions';
import { deleteProject } from '@/features/lifeos/actions/projects.actions';
import { TaskFormDialog } from '@/features/lifeos/components/tasks/task-form-dialog';
import { AssignTaskDialog } from '@/features/lifeos/components/tasks/assign-task-dialog';
import { ProjectGanttFull } from '@/features/lifeos/components/projects/project-gantt-full';
import { TasksTable } from '@/features/lifeos/components/tasks/tasks-table';

interface ProjectDetailDashboardProps {
  project: Project;
  initialTasks: Task[];
  error: string | null;
}

// Status configuration for Kanban columns
const TASK_STATUSES = [
  { id: 'backlog', name: 'Backlog', icon: Circle, color: 'text-gray-500' },
  { id: 'todo', name: 'À faire', icon: Circle, color: 'text-blue-500' },
  { id: 'in_progress', name: 'En cours', icon: Clock, color: 'text-yellow-500' },
  { id: 'blocked', name: 'Bloqué', icon: AlertCircle, color: 'text-red-500' },
  { id: 'done', name: 'Terminé', icon: CheckCircle2, color: 'text-green-500' },
];

const PROJECT_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Actif', color: 'bg-green-500', icon: Circle },
  paused: { label: 'En pause', color: 'bg-yellow-500', icon: Pause },
  completed: { label: 'Terminé', color: 'bg-blue-500', icon: CheckCircle2 },
  archived: { label: 'Archivé', color: 'bg-gray-500', icon: Circle },
};

export function ProjectDetailDashboard({ 
  project: initialProject, 
  initialTasks, 
  error 
}: Readonly<ProjectDetailDashboardProps>) {
  const router = useRouter();
  const [project] = React.useState(initialProject);
  const [tasks, setTasks] = React.useState(initialTasks);
  const [activeView, setActiveView] = React.useState<'kanban' | 'list' | 'gantt' | 'timeline' | 'table'>('kanban');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = React.useState(false);
  const [isCreatingTask, setIsCreatingTask] = React.useState(false);
  const [parentTaskForSubtask, setParentTaskForSubtask] = React.useState<string | null>(null);
  const [taskToEdit, setTaskToEdit] = React.useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = React.useState<Task | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);

  // Calculate progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Show error if initial load failed
  React.useEffect(() => {
    if (error) {
      toast.error('Erreur de chargement', { description: error });
    }
  }, [error]);

  // Handle task status change via Kanban drag & drop
  const handleTaskStatusChange = React.useCallback(async (taskId: string, newStatus: string) => {
    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t
    ));

    const result = await updateTask({ id: taskId, status: newStatus as Task['status'] });
    
    if (result.error) {
      // Revert on error
      setTasks(initialTasks);
      toast.error('Erreur', { description: result.error });
    }
  }, [initialTasks]);

  // Handle Kanban drag end
  const handleKanbanDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // Find the new column (status)
    const overTask = tasks.find(t => t.id === over.id);
    const newStatus = overTask?.status || (over.id as string);
    
    // Check if status actually changed
    if (TASK_STATUSES.some(s => s.id === newStatus) && task.status !== newStatus) {
      handleTaskStatusChange(taskId, newStatus);
    }
  }, [tasks, handleTaskStatusChange]);

  // Handle task creation
  const handleCreateTask = async (data: {
    title: string;
    description?: string | null;
    domain_id?: string | null;
    project_id?: string | null;
    parent_task_id?: string | null;
    priority: 'high' | 'medium' | 'low';
    estimated_minutes?: number | null;
    due_date?: string | null;
  }) => {
    setIsCreatingTask(true);
    try {
      const result = await createTask({
        ...data,
        project_id: project.id,
        parent_task_id: parentTaskForSubtask,
      });

      if (result.error) {
        toast.error('Erreur lors de la création', { description: result.error });
        return;
      }

      if (result.data) {
        setTasks(prev => [...prev, result.data!]);
        toast.success(parentTaskForSubtask ? 'Sous-tâche créée' : 'Tâche créée');
        setIsTaskFormOpen(false);
        setParentTaskForSubtask(null);
        router.refresh();
      }
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Handle add subtask
  const handleAddSubtask = (parentTaskId: string) => {
    setParentTaskForSubtask(parentTaskId);
    setIsTaskFormOpen(true);
  };

  // Handle task form close
  const handleTaskFormClose = (open: boolean) => {
    setIsTaskFormOpen(open);
    if (!open) {
      setParentTaskForSubtask(null);
      setTaskToEdit(null);
    }
  };

  // Handle task click for editing
  const handleTaskClick = React.useCallback((task: Task) => {
    setTaskToEdit(task);
    setIsTaskFormOpen(true);
  }, []);

  // Handle task update (edit mode)
  const handleUpdateTask = async (data: {
    title: string;
    description?: string | null;
    domain_id?: string | null;
    project_id?: string | null;
    parent_task_id?: string | null;
    priority: 'high' | 'medium' | 'low';
    estimated_minutes?: number | null;
    due_date?: string | null;
  }) => {
    if (!taskToEdit) return;
    
    setIsCreatingTask(true);
    try {
      const result = await updateTask({
        id: taskToEdit.id,
        ...data,
      });

      if (result.error) {
        toast.error('Erreur lors de la mise à jour', { description: result.error });
        return;
      }

      if (result.data) {
        setTasks(prev => prev.map(t => t.id === taskToEdit.id ? result.data! : t));
        toast.success('Tâche mise à jour');
        setIsTaskFormOpen(false);
        setTaskToEdit(null);
        router.refresh();
      }
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Refresh tasks after Gantt drag
  const handleGanttTaskUpdate = React.useCallback(() => {
    router.refresh();
  }, [router]);

  // Handle task deletion
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      const result = await deleteTask(taskToDelete.id);
      
      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }
      
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      toast.success('Tâche supprimée');
      setTaskToDelete(null);
      router.refresh();
    } catch {
      toast.error('Une erreur est survenue');
    }
  };

  // Handle status change from table
  const handleStatusChange = React.useCallback(async (taskId: string, status: Task['status']) => {
    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status } : t
    ));

    const result = await updateTask({ id: taskId, status });
    
    if (result.error) {
      setTasks(initialTasks);
      toast.error('Erreur', { description: result.error });
    }
  }, [initialTasks]);

  // Handle project deletion
  const handleDeleteProject = async () => {
    setIsDeleting(true);
    const result = await deleteProject(project.id);
    
    if (result.error) {
      toast.error('Erreur', { description: result.error });
      setIsDeleting(false);
    } else {
      toast.success('Projet supprimé');
      router.push('/app/planning/projects');
    }
  };

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusConfig = PROJECT_STATUS_CONFIG[project.status];

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link 
              href="/app/planning/projects" 
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Projets
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground max-w-2xl">{project.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/app/planning/projects/${project.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsTaskFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une tâche
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsAssignDialogOpen(true)}>
                <Link2 className="h-4 w-4 mr-2" />
                Affecter des tâches existantes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer le projet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Project info bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <span className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Dates */}
            {(project.start_date || project.target_date) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {project.start_date && formatDate(project.start_date)}
                {project.start_date && project.target_date && <span>→</span>}
                {project.target_date && (
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {formatDate(project.target_date)}
                  </span>
                )}
              </div>
            )}

            {/* Progress */}
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <Progress value={progressPercent} className="h-2 flex-1" />
              <span className="text-sm font-medium whitespace-nowrap">
                {completedTasks}/{totalTasks} ({progressPercent}%)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Views Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2">
              <Kanban className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Liste
            </TabsTrigger>
            <TabsTrigger value="gantt" className="gap-2">
              <GanttChartSquare className="h-4 w-4" />
              Gantt
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <Table2 className="h-4 w-4" />
              Tableau
            </TabsTrigger>
          </TabsList>
          
          <Button size="sm" onClick={() => setIsTaskFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>

        <TabsContent value="kanban" className="mt-4">
          <ProjectKanbanView 
            tasks={tasks} 
            onDragEnd={handleKanbanDragEnd}
            onTaskClick={handleTaskClick}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <ProjectListView 
            tasks={tasks} 
            onTaskClick={handleTaskClick}
          />
        </TabsContent>

        <TabsContent value="gantt" className="mt-4">
          <ProjectGanttView 
            projectId={project.id}
            tasks={tasks} 
            onTaskUpdate={handleGanttTaskUpdate}
            onTaskClick={handleTaskClick}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <ProjectTimelineView 
            tasks={tasks}
            onTaskClick={handleTaskClick}
          />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <TasksTable
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskDelete={(task) => setTaskToDelete(task)}
            onStatusChange={handleStatusChange}
            showParentColumn={true}
          />
        </TabsContent>
      </Tabs>

      {/* Delete project confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le projet</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le projet &quot;{project.name}&quot; ?
              Cette action est irréversible et supprimera également toutes les tâches associées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task creation/edit dialog */}
      <TaskFormDialog
        open={isTaskFormOpen}
        onOpenChange={handleTaskFormClose}
        task={taskToEdit}
        projectId={project.id}
        parentTaskId={parentTaskForSubtask}
        parentTasks={tasks.filter(t => !t.parent_task_id)}
        onSubmit={taskToEdit ? handleUpdateTask : handleCreateTask}
        isSubmitting={isCreatingTask}
      />

      {/* Assign existing tasks dialog */}
      <AssignTaskDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        project={project}
        onTaskAssigned={() => router.refresh()}
      />

      {/* Task delete confirmation dialog */}
      <Dialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la tâche</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la tâche &quot;{taskToDelete?.title}&quot; ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setTaskToDelete(null)}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTask}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// KANBAN VIEW
// ============================================================================

// Extended type for Kanban items with task properties
type KanbanTaskItem = {
  id: string;
  name: string;
  column: string;
  priority?: string;
  due_date?: string | null;
  title: string;
  status: string;
};

interface ProjectKanbanViewProps {
  tasks: Task[];
  onDragEnd: (event: DragEndEvent) => void;
  onTaskClick: (task: Task) => void;
}

function ProjectKanbanView({ tasks, onDragEnd, onTaskClick }: Readonly<ProjectKanbanViewProps>) {
  // Transform tasks to Kanban format
  const kanbanData: KanbanTaskItem[] = React.useMemo(() => 
    tasks.map(task => ({
      id: task.id,
      name: task.title,
      column: task.status,
      priority: task.priority,
      due_date: task.due_date,
      title: task.title,
      status: task.status,
    })),
    [tasks]
  );

  const columns = TASK_STATUSES.map(s => ({ id: s.id, name: s.name }));

  if (tasks.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <Kanban className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucune tâche</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-4">
          Ajoutez des tâches à ce projet pour les voir dans la vue Kanban.
        </p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une tâche
        </Button>
      </Card>
    );
  }

  return (
    <div className="h-[600px]">
      <KanbanProvider
        columns={columns}
        data={kanbanData}
        onDragEnd={onDragEnd}
      >
        {(column) => {
          const statusConfig = TASK_STATUSES.find(s => s.id === column.id);
          const StatusIcon = statusConfig?.icon || Circle;
          const columnTasks = tasks.filter(t => t.status === column.id);
          
          return (
            <KanbanBoard key={column.id} id={column.id}>
              <KanbanHeader className="flex items-center gap-2">
                <StatusIcon className={`h-4 w-4 ${statusConfig?.color}`} />
                <span>{column.name}</span>
                <Badge variant="secondary" className="ml-auto">
                  {columnTasks.length}
                </Badge>
              </KanbanHeader>
              <KanbanCards<KanbanTaskItem> id={column.id}>
                {(item) => {
                  const originalTask = tasks.find(t => t.id === item.id);
                  return (
                    <KanbanCard 
                      key={item.id} 
                      id={item.id} 
                      name={item.name} 
                      column={item.column}
                      onClick={() => originalTask && onTaskClick(originalTask)}
                      className="cursor-pointer"
                    >
                      <div className="space-y-2">
                        <p className="font-medium text-sm">{item.name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.priority && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                item.priority === 'high' ? 'border-red-500 text-red-500' :
                                item.priority === 'low' ? 'border-gray-400 text-gray-400' :
                                'border-blue-500 text-blue-500'
                              }`}
                            >
                              {item.priority}
                            </Badge>
                          )}
                          {item.due_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </KanbanCard>
                  );
                }}
              </KanbanCards>
            </KanbanBoard>
          );
        }}
      </KanbanProvider>
    </div>
  );
}

// ============================================================================
// LIST VIEW
// ============================================================================

interface ProjectListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

function ProjectListView({ tasks, onTaskClick }: Readonly<ProjectListViewProps>) {
  if (tasks.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <List className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucune tâche</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Ajoutez des tâches à ce projet pour les voir ici.
        </p>
      </Card>
    );
  }

  // Group tasks by status
  const groupedTasks = TASK_STATUSES.map(status => ({
    ...status,
    tasks: tasks.filter(t => t.status === status.id),
  }));

  return (
    <div className="space-y-6">
      {groupedTasks.map(group => {
        if (group.tasks.length === 0) return null;
        const StatusIcon = group.icon;
        
        return (
          <Card key={group.id}>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <StatusIcon className={`h-4 w-4 ${group.color}`} />
                {group.name}
                <Badge variant="secondary">{group.tasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {group.tasks.map(task => {
                  const priorityClass = task.priority === 'high' 
                    ? 'border-red-500 text-red-500' 
                    : task.priority === 'low' 
                      ? 'border-gray-400 text-gray-400' 
                      : '';
                  
                  return (
                    <button 
                      key={task.id} 
                      type="button"
                      className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() => onTaskClick(task)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                        )}
                      </div>
                      {task.priority && (
                        <Badge 
                          variant="outline"
                          className={priorityClass}
                        >
                          {task.priority}
                        </Badge>
                      )}
                      {task.due_date && (
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(task.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================================
// GANTT VIEW
// ============================================================================

interface ProjectGanttViewProps {
  projectId: string;
  tasks: Task[];
  onTaskUpdate: () => void;
  onTaskClick: (task: Task) => void;
}

function ProjectGanttView({ projectId, tasks, onTaskUpdate, onTaskClick }: Readonly<ProjectGanttViewProps>) {
  // Use the full Gantt with Kibo-UI, drag & drop, and dependencies
  return (
    <ProjectGanttFull 
      projectId={projectId}
      tasks={tasks} 
      onTaskUpdate={onTaskUpdate}
      onTaskClick={onTaskClick}
    />
  );
}

// ============================================================================
// TIMELINE VIEW
// ============================================================================

interface ProjectTimelineViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

function ProjectTimelineView({ tasks, onTaskClick }: Readonly<ProjectTimelineViewProps>) {
  // Sort tasks by date
  const sortedTasks = [...tasks]
    .filter(t => t.due_date || t.created_at)
    .sort((a, b) => {
      const dateA = a.due_date || a.created_at;
      const dateB = b.due_date || b.created_at;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

  if (sortedTasks.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucune tâche</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Ajoutez des tâches avec des dates pour voir la timeline.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline
        </CardTitle>
        <CardDescription>
          Vue chronologique des tâches du projet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-6">
            {sortedTasks.map((task) => {
              const statusConfig = TASK_STATUSES.find(s => s.id === task.status);
              const StatusIcon = statusConfig?.icon || Circle;
              const dotBgClass = task.status === 'done' 
                ? 'bg-green-500' 
                : task.status === 'in_progress' 
                  ? 'bg-yellow-500' 
                  : task.status === 'blocked' 
                    ? 'bg-red-500' 
                    : 'bg-muted';
              
              return (
                <button 
                  key={task.id} 
                  type="button"
                  className="relative pl-10 cursor-pointer group text-left w-full"
                  onClick={() => onTaskClick(task)}
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-2 top-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center ${dotBgClass}`}>
                    <StatusIcon className="h-3 w-3 text-white" />
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3 group-hover:bg-muted transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{task.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {task.due_date && new Date(task.due_date).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
