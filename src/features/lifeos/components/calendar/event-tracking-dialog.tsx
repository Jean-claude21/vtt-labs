/**
 * Event Tracking Dialog
 * 
 * Modal for tracking routine instances and tasks.
 * Allows marking as Done/Partial/Skipped with optional tracking data.
 * 
 * @module lifeos/components/calendar/event-tracking-dialog
 */
'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check,
  X,
  SkipForward,
  Clock,
  Smile,
  Zap,
  FileText,
  Timer,
  Target,
  Calendar,
  Loader2,
  CheckSquare,
  Square,
  ListTodo,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/features/lifeos/schema/calendar.schema';
import { 
  completeRoutineInstance, 
  skipRoutineInstance,
  partialRoutineInstance,
  rescheduleRoutineInstance,
  toggleChecklistItem,
  getRoutineChecklist,
  addChecklistItem,
  updateRoutineActualTimes,
  startRoutineInstance,
} from '@/features/lifeos/actions/routines.actions';
import { 
  completeTask, 
  updateTaskStatus,
  scheduleTask,
  startTask,
  updateTaskActualTimes,
} from '@/features/lifeos/actions/tasks.actions';

interface EventTrackingDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated?: () => void;
  onOpenRoutineTasks?: () => void;
}

// Mood emoji mapping
const moodEmojis = [
  { value: 1, emoji: '😢', label: 'Très mal' },
  { value: 2, emoji: '😕', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Neutre' },
  { value: 4, emoji: '🙂', label: 'Bien' },
  { value: 5, emoji: '😄', label: 'Très bien' },
];

// Energy level labels
const energyLabels: Record<number, string> = {
  1: 'Épuisé',
  2: 'Très fatigué',
  3: 'Fatigué',
  4: 'Un peu fatigué',
  5: 'Moyen',
  6: 'Correct',
  7: 'En forme',
  8: 'Bien',
  9: 'Très en forme',
  10: 'Au top!',
};

export function EventTrackingDialog({
  event,
  open,
  onOpenChange,
  onEventUpdated,
  onOpenRoutineTasks,
}: Readonly<EventTrackingDialogProps>) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<string>('quick');
  
  // Tracking state
  const [moodBefore, setMoodBefore] = useState<number>(3);
  const [moodAfter, setMoodAfter] = useState<number>(3);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [actualValue, setActualValue] = useState<string>('');
  const [skipReason, setSkipReason] = useState<string>('');
  
  // Schedule modification state
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleStartTime, setScheduleStartTime] = useState<string>('');
  const [scheduleEndTime, setScheduleEndTime] = useState<string>('');
  
  // Actual time state (for manual entry)
  const [actualStartTime, setActualStartTime] = useState<string>('');
  const [actualEndTime, setActualEndTime] = useState<string>('');
  
  // Checklist state (for routines)
  const [checklistItems, setChecklistItems] = useState<{ id: string; label: string; order: number }[]>([]);
  const [completedChecklistIds, setCompletedChecklistIds] = useState<string[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState<string>('');
  const [isAddingChecklistItem, setIsAddingChecklistItem] = useState(false);

  // Load checklist when dialog opens for a routine with checklist (or routine without items yet)
  React.useEffect(() => {
    if (open && event && event.type === 'routine') {
      setChecklistLoading(true);
      getRoutineChecklist(event.entityId).then((result) => {
        if (result.data) {
          setChecklistItems(result.data.items);
          setCompletedChecklistIds(result.data.completedIds);
        }
        setChecklistLoading(false);
      });
    }
  }, [open, event]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open && event) {
      setMoodBefore(3);
      setMoodAfter(3);
      setEnergyLevel(5);
      setNotes('');
      setActualValue('');
      setSkipReason('');
      setActiveTab('quick');
      
      // Initialize schedule times from event
      if (event.start) {
        setScheduleDate(event.start.toISOString().split('T')[0]);
        setScheduleStartTime(event.start.toTimeString().substring(0, 5));
      }
      if (event.end) {
        setScheduleEndTime(event.end.toTimeString().substring(0, 5));
      }
      
      // Initialize actual times from event (if already tracked)
      if (event.actualStart) {
        setActualStartTime(event.actualStart.toTimeString().substring(0, 5));
      } else {
        setActualStartTime('');
      }
      if (event.actualEnd) {
        setActualEndTime(event.actualEnd.toTimeString().substring(0, 5));
      } else {
        setActualEndTime('');
      }
    }
  }, [open, event]);

  if (!event) return null;

  const isRoutine = event.type === 'routine';
  const isTask = event.type === 'task';

  // Format time display
  const formatTime = (date: Date | null | undefined) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Handle routine completion
  const handleCompleteRoutine = async (status: 'completed' | 'partial') => {
    if (!event.entityId) return;

    startTransition(async () => {
      const action = status === 'completed' ? completeRoutineInstance : partialRoutineInstance;
      const result = await action({
        id: event.entityId,
        mood_before: moodBefore,
        mood_after: moodAfter,
        energy_level: energyLevel,
        notes: notes || undefined,
        actual_value: actualValue ? Number.parseFloat(actualValue) : undefined,
      });

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      toast.success(
        status === 'completed' ? 'Routine terminée!' : 'Routine partiellement complétée',
        { description: `"${event.title}" marquée comme ${status === 'completed' ? 'terminée' : 'partielle'}` }
      );
      
      onOpenChange(false);
      onEventUpdated?.();
    });
  };

  // Handle routine skip
  const handleSkipRoutine = async () => {
    if (!event.entityId || !skipReason.trim()) {
      toast.error('Veuillez indiquer la raison du skip');
      return;
    }

    startTransition(async () => {
      const result = await skipRoutineInstance({
        id: event.entityId,
        skip_reason: skipReason,
      });

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      toast.info('Routine sautée', { 
        description: `"${event.title}" sautée pour aujourd'hui` 
      });
      
      onOpenChange(false);
      onEventUpdated?.();
    });
  };

  // Handle task completion
  const handleCompleteTask = async () => {
    if (!event.entityId) return;

    startTransition(async () => {
      const result = await completeTask(event.entityId);

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      toast.success('Tâche terminée!', { 
        description: `"${event.title}" marquée comme terminée` 
      });
      
      onOpenChange(false);
      onEventUpdated?.();
    });
  };

  // Handle starting a task (records actual_start time)
  const handleStartTask = async () => {
    if (!event.entityId) return;

    startTransition(async () => {
      const result = await startTask(event.entityId);

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      toast.success('Tâche commencée!', { 
        description: `"${event.title}" en cours` 
      });
      
      onEventUpdated?.();
    });
  };

  // Handle schedule modification
  const handleUpdateSchedule = async () => {
    if (!event.entityId || !scheduleDate || !scheduleStartTime) {
      toast.error('Veuillez remplir la date et l\'heure de début');
      return;
    }

    startTransition(async () => {
      let result;
      
      if (isTask) {
        // For tasks, update scheduled_date and scheduled_time
        result = await scheduleTask(event.entityId, scheduleDate, scheduleStartTime);
      } else if (isRoutine) {
        // For routines, update scheduled_start and scheduled_end
        result = await rescheduleRoutineInstance(
          event.entityId, 
          scheduleStartTime, 
          scheduleEndTime || scheduleStartTime
        );
      } else {
        toast.error('Type d\'événement non supporté');
        return;
      }

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      toast.success('Horaires modifiés', { 
        description: `"${event.title}" reprogrammé à ${scheduleStartTime}` 
      });
      
      onOpenChange(false);
      onEventUpdated?.();
    });
  };

  // Handle checklist item toggle
  const handleToggleChecklistItem = async (itemId: string, completed: boolean) => {
    if (!event.entityId) return;

    // Optimistic update
    setCompletedChecklistIds(prev => 
      completed 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );

    const result = await toggleChecklistItem(event.entityId, itemId, completed);
    
    if (result.error) {
      // Revert on error
      setCompletedChecklistIds(prev => 
        completed 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
      toast.error('Erreur', { description: result.error });
      return;
    }

    // Sync with server response
    if (result.data) {
      setCompletedChecklistIds(result.data);
    }
  };

  // Handle adding a new checklist item
  const handleAddChecklistItem = async () => {
    if (!event.entityId || !newChecklistItem.trim()) return;

    setIsAddingChecklistItem(true);
    
    const result = await addChecklistItem(event.entityId, newChecklistItem.trim());
    
    if (result.error) {
      toast.error('Erreur', { description: result.error });
      setIsAddingChecklistItem(false);
      return;
    }

    if (result.data) {
      // Add to local list
      setChecklistItems(prev => [...prev, result.data!]);
      setNewChecklistItem('');
      toast.success('Étape ajoutée');
    }
    
    setIsAddingChecklistItem(false);
  };

  // Handle saving actual times (manual entry) - works for both tasks and routines
  const handleSaveActualTimes = async () => {
    if (!event.entityId) return;
    
    // Build ISO datetime from date + time
    const dateStr = scheduleDate || event.start?.toISOString().split('T')[0];
    if (!dateStr) {
      toast.error('Date requise');
      return;
    }

    const actualStartISO = actualStartTime ? `${dateStr}T${actualStartTime}:00` : null;
    const actualEndISO = actualEndTime ? `${dateStr}T${actualEndTime}:00` : null;

    startTransition(async () => {
      let result;
      
      if (isTask) {
        result = await updateTaskActualTimes(event.entityId, actualStartISO, actualEndISO);
      } else if (isRoutine) {
        result = await updateRoutineActualTimes(event.entityId, actualStartISO, actualEndISO);
      } else {
        toast.error('Type d\'événement non supporté');
        return;
      }

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      toast.success('Temps réels enregistrés');
      onEventUpdated?.();
    });
  };

  // Handle starting a routine (record actual_start = now)
  const handleStartRoutine = async () => {
    if (!event.entityId || !isRoutine) return;

    startTransition(async () => {
      const result = await startRoutineInstance(event.entityId);

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      toast.success('Routine démarrée!');
      // Set local state to show the start time
      setActualStartTime(new Date().toTimeString().substring(0, 5));
      onEventUpdated?.();
    });
  };

  // Handle task status change
  const handleTaskStatus = async (status: 'in_progress' | 'cancelled') => {
    if (!event.entityId) return;

    startTransition(async () => {
      const result = await updateTaskStatus(event.entityId, status);

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      const statusLabel = status === 'in_progress' ? 'en cours' : 'annulée';
      toast.success('Statut mis à jour', { 
        description: `"${event.title}" est maintenant ${statusLabel}` 
      });
      
      onOpenChange(false);
      onEventUpdated?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {/* Domain color indicator */}
            <div 
              className="w-3 h-10 rounded-full" 
              style={{ backgroundColor: event.color || 'hsl(var(--primary))' }}
            />
            <div className="flex-1">
              <DialogTitle className="text-lg">{event.title}</DialogTitle>
              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3" />
                {formatTime(event.start)} - {formatTime(event.end)}
                <Badge variant="outline" className="ml-2">
                  {isRoutine ? 'Routine' : 'Tâche'}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className={cn(
            "grid w-full",
            isRoutine ? "grid-cols-4" : "grid-cols-3"
          )}>
            <TabsTrigger value="quick">Actions</TabsTrigger>
            {isRoutine && (
              <TabsTrigger value="checklist" className="gap-1">
                Étapes
                {checklistItems.length > 0 && (
                  <span className="text-xs opacity-70">
                    {completedChecklistIds.length}/{checklistItems.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="schedule">Horaires</TabsTrigger>
            <TabsTrigger value="details">Détails</TabsTrigger>
          </TabsList>

          {/* Quick Actions Tab */}
          <TabsContent value="quick" className="space-y-4 mt-4">
            {isRoutine && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col h-auto py-4 hover:bg-green-50 hover:border-green-500 hover:text-green-700"
                    onClick={() => handleCompleteRoutine('completed')}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                    ) : (
                      <Check className="h-6 w-6 mb-2 text-green-600" />
                    )}
                    <span className="text-sm font-medium">Terminé</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex flex-col h-auto py-4 hover:bg-yellow-50 hover:border-yellow-500 hover:text-yellow-700"
                    onClick={() => handleCompleteRoutine('partial')}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                    ) : (
                      <Target className="h-6 w-6 mb-2 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">Partiel</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex flex-col h-auto py-4 hover:bg-gray-100 hover:border-gray-400"
                    onClick={() => setActiveTab('skip')}
                    disabled={isPending}
                  >
                    <SkipForward className="h-6 w-6 mb-2 text-gray-500" />
                    <span className="text-sm font-medium">Sauter</span>
                  </Button>
                </div>
                
                {/* Bouton pour gérer les tâches liées */}
                {onOpenRoutineTasks && (
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700"
                    onClick={() => {
                      onOpenChange(false);
                      onOpenRoutineTasks();
                    }}
                  >
                    <ListTodo className="h-4 w-4" />
                    <span>Gérer les tâches liées</span>
                  </Button>
                )}
              </div>
            )}

            {isTask && (
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 hover:bg-green-50 hover:border-green-500 hover:text-green-700"
                  onClick={handleCompleteTask}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                  ) : (
                    <Check className="h-6 w-6 mb-2 text-green-600" />
                  )}
                  <span className="text-sm font-medium">Terminé</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700"
                  onClick={handleStartTask}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                  ) : (
                    <Timer className="h-6 w-6 mb-2 text-blue-600" />
                  )}
                  <span className="text-sm font-medium">Commencer</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex flex-col h-auto py-4 hover:bg-red-50 hover:border-red-500 hover:text-red-700"
                  onClick={() => handleTaskStatus('cancelled')}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                  ) : (
                    <X className="h-6 w-6 mb-2 text-red-500" />
                  )}
                  <span className="text-sm font-medium">Annuler</span>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Checklist Tab - for routines (always shown for routines to allow adding items) */}
          {isRoutine && (
            <TabsContent value="checklist" className="space-y-4 mt-4">
              {checklistLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Progress bar (only if items exist) */}
                  {checklistItems.length > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ 
                            width: `${(completedChecklistIds.length / checklistItems.length) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {completedChecklistIds.length}/{checklistItems.length}
                      </span>
                    </div>
                  )}
                  
                  {/* Checklist items */}
                  {checklistItems.map((item) => {
                    const isChecked = completedChecklistIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleChecklistItem(item.id, !isChecked)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                          isChecked 
                            ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" 
                            : "bg-card hover:bg-muted/50"
                        )}
                      >
                        {isChecked ? (
                          <CheckSquare className="h-5 w-5 text-green-600 shrink-0" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <span className={cn(
                          "text-sm",
                          isChecked && "line-through text-muted-foreground"
                        )}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                  
                  {checklistItems.length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      Aucune étape configurée. Ajoutez-en une ci-dessous.
                    </p>
                  )}

                  {/* Add new item form */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Input
                      placeholder="Nouvelle étape..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newChecklistItem.trim()) {
                          e.preventDefault();
                          handleAddChecklistItem();
                        }
                      }}
                      disabled={isAddingChecklistItem}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={handleAddChecklistItem}
                      disabled={isAddingChecklistItem || !newChecklistItem.trim()}
                    >
                      {isAddingChecklistItem ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Les étapes ajoutées seront disponibles pour toutes les occurrences futures.
                  </p>
                </div>
              )}
            </TabsContent>
          )}

          {/* Schedule Tab - Modify times */}
          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </Label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              
              {/* Start Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Début
                  </Label>
                  <Input
                    type="time"
                    value={scheduleStartTime}
                    onChange={(e) => setScheduleStartTime(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Fin
                  </Label>
                  <Input
                    type="time"
                    value={scheduleEndTime}
                    onChange={(e) => setScheduleEndTime(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Duration info */}
              {scheduleStartTime && scheduleEndTime && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Durée: {(() => {
                      const [startH, startM] = scheduleStartTime.split(':').map(Number);
                      const [endH, endM] = scheduleEndTime.split(':').map(Number);
                      const durationMin = (endH * 60 + endM) - (startH * 60 + startM);
                      if (durationMin < 0) return 'Invalide';
                      const hours = Math.floor(durationMin / 60);
                      const mins = durationMin % 60;
                      return hours > 0 ? `${hours}h${mins > 0 ? mins : ''}` : `${mins}min`;
                    })()}
                  </div>
                </div>
              )}
              
              {/* Actual times section (for tasks and routines) - Editable */}
              {(isTask || isRoutine) && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium text-sm">
                      <Timer className="h-4 w-4" />
                      Temps réel
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Planifié: {formatTime(event.start)} - {formatTime(event.end)}
                    </span>
                  </div>
                  
                  {/* Quick start button for routines */}
                  {isRoutine && !actualStartTime && event.status !== 'completed' && event.status !== 'skipped' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-green-700 border-green-300 hover:bg-green-50"
                      onClick={handleStartRoutine}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Timer className="h-4 w-4" />
                      )}
                      Démarrer maintenant
                    </Button>
                  )}
                  
                  {/* Editable actual times */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Début réel</Label>
                      <Input
                        type="time"
                        value={actualStartTime}
                        onChange={(e) => setActualStartTime(e.target.value)}
                        className="h-8 text-sm"
                        placeholder="--:--"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fin réelle</Label>
                      <Input
                        type="time"
                        value={actualEndTime}
                        onChange={(e) => setActualEndTime(e.target.value)}
                        className="h-8 text-sm"
                        placeholder="--:--"
                      />
                    </div>
                  </div>
                  
                  {/* Show difference if actual times are set */}
                  {actualStartTime && (
                    <div className="text-xs text-muted-foreground border-t border-blue-200 dark:border-blue-800 pt-2">
                      {(() => {
                        const [plannedH, plannedM] = (event.start?.toTimeString().substring(0, 5) || '00:00').split(':').map(Number);
                        const [actualH, actualM] = actualStartTime.split(':').map(Number);
                        const diffMinutes = (actualH * 60 + actualM) - (plannedH * 60 + plannedM);
                        
                        if (Math.abs(diffMinutes) < 5) {
                          return <span className="text-green-600">✓ Commencé à l&apos;heure</span>;
                        } else if (diffMinutes > 0) {
                          const hours = Math.floor(diffMinutes / 60);
                          const mins = diffMinutes % 60;
                          const label = hours > 0 ? `${hours}h${mins}min` : `${mins}min`;
                          return <span className="text-orange-600">⏰ Commencé {label} en retard</span>;
                        } else {
                          const absDiff = Math.abs(diffMinutes);
                          const hours = Math.floor(absDiff / 60);
                          const mins = absDiff % 60;
                          const label = hours > 0 ? `${hours}h${mins}min` : `${mins}min`;
                          return <span className="text-green-600">⚡ Commencé {label} en avance</span>;
                        }
                      })()}
                    </div>
                  )}
                  
                  {/* Save actual times button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={handleSaveActualTimes}
                    disabled={isPending || (!actualStartTime && !actualEndTime)}
                  >
                    {isPending && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                    Enregistrer temps réels
                  </Button>
                </div>
              )}
              
              <Separator />
              
              {/* Save button */}
              <Button
                className="w-full"
                onClick={handleUpdateSchedule}
                disabled={isPending || !scheduleDate || !scheduleStartTime}
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Clock className="h-4 w-4 mr-2" />
                Enregistrer les horaires planifiés
              </Button>
            </div>
          </TabsContent>

          {/* Details Tab (for routines) */}
          <TabsContent value="details" className="space-y-6 mt-4">
            {isRoutine && (
              <>
                {/* Mood Before */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Smile className="h-4 w-4" />
                    Humeur avant
                  </Label>
                  <div className="flex justify-between gap-2">
                    {moodEmojis.map((mood) => (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() => setMoodBefore(mood.value)}
                        className={cn(
                          'text-2xl p-2 rounded-lg transition-all hover:scale-110',
                          moodBefore === mood.value 
                            ? 'bg-primary/10 ring-2 ring-primary' 
                            : 'hover:bg-muted'
                        )}
                        title={mood.label}
                      >
                        {mood.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood After */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Smile className="h-4 w-4" />
                    Humeur après
                  </Label>
                  <div className="flex justify-between gap-2">
                    {moodEmojis.map((mood) => (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() => setMoodAfter(mood.value)}
                        className={cn(
                          'text-2xl p-2 rounded-lg transition-all hover:scale-110',
                          moodAfter === mood.value 
                            ? 'bg-primary/10 ring-2 ring-primary' 
                            : 'hover:bg-muted'
                        )}
                        title={mood.label}
                      >
                        {mood.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Energy Level */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Niveau d&apos;énergie: {energyLevel}/10 
                    <span className="text-muted-foreground text-sm">
                      ({energyLabels[energyLevel]})
                    </span>
                  </Label>
                  <Slider
                    value={[energyLevel]}
                    onValueChange={([value]) => setEnergyLevel(value)}
                    min={1}
                    max={10}
                    step={1}
                    className="py-2"
                  />
                </div>

                <Separator />

                {/* Actual Value (if template has target) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Valeur réalisée (optionnel)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ex: 30 (minutes), 5 (km), etc."
                    value={actualValue}
                    onChange={(e) => setActualValue(e.target.value)}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes (optionnel)
                  </Label>
                  <Textarea
                    placeholder="Comment s'est passée cette routine?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="hover:bg-yellow-50 hover:border-yellow-500"
                    onClick={() => handleCompleteRoutine('partial')}
                    disabled={isPending}
                  >
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Partiel
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleCompleteRoutine('completed')}
                    disabled={isPending}
                  >
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Terminé
                  </Button>
                </div>
              </>
            )}

            {isTask && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Les détails de suivi sont disponibles pour les routines.</p>
                <p className="text-sm mt-2">
                  Utilisez l&apos;onglet &quot;Action rapide&quot; pour les tâches.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Skip Tab (for routines) */}
          <TabsContent value="skip" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Pourquoi sautez-vous cette routine?</Label>
              <Textarea
                placeholder="Ex: Pas le temps aujourd'hui, pas en forme, imprévu..."
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setActiveTab('quick')}
              >
                Retour
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleSkipRoutine}
                disabled={isPending || !skipReason.trim()}
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <SkipForward className="h-4 w-4 mr-2" />
                Confirmer le skip
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
