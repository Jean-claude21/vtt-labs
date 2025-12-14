/**
 * Planning Dashboard Client Component
 * 
 * Main dashboard with timeline, day navigation, and plan generation.
 * 
 * @module lifeos/planning-dashboard
 */
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  Sparkles,
  FolderKanban, 
  RotateCcw, 
  ListTodo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DayNavigator } from '@/features/lifeos/components/planning/day-navigator';
import { GeneratePlanButton, type PlanPreferences } from '@/features/lifeos/components/planning/generate-plan-button';
import { TimelineView } from '@/features/lifeos/components/planning/timeline-view';
import { 
  generatePlan, 
  getPlanForDate,
  getPlanSlotsWithDetails,
} from '@/features/lifeos/actions/planning.actions';
import { 
  completeRoutineInstance, 
  skipRoutineInstance,
} from '@/features/lifeos/actions/routines.actions';
import { updateTask } from '@/features/lifeos/actions/tasks.actions';
import type { GeneratedPlan, PlanSlot } from '@/features/lifeos/schema/planning.schema';
import type { RoutineInstance, RoutineTemplate } from '@/features/lifeos/schema/routines.schema';
import type { Task } from '@/features/lifeos/schema/tasks.schema';
import type { Domain } from '@/features/lifeos/schema/domains.schema';

interface PlanningDashboardProps {
  initialDate: string;
  initialPlan: (GeneratedPlan & { slots: PlanSlot[] }) | null;
  error: string | null;
}

type SlotWithDetails = PlanSlot & {
  routineInstance?: (RoutineInstance & { 
    template: RoutineTemplate & { 
      streak?: { current_streak: number; longest_streak: number } | null 
    }; 
    domain?: Domain 
  }) | null;
  task?: (Task & { domain?: Domain }) | null;
};

const quickLinks = [
  {
    title: 'Domaines',
    description: 'Configurer vos domaines de vie',
    href: '/app/lifeos/domains',
    icon: FolderKanban,
    color: 'text-purple-500',
  },
  {
    title: 'Routines',
    description: 'Gérer vos habitudes',
    href: '/app/lifeos/routines',
    icon: RotateCcw,
    color: 'text-green-500',
  },
  {
    title: 'Tâches',
    description: 'Actions ponctuelles',
    href: '/app/lifeos/tasks',
    icon: ListTodo,
    color: 'text-blue-500',
  },
];

