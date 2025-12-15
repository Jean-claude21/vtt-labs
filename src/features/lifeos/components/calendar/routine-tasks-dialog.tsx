/**
 * Routine Tasks Dialog
 * 
 * Dialog to manage tasks linked to a routine instance.
 * Allows viewing linked tasks, creating new tasks, and linking existing tasks.
 * 
 * @module lifeos/components/calendar/routine-tasks-dialog
 */
'use client';

import * as React from 'react';
import { useState, useTransition, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Link2,
  ListTodo,
  Loader2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/features/lifeos/schema/calendar.schema';
import type { Task } from '@/features/lifeos/schema/tasks.schema';
import { createTaskFromRoutine } from '@/features/lifeos/actions/routines.actions';
import { getUnscheduledTasks, createTask } from '@/features/lifeos/actions/tasks.actions';

interface RoutineTasksDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: () => void;
}

export function RoutineTasksDialog({
  event,
  open,
  onOpenChange,
  onTaskCreated,
}: Readonly<RoutineTasksDialogProps>) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<string>('create');
  
  // Create task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskEstimate, setNewTaskEstimate] = useState('30');
  
  // Available tasks to link
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  // Load unscheduled tasks when dialog opens
  useEffect(() => {
    if (open && activeTab === 'link') {
      setLoadingTasks(true);
      getUnscheduledTasks().then((result) => {
        if (result.data) {
          setAvailableTasks(result.data);
        }
        setLoadingTasks(false);
      });
    }
  }, [open, activeTab]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && event) {
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskEstimate('30');
      setActiveTab('create');
    }
  }, [open, event]);

  if (!event) return null;

  // Handle quick task creation from routine
  const handleQuickCreateTask = async () => {
    if (!event.entityId) return;

    startTransition(async () => {
      const result = await createTaskFromRoutine(event.entityId);

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      toast.success('Tâche créée!', { 
        description: `Tâche liée à "${event.title}" créée` 
      });
      
      // Ne pas fermer le dialog - permettre de créer plusieurs tâches
      onTaskCreated?.();
    });
  };

  // Handle custom task creation
  const handleCreateCustomTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    startTransition(async () => {
      // Create task with the routine's scheduled date/time
      const scheduledDate = event.start?.toISOString().split('T')[0];
      const scheduledTime = event.start?.toTimeString().substring(0, 5);

      const result = await createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        domain_id: event.domainId || undefined,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        estimated_minutes: parseInt(newTaskEstimate) || 30,
        priority: 'medium',
        status: 'todo',
        // Note: linking to routine would require updating the task after creation
        // or adding a routine_instance_id field to createTask
      });

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      toast.success('Tâche créée!', { 
        description: `"${newTaskTitle}" ajoutée` 
      });
      
      // Réinitialiser le formulaire mais garder le dialog ouvert
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskEstimate('30');
      onTaskCreated?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-10 rounded-full" 
              style={{ backgroundColor: event.color || 'hsl(var(--primary))' }}
            />
            <div className="flex-1">
              <DialogTitle className="text-lg">Tâches liées</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {event.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="gap-2">
              <Plus className="h-4 w-4" />
              Créer
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <Link2 className="h-4 w-4" />
              Lier existante
            </TabsTrigger>
          </TabsList>

          {/* Create Task Tab */}
          <TabsContent value="create" className="space-y-4 mt-4">
            {/* Quick create button */}
            <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ListTodo className="h-4 w-4" />
                Création rapide
              </div>
              <p className="text-xs text-muted-foreground">
                Crée automatiquement une tâche avec le même nom, horaire et domaine que la routine.
              </p>
              <Button 
                onClick={handleQuickCreateTask}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Créer tâche depuis routine
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  ou créer une tâche personnalisée
                </span>
              </div>
            </div>

            {/* Custom task form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Titre de la tâche</Label>
                <Input
                  id="task-title"
                  placeholder="Ex: Préparer le matériel de méditation"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-description">Description (optionnel)</Label>
                <Input
                  id="task-description"
                  placeholder="Détails supplémentaires..."
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-estimate">Durée estimée (minutes)</Label>
                <Input
                  id="task-estimate"
                  type="number"
                  min="5"
                  max="480"
                  value={newTaskEstimate}
                  onChange={(e) => setNewTaskEstimate(e.target.value)}
                />
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                La tâche sera planifiée le même jour que la routine ({event.start?.toLocaleDateString('fr-FR')})
              </div>

              <Button 
                onClick={handleCreateCustomTask}
                disabled={isPending || !newTaskTitle.trim()}
                className="w-full"
                variant="secondary"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Créer tâche personnalisée
              </Button>
            </div>
          </TabsContent>

          {/* Link Existing Task Tab */}
          <TabsContent value="link" className="space-y-4 mt-4">
            {loadingTasks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Aucune tâche non planifiée</p>
                <p className="text-xs mt-1">Créez d&apos;abord une tâche dans l&apos;onglet &quot;Créer&quot;</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2 pr-4">
                  <p className="text-xs text-muted-foreground mb-3">
                    Sélectionnez une tâche existante pour la lier à cette routine
                  </p>
                  {availableTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => {
                        // TODO: Implement linking existing task
                        toast.info('Fonctionnalité à venir', {
                          description: 'Le lien de tâches existantes sera bientôt disponible'
                        });
                      }}
                      className={cn(
                        "w-full p-3 rounded-lg border bg-card text-left",
                        "hover:bg-muted/50 hover:border-primary/50 transition-colors"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <ListTodo className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {task.estimated_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {task.estimated_minutes} min
                              </span>
                            )}
                            {task.priority && (
                              <Badge variant="outline" className="text-xs">
                                {task.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
