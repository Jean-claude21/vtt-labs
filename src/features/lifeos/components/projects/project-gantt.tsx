/**
 * Project Gantt Component
 * 
 * Simple Gantt chart visualization for project tasks.
 * Uses a custom implementation since Kibo-UI Gantt has API limitations.
 * 
 * @module lifeos/components/projects
 */
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GanttChartSquare } from 'lucide-react';
import type { Task } from '../../schema/tasks.schema';

// Status colors for the Gantt bars
const STATUS_COLORS: Record<string, string> = {
  backlog: '#6b7280',
  todo: '#3b82f6',
  in_progress: '#eab308',
  blocked: '#ef4444',
  done: '#22c55e',
  cancelled: '#9ca3af',
  archived: '#9ca3af',
};

interface ProjectGanttProps {
  projectId?: string;
  tasks: Task[];
  onTaskUpdate?: () => void;
}

/**
 * Simple Gantt chart visualization for project tasks.
 * Displays tasks on a timeline based on their due dates.
 */
export function ProjectGantt({ tasks, onTaskUpdate: _onTaskUpdate }: Readonly<ProjectGanttProps>) {
  // Filter tasks with dates for Gantt
  const ganttTasks = tasks.filter(t => t.due_date);

  if (ganttTasks.length === 0) {
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

  // Sort tasks by due date
  const sortedTasks = [...ganttTasks].sort((a, b) => {
    const dateA = a.due_date ? new Date(a.due_date) : new Date();
    const dateB = b.due_date ? new Date(b.due_date) : new Date();
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate date range
  const dates = sortedTasks.map(t => new Date(t.due_date!));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const today = new Date();
  
  // Add padding to date range
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 7);
  
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate position and width for each task
  const getTaskBar = (task: Task) => {
    const endDate = new Date(task.due_date!);
    // Assume task starts 7 days before due date (or use start_date if available)
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);
    
    const startOffset = Math.max(0, (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };

  // Today marker position
  const todayOffset = (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
  const todayPosition = (todayOffset / totalDays) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GanttChartSquare className="h-5 w-5" />
          Diagramme de Gantt
        </CardTitle>
        <CardDescription>
          Vue timeline des tâches avec leurs échéances.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Header with dates */}
          <div className="flex justify-between text-xs text-muted-foreground mb-4 px-2">
            <span>{minDate.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}</span>
            <span>{maxDate.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}</span>
          </div>
          
          {/* Today marker */}
          {todayPosition >= 0 && todayPosition <= 100 && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: `${todayPosition}%` }}
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-red-500 whitespace-nowrap">
                Aujourd&apos;hui
              </span>
            </div>
          )}

          {/* Tasks */}
          <div className="space-y-2">
            {sortedTasks.map(task => {
              const bar = getTaskBar(task);
              const statusColor = STATUS_COLORS[task.status] || '#3b82f6';
              
              return (
                <div key={task.id} className="flex items-center gap-4 py-2">
                  <div className="w-48 truncate text-sm font-medium shrink-0">
                    {task.title}
                  </div>
                  <div className="flex-1 h-6 bg-muted rounded relative">
                    <div 
                      className="absolute h-full rounded transition-all duration-300"
                      style={{ 
                        left: bar.left, 
                        width: bar.width,
                        backgroundColor: statusColor,
                        opacity: task.status === 'done' ? 0.6 : 1,
                      }}
                    >
                      <span className="absolute inset-0 flex items-center px-2 text-xs text-white truncate">
                        {task.status === 'done' && '✓'}
                      </span>
                    </div>
                  </div>
                  <div className="w-24 text-xs text-muted-foreground text-right shrink-0">
                    {new Date(task.due_date!).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Alias for backward compatibility
export const ProjectGanttSimple = ProjectGantt;