export function PlanningDashboard({
  initialDate,
  initialPlan,
  error,
}: PlanningDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date(initialDate));
  const [plan, setPlan] = useState(initialPlan);
  const [slots, setSlots] = useState<SlotWithDetails[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Show error if initial load failed
  if (error) {
    toast.error('Erreur de chargement', { description: error });
  }

  // Load slots with details when plan changes
  const loadSlotsWithDetails = async (planId: string) => {
    setIsLoadingSlots(true);
    try {
      const result = await getPlanSlotsWithDetails(planId);
      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }
      setSlots(result.data ?? []);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Handle date change
  const handleDateChange = async (newDate: Date) => {
    setCurrentDate(newDate);
    const dateStr = newDate.toISOString().split('T')[0];
    
    // Fetch plan for new date
    startTransition(async () => {
      const result = await getPlanForDate(dateStr);
      setPlan(result.data ?? null);
      
      if (result.data) {
        await loadSlotsWithDetails(result.data.id);
      } else {
        setSlots([]);
      }
    });
  };

  // Handle plan generation
  const handleGeneratePlan = async (regenerate: boolean, preferences?: PlanPreferences) => {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    console.log('[Dashboard] handleGeneratePlan called with:', { dateStr, regenerate, preferences });
    
    try {
      const result = await generatePlan(dateStr, regenerate, preferences);
      
      console.log('[Dashboard] generatePlan result:', result);
      
      if (result.error) {
        toast.error('Erreur de génération', { description: result.error });
        return;
      }
      
      setPlan(result.data ?? null);
      
      if (result.data) {
        await loadSlotsWithDetails(result.data.id);
        toast.success('Planning généré !', {
          description: `${result.data.slots.length} créneaux planifiés`,
        });
      }
      
      // Refresh server data
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error('Erreur inattendue');
    }
  };

  // Handle routine instance completion
  const handleCompleteRoutine = async (
    instanceId: string,
    actualValue?: number,
    mood?: number,
    energyLevel?: number,
    notes?: string
  ) => {
    try {
      const result = await completeRoutineInstance({
        id: instanceId,
        actual_value: actualValue,
        mood_after: mood,
        energy_level: energyLevel,
        notes
      });
      
      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }
      
      // Update local state
      setSlots(prev => prev.map(slot => {
        if (slot.routineInstance?.id === instanceId) {
          return {
            ...slot,
            routineInstance: result.data ? {
              ...slot.routineInstance,
              ...result.data,
            } : slot.routineInstance,
          };
        }
        return slot;
      }));
      
      toast.success('Routine complétée !', {
        description: result.data?.completion_score 
          ? `Score: ${result.data.completion_score}%` 
          : undefined,
      });
    } catch {
      toast.error('Erreur inattendue');
    }
  };

  // Handle routine instance skip
  const handleSkipRoutine = async (instanceId: string, reason?: string) => {
    try {
      const result = await skipRoutineInstance({
        id: instanceId,
        skip_reason: reason || 'Non spécifié'
      });
      
      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }
      
      // Update local state
      setSlots(prev => prev.map(slot => {
        if (slot.routineInstance?.id === instanceId) {
          return {
            ...slot,
            routineInstance: result.data ? {
              ...slot.routineInstance,
              ...result.data,
            } : slot.routineInstance,
          };
        }
        return slot;
      }));
      
      toast.info('Routine passée');
    } catch {
      toast.error('Erreur inattendue');
    }
  };

  // Handle task completion
  const handleCompleteTask = async (taskId: string) => {
    try {
      const result = await updateTask({ id: taskId, status: 'done' });
      
      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }
      
      // Update local state
      setSlots(prev => prev.map(slot => {
        if (slot.task?.id === taskId) {
          return {
            ...slot,
            task: result.data ? {
              ...slot.task,
              ...result.data,
            } : slot.task,
          };
        }
        return slot;
      }));
      
      toast.success('Tâche complétée !');
    } catch {
      toast.error('Erreur inattendue');
    }
  };

  // Handle task skip (cancel)
  const handleSkipTask = async (taskId: string) => {
    try {
      const result = await updateTask({ id: taskId, status: 'cancelled' });
      
      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }
      
      // Update local state
      setSlots(prev => prev.map(slot => {
        if (slot.task?.id === taskId) {
          return {
            ...slot,
            task: result.data ? {
              ...slot.task,
              ...result.data,
            } : slot.task,
          };
        }
        return slot;
      }));
      
      toast.info('Tâche annulée');
    } catch {
      toast.error('Erreur inattendue');
    }
  };

  // Format date for display
  const formatDateDisplay = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    
    if (target.getTime() === today.getTime()) {
      return "Aujourd'hui";
    }
    
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-teal-500" />
            LifeOS
          </h1>
          <p className="text-muted-foreground">
            Votre assistant intelligent de planification
          </p>
        </div>
        <div className="flex gap-2">
          <GeneratePlanButton
            date={currentDate}
            hasExistingPlan={!!plan}
            isStale={plan?.status === 'draft'}
            onGenerate={handleGeneratePlan}
            className="bg-teal-600 hover:bg-teal-700"
          />
        </div>
      </div>

      {/* Day Navigation */}
      <Card>
        <CardContent className="py-4">
          <DayNavigator
            currentDate={currentDate}
            onDateChange={handleDateChange}
          />
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline (2/3) */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                Planning du {formatDateDisplay(currentDate)}
              </CardTitle>
              {plan && (
                <CardDescription>
                  {slots.length} créneau{slots.length !== 1 ? 'x' : ''} planifié{slots.length !== 1 ? 's' : ''}
                  {plan.status === 'draft' && (
                    <span className="text-orange-500 ml-2">
                      • Modifications en attente
                    </span>
                  )}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isPending || isLoadingSlots ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : !plan ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Aucun planning pour cette journée
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    Générez un planning intelligent basé sur vos routines et tâches.
                  </p>
                  <GeneratePlanButton
                    date={currentDate}
                    hasExistingPlan={false}
                    onGenerate={handleGeneratePlan}
                  />
                </div>
              ) : (
                <div className="overflow-auto max-h-[600px]">
                  <TimelineView
                    slots={slots}
                    date={currentDate}
                    onCompleteRoutine={handleCompleteRoutine}
                    onSkipRoutine={handleSkipRoutine}
                    onCompleteTask={handleCompleteTask}
                    onSkipTask={handleSkipTask}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-4">
          {/* Quick links */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Modules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Button
                    key={link.href}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3"
                    asChild
                  >
                    <Link href={link.href}>
                      <Icon className={`h-5 w-5 mr-3 ${link.color}`} />
                      <div className="text-left">
                        <div className="font-medium">{link.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {link.description}
                        </div>
                      </div>
                    </Link>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick stats placeholder */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">—</p>
                  <p className="text-xs text-muted-foreground">Routines du jour</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">—</p>
                  <p className="text-xs text-muted-foreground">Tâches actives</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">—</p>
                  <p className="text-xs text-muted-foreground">Séries actives</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">—%</p>
                  <p className="text-xs text-muted-foreground">Taux de complétion</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info about AI */}
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Planification intelligente</AlertTitle>
            <AlertDescription className="text-xs">
              L&apos;IA prend en compte vos contraintes, priorités et domaines de vie 
              pour créer un planning optimal.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
