/**
 * Generate Plan Button Component
 * 
 * Button to trigger AI plan generation for a date.
 * 
 * @module lifeos/components/planning
 */
'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
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

interface GeneratePlanButtonProps extends Omit<ButtonProps, 'onClick'> {
  date: Date;
  hasExistingPlan?: boolean;
  isStale?: boolean;
  onGenerate: (regenerate: boolean) => Promise<void>;
}

export function GeneratePlanButton({
  date,
  hasExistingPlan = false,
  isStale = false,
  onGenerate,
  ...buttonProps
}: GeneratePlanButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = async () => {
    if (hasExistingPlan && !isStale) {
      // Show confirmation for regeneration
      setShowConfirm(true);
    } else {
      // Generate directly
      await handleGenerate(false);
    }
  };

  const handleGenerate = async (regenerate: boolean) => {
    setIsLoading(true);
    try {
      await onGenerate(regenerate);
    } finally {
      setIsLoading(false);
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
              onClick={() => handleGenerate(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                'Regénérer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
