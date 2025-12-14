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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/features/lifeos/schema/calendar.schema';
import { 
  completeRoutineInstance, 
  skipRoutineInstance,
  partialRoutineInstance,
} from '@/features/lifeos/actions/routines.actions';
import { 
  completeTask, 
  updateTaskStatus,
} from '@/features/lifeos/actions/tasks.actions';

interface EventTrackingDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated?: () => void;
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

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setMoodBefore(3);
      setMoodAfter(3);
      setEnergyLevel(5);
      setNotes('');
      setActualValue('');
      setSkipReason('');
      setActiveTab('quick');
    }
  }, [open]);

  if (!event) return null;

  const isRoutine = event.type === 'routine';
  const isTask = event.type === 'task';

  // Format time display
  const formatTime = (date: Date) => {
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">Action rapide</TabsTrigger>
            <TabsTrigger value="details">Détails</TabsTrigger>
          </TabsList>

          {/* Quick Actions Tab */}
          <TabsContent value="quick" className="space-y-4 mt-4">
            {isRoutine && (
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
                  onClick={() => handleTaskStatus('in_progress')}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                  ) : (
                    <Timer className="h-6 w-6 mb-2 text-blue-600" />
                  )}
                  <span className="text-sm font-medium">En cours</span>
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
                    Niveau d'énergie: {energyLevel}/10 
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
