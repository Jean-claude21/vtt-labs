/**
 * Routines Client Component
 * 
 * Client-side state management for routines CRUD operations.
 * 
 * @module lifeos/pages/routines
 */
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RoutinesList } from '@/features/lifeos/components/routines/routines-list';
import { RoutineForm } from '@/features/lifeos/components/routines/routine-form';
import {
  createRoutine,
  updateRoutine,
  deleteRoutine,
  toggleRoutineActive,
} from '@/features/lifeos/actions/routines.actions';
import type { RoutineTemplate, RecurrenceConfig } from '@/features/lifeos/schema/routines.schema';
import type { Domain } from '@/features/lifeos/schema/domains.schema';

interface RoutinesClientProps {
  initialRoutines: (RoutineTemplate & { 
    streak: { current_streak: number; longest_streak: number } | null 
  })[];
  initialDomains: Domain[];
  error: string | null;
}

export function RoutinesClient({
  initialRoutines,
  initialDomains,
  error,
}: RoutinesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Local state for optimistic updates
  const [routines, setRoutines] = useState(initialRoutines);
  const [domains] = useState(initialDomains);
  
  // Form dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show error toast if initial load failed
  if (error) {
    toast.error('Erreur de chargement', {
      description: error,
    });
  }

  // Open form for new routine
  const handleAdd = () => {
    setEditingRoutine(null);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleEdit = (routine: RoutineTemplate) => {
    setEditingRoutine(routine);
    setIsFormOpen(true);
  };

  // Handle form submission (create or update)
  const handleFormSubmit = async (data: {
    name: string;
    description?: string;
    domain_id?: string | null;
    category_moment?: 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' | null;
    category_type?: 'professional' | 'personal' | 'spiritual' | 'health' | 'learning' | 'leisure' | 'energy' | null;
    priority: 'high' | 'medium' | 'low';
    is_flexible: boolean;
    constraints: Record<string, unknown>;
    recurrence_config: RecurrenceConfig;
    recurrence_rule: string;
  }) => {
    setIsSubmitting(true);

    try {
      if (editingRoutine) {
        // Update existing routine
        const result = await updateRoutine({
          id: editingRoutine.id,
          ...data,
        });

        if (result.error) {
          toast.error('Erreur', { description: result.error });
          return;
        }

        // Optimistic update
        setRoutines((prev) =>
          prev.map((r) =>
            r.id === editingRoutine.id
              ? { ...r, ...result.data, streak: r.streak }
              : r
          )
        );

        toast.success('Routine mise à jour');
      } else {
        // Create new routine
        const result = await createRoutine(data);

        if (result.error) {
          toast.error('Erreur', { description: result.error });
          return;
        }

        // Optimistic update
        if (result.data) {
          setRoutines((prev) => [
            { ...result.data!, streak: null },
            ...prev,
          ]);
        }

        toast.success('Routine créée');
      }

      setIsFormOpen(false);
      setEditingRoutine(null);
      
      // Refresh server data
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (routineId: string) => {
    // Optimistic update
    const previousRoutines = routines;
    setRoutines((prev) => prev.filter((r) => r.id !== routineId));

    const result = await deleteRoutine(routineId);

    if (result.error) {
      // Revert on error
      setRoutines(previousRoutines);
      toast.error('Erreur', { description: result.error });
      return;
    }

    toast.success('Routine supprimée');
    
    // Refresh server data
    startTransition(() => {
      router.refresh();
    });
  };

  // Handle toggle active
  const handleToggleActive = async (routineId: string) => {
    // Optimistic update
    const previousRoutines = routines;
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routineId ? { ...r, is_active: !r.is_active } : r
      )
    );

    const result = await toggleRoutineActive(routineId);

    if (result.error) {
      // Revert on error
      setRoutines(previousRoutines);
      toast.error('Erreur', { description: result.error });
      return;
    }

    const routine = routines.find((r) => r.id === routineId);
    toast.success(
      routine?.is_active ? 'Routine mise en pause' : 'Routine réactivée'
    );
    
    // Refresh server data
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <>
      <RoutinesList
        routines={routines}
        domains={domains}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        isLoading={isPending}
      />

      <RoutineForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingRoutine(null);
        }}
        routine={editingRoutine}
        domains={domains}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
