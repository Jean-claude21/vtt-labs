/**
 * LifeOS Calendar View Component
 * 
 * Unified calendar view for routines and tasks.
 * Supports day, week, and month views.
 * 
 * @module lifeos/components/calendar
 */
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Grid3X3,
  Plus,
  Clock,
  ArrowUp,
  ArrowDown,
  ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEvent, CalendarView } from '@/features/lifeos/schema/calendar.schema';
import type { Task } from '@/features/lifeos/schema/tasks.schema';

/**
 * Calculate column positions for overlapping events (Google Calendar style)
 * Returns events with column index and total columns for their overlap group
 */
interface EventWithPosition extends CalendarEvent {
  column: number;
  totalColumns: number;
}

function calculateEventPositions(events: CalendarEvent[]): EventWithPosition[] {
  // Filter out events with null start/end times
  const validEvents = events.filter(e => e.start != null && e.end != null);
  
  if (validEvents.length === 0) return [];
  if (validEvents.length === 1) {
    return [{ ...validEvents[0], column: 0, totalColumns: 1 }];
  }

  // Sort by start time, then by duration (longer first)
  const sorted = [...validEvents].sort((a, b) => {
    const startDiff = a.start.getTime() - b.start.getTime();
    if (startDiff !== 0) return startDiff;
    // Longer events first (they span more)
    const aDuration = a.end.getTime() - a.start.getTime();
    const bDuration = b.end.getTime() - b.start.getTime();
    return bDuration - aDuration;
  });

  // Find overlapping groups
  const groups: CalendarEvent[][] = [];
  let currentGroup: CalendarEvent[] = [];

  for (const event of sorted) {
    if (currentGroup.length === 0) {
      currentGroup.push(event);
    } else {
      // Check if event overlaps with any event in current group
      const overlaps = currentGroup.some(e => 
        event.start < e.end && event.end > e.start
      );
      
      if (overlaps) {
        currentGroup.push(event);
      } else {
        // Start new group
        groups.push(currentGroup);
        currentGroup = [event];
      }
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Assign columns within each group
  const result: EventWithPosition[] = [];
  
  for (const group of groups) {
    const columns: CalendarEvent[][] = [];
    
    for (const event of group) {
      // Find first column where event doesn't overlap with existing events
      let placed = false;
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const columnEvents = columns[colIndex];
        const overlapsInColumn = columnEvents.some(e => 
          event.start < e.end && event.end > e.start
        );
        
        if (!overlapsInColumn) {
          columns[colIndex].push(event);
          result.push({ ...event, column: colIndex, totalColumns: 0 });
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        // Create new column
        columns.push([event]);
        result.push({ ...event, column: columns.length - 1, totalColumns: 0 });
      }
    }
    
    // Update totalColumns for all events in group
    const totalCols = columns.length;
    for (const event of result) {
      if (group.some(e => e.id === event.id)) {
        event.totalColumns = totalCols;
      }
    }
  }

  return result;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  initialView?: CalendarView;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
  onTimeShift?: (eventId: string, shiftMinutes: number) => void;
  onCreateTaskFromRoutine?: (instanceId: string) => void;
  onDateChange?: (date: Date) => void;
  draggedTask?: Task | null;
  onTaskDrop?: (task: Task, date: string, time: string) => void;
  onSlotClick?: (date: string, time: string, mouseEvent?: React.MouseEvent) => void;
}

export function CalendarViewComponent({
  events,
  initialView = 'week',
  onEventClick,
  onEventDrop,
  onTimeShift,
  onCreateTaskFromRoutine,
  onDateChange,
  draggedTask,
  onTaskDrop,
  onSlotClick,
}: Readonly<CalendarViewProps>) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<CalendarView>(initialView);
  const [draggedEvent, setDraggedEvent] = React.useState<CalendarEvent | null>(null);

  // Navigation helpers
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateChange?.(today);
  };

  // Format header based on view
  const getHeaderText = () => {
    switch (view) {
      case 'day':
        return currentDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      case 'week': {
        const weekStart = getWeekStart(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      }
      case 'month':
        return currentDate.toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        });
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Aujourd&apos;hui
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Title */}
          <CardTitle className="text-lg capitalize">{getHeaderText()}</CardTitle>

          {/* View selector */}
          <div className="flex items-center gap-1">
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
            >
              <List className="h-4 w-4 mr-1" />
              Jour
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Semaine
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Mois
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        {view === 'day' && (
          <DayView
            date={currentDate}
            events={filterEventsForDay(events, currentDate)}
            onEventClick={onEventClick}
            draggedTask={draggedTask}
            onTaskDrop={onTaskDrop}
            onSlotClick={onSlotClick}
            draggedEvent={draggedEvent}
            onEventDragStart={setDraggedEvent}
            onEventDragEnd={() => setDraggedEvent(null)}
            onEventDrop={onEventDrop}
            onTimeShift={onTimeShift}
            onCreateTaskFromRoutine={onCreateTaskFromRoutine}
          />
        )}
        {view === 'week' && (
          <WeekView
            startDate={getWeekStart(currentDate)}
            events={events}
            onEventClick={onEventClick}
            draggedTask={draggedTask}
            onTaskDrop={onTaskDrop}
            onSlotClick={onSlotClick}
            draggedEvent={draggedEvent}
            onEventDragStart={setDraggedEvent}
            onEventDragEnd={() => setDraggedEvent(null)}
            onEventDrop={onEventDrop}
            onTimeShift={onTimeShift}
            onCreateTaskFromRoutine={onCreateTaskFromRoutine}
          />
        )}
        {view === 'month' && (
          <MonthView
            month={currentDate.getMonth()}
            year={currentDate.getFullYear()}
            events={events}
            onEventClick={onEventClick}
            onSlotClick={onSlotClick}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff));
}

