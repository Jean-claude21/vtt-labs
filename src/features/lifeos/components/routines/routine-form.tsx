// @ts-nocheck
/**
 * Routine Form Component
 * 
 * Dialog form for creating and editing routine templates.
 * Includes constraints configuration and recurrence settings.
 * 
 * @module lifeos/components/routines
 */
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RoutineTemplate, RecurrenceConfig, RoutineConstraints } from '../../schema/routines.schema';
import type { Domain } from '../../schema/domains.schema';

// Helper to generate RRULE from recurrence config
function generateRRule(config: RecurrenceConfig): string {
  const parts: string[] = ['RRULE:FREQ='];
  
  switch (config.type) {
    case 'daily':
      parts[0] += 'DAILY';
      if (config.excludeWeekends) {
        parts.push('BYDAY=MO,TU,WE,TH,FR');
      }
      break;
    case 'weekly':
      parts[0] += 'WEEKLY';
      if (config.daysOfWeek?.length) {
        const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        parts.push(`BYDAY=${config.daysOfWeek.map(d => dayMap[d]).join(',')}`);
      }
      break;
    case 'monthly':
      parts[0] += 'MONTHLY';
      if (config.daysOfMonth?.length) {
        parts.push(`BYMONTHDAY=${config.daysOfMonth.join(',')}`);
      }
      break;
    default:
      parts[0] += 'DAILY';
  }
  
  if (config.interval && config.interval > 1) {
    parts.push(`INTERVAL=${config.interval}`);
  }
  
  return parts.join(';');
}

// Form schema - aligned with backend schema
const routineFormSchema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caractères)').max(100),
  description: z.string().max(500).optional(),
  domain_id: z.string().uuid().optional().nullable(),
  category_moment: z.enum(['morning', 'noon', 'afternoon', 'evening', 'night']).optional().nullable(),
  category_type: z.enum(['professional', 'personal', 'spiritual', 'health', 'learning', 'leisure', 'energy']).optional().nullable(),
  priority: z.enum(['high', 'medium', 'low']),
  is_flexible: z.boolean(),
  // Constraints
  duration_minutes: z.number().min(5).max(480).optional(),
  time_start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  time_end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  targetValue: z.number().min(1).optional(),
  targetUnit: z.string().max(20).optional(),
  // Recurrence
  recurrence_type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  interval: z.number().min(1).max(30).optional(),
  excludeWeekends: z.boolean().optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  daysOfMonth: z.array(z.number().min(1).max(31)).optional(),
});

type RoutineFormValues = z.infer<typeof routineFormSchema>;

interface RoutineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine?: RoutineTemplate | null;
  domains: Domain[];
  onSubmit: (data: {
    name: string;
    description?: string;
    domain_id?: string | null;
    category_moment?: 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' | null;
    category_type?: 'professional' | 'personal' | 'spiritual' | 'health' | 'learning' | 'leisure' | 'energy' | null;
    priority: 'high' | 'medium' | 'low';
    is_flexible: boolean;
    constraints: RoutineConstraints;
    recurrence_config: RecurrenceConfig;
    recurrence_rule: string;
  }) => void;
  isSubmitting?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dim' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
];

