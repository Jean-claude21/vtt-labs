/**
 * Full Project Gantt Component
 * 
 * Uses Kibo-UI Gantt with:
 * - Drag & drop for date changes
 * - SVG arrows for dependencies
 * - Click to edit task
 * 
 * @module lifeos/components/projects
 */
'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GanttChartSquare, ZoomIn, ZoomOut } from 'lucide-react';
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureItem,
  GanttToday,
  type GanttFeature,
  type GanttStatus,
} from '@/components/kibo-ui/gantt';
import { updateTask } from '../../actions/tasks.actions';
import type { Task } from '../../schema/tasks.schema';

// Status mapping for Gantt
const STATUS_MAP: Record<string, GanttStatus> = {
  backlog: { id: 'backlog', name: 'Backlog', color: '#6b7280' },
  todo: { id: 'todo', name: 'À faire', color: '#3b82f6' },
  in_progress: { id: 'in_progress', name: 'En cours', color: '#eab308' },
  blocked: { id: 'blocked', name: 'Bloqué', color: '#ef4444' },
  done: { id: 'done', name: 'Terminé', color: '#22c55e' },
  cancelled: { id: 'cancelled', name: 'Annulé', color: '#9ca3af' },
  archived: { id: 'archived', name: 'Archivé', color: '#9ca3af' },
};

interface ProjectGanttFullProps {
  projectId: string;
  tasks: Task[];
  onTaskUpdate?: () => void;
  onTaskClick?: (task: Task) => void;
}

// Convert Task to GanttFeature
function taskToFeature(task: Task): GanttFeature | null {
  if (!task.due_date) return null;
  
  const endAt = new Date(task.due_date);
  // Use start_date if available, otherwise 7 days before due_date
  const startAt = (task as Task & { start_date?: string }).start_date
    ? new Date((task as Task & { start_date?: string }).start_date!)
    : new Date(endAt.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    id: task.id,
    name: task.title,
    startAt,
    endAt,
    status: STATUS_MAP[task.status] || STATUS_MAP.todo,
  };
}

/**
 * Full Gantt with Kibo-UI, dependencies arrows, and click to edit
 */
