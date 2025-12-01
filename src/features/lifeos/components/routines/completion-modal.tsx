/**
 * LifeOS Completion Modal Component
 * 
 * Modal for completing a routine with actual value, mood, and energy level inputs.
 * Used when a routine has a target value that needs to be tracked.
 * 
 * @module lifeos/components/routines/completion-modal
 */
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Check, 
  X, 
  Loader2,
  Smile,
  Meh,
  Frown,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routineName: string;
  targetValue?: number;
  targetUnit?: string;
  onSubmit: (
    actualValue?: number,
    mood?: number,
    energyLevel?: number,
    notes?: string
  ) => Promise<void>;
  onSkip: (reason?: string) => Promise<void>;
  isLoading?: boolean;
}

type MoodLevel = 1 | 2 | 3 | 4 | 5;
type EnergyLevel = 1 | 2 | 3 | 4 | 5;

const moodOptions: { value: MoodLevel; icon: typeof Smile; label: string; color: string }[] = [
  { value: 1, icon: Frown, label: 'Très mal', color: 'text-red-500' },
  { value: 2, icon: Frown, label: 'Mal', color: 'text-orange-500' },
  { value: 3, icon: Meh, label: 'Neutre', color: 'text-yellow-500' },
  { value: 4, icon: Smile, label: 'Bien', color: 'text-lime-500' },
  { value: 5, icon: Smile, label: 'Très bien', color: 'text-green-500' },
];

const energyOptions: { value: EnergyLevel; icon: typeof Battery; label: string; color: string }[] = [
  { value: 1, icon: BatteryLow, label: 'Épuisé', color: 'text-red-500' },
  { value: 2, icon: BatteryLow, label: 'Fatigué', color: 'text-orange-500' },
  { value: 3, icon: BatteryMedium, label: 'Normal', color: 'text-yellow-500' },
  { value: 4, icon: BatteryMedium, label: 'Énergique', color: 'text-lime-500' },
  { value: 5, icon: BatteryFull, label: 'Plein d\'énergie', color: 'text-green-500' },
];

export function CompletionModal({
  open,
  onOpenChange,
  routineName,
  targetValue,
  targetUnit = '',
  onSubmit,
  onSkip,
  isLoading = false,
}: CompletionModalProps) {
  const [actualValue, setActualValue] = useState<string>(
    targetValue?.toString() ?? ''
  );
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(null);
  const [notes, setNotes] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [showSkipForm, setShowSkipForm] = useState(false);

  const handleSubmit = async () => {
    const value = actualValue ? parseFloat(actualValue) : undefined;
    await onSubmit(
      value,
      mood ?? undefined,
      energyLevel ?? undefined,
      notes || undefined
    );
  };

  const handleSkip = async () => {
    await onSkip(skipReason || undefined);
    onOpenChange(false);
  };

  // Calculate completion percentage for preview
  const completionPercent = targetValue && actualValue
    ? Math.min(100, Math.round((parseFloat(actualValue) / targetValue) * 100))
    : 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {showSkipForm ? 'Sauter cette routine' : 'Compléter la routine'}
          </DialogTitle>
          <DialogDescription>
            {routineName}
          </DialogDescription>
        </DialogHeader>

        {showSkipForm ? (
          // Skip form
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="skipReason">Raison (optionnel)</Label>
              <Textarea
                id="skipReason"
                placeholder="Pourquoi sautez-vous cette routine ?"
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
        ) : (
          // Completion form
          <div className="space-y-6 py-4">
            {/* Actual value input */}
            {targetValue !== undefined && (
              <div className="space-y-2">
                <Label htmlFor="actualValue">
                  Valeur réalisée {targetUnit && `(${targetUnit})`}
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="actualValue"
                    type="number"
                    step="any"
                    min="0"
                    placeholder={targetValue.toString()}
                    value={actualValue}
                    onChange={(e) => setActualValue(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">
                    / {targetValue} {targetUnit}
                  </span>
                </div>
                {/* Progress preview */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        'h-full transition-all duration-300',
                        completionPercent >= 100 ? 'bg-green-500' :
                        completionPercent >= 75 ? 'bg-lime-500' :
                        completionPercent >= 50 ? 'bg-yellow-500' :
                        'bg-orange-500'
                      )}
                      style={{ width: `${Math.min(100, completionPercent)}%` }}
                    />
                  </div>
                  <span className={cn(
                    'text-sm font-medium',
                    completionPercent >= 100 ? 'text-green-600' :
                    completionPercent >= 75 ? 'text-lime-600' :
                    completionPercent >= 50 ? 'text-yellow-600' :
                    'text-orange-600'
                  )}>
                    {completionPercent}%
                  </span>
                </div>
              </div>
            )}

            {/* Mood selector */}
            <div className="space-y-2">
              <Label>Humeur (optionnel)</Label>
              <div className="flex items-center justify-between gap-2">
                {moodOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMood(mood === option.value ? null : option.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                        mood === option.value
                          ? 'bg-gray-100 dark:bg-gray-800 ring-2 ring-primary'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      )}
                    >
                      <Icon className={cn('h-6 w-6', option.color)} />
                      <span className="text-[10px] text-muted-foreground">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Energy level selector */}
            <div className="space-y-2">
              <Label>Énergie (optionnel)</Label>
              <div className="flex items-center justify-between gap-2">
                {energyOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEnergyLevel(energyLevel === option.value ? null : option.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                        energyLevel === option.value
                          ? 'bg-gray-100 dark:bg-gray-800 ring-2 ring-primary'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      )}
                    >
                      <Icon className={cn('h-6 w-6', option.color)} />
                      <span className="text-[10px] text-muted-foreground">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Commentaires sur cette session..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {showSkipForm ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowSkipForm(false)}
                disabled={isLoading}
              >
                Retour
              </Button>
              <Button
                variant="destructive"
                onClick={handleSkip}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Confirmer sauter
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setShowSkipForm(true)}
                disabled={isLoading}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Sauter
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Compléter
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