/**
 * Format date to YYYY-MM-DD in local timezone (not UTC)
 * This is important to avoid timezone issues when comparing dates
 */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function filterEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dateStr = toLocalDateString(date);
  return events.filter(event => {
    const eventDate = toLocalDateString(event.start);
    return eventDate === dateStr;
  });
}

// Day View Component
function DayView({
  date,
  events,
  onEventClick,
  draggedTask,
  onTaskDrop,
  onSlotClick,
  draggedEvent,
  onEventDragStart,
  onEventDragEnd,
  onEventDrop,
  onTimeShift,
  onCreateTaskFromRoutine,
}: Readonly<{
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  draggedTask?: Task | null;
  onTaskDrop?: (task: Task, date: string, time: string) => void;
  onSlotClick?: (date: string, time: string, mouseEvent?: React.MouseEvent) => void;
  draggedEvent?: CalendarEvent | null;
  onEventDragStart?: (event: CalendarEvent) => void;
  onEventDragEnd?: () => void;
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
  onTimeShift?: (eventId: string, shiftMinutes: number) => void;
  onCreateTaskFromRoutine?: (instanceId: string) => void;
}>) {
  // Generate time slots from 00:00 to 23:00
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dateStr = toLocalDateString(date);
  const [dragOverHour, setDragOverHour] = React.useState<number | null>(null);

  const handleDragOver = React.useCallback((e: React.DragEvent, hour: number) => {
    if (draggedTask || draggedEvent) {
      e.preventDefault();
      setDragOverHour(hour);
    }
  }, [draggedTask, draggedEvent]);

  const handleDragLeave = React.useCallback(() => {
    setDragOverHour(null);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent, hour: number) => {
    e.preventDefault();
    setDragOverHour(null);
    
    // Handle task drop from sidebar
    if (draggedTask && onTaskDrop) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      onTaskDrop(draggedTask, dateStr, time);
    }
    
    // Handle event repositioning
    if (draggedEvent && onEventDrop) {
      const duration = draggedEvent.end && draggedEvent.start 
        ? draggedEvent.end.getTime() - draggedEvent.start.getTime()
        : 60 * 60 * 1000; // Default 1h
      
      const newStart = new Date(date);
      newStart.setHours(hour, 0, 0, 0);
      const newEnd = new Date(newStart.getTime() + duration);
      
      onEventDrop(draggedEvent.id, newStart, newEnd);
    }
  }, [draggedTask, onTaskDrop, dateStr, draggedEvent, onEventDrop, date]);

  const handleSlotClick = React.useCallback((hour: number, mouseEvent?: React.MouseEvent) => {
    if (onSlotClick) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      onSlotClick(dateStr, time, mouseEvent);
    }
  }, [onSlotClick, dateStr]);

  // Group events by hour for overlap handling
  const getEventsForHour = (hour: number) => {
    return events.filter((event) => event.start.getHours() === hour);
  };

  return (
    <div className="relative">
      {/* Time grid */}
      <div className="border-l">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          const isDragOver = dragOverHour === hour;
          
          return (
            <div key={hour} className="flex border-b min-h-[70px]">
              <div className="w-16 py-1 px-2 text-xs text-muted-foreground text-right border-r flex-shrink-0">
                {String(hour).padStart(2, '0')}:00
              </div>
              <div 
                tabIndex={0}
                aria-label={`Créneau ${String(hour).padStart(2, '0')}:00`}
                className={cn(
                  "flex-1 relative transition-all duration-200 group",
                  draggedTask && "cursor-pointer",
                  isDragOver && "bg-primary/20 ring-2 ring-primary ring-inset"
                )}
                onDragOver={(e) => handleDragOver(e, hour)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, hour)}
                onClick={(e) => handleSlotClick(hour, e)}
                onKeyDown={(e) => e.key === 'Enter' && handleSlotClick(hour)}
              >
                {/* Drop indicator */}
                {isDragOver && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex items-center gap-2 text-primary font-medium text-sm bg-background/80 px-3 py-1 rounded-full shadow-sm">
                      <Plus className="h-4 w-4" />
                      Déposer ici
                    </div>
                  </div>
                )}
                {/* Hover add button */}
                {!draggedTask && onSlotClick && hourEvents.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Plus className="h-3 w-3" />
                      Ajouter
                    </div>
                  </div>
                )}
                {/* Events for this hour - handle overlaps with column layout */}
                {(() => {
                  const positionedEvents = calculateEventPositions(hourEvents);
                  return (
                    <div className="relative w-full h-full min-h-[60px]">
                      {positionedEvents.map((event) => {
                        const widthPercent = 100 / event.totalColumns;
                        const leftPercent = event.column * widthPercent;
                        return (
                          <div
                            key={event.id}
                            style={{
                              position: 'absolute',
                              left: `${leftPercent}%`,
                              width: `${widthPercent - 1}%`,
                              top: 0,
                              bottom: 0,
                            }}
                          >
                            <EventBlock
                              event={event}
                              onClick={() => onEventClick?.(event)}
                              draggable={!!onEventDrop}
                              onDragStart={() => onEventDragStart?.(event)}
                              onDragEnd={onEventDragEnd}
                              onTimeShift={onTimeShift}
                              onCreateTaskFromRoutine={onCreateTaskFromRoutine}
                              isOverlapping={event.totalColumns > 1}
                              style={{ height: '100%' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Week View Component
function WeekView({
  startDate,
  events,
  onEventClick,
  draggedTask,
  onTaskDrop,
  onSlotClick,
  draggedEvent,
  onEventDragStart,
  onEventDragEnd,
  onEventDrop,
  onTimeShift,
  onCreateTaskFromRoutine,
}: Readonly<{
  startDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  draggedTask?: Task | null;
  onTaskDrop?: (task: Task, date: string, time: string) => void;
  onSlotClick?: (date: string, time: string, mouseEvent?: React.MouseEvent) => void;
  draggedEvent?: CalendarEvent | null;
  onEventDragStart?: (event: CalendarEvent) => void;
  onEventDragEnd?: () => void;
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
  onTimeShift?: (eventId: string, shiftMinutes: number) => void;
  onCreateTaskFromRoutine?: (instanceId: string) => void;
}>) {
  // Generate days of the week
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Generate time slots from 00:00 to 23:00
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="flex border-b sticky top-0 bg-background z-10">
        <div className="w-16 border-r" />
        {days.map((day) => {
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex-1 py-2 text-center text-sm border-r',
                isToday && 'bg-primary/5'
              )}
            >
              <div className="font-medium">
                {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div
                className={cn(
                  'text-lg',
                  isToday && 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                )}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        {hours.map((hour) => (
          <div key={hour} className="flex border-b min-h-[60px]">
            <div className="w-16 py-1 px-2 text-xs text-muted-foreground text-right border-r flex-shrink-0">
              {String(hour).padStart(2, '0')}:00
            </div>
            {days.map((day) => (
              <WeekDayCell
                key={day.toISOString()}
                day={day}
                hour={hour}
                events={events}
                onEventClick={onEventClick}
                draggedTask={draggedTask}
                onTaskDrop={onTaskDrop}
                onSlotClick={onSlotClick}
                draggedEvent={draggedEvent}
                onEventDragStart={onEventDragStart}
                onEventDragEnd={onEventDragEnd}
                onEventDrop={onEventDrop}
                onTimeShift={onTimeShift}
                onCreateTaskFromRoutine={onCreateTaskFromRoutine}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Week Day Cell Component - Extracted to avoid deep nesting
function WeekDayCell({
  day,
  hour,
  events,
  onEventClick,
  draggedTask,
  onTaskDrop,
  onSlotClick,
  draggedEvent,
  onEventDragStart,
  onEventDragEnd,
  onEventDrop,
  onTimeShift,
  onCreateTaskFromRoutine,
}: Readonly<{
  day: Date;
  hour: number;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  draggedTask?: Task | null;
  onTaskDrop?: (task: Task, date: string, time: string) => void;
  onSlotClick?: (date: string, time: string, mouseEvent?: React.MouseEvent) => void;
  draggedEvent?: CalendarEvent | null;
  onEventDragStart?: (event: CalendarEvent) => void;
  onEventDragEnd?: () => void;
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
  onTimeShift?: (eventId: string, shiftMinutes: number) => void;
  onCreateTaskFromRoutine?: (instanceId: string) => void;
}>) {
  const dayStr = toLocalDateString(day);
  const [isDragOver, setIsDragOver] = React.useState(false);
  
  const dayEvents = events.filter((event) => {
    const eventDate = toLocalDateString(event.start);
    return eventDate === dayStr && event.start.getHours() === hour;
  });

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    if (draggedTask || draggedEvent) {
      e.preventDefault();
      setIsDragOver(true);
    }
  }, [draggedTask, draggedEvent]);

  const handleDragLeave = React.useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Handle task drop from sidebar
    if (draggedTask && onTaskDrop) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      onTaskDrop(draggedTask, dayStr, time);
    }
    
    // Handle event repositioning
    if (draggedEvent && onEventDrop) {
      const duration = draggedEvent.end && draggedEvent.start 
        ? draggedEvent.end.getTime() - draggedEvent.start.getTime()
        : 60 * 60 * 1000; // Default 1h
      
      const newStart = new Date(day);
      newStart.setHours(hour, 0, 0, 0);
      const newEnd = new Date(newStart.getTime() + duration);
      
      onEventDrop(draggedEvent.id, newStart, newEnd);
    }
  }, [draggedTask, onTaskDrop, dayStr, hour, draggedEvent, onEventDrop, day]);

  const handleClick = React.useCallback((e?: React.MouseEvent) => {
    if (onSlotClick && dayEvents.length === 0) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      onSlotClick(dayStr, time, e);
    }
  }, [onSlotClick, dayStr, hour, dayEvents.length]);

  return (
    <div 
      tabIndex={0}
      aria-label={`Créneau ${dayStr} ${String(hour).padStart(2, '0')}:00`}
      className={cn(
        "flex-1 border-r relative transition-all duration-200 group",
        draggedTask && "cursor-pointer",
        isDragOver && "bg-primary/20 ring-2 ring-primary ring-inset",
        !draggedTask && onSlotClick && dayEvents.length === 0 && "hover:bg-muted/50 cursor-pointer"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => handleClick(e)}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Drop indicator */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <Plus className="h-4 w-4 text-primary" />
        </div>
      )}
      {/* Hover add indicator */}
      {!draggedTask && onSlotClick && dayEvents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Plus className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
      {/* Events - handle overlaps with column layout */}
      {(() => {
        const positionedEvents = calculateEventPositions(dayEvents);
        return (
          <div className="relative w-full h-full">
            {positionedEvents.map((event) => {
              const widthPercent = 100 / event.totalColumns;
              const leftPercent = event.column * widthPercent;
              return (
                <div
                  key={event.id}
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    width: `${widthPercent - 1}%`,
                    top: 0,
                    bottom: 0,
                  }}
                >
                  <EventBlock
                    event={event}
                    compact
                    onClick={() => onEventClick?.(event)}
                    draggable={!!onEventDrop}
                    onDragStart={() => onEventDragStart?.(event)}
                    onDragEnd={onEventDragEnd}
                    onTimeShift={onTimeShift}
                    onCreateTaskFromRoutine={onCreateTaskFromRoutine}
                    isOverlapping={event.totalColumns > 1}
                    style={{ height: '100%' }}
                  />
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

// Month View Component
function MonthView({
  month,
  year,
  events,
  onEventClick,
  onSlotClick,
}: Readonly<{
  month: number;
  year: number;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: string, time: string, mouseEvent?: React.MouseEvent) => void;
}>) {
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
  let startDayOfWeek = firstDay.getDay();
  // Adjust for Monday start
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Generate calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="p-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-before-day-${startDayOfWeek - index}`} className="min-h-[100px]" />;
          }

          const dayDate = new Date(year, month, day);
          const dayEvents = events.filter((event) => {
            const eventDate = toLocalDateString(event.start);
            const dayStr = toLocalDateString(dayDate);
            return eventDate === dayStr;
          });

          const isToday = dayDate.toDateString() === new Date().toDateString();
          const dateStr = toLocalDateString(dayDate);

          return (
            <MonthDayCell
              key={`day-${day}`}
              day={day}
              dateStr={dateStr}
              isToday={isToday}
              events={dayEvents}
              onEventClick={onEventClick}
              onSlotClick={onSlotClick}
            />
          );
        })}
      </div>
    </div>
  );
}

// Month Day Cell Component - Extracted to avoid deep nesting
function MonthDayCell({
  day,
  dateStr,
  isToday,
  events,
  onEventClick,
  onSlotClick,
}: Readonly<{
  day: number;
  dateStr: string;
  isToday: boolean;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: string, time: string, mouseEvent?: React.MouseEvent) => void;
}>) {
  const handleDayClick = React.useCallback((e: React.MouseEvent) => {
    // Don't trigger if clicking on an event
    if ((e.target as HTMLElement).closest('button')) return;
    if (onSlotClick) {
      onSlotClick(dateStr, '09:00', e); // Default to 9 AM, pass event
    }
  }, [onSlotClick, dateStr]);

  return (
    <div
      tabIndex={0}
      aria-label={`Jour ${day}`}
      className={cn(
        'min-h-[100px] border rounded-lg p-1 transition-colors group',
        isToday && 'bg-primary/5 border-primary',
        onSlotClick && 'hover:bg-muted/50 cursor-pointer'
      )}
      onClick={handleDayClick}
      onKeyDown={(e) => e.key === 'Enter' && onSlotClick?.(dateStr, '09:00')}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium',
            isToday && 'text-primary'
          )}
        >
          {day}
        </span>
        {onSlotClick && (
          <Plus className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <div className="space-y-1">
        {events.slice(0, 3).map((event) => (
          <button
            key={event.id}
            type="button"
            className="text-xs truncate px-1 py-0.5 rounded cursor-pointer hover:opacity-80 w-full text-left"
            style={{ backgroundColor: event.color || '#6B7280', color: 'white' }}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick?.(event);
            }}
            title={event.title}
          >
            {event.title}
          </button>
        ))}
        {events.length > 3 && (
          <div className="text-xs text-muted-foreground px-1">
            +{events.length - 3} autres
          </div>
        )}
      </div>
    </div>
  );
}

// Event Block Component
function EventBlock({
  event,
  compact = false,
  showTime = true,
  onClick,
  style,
  draggable = false,
  onDragStart,
  onDragEnd,
  onTimeShift,
  onCreateTaskFromRoutine,
  isOverlapping = false,
}: Readonly<{
  event: CalendarEvent;
  compact?: boolean;
  showTime?: boolean; // Show time even in compact mode (false for month view)
  onClick?: () => void;
  style?: React.CSSProperties;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onTimeShift?: (eventId: string, shiftMinutes: number) => void;
  onCreateTaskFromRoutine?: (instanceId: string) => void;
  isOverlapping?: boolean;
}>) {
  // Calculate top position - avoid nested ternary
  let topPosition: number | undefined;
  if (!style) {
    topPosition = compact ? 2 : 4;
  }
  
  const handleDragStart = React.useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    onDragStart?.();
  }, [event.id, onDragStart]);

  const handleDragEnd = React.useCallback(() => {
    onDragEnd?.();
  }, [onDragEnd]);
  
  // Format time string - guard against null dates
  const timeString = event.start && event.end 
    ? `${event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${event.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  // Check if event is completed
  const isCompleted = event.isCompleted || event.status === 'done' || event.status === 'completed';

  const eventButton = (
    <button
      type="button"
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      onDragEnd={draggable ? handleDragEnd : undefined}
      className={cn(
        'rounded px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden text-left w-full',
        compact ? 'text-xs' : 'text-sm',
        !style && 'absolute left-1 right-1',
        // Completed events: reduced opacity and visual indicator
        isCompleted && 'opacity-60',
        // Draggable cursor
        draggable && 'cursor-grab active:cursor-grabbing',
        // Overlapping indicator - orange/red left border
        isOverlapping && 'border-l-4 border-l-orange-500'
      )}
      style={{
        backgroundColor: event.color || '#6B7280',
        color: 'white',
        top: topPosition,
        // Add slight shadow for overlapping events to help differentiate
        boxShadow: isOverlapping ? '2px 2px 4px rgba(0,0,0,0.2)' : undefined,
        ...style,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div className="flex items-center gap-1">
        {/* Checkmark for completed events */}
        {isCompleted && <span className="text-green-300">✓</span>}
        {!isCompleted && event.icon && <span>{event.icon}</span>}
        <span className={cn(
          "font-medium truncate",
          isCompleted && "line-through opacity-80"
        )}>{event.title}</span>
        {/* Checklist progress indicator */}
        {event.checklistTotal && event.checklistTotal > 0 && (
          <span className={cn(
            "ml-auto text-xs font-medium px-1 rounded",
            event.checklistCompleted === event.checklistTotal 
              ? "bg-green-500/30 text-green-200" 
              : "bg-white/20"
          )}>
            {event.checklistCompleted || 0}/{event.checklistTotal}
          </span>
        )}
      </div>
      {/* Show time in compact mode if showTime=true, always show in non-compact */}
      {(showTime || !compact) && timeString && (
        <div className={cn(
          "flex items-center gap-2 opacity-80",
          compact ? "text-[10px]" : "text-xs",
          isCompleted && "line-through"
        )}>
          <span className="truncate">{timeString}</span>
        </div>
      )}
    </button>
  );

  // If no time shift callback, render without context menu
  if (!onTimeShift) {
    return eventButton;
  }
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {eventButton}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={() => onTimeShift(event.id, -60)}
          className="gap-2"
        >
          <ArrowUp className="h-4 w-4" />
          Décaler -1h
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onTimeShift(event.id, -30)}
          className="gap-2"
        >
          <ArrowUp className="h-4 w-4" />
          Décaler -30min
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onTimeShift(event.id, 30)}
          className="gap-2"
        >
          <ArrowDown className="h-4 w-4" />
          Décaler +30min
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onTimeShift(event.id, 60)}
          className="gap-2"
        >
          <ArrowDown className="h-4 w-4" />
          Décaler +1h
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onClick?.()}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          Modifier horaires...
        </ContextMenuItem>
        {/* Show "Create linked task" only for routine instances */}
        {event.entityType === 'routine_instance' && onCreateTaskFromRoutine && !event.linkedTaskId && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onCreateTaskFromRoutine(event.entityId)}
              className="gap-2"
            >
              <ListTodo className="h-4 w-4" />
              Créer tâche liée
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
