/**
 * Project Form Component
 * 
 * Dialog form for creating and editing projects.
 * 
 * @module lifeos/components/projects
 */
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Loader2, Palette } from 'lucide-react';
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
import type { Project } from '../../schema/projects.schema';
import type { Domain } from '../../schema/domains.schema';

// Preset colors for quick selection
const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#64748b', // slate
];

// Project status options
const PROJECT_STATUSES = [
  { value: 'active', label: 'Actif', color: 'bg-green-500' },
  { value: 'paused', label: 'En pause', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Terminé', color: 'bg-blue-500' },
  { value: 'archived', label: 'Archivé', color: 'bg-gray-500' },
];

// Form schema
const projectFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Max 100 caractères'),
  description: z.string().max(2000).optional(),
  domain_id: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  start_date: z.date().optional().nullable(),
  target_date: z.date().optional().nullable(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  domains: Domain[];
  onSubmit: (data: {
    name: string;
    description?: string | null;
    domain_id?: string | null;
    color?: string | null;
    status?: 'active' | 'paused' | 'completed' | 'archived';
    start_date?: string | null;
    target_date?: string | null;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function ProjectForm({
  open,
  onOpenChange,
  project,
  domains,
  onSubmit,
  isSubmitting = false,
}: Readonly<ProjectFormProps>) {
  const isEditing = !!project;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      domain_id: undefined,
      color: '#6366f1',
      status: 'active',
      start_date: null,
      target_date: null,
    },
  });

  // Reset form when project changes
  React.useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description ?? '',
        domain_id: project.domain_id ?? undefined,
        color: project.color ?? '#6366f1',
        status: project.status,
        start_date: project.start_date ? new Date(project.start_date) : null,
        target_date: project.target_date ? new Date(project.target_date) : null,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        domain_id: undefined,
        color: '#6366f1',
        status: 'active',
        start_date: null,
        target_date: null,
      });
    }
  }, [project, form]);

  async function handleSubmit(data: ProjectFormValues) {
    await onSubmit({
      name: data.name,
      description: data.description || null,
      domain_id: data.domain_id || null,
      color: data.color || null,
      status: data.status,
      start_date: data.start_date ? format(data.start_date, 'yyyy-MM-dd') : null,
      target_date: data.target_date ? format(data.target_date, 'yyyy-MM-dd') : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le projet' : 'Nouveau projet'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations du projet.'
              : 'Créez un nouveau projet pour organiser vos tâches.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du projet *</FormLabel>
                  <FormControl>
                    <Input placeholder="Mon projet" {...field} />
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
                      placeholder="Description du projet..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Domain and Color row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Domain */}
              <FormField
                control={form.control}
                name="domain_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domaine</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aucun domaine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Aucun domaine</SelectItem>
                        {domains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id}>
                            <div className="flex items-center gap-2">
                              <span>{domain.icon}</span>
                              <span>{domain.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2"
                          >
                            <div
                              className="h-4 w-4 rounded-full border"
                              style={{ backgroundColor: field.value ?? '#6366f1' }}
                            />
                            <span className="text-muted-foreground">
                              {field.value ?? 'Choisir'}
                            </span>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <div className="grid grid-cols-8 gap-1.5">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={cn(
                                'h-6 w-6 rounded-full border-2 transition-all hover:scale-110',
                                field.value === color
                                  ? 'border-foreground'
                                  : 'border-transparent'
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => field.onChange(color)}
                            />
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Palette className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="#6366f1"
                            className="h-8"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status (only for editing) */}
            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${status.color}`} />
                              <span>{status.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Dates row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start date */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de début</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, 'dd MMM yyyy', { locale: fr })
                              : 'Sélectionner'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={field.onChange}
                          locale={fr}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target date */}
              <FormField
                control={form.control}
                name="target_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date cible</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, 'dd MMM yyyy', { locale: fr })
                              : 'Sélectionner'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={field.onChange}
                          locale={fr}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormDescription className="text-xs">
              * Champs obligatoires
            </FormDescription>

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
                {isEditing ? 'Enregistrer' : 'Créer le projet'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
