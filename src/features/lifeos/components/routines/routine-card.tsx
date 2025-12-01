// @ts-nocheck
/**
 * Routine Card Component
 * 
 * Displays a routine template with constraints, recurrence info, and streak.
 * 
 * @module lifeos/components/routines
 */
'use client';

import { useState } from 'react';
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Play, 
  Pause,
  Clock,
  Repeat,
  Flame,
  GripVertical,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { RoutineTemplate, RoutineConstraints, RecurrenceConfig } from '../../schema/routines.schema';
import type { Domain } from '../../schema/domains.schema';

interface RoutineCardProps {
  routine: RoutineTemplate & { 
    streak?: { current_streak: number; longest_streak: number } | null 
  };
  domain?: Domain | null;
  onEdit?: (routine: RoutineTemplate) => void;
  onDelete?: (routineId: string) => void;
  onToggleActive?: (routineId: string) => void;
  draggable?: boolean;
}

// Helper to format duration
function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
}

// Helper to format time slot
function formatTimeSlot(slot: string | null | undefined): string {
  if (!slot) return '';
  const slots: Record<string, string> = {
    morning: '🌅 Matin',
    afternoon: '☀️ Après-midi',
    evening: '🌆 Soir',
    night: '🌙 Nuit',
  };
  return slots[slot] || slot;
}

// Helper to format recurrence
function formatRecurrence(config: RecurrenceConfig | null | undefined): string {
  if (!config) return 'Quotidien';
  
  switch (config.type) {
    case 'daily':
      if (config.excludeWeekends) return 'Jours ouvrés';
      if (config.interval && config.interval > 1) return `Tous les ${config.interval} jours`;
      return 'Quotidien';
      
    case 'weekly':
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const days = config.daysOfWeek.map(d => dayNames[d]).join(', ');
        return days;
      }
      if (config.interval && config.interval > 1) return `Toutes les ${config.interval} sem.`;
      return 'Hebdomadaire';
      
    case 'monthly':
      if (config.daysOfMonth && config.daysOfMonth.length > 0) {
        return `Le ${config.daysOfMonth.join(', ')} du mois`;
      }
      return 'Mensuel';
      
    case 'custom':
      return 'Personnalisé';
      
    default:
      return 'Quotidien';
  }
}

// Priority badge colors
const priorityColors: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const priorityLabels: Record<string, string> = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

export function RoutineCard({
  routine,
  domain,
  onEdit,
  onDelete,
  onToggleActive,
  draggable = false,
}: RoutineCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const constraints = routine.constraints as RoutineConstraints | null;
  const recurrenceConfig = routine.recurrence_config as RecurrenceConfig | null;

  return (
    <>
      <Card 
        className={`group relative transition-all duration-200 hover:shadow-md ${
          !routine.is_active ? 'opacity-60' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              {draggable && (
                <button 
                  className="mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity active:cursor-grabbing"
                  aria-label="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base truncate">
                    {routine.name}
                  </CardTitle>
                  {!routine.is_active && (
                    <Badge variant="outline" className="text-xs">
                      Pause
                    </Badge>
                  )}
                </div>
                {routine.description && (
                  <CardDescription className="line-clamp-2">
                    {routine.description}
                  </CardDescription>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(routine)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive?.(routine.id)}>
                  {routine.is_active ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Mettre en pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Réactiver
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Domain & Priority */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {domain && (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ 
                  borderColor: domain.color,
                  color: domain.color,
                  backgroundColor: `${domain.color}10`,
                }}
              >
                {domain.icon} {domain.name}
              </Badge>
            )}
            <Badge 
              variant="outline" 
              className={`text-xs ${priorityColors[routine.priority]}`}
            >
              {priorityLabels[routine.priority]}
            </Badge>
            {routine.category_moment && (
              <Badge variant="secondary" className="text-xs">
                {routine.category_moment === 'morning' && '🌅 Matin'}
                {routine.category_moment === 'noon' && '☀️ Midi'}
                {routine.category_moment === 'afternoon' && '🌤️ Après-midi'}
                {routine.category_moment === 'evening' && '🌆 Soir'}
                {routine.category_moment === 'night' && '🌙 Nuit'}
              </Badge>
            )}
          </div>

          {/* Constraints */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {constraints?.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {typeof constraints.duration === 'number' 
                    ? formatDuration(constraints.duration)
                    : formatDuration(constraints.duration.minutes)
                  }
                </span>
              </div>
            )}
            
            {constraints?.timeSlot && (
              <div className="flex items-center gap-1">
                <span>
                  {typeof constraints.timeSlot === 'string'
                    ? formatTimeSlot(constraints.timeSlot)
                    : `${constraints.timeSlot.startTime} - ${constraints.timeSlot.endTime}`
                  }
                </span>
              </div>
            )}
            
            {constraints?.targetValue && (
              <div className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                <span>
                  {typeof constraints.targetValue === 'number'
                    ? constraints.targetValue
                    : `${constraints.targetValue.value} ${constraints.targetValue.unit || ''}`
                  }
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Repeat className="h-3.5 w-3.5" />
              <span>{formatRecurrence(recurrenceConfig)}</span>
            </div>
          </div>

          {/* Streak */}
          {routine.streak && routine.streak.current_streak > 0 && (
            <div className="mt-3 pt-3 border-t flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">
                {routine.streak.current_streak} jour{routine.streak.current_streak > 1 ? 's' : ''} de suite
              </span>
              {routine.streak.longest_streak > routine.streak.current_streak && (
                <span className="text-xs text-muted-foreground">
                  (record: {routine.streak.longest_streak})
                </span>
              )}
            </div>
          )}

          {/* Flexible indicator */}
          {routine.is_flexible && (
            <div className="mt-2 text-xs text-muted-foreground">
              ↔️ Horaire flexible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette routine ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La routine &quot;{routine.name}&quot; sera 
              définitivement supprimée ainsi que son historique de séries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(routine.id);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


