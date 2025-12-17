/**
 * Task Form Dialog Component
 * 
 * A dialog form for creating and editing tasks.
 * Can be pre-filled with project_id or parent_task_id.
 * 
 * @module lifeos/components/tasks
 */
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Loader2, Plus, ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Task } from '../../schema/tasks.schema';
import type { Domain } from '../../schema/domains.schema';
import type { Project } from '../../schema/projects.schema';

// Form schema
const taskFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().max(2000).optional(),
  domain_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  parent_task_id: z.string().uuid().optional().nullable(),
  priority: z.enum(['high', 'medium', 'low']),
  estimated_minutes: z.number().int().positive().optional().nullable(),
  due_date: z.date().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  // Pre-fill values
  projectId?: string | null;
  parentTaskId?: string | null;
  domainId?: string | null;
  // Data
  domains?: Domain[];
  projects?: Project[];
  parentTasks?: Task[];
  // Callbacks
  onSubmit: (data: {
    title: string;
    description?: string | null;
    domain_id?: string | null;
    project_id?: string | null;
    parent_task_id?: string | null;
    priority: 'high' | 'medium' | 'low';
    estimated_minutes?: number | null;
    due_date?: string | null;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  projectId,
  parentTaskId,
  domainId,
  domains = [],
  projects = [],
  parentTasks = [],
  onSubmit,
  isSubmitting = false,
}: Readonly<TaskFormDialogProps>) {
  const isEditing = !!task;
  const isSubtask = !!parentTaskId || !!task?.parent_task_id;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      domain_id: domainId ?? null,
      project_id: projectId ?? null,
      parent_task_id: parentTaskId ?? null,
      priority: 'medium',
      estimated_minutes: null,
      due_date: null,
    },
  });

  // Reset form when task or pre-fill values change
  React.useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description ?? '',
        domain_id: task.domain_id ?? null,
        project_id: task.project_id ?? null,
        parent_task_id: task.parent_task_id ?? null,
        priority: task.priority,
        estimated_minutes: task.estimated_minutes ?? null,
        due_date: task.due_date ? new Date(task.due_date) : null,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        domain_id: domainId ?? null,
        project_id: projectId ?? null,
        parent_task_id: parentTaskId ?? null,
        priority: 'medium',
        estimated_minutes: null,
        due_date: null,
      });
    }
  }, [task, projectId, parentTaskId, domainId, form]);

  async function handleSubmit(data: TaskFormValues) {
    await onSubmit({
      title: data.title,
      description: data.description || null,
      domain_id: data.domain_id || null,
      project_id: data.project_id || null,
      parent_task_id: data.parent_task_id || null,
      priority: data.priority,
      estimated_minutes: data.estimated_minutes || null,
      due_date: data.due_date ? format(data.due_date, 'yyyy-MM-dd') : null,
    });
  }

  // Get title based on context
  const getDialogTitle = () => {
    if (isEditing) return 'Modifier la tâche';
    if (isSubtask) return 'Nouvelle sous-tâche';
    return 'Nouvelle tâche';
  };

  const getDialogDescription = () => {
    if (isEditing) return 'Modifiez les détails de la tâche.';
    if (isSubtask) return 'Créez une sous-tâche pour décomposer le travail.';
    return 'Créez une nouvelle tâche pour le projet.';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSubtask ? <ListTodo className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={isSubtask ? "Ex: Étape 1 - Recherche" : "Ex: Finaliser le rapport"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description optionnelle..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority and Estimated time row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">🔴 Haute</SelectItem>
                        <SelectItem value="medium">🟡 Moyenne</SelectItem>
                        <SelectItem value="low">🟢 Basse</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée estimée (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 30"
                        min={1}
                        max={480}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due date */}
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Échéance</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: fr })
                          ) : (
                            <span>Sélectionner une date...</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                      {field.value && (
                        <div className="p-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => field.onChange(null)}
                          >
                            Supprimer l&apos;échéance
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Domain - only show if not in project context */}
            {!projectId && !isSubtask && domains.length > 0 && (
              <FormField
                control={form.control}
                name="domain_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domaine</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === '_none' ? null : v)}
                      value={field.value ?? '_none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aucun domaine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Aucun domaine</SelectItem>
                        {domains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id}>
                            <span className="flex items-center gap-2">
                              <span>{domain.icon}</span>
                              <span>{domain.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Project - only show if not pre-filled and not a subtask */}
            {!projectId && !isSubtask && projects.length > 0 && (
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projet</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === '_none' ? null : v)}
                      value={field.value ?? '_none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aucun projet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Aucun projet</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <span className="flex items-center gap-2">
                              <span>📁</span>
                              <span>{project.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Associez cette tâche à un projet
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Parent task - only show if selecting subtask parent */}
            {!parentTaskId && !isEditing && parentTasks.length > 0 && (
              <FormField
                control={form.control}
                name="parent_task_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tâche parente (optionnel)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === '_none' ? null : v)}
                      value={field.value ?? '_none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aucune (tâche principale)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Aucune (tâche principale)</SelectItem>
                        {parentTasks.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            <span className="flex items-center gap-2">
                              <ListTodo className="h-4 w-4" />
                              <span className="truncate max-w-[250px]">{t.title}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Créez une sous-tâche en sélectionnant une tâche parente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