export function ProjectGanttFull({ 
  projectId: _projectId, 
  tasks, 
  onTaskUpdate,
  onTaskClick,
}: Readonly<ProjectGanttFullProps>) {
  const [zoom, setZoom] = React.useState(100);
  const [range, setRange] = React.useState<'daily' | 'monthly' | 'quarterly'>('monthly');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [taskPositions, setTaskPositions] = React.useState<Map<string, { x: number; y: number; width: number }>>(new Map());

  // Convert tasks to Gantt features
  const features = React.useMemo(() => {
    return tasks
      .map(taskToFeature)
      .filter((f): f is GanttFeature => f !== null);
  }, [tasks]);

  // Group main tasks (non-subtasks)
  const mainTasks = React.useMemo(() => {
    return tasks.filter(task => !task.parent_task_id);
  }, [tasks]);

  // Handle feature move (date change via drag & drop)
  const handleFeatureMove = React.useCallback(async (
    featureId: string,
    startDate: Date,
    endDate: Date | null
  ) => {
    try {
      const result = await updateTask({
        id: featureId,
        due_date: endDate ? endDate.toISOString().split('T')[0] : undefined,
      });

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      toast.success('Dates mises à jour');
      onTaskUpdate?.();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  }, [onTaskUpdate]);

  // Handle task click
  const handleTaskClick = React.useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && onTaskClick) {
      onTaskClick(task);
    }
  }, [tasks, onTaskClick]);

  // Update task positions for dependency arrows
  React.useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current) return;
      
      const newPositions = new Map<string, { x: number; y: number; width: number }>();
      const items = containerRef.current.querySelectorAll('[data-task-id]');
      
      items.forEach((item) => {
        const taskId = (item as HTMLElement).dataset.taskId;
        if (taskId) {
          const rect = item.getBoundingClientRect();
          const containerRect = containerRef.current!.getBoundingClientRect();
          newPositions.set(taskId, {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top + rect.height / 2,
            width: rect.width,
          });
        }
      });
      
      setTaskPositions(newPositions);
    };

    // Update after render and on scroll
    const timer = setTimeout(updatePositions, 100);
    return () => clearTimeout(timer);
  }, [tasks, zoom]);

  // Get dependencies for arrows
  const dependencies = React.useMemo(() => {
    const deps: { from: string; to: string }[] = [];
    
    for (const task of tasks) {
      // Predecessor dependencies
      const predecessors = (task as Task & { predecessors?: string[] }).predecessors;
      if (predecessors && Array.isArray(predecessors)) {
        for (const predId of predecessors) {
          deps.push({ from: predId, to: task.id });
        }
      }
    }
    
    return deps;
  }, [tasks]);

  // No tasks with dates
  if (features.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <GanttChartSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Pas de données pour le Gantt</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Ajoutez des dates d&apos;échéance à vos tâches pour les visualiser dans le diagramme de Gantt.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GanttChartSquare className="h-5 w-5" />
              Diagramme de Gantt
            </CardTitle>
            <CardDescription>
              Glissez-déposez pour modifier les dates. Cliquez pour éditer.
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {/* Range selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Vue:</span>
              <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Journalière</SelectItem>
                  <SelectItem value="monthly">Mensuelle</SelectItem>
                  <SelectItem value="quarterly">Trimestrielle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Zoom controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.max(50, z - 25))}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[50px] text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.min(200, z + 25))}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef}
          className="relative border rounded-lg overflow-hidden" 
          style={{ height: `${Math.max(400, tasks.length * 40 + 100)}px` }}
        >
          {/* Dependency arrows SVG overlay */}
          <DependencyArrows 
            dependencies={dependencies} 
            taskPositions={taskPositions}
          />

          <GanttProvider zoom={zoom} range={range}>
            <GanttSidebar>
              <GanttSidebarGroup name="Tâches">
                {mainTasks.map(task => {
                  const feature = features.find(f => f.id === task.id);
                  if (!feature) return null;
                  
                  return (
                    <GanttSidebarItem 
                      key={task.id} 
                      feature={feature}
                      onSelectItem={() => handleTaskClick(task.id)}
                    />
                  );
                })}
              </GanttSidebarGroup>
            </GanttSidebar>
            
            <GanttTimeline>
              <GanttHeader />
              <GanttFeatureList>
                <GanttFeatureListGroup>
                  {features.map(feature => {
                    const task = tasks.find(t => t.id === feature.id);
                    return (
                      <button 
                        key={feature.id}
                        type="button"
                        data-task-id={feature.id}
                        onClick={() => handleTaskClick(feature.id)}
                        className="cursor-pointer w-full text-left"
                      >
                        <GanttFeatureItem 
                          {...feature}
                          onMove={handleFeatureMove}
                        >
                          <div className="flex items-center gap-1 px-2 h-full">
                            <span className="text-xs text-white truncate">
                              {task?.title}
                            </span>
                            {task?.status === 'done' && (
                              <span className="text-xs">✓</span>
                            )}
                          </div>
                        </GanttFeatureItem>
                      </button>
                    );
                  })}
                </GanttFeatureListGroup>
              </GanttFeatureList>
              <GanttToday />
            </GanttTimeline>
          </GanttProvider>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * SVG layer for dependency arrows
 */
interface DependencyArrowsProps {
  dependencies: { from: string; to: string }[];
  taskPositions: Map<string, { x: number; y: number; width: number }>;
}

function DependencyArrows({ dependencies, taskPositions }: Readonly<DependencyArrowsProps>) {
  if (dependencies.length === 0 || taskPositions.size === 0) {
    return null;
  }

  return (
    <svg 
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon 
            points="0 0, 10 3.5, 0 7" 
            fill="#6366f1"
          />
        </marker>
      </defs>
      
      {dependencies.map(dep => {
        const fromPos = taskPositions.get(dep.from);
        const toPos = taskPositions.get(dep.to);
        
        if (!fromPos || !toPos) return null;
        
        // Draw curved arrow from end of "from" task to start of "to" task
        const startX = fromPos.x + fromPos.width;
        const startY = fromPos.y;
        const endX = toPos.x;
        const endY = toPos.y;
        
        // Calculate control offset for bezier curve
        const controlOffset = Math.abs(endY - startY) * 0.3;
        
        const path = `M ${startX} ${startY} 
                      C ${startX + controlOffset} ${startY}, 
                        ${endX - controlOffset} ${endY}, 
                        ${endX} ${endY}`;
        
        return (
          <path
            key={`${dep.from}-${dep.to}`}
            d={path}
            stroke="#6366f1"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            opacity="0.7"
          />
        );
      })}
    </svg>
  );
}

// Re-export simple version for backward compatibility
export { ProjectGantt, ProjectGanttSimple } from './project-gantt';
