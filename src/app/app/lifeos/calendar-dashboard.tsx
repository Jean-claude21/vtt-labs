/**
 * Calendar Dashboard Client Component
 * 
 * Main calendar view with event display, mini-calendar, filters, 
 * and unscheduled tasks sidebar with drag & drop support.
 * 
 * @module lifeos/calendar-dashboard
 */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
'use client';

import { useState, useTransition, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { CalendarViewComponent } from '@/features/lifeos/components/calendar/calendar-view';
import { EventTrackingDialog } from '@/features/lifeos/components/calendar/event-tracking-dialog';
import { TaskForm } from '@/features/lifeos/components/tasks/task-form';
import { getCalendarEvents } from '@/features/lifeos/actions/calendar.actions';
import { getUnscheduledTasks, scheduleTask, createTask } from '@/features/lifeos/actions/tasks.actions';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Filter, 
  ListTodo, 
  GripVertical,
  Clock,
  CalendarDays,
  AlertCircle,
  Menu,
  ChevronDown,
  ChevronUp,
  Plus,
  Repeat,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { CalendarEvent } from '@/features/lifeos/schema/calendar.schema';
import type { Domain } from '@/features/lifeos/schema/domains.schema';
import type { Task } from '@/features/lifeos/schema/tasks.schema';

interface CalendarDashboardProps {
  initialEvents: CalendarEvent[];
  initialDomains: Domain[];
  initialUnscheduledTasks: Task[];
  error: string | null;
}

interface CalendarFilters {
  showRoutines: boolean;
  showTasks: boolean;
  hiddenDomainIds: string[];
}

// Priority labels for display
const priorityLabels: Record<string, string> = {
  high: 'Haute',
  medium: 'Normale',
  low: 'Basse',
};

// Priority colors for badges
const priorityColors: Record<string, string> = {
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-gray-500',
};

// Helper to get priority label safely
function getPriorityLabel(priority: string | null | undefined): string {
  return priorityLabels[priority ?? 'medium'] ?? 'Normale';
}

// Helper to get priority color safely
function getPriorityColor(priority: string | null | undefined): string {
  return priorityColors[priority ?? 'medium'] ?? 'bg-blue-500';
}

export function CalendarDashboard({
  initialEvents,
  initialDomains,
  initialUnscheduledTasks,
  error,
}: Readonly<CalendarDashboardProps>) {
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [domains] = useState<Domain[]>(initialDomains);
  const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>(initialUnscheduledTasks);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [sidebarTab, setSidebarTab] = useState<string>('tasks');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [miniCalendarCollapsed, setMiniCalendarCollapsed] = useState(false);
  
  // Event tracking dialog state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  
  // Quick task creation dialog state
  const [quickTaskDialogOpen, setQuickTaskDialogOpen] = useState(false);
  const [quickTaskSlot, setQuickTaskSlot] = useState<{ date: string; time: string } | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  
  // Context menu state for slot click
  const [contextMenu, setContextMenu] = useState<{
    open: boolean;
    x: number;
    y: number;
    date: string;
    time: string;
  } | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<CalendarFilters>({
    showRoutines: true,
    showTasks: true,
    hiddenDomainIds: [],
  });

  // Show error if initial load failed
  useEffect(() => {
    if (error) {
      toast.error('Erreur de chargement', { description: error });
    }
  }, [error]);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filter by type
      if (event.type === 'routine' && !filters.showRoutines) return false;
      if (event.type === 'task' && !filters.showTasks) return false;
      
      // Filter by domain
      if (event.domainId && filters.hiddenDomainIds.includes(event.domainId)) {
        return false;
      }
      
      return true;
    });
  }, [events, filters]);

  // Handle date selection from mini calendar
  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    loadEventsForDate(date);
  }, []);

  // Load events for a specific date range
  const loadEventsForDate = useCallback((date: Date) => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    startTransition(async () => {
      const result = await getCalendarEvents(
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
      );

      if (result.error) {
        toast.error('Erreur', { description: result.error });
        return;
      }

      setEvents(result.data ?? []);
    });
  }, []);

  // Refresh unscheduled tasks
  const refreshUnscheduledTasks = useCallback(() => {
    startTransition(async () => {
      const result = await getUnscheduledTasks();
      if (!result.error && result.data) {
        setUnscheduledTasks(result.data);
      }
    });
  }, []);

  // Handle task drop on calendar
  const handleTaskDrop = useCallback(async (task: Task, date: string, time: string) => {
    setDraggedTask(null);
    
    const result = await scheduleTask(task.id, date, time);
    
    if (result.error) {
      toast.error('Erreur', { description: result.error });
      return;
    }

    toast.success('Tâche planifiée', { 
      description: `"${task.title}" ajoutée au calendrier` 
    });

    // Remove from unscheduled list
    setUnscheduledTasks(prev => prev.filter(t => t.id !== task.id));
    
    // Reload calendar events
    loadEventsForDate(selectedDate);
  }, [selectedDate, loadEventsForDate]);

  // Handle task drag start
  const handleTaskDragStart = useCallback((task: Task) => {
    setDraggedTask(task);
  }, []);

  // Handle task drag end
  const handleTaskDragEnd = useCallback(() => {
    setDraggedTask(null);
  }, []);

  // Handle date range change from main calendar
  const handleDateChange = useCallback((newDate: Date) => {
    setSelectedDate(newDate);
    loadEventsForDate(newDate);
  }, [loadEventsForDate]);

  // Handle event click - opens tracking dialog
  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setTrackingDialogOpen(true);
  }, []);

  // Handle tracking dialog complete
  const handleTrackingComplete = useCallback(() => {
    loadEventsForDate(selectedDate);
    refreshUnscheduledTasks();
  }, [selectedDate, loadEventsForDate, refreshUnscheduledTasks]);

  // Handle slot click - opens context menu for creation
  const handleSlotClick = useCallback((date: string, time: string, mouseEvent?: React.MouseEvent) => {
    // If we have a mouse event, show context menu
    if (mouseEvent) {
      setContextMenu({
        open: true,
        x: mouseEvent.clientX,
        y: mouseEvent.clientY,
        date,
        time,
      });
    } else {
      // Fallback: open task creation directly (keyboard navigation)
      setQuickTaskSlot({ date, time });
      setQuickTaskDialogOpen(true);
    }
  }, []);

  // Handle context menu item selection
  const handleCreateTask = useCallback(() => {
    if (contextMenu) {
      setQuickTaskSlot({ date: contextMenu.date, time: contextMenu.time });
      setQuickTaskDialogOpen(true);
      setContextMenu(null);
    }
  }, [contextMenu]);

  // Handle create routine from context menu (placeholder for future)
  const handleCreateRoutine = useCallback(() => {
    if (contextMenu) {
      // TODO: Implement routine creation dialog
      toast.info('Création de routine', { 
        description: 'La création de routines sera disponible prochainement.' 
      });
      setContextMenu(null);
    }
  }, [contextMenu]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu?.open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu?.open]);

  // Handle quick task creation
  const handleQuickTaskSubmit = useCallback(async (data: {
    title: string;
    description?: string;
    domain_id?: string | null;
    project_id?: string | null;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimated_minutes?: number | null;
    deadline?: string | null;
  }) => {
    if (!quickTaskSlot) return;
    
    setIsCreatingTask(true);
    
    // Create the task
    const result = await createTask({
      ...data,
      scheduled_date: quickTaskSlot.date,
      scheduled_time: quickTaskSlot.time,
    });
    
    setIsCreatingTask(false);
    
    if (result.error) {
      toast.error('Erreur', { description: result.error });
      return;
    }
    
    toast.success('Tâche créée', { 
      description: `"${data.title}" ajoutée au calendrier` 
    });
    
    setQuickTaskDialogOpen(false);
    setQuickTaskSlot(null);
    loadEventsForDate(selectedDate);
  }, [quickTaskSlot, selectedDate, loadEventsForDate]);

  // Toggle domain visibility
  const toggleDomain = useCallback((domainId: string) => {
    setFilters(prev => ({
      ...prev,
      hiddenDomainIds: prev.hiddenDomainIds.includes(domainId)
        ? prev.hiddenDomainIds.filter(id => id !== domainId)
        : [...prev.hiddenDomainIds, domainId],
    }));
  }, []);

  // Get dates with events for mini calendar
  const datesWithEvents = useMemo(() => {
    const dates = new Set<string>();
    for (const event of filteredEvents) {
      dates.add(event.start.toISOString().split('T')[0]);
    }
    return dates;
  }, [filteredEvents]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-4 p-4">
      {/* Sidebar with mini calendar and tabs - hidden on mobile */}
      <div className="hidden lg:flex w-80 flex-shrink-0 flex-col gap-4">
        {/* Mini Calendar - Collapsible */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                Navigation
                {isPending && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setMiniCalendarCollapsed(!miniCalendarCollapsed)}
              >
                {miniCalendarCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          {!miniCalendarCollapsed && (
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md"
                weekStartsOn={1}
                modifiers={{
                  hasEvents: (date) => datesWithEvents.has(date.toISOString().split('T')[0]),
                }}
                modifiersStyles={{
                  hasEvents: { 
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    textDecorationColor: 'hsl(var(--primary))',
                  },
                }}
              />
            </CardContent>
          )}
        </Card>

        {/* Tabbed content: Unscheduled Tasks / Filters */}
        <Card className="flex-1 min-h-[300px] flex flex-col overflow-hidden">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <TabsList className="w-full grid grid-cols-2 rounded-none border-b shrink-0">
              <TabsTrigger value="tasks" className="gap-2">
                <ListTodo className="h-4 w-4" />
                À planifier
                {unscheduledTasks.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {unscheduledTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="filters" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtres
              </TabsTrigger>
            </TabsList>
            
            {/* Unscheduled Tasks Tab */}
            <TabsContent value="tasks" className="flex-1 m-0 min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {unscheduledTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">Toutes les tâches sont planifiées</p>
                      <p className="text-xs mt-1">Créez une nouvelle tâche ou consultez vos tâches existantes</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground mb-3">
                        Glissez une tâche vers le calendrier pour la planifier
                      </p>
                      {unscheduledTasks.map((task) => (
                        /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */
                        <div
                          key={task.id}
                          draggable
                          aria-label={`Tâche: ${task.title}. Glissez pour planifier.`}
                          onDragStart={() => handleTaskDragStart(task)}
                          onDragEnd={handleTaskDragEnd}
                          className={`
                            group p-3 rounded-lg border bg-card cursor-grab active:cursor-grabbing
                            transition-all hover:shadow-md hover:border-primary/50
                            ${draggedTask?.id === task.id ? 'opacity-50 scale-95' : ''}
                          `}
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/50 group-hover:text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{task.title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {/* Priority badge */}
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs text-white ${getPriorityColor(task.priority)}`}
                                >
                                  {getPriorityLabel(task.priority)}
                                </Badge>
                                {/* Due date if exists */}
                                {task.due_date && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(task.due_date).toLocaleDateString('fr-FR', { 
                                      day: 'numeric', 
                                      month: 'short' 
                                    })}
                                  </span>
                                )}
                                {/* Overdue warning */}
                                {task.due_date && new Date(task.due_date) < new Date() && (
                                  <AlertCircle className="h-3 w-3 text-destructive" />
                                )}
                              </div>
                              {/* Estimated duration if exists */}
                              {task.estimated_minutes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  ~{task.estimated_minutes} min
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={refreshUnscheduledTasks}
                      disabled={isPending}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
                      Actualiser
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* Filters Tab */}
            <TabsContent value="filters" className="flex-1 m-0 min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Type filters */}
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase">Types</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="show-routines"
                          checked={filters.showRoutines}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, showRoutines: checked === true }))
                          }
                        />
                        <Label htmlFor="show-routines" className="text-sm cursor-pointer">
                          Routines
                        </Label>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {events.filter(e => e.type === 'routine').length}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="show-tasks"
                          checked={filters.showTasks}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ ...prev, showTasks: checked === true }))
                          }
                        />
                        <Label htmlFor="show-tasks" className="text-sm cursor-pointer">
                          Tâches
                        </Label>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {events.filter(e => e.type === 'task').length}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Domain filters */}
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase">Domaines</Label>
                    <div className="space-y-2">
                      {domains.map((domain) => {
                        const isVisible = !filters.hiddenDomainIds.includes(domain.id);
                        const eventCount = events.filter(e => e.domainId === domain.id).length;
                        
                        return (
                          <div 
                            key={domain.id} 
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`domain-${domain.id}`}
                              checked={isVisible}
                              onCheckedChange={() => toggleDomain(domain.id)}
                            />
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: domain.color }}
                            />
                            <Label 
                              htmlFor={`domain-${domain.id}`} 
                              className="text-sm cursor-pointer flex-1 truncate"
                            >
                              {domain.name}
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              {eventCount}
                            </Badge>
                          </div>
                        );
                      })}
                      {domains.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucun domaine configuré
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Main Calendar */}
      <div className="flex-1 min-w-0">
        {/* Mobile sidebar trigger */}
        <div className="lg:hidden mb-4 flex items-center justify-between">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4 mr-2" />
                Menu
                {unscheduledTasks.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unscheduledTasks.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>LifeOS</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-[calc(100%-60px)]">
                {/* Mini Calendar in sheet */}
                <div className="p-4 border-b">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      handleDateSelect(date);
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-md"
                    modifiers={{
                      hasEvents: (date) => datesWithEvents.has(date.toISOString().split('T')[0]),
                    }}
                    modifiersStyles={{
                      hasEvents: { 
                        fontWeight: 'bold',
                        textDecoration: 'underline',
                        textDecorationColor: 'hsl(var(--primary))',
                      },
                    }}
                  />
                </div>
                
                {/* Unscheduled tasks in sheet */}
                <ScrollArea className="flex-1 p-4">
                  <h4 className="text-sm font-medium mb-3">
                    Tâches à planifier ({unscheduledTasks.length})
                  </h4>
                  {unscheduledTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Toutes les tâches sont planifiées
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {unscheduledTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg border bg-card"
                        >
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs text-white ${getPriorityColor(task.priority)}`}
                            >
                              {getPriorityLabel(task.priority)}
                            </Badge>
                            {task.due_date && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(task.due_date).toLocaleDateString('fr-FR', { 
                                  day: 'numeric', 
                                  month: 'short' 
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
          
          <span className="text-sm text-muted-foreground">
            {selectedDate.toLocaleDateString('fr-FR', { 
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </span>
        </div>
        
        <CalendarViewComponent
          events={filteredEvents}
          initialView="week"
          onEventClick={handleEventClick}
          onDateChange={handleDateChange}
          draggedTask={draggedTask}
          onTaskDrop={handleTaskDrop}
          onSlotClick={handleSlotClick}
        />
      </div>

      {/* Event Tracking Dialog */}
      <EventTrackingDialog
        event={selectedEvent}
        open={trackingDialogOpen}
        onOpenChange={setTrackingDialogOpen}
        onEventUpdated={handleTrackingComplete}
      />

      {/* Quick Task Creation Dialog */}
      <TaskForm
        open={quickTaskDialogOpen}
        onOpenChange={(open) => {
          setQuickTaskDialogOpen(open);
          if (!open) setQuickTaskSlot(null);
        }}
        domains={domains}
        onSubmit={handleQuickTaskSubmit}
        isSubmitting={isCreatingTask}
      />

      {/* Context Menu for slot click */}
      {contextMenu?.open && (
        <div
          className="fixed z-50 min-w-[160px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            onClick={handleCreateTask}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle tâche
          </button>
          <button
            type="button"
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            onClick={handleCreateRoutine}
          >
            <Repeat className="mr-2 h-4 w-4" />
            Nouvelle routine
          </button>
        </div>
      )}
    </div>
  );
}

// Helper to get Monday of current week
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
