/**
 * LifeOS Calendar View Component
 * 
 * Unified calendar view for routines and tasks.
 * Supports day, week, and month views.
 * 
 * @module lifeos/components/calendar
 */
/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-tabindex */
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Grid3X3,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEvent, CalendarView } from '@/features/lifeos/schema/calendar.schema';
import type { Task } from '@/features/lifeos/schema/tasks.schema';

interface CalendarViewProps {
  events: CalendarEvent[];
  initialView?: CalendarView;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
  onDateChange?: (date: Date) => void;
  draggedTask?: Task | null;
  onTaskDrop?: (task: Task, date: string, time: string) => void;
  onSlotClick?: (date: string, time: string) => void;
}

export function CalendarViewComponent({
  events,
  initialView = 'week',
  onEventClick,
  onDateChange,
  draggedTask,
  onTaskDrop,
  onSlotClick,
}: Readonly<CalendarViewProps>) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<CalendarView>(initialView);

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

function filterEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dateStr = date.toISOString().split('T')[0];
  return events.filter(event => {
    const eventDate = event.start.toISOString().split('T')[0];
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
}: Readonly<{
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  draggedTask?: Task | null;
  onTaskDrop?: (task: Task, date: string, time: string) => void;
  onSlotClick?: (date: string, time: string) => void;
}>) {
  // Generate time slots from 00:00 to 23:00
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dateStr = date.toISOString().split('T')[0];
  const [dragOverHour, setDragOverHour] = React.useState<number | null>(null);

  const handleDragOver = React.useCallback((e: React.DragEvent, hour: number) => {
    if (draggedTask) {
      e.preventDefault();
      setDragOverHour(hour);
    }
  }, [draggedTask]);

  const handleDragLeave = React.useCallback(() => {
    setDragOverHour(null);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent, hour: number) => {
    e.preventDefault();
    setDragOverHour(null);
    if (draggedTask && onTaskDrop) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      onTaskDrop(draggedTask, dateStr, time);
    }
  }, [draggedTask, onTaskDrop, dateStr]);

  const handleSlotClick = React.useCallback((hour: number) => {
    if (onSlotClick) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      onSlotClick(dateStr, time);
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
                onClick={() => handleSlotClick(hour)}
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
                {/* Events for this hour - handle overlaps */}
                <div className="flex gap-1">
                  {hourEvents.map((event, index) => (
                    <EventBlock
                      key={event.id}
                      event={event}
                      onClick={() => onEventClick?.(event)}
                      style={{ 
                        position: 'relative',
                        flex: 1,
                        maxWidth: hourEvents.length > 1 ? `${100 / hourEvents.length}%` : undefined 
                      }}
                    />
                  ))}
                </div>
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
}: Readonly<{
  startDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  draggedTask?: Task | null;
  onTaskDrop?: (task: Task, date: string, time: string) => void;
  onSlotClick?: (date: string, time: string) => void;
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
}: Readonly<{
  day: Date;
  hour: number;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  draggedTask?: Task | null;
  onTaskDrop?: (task: Task, date: string, time: string) => void;
  onSlotClick?: (date: string, time: string) => void;
}>) {
  const dayStr = day.toISOString().split('T')[0];
  const [isDragOver, setIsDragOver] = React.useState(false);
  
  const dayEvents = events.filter((event) => {
    const eventDate = event.start.toISOString().split('T')[0];
    return eventDate === dayStr && event.start.getHours() === hour;
  });

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    if (draggedTask) {
      e.preventDefault();
      setIsDragOver(true);
    }
  }, [draggedTask]);

  const handleDragLeave = React.useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (draggedTask && onTaskDrop) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      onTaskDrop(draggedTask, dayStr, time);
    }
  }, [draggedTask, onTaskDrop, dayStr, hour]);

  const handleClick = React.useCallback(() => {
    if (onSlotClick && dayEvents.length === 0) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      onSlotClick(dayStr, time);
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
      onClick={handleClick}
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
      {/* Events - handle overlaps */}
      <div className="flex gap-0.5 h-full">
        {dayEvents.map((event) => (
          <EventBlock
            key={event.id}
            event={event}
            compact
            onClick={() => onEventClick?.(event)}
            style={{
              position: 'relative',
              flex: 1,
              maxWidth: dayEvents.length > 1 ? `${100 / dayEvents.length}%` : undefined
            }}
          />
        ))}
      </div>
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
  onSlotClick?: (date: string, time: string) => void;
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
            const eventDate = event.start.toISOString().split('T')[0];
            const dayStr = dayDate.toISOString().split('T')[0];
            return eventDate === dayStr;
          });

          const isToday = dayDate.toDateString() === new Date().toDateString();
          const dateStr = dayDate.toISOString().split('T')[0];

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
  onSlotClick?: (date: string, time: string) => void;
}>) {
  const handleDayClick = React.useCallback((e: React.MouseEvent) => {
    // Don't trigger if clicking on an event
    if ((e.target as HTMLElement).closest('button')) return;
    if (onSlotClick) {
      onSlotClick(dateStr, '09:00'); // Default to 9 AM
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
  onClick,
  style,
}: Readonly<{
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}>) {
  // Calculate top position - avoid nested ternary
  let topPosition: number | undefined;
  if (!style) {
    topPosition = compact ? 2 : 4;
  }
  
  return (
    <button
      type="button"
      className={cn(
        'rounded px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden text-left',
        compact ? 'text-xs' : 'text-sm',
        !style && 'absolute left-1 right-1'
      )}
      style={{
        backgroundColor: event.color || '#6B7280',
        color: 'white',
        top: topPosition,
        ...style,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div className="flex items-center gap-1">
        {event.icon && <span>{event.icon}</span>}
        <span className="font-medium truncate">{event.title}</span>
      </div>
      {!compact && (
        <div className="flex items-center gap-2 text-xs opacity-80">
          <span>
            {event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {event.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {event.isCompleted && <Badge variant="outline" className="text-white border-white/50">✓</Badge>}
        </div>
      )}
    </button>
  );
}
