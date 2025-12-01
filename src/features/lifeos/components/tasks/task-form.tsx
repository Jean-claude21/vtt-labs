// @ts-nocheck
/**
 * Task Form Component
 * 
 * Dialog form for creating and editing tasks.
 * Includes deadline options and project assignment.
 * 
 * @module lifeos/components/tasks
 */
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
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

// Form schema
const taskFormSchema = z.object({
  title: z.string().min(2, 'Titre requis (min 2 caractères)').max(200),
  description: z.string().max(1000).optional(),
  domain_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  estimated_minutes: z.number().min(5).max(480).optional().nullable(),
  deadline: z.date().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface Project {
  id: string;
  name: string;
  domain_id: string | null;
}

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  domains: Domain[];
  projects?: Project[];
  onSubmit: (data: {
    title: string;
    description?: string;
    domain_id?: string | null;
    project_id?: string | null;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimated_minutes?: number | null;
    deadline?: string | null;
  }) => void;
  isSubmitting?: boolean;
}

export function TaskForm({
  open,
  onOpenChange,
  task,
  domains,
  projects = [],
  onSubmit,
  isSubmitting = false,
}: TaskFormProps) {
  const isEditing = !!task;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      domain_id: null,
      project_id: null,
      priority: 'medium',
      estimated_minutes: null,
      deadline: null,
    },
  });

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description ?? '',
        domain_id: task.domain_id ?? null,
        project_id: task.project_id ?? null,
        priority: task.priority as TaskFormValues['priority'],
        estimated_minutes: task.estimated_minutes ?? null,
        deadline: task.due_date ? new Date(task.due_date) : null,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        domain_id: null,
        project_id: null,
        priority: 'medium',
        estimated_minutes: null,
        deadline: null,
      });
    }
  }, [task, form]);

  const handleSubmit = (values: TaskFormValues) => {
    onSubmit({
      title: values.title,
      description: values.description,
      domain_id: values.domain_id,
      project_id: values.project_id,
      priority: values.priority,
      estimated_minutes: values.estimated_minutes,
      deadline: values.due_date ? values.due_date.toISOString() : null,
    });
  };

  // Filter projects by selected domain
  const selectedDomainId = form.watch('domain_id');
  const filteredProjects = selectedDomainId 
    ? projects.filter(p => p.domain_id === selectedDomainId || !p.domain_id)
    : projects;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifiez les détails de votre tâche.'
              : 'Créez une nouvelle tâche avec ses paramètres.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Finaliser le rapport" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description optionnelle de la tâche..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="domain_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domaine</FormLabel>
                    <Select 
                      onValueChange={(v) => {
                        field.onChange(v === '_none' ? null : v);
                        // Reset project if domain changes
                        if (v !== field.value) {
                          form.setValue('project_id', null);
                        }
                      }} 
                      value={field.value ?? '_none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Aucun</SelectItem>
                        {domains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id}>
                            {domain.icon} {domain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <SelectItem value="critical">🔴 Critique</SelectItem>
                        <SelectItem value="high">🟠 Haute</SelectItem>
                        <SelectItem value="medium">🔵 Moyenne</SelectItem>
                        <SelectItem value="low">⚪ Basse</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {filteredProjects.length > 0 && (
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
                        {filteredProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            📁 {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Associez cette tâche à un projet existant
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
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
                        min={5}
                        max={480}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
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
                              <span>Sélectionner...</span>
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
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
            </div>

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
                {isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


