/**
 * Generate Plan Button Component
 * 
 * Button to trigger AI plan generation for a date.
 * Shows configuration dialog for wake/sleep times before generating.
 * 
 * @module lifeos/components/planning
 */
'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, Loader2, Clock, Moon, Sun } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface PlanPreferences {
  wakeTime: string;
  sleepTime: string;
  lunchBreakStart: string;
  lunchBreakDuration: number;
}

interface GeneratePlanButtonProps extends Omit<ButtonProps, 'onClick'> {
  date: Date;
  hasExistingPlan?: boolean;
  isStale?: boolean;
  onGenerate: (regenerate: boolean, preferences?: PlanPreferences) => Promise<void>;
}

export function GeneratePlanButton({
  date,
  hasExistingPlan = false,
  isStale = false,
  onGenerate,
  ...buttonProps
}: GeneratePlanButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Preferences state
  const [preferences, setPreferences] = useState<PlanPreferences>({
    wakeTime: '07:00',
    sleepTime: '22:00',
    lunchBreakStart: '12:00',
    lunchBreakDuration: 60,
  });

  const handleClick = () => {
    if (hasExistingPlan && !isStale) {
      // Show confirmation for regeneration
      setShowConfirm(true);
    } else {
      // Show configuration dialog
      setShowConfig(true);
    }
  };

  const handleGenerate = async (regenerate: boolean) => {
    setIsLoading(true);
    try {
      await onGenerate(regenerate, preferences);
    } finally {
      setIsLoading(false);
      setShowConfig(false);
      setShowConfirm(false);
    }
  };

  const formatDate = (d: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(d);
    targetDate.setHours(0, 0, 0, 0);
    
    if (targetDate.getTime() === today.getTime()) {
      return "aujourd'hui";
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (targetDate.getTime() === tomorrow.getTime()) {
      return 'demain';
    }
    
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        {...buttonProps}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Génération...
          </>
        ) : hasExistingPlan && !isStale ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regénérer
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            {isStale ? 'Actualiser le planning' : 'Générer le planning'}
          </>
        )}
      </Button>

      {/* Configuration Dialog */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Configurer le planning
            </DialogTitle>
            <DialogDescription>
              Définissez vos préférences pour {formatDate(date)}.
              L&apos;IA optimisera votre journée en fonction.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Wake Time */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="wakeTime" className="text-right flex items-center justify-end gap-1">
                <Sun className="h-4 w-4 text-yellow-500" />
                Réveil
              </Label>
              <Input
                id="wakeTime"
                type="time"
                value={preferences.wakeTime}
                onChange={(e) => setPreferences(p => ({ ...p, wakeTime: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            {/* Sleep Time */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sleepTime" className="text-right flex items-center justify-end gap-1">
                <Moon className="h-4 w-4 text-blue-500" />
                Coucher
              </Label>
              <Input
                id="sleepTime"
                type="time"
                value={preferences.sleepTime}
                onChange={(e) => setPreferences(p => ({ ...p, sleepTime: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            {/* Lunch Break */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lunchBreak" className="text-right flex items-center justify-end gap-1">
                <Clock className="h-4 w-4 text-green-500" />
                Déjeuner
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="lunchBreak"
                  type="time"
                  value={preferences.lunchBreakStart}
                  onChange={(e) => setPreferences(p => ({ ...p, lunchBreakStart: e.target.value }))}
                  className="flex-1"
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={15}
                    max={120}
                    step={15}
                    value={preferences.lunchBreakDuration}
                    onChange={(e) => setPreferences(p => ({ ...p, lunchBreakDuration: parseInt(e.target.value) || 60 }))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfig(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button onClick={() => handleGenerate(hasExistingPlan)} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {hasExistingPlan ? 'Regénérer' : 'Générer'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regeneration Confirmation */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regénérer le planning ?</AlertDialogTitle>
            <AlertDialogDescription>
              Un planning existe déjà pour {formatDate(date)}. 
              En regénérant, vous perdrez les ajustements manuels effectués.
              <br /><br />
              Les routines et tâches complétées seront conservées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirm(false);
                setShowConfig(true);
              }}
              disabled={isLoading}
            >
              Configurer et regénérer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