export function RoutineForm({
  open,
  onOpenChange,
  routine,
  domains,
  onSubmit,
  isSubmitting = false,
}: RoutineFormProps) {
  const [activeTab, setActiveTab] = useState('general');
  
  const isEditing = !!routine;

  // Parse existing constraints and recurrence config
  const existingConstraints = routine?.constraints as RoutineConstraints | null;
  const existingRecurrence = routine?.recurrence_config as RecurrenceConfig | null;

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: {
      name: '',
      description: '',
      domain_id: null,
      category_moment: null,
      category_type: null,
      priority: 'medium',
      is_flexible: true,
      duration_minutes: undefined,
      time_start: undefined,
      time_end: undefined,
      targetValue: undefined,
      targetUnit: '',
      recurrence_type: 'daily',
      interval: 1,
      excludeWeekends: false,
      daysOfWeek: [],
      daysOfMonth: [],
    },
  });

  // Reset form when routine changes
  useEffect(() => {
    if (routine) {
      form.reset({
        name: routine.name,
        description: routine.description ?? '',
        domain_id: routine.domain_id ?? null,
        category_moment: routine.category_moment ?? null,
        category_type: routine.category_type ?? null,
        priority: routine.priority,
        is_flexible: routine.is_flexible,
        duration_minutes: existingConstraints?.duration?.minutes,
        time_start: existingConstraints?.timeSlot?.startTime,
        time_end: existingConstraints?.timeSlot?.endTime,
        targetValue: existingConstraints?.targetValue?.value,
        targetUnit: existingConstraints?.targetValue?.unit ?? '',
        recurrence_type: existingRecurrence?.type ?? 'daily',
        interval: existingRecurrence?.interval ?? 1,
        excludeWeekends: existingRecurrence?.excludeWeekends ?? false,
        daysOfWeek: existingRecurrence?.daysOfWeek ?? [],
        daysOfMonth: existingRecurrence?.daysOfMonth ?? [],
      });
    } else {
      form.reset({
        name: '',
        description: '',
        domain_id: null,
        category_moment: null,
        category_type: null,
        priority: 'medium',
        is_flexible: true,
        duration_minutes: undefined,
        time_start: undefined,
        time_end: undefined,
        targetValue: undefined,
        targetUnit: '',
        recurrence_type: 'daily',
        interval: 1,
        excludeWeekends: false,
        daysOfWeek: [],
        daysOfMonth: [],
      });
    }
    setActiveTab('general');
  }, [routine, form, existingConstraints, existingRecurrence]);

  const handleSubmit = (values: RoutineFormValues) => {
    // Build constraints object with proper structure
    const constraints: RoutineConstraints = {};
    
    if (values.duration_minutes) {
      constraints.duration = {
        required: true,
        minutes: values.duration_minutes,
      };
    }
    
    if (values.time_start && values.time_end) {
      constraints.timeSlot = {
        required: true,
        startTime: values.time_start,
        endTime: values.time_end,
      };
    }
    
    if (values.targetValue && values.targetUnit) {
      constraints.targetValue = {
        required: true,
        value: values.targetValue,
        unit: values.targetUnit,
      };
    }

    // Build recurrence config
    const recurrence_config: RecurrenceConfig = {
      type: values.recurrence_type,
    };
    if (values.interval && values.interval > 1) {
      recurrence_config.interval = values.interval;
    }
    if (values.recurrence_type === 'daily' && values.excludeWeekends) {
      recurrence_config.excludeWeekends = true;
    }
    if (values.recurrence_type === 'weekly' && values.daysOfWeek?.length) {
      recurrence_config.daysOfWeek = values.daysOfWeek;
    }
    if (values.recurrence_type === 'monthly' && values.daysOfMonth?.length) {
      recurrence_config.daysOfMonth = values.daysOfMonth;
    }

    // Generate RRULE
    const recurrence_rule = generateRRule(recurrence_config);

    onSubmit({
      name: values.name,
      description: values.description,
      domain_id: values.domain_id,
      category_moment: values.category_moment,
      category_type: values.category_type,
      priority: values.priority,
      is_flexible: values.is_flexible,
      constraints,
      recurrence_config,
      recurrence_rule,
    });
  };

  const recurrenceType = form.watch('recurrence_type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la routine' : 'Nouvelle routine'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifiez les paramètres de votre routine.'
              : 'Créez une nouvelle routine avec ses contraintes et récurrence.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="constraints">Contraintes</TabsTrigger>
                <TabsTrigger value="recurrence">Récurrence</TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Méditation matinale" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Description optionnelle de la routine..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="domain_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domaine</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {domains.map((domain) => (
                              <SelectItem key={domain.id} value={domain.id}>
                                {domain.icon} {domain.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorité</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="high">🟠 Haute</SelectItem>
                            <SelectItem value="medium">🔵 Moyenne</SelectItem>
                            <SelectItem value="low">⚪ Basse</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category_moment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moment</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Optionnel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="morning">🌅 Matin</SelectItem>
                            <SelectItem value="noon">☀️ Midi</SelectItem>
                            <SelectItem value="afternoon">🌤️ Après-midi</SelectItem>
                            <SelectItem value="evening">🌆 Soir</SelectItem>
                            <SelectItem value="night">🌙 Nuit</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Optionnel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="professional">💼 Professionnel</SelectItem>
                            <SelectItem value="personal">🧘 Personnel</SelectItem>
                            <SelectItem value="spiritual">🙏 Spirituel</SelectItem>
                            <SelectItem value="health">💪 Santé</SelectItem>
                            <SelectItem value="learning">📚 Apprentissage</SelectItem>
                            <SelectItem value="leisure">🎮 Loisirs</SelectItem>
                            <SelectItem value="energy">⚡ Énergie</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_flexible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Horaire flexible</FormLabel>
                        <FormDescription>
                          Permet à l&apos;IA de déplacer cette routine selon les contraintes
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Constraints Tab */}
              <TabsContent value="constraints" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durée (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 30"
                          min={5}
                          max={480}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Durée estimée de la routine (5-480 min)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="time_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heure de début</FormLabel>
                        <FormControl>
                          <Input 
                            type="time"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heure de fin</FormLabel>
                        <FormControl>
                          <Input 
                            type="time"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objectif quantifié</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Ex: 10"
                            min={1}
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unité</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: pages, km, rep..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Recurrence Tab */}
              <TabsContent value="recurrence" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="recurrence_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de récurrence</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Quotidien</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="monthly">Mensuel</SelectItem>
                          <SelectItem value="custom">Personnalisé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalle</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          max={30}
                          {...field}
                          value={field.value ?? 1}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        {recurrenceType === 'daily' && 'Tous les X jours'}
                        {recurrenceType === 'weekly' && 'Toutes les X semaines'}
                        {recurrenceType === 'monthly' && 'Tous les X mois'}
                        {recurrenceType === 'custom' && 'Intervalle personnalisé'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {recurrenceType === 'daily' && (
                  <FormField
                    control={form.control}
                    name="excludeWeekends"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Exclure les week-ends</FormLabel>
                          <FormDescription>
                            La routine ne sera planifiée que du lundi au vendredi
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {recurrenceType === 'weekly' && (
                  <FormField
                    control={form.control}
                    name="daysOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jours de la semaine</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((day) => (
                            <Button
                              key={day.value}
                              type="button"
                              variant={field.value?.includes(day.value) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                const current = field.value ?? [];
                                if (current.includes(day.value)) {
                                  field.onChange(current.filter(d => d !== day.value));
                                } else {
                                  field.onChange([...current, day.value].sort());
                                }
                              }}
                            >
                              {day.label}
                            </Button>
                          ))}
                        </div>
                        <FormDescription>
                          Sélectionnez les jours où la routine doit être planifiée
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {recurrenceType === 'monthly' && (
                  <FormField
                    control={form.control}
                    name="daysOfMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jours du mois</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: 1, 15 (séparés par des virgules)"
                            value={(field.value ?? []).join(', ')}
                            onChange={(e) => {
                              const days = e.target.value
                                .split(',')
                                .map(s => parseInt(s.trim()))
                                .filter(n => !isNaN(n) && n >= 1 && n <= 31);
                              field.onChange(days);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Jours du mois (1-31) séparés par des virgules
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>
            </Tabs>

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
                {isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


