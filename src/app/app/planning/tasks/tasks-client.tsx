/**
 * Tasks Client Component
 * 
 * Client-side state management for tasks CRUD operations.
 * 
 * @module lifeos/pages/tasks
 */
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TasksList } from '@/features/lifeos/components/tasks/tasks-list';
import { TaskForm } from '@/features/lifeos/components/tasks/task-form';
import {
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from '@/features/lifeos/actions/tasks.actions';
import type { Task, TaskStatus } from '@/features/lifeos/schema/tasks.schema';
import type { Domain } from '@/features/lifeos/schema/domains.schema';

interface Project {
  id: string;
  name: string;
  domain_id: string | null;
}

interface TasksClientProps {
  initialTasks: Task[];
  initialDomains: Domain[];
  initialProjects: Project[];
  error: string | null;
}

export function TasksClient({
  initialTasks,
  initialDomains,
  initialProjects,
  error,
}: TasksClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Local state for optimistic updates
  const [tasks, setTasks] = useState(initialTasks);
  const [domains] = useState(initialDomains);
  const [projects] = useState(initialProjects);
  
  // Form dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show error toast if initial load failed
  if (error) {
    toast.error('Erreur de chargement', {
      description: error,
    });
  }

  // Open form for new task
  const handleAdd = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  // Handle form submission (create or update)
  const handleFormSubmit = async (data: {
    title: string;
    description?: string;
    domain_id?: string | null;
    project_id?: string | null;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimated_duration?: number | null;
    deadline?: string | null;
  }) => {
    setIsSubmitting(true);

    try {
      if (editingTask) {
        // Update existing task
        const result = await updateTask({
          id: editingTask.id,
          ...data,
        });

        if (result.error) {
          toast.error('Erreur', { description: result.error });
          return;
        }

        // Optimistic update
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingTask.id ? { ...t, ...result.data } : t
          )
        );

        toast.success('Tâche mise à jour');
      } else {
        // Create new task
        const result = await createTask(data);

        if (result.error) {
          toast.error('Erreur', { description: result.error });
          return;
        }

        // Optimistic update
        if (result.data) {
          setTasks((prev) => [result.data!, ...prev]);
        }

        toast.success('Tâche créée');
      }

      setIsFormOpen(false);
      setEditingTask(null);
      
      // Refresh server data
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (taskId: string) => {
    // Optimistic update
    const previousTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    const result = await deleteTask(taskId);

    if (result.error) {
      // Revert on error
      setTasks(previousTasks);
      toast.error('Erreur', { description: result.error });
      return;
    }

    toast.success('Tâche supprimée');
    
    // Refresh server data
    startTransition(() => {
      router.refresh();
    });
  };

  // Handle status change
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update
    const previousTasks = tasks;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId 
          ? { 
              ...t, 
              status: newStatus,
            } 
          : t
      )
    );

    const result = await updateTaskStatus(taskId, newStatus);

    if (result.error) {
      // Revert on error
      setTasks(previousTasks);
      toast.error('Erreur', { description: result.error });
      return;
    }

    // Status change toasts
    const statusMessages: Record<TaskStatus, string> = {
      backlog: 'Tâche déplacée en backlog',
      todo: 'Tâche rouverte',
      in_progress: 'Tâche démarrée',
      blocked: 'Tâche bloquée',
      done: 'Tâche terminée ! 🎉',
      cancelled: 'Tâche annulée',
      archived: 'Tâche archivée',
    };
    toast.success(statusMessages[newStatus]);
    
    // Refresh server data
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <>
      <TasksList
        tasks={tasks}
        domains={domains}
        projects={projects}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        isLoading={isPending}
      />

      <TaskForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        domains={domains}
        projects={projects}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
