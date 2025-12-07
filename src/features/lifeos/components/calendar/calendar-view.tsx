/**
 * LifeOS Calendar View Component
 * 
 * Unified calendar view for routines and tasks.
 * Supports day, week, and month views.
 * 
 * @module lifeos/components/calendar
 */
/* eslint-disable jsx-a11y/no-static-element-interactions */
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
}

export function CalendarViewComponent({
  events,
  initialView = 'week',
  onEventClick,
  onDateChange,
  draggedTask,
  onTaskDrop,
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
          />
        )}
        {view === 'week' && (
          <WeekView
            startDate={getWeekStart(currentDate)}
            events={events}
            onEventClick={onEventClick}
            draggedTask={draggedTask}
            onTaskDrop={onTaskDrop}
          />
        )}
        {view === 'month' && (
          <MonthView
            month={currentDate.getMonth()}
            year={currentDate.getFullYear()}
            events={events}
            onEventClick={onEventClick}
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
}: Readonly<{
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  draggedTask?: Task | null;
  onTaskDrop?: (task: Task, date: string, time: string) => void;
}>) {
  // Generate time slots from 00:00 to 23:00
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dateStr = date.toISOString().split('T')[0];

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    if (draggedTask) {
      e.preventDefault();
      e.currentTarget.classList.add('bg-primary/10');
    }
  }, [draggedTask]);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-primary/10');
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent, hour: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-primary/10');
    if (draggedTask && onTaskDrop) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      onTaskDrop(draggedTask, dateStr, time);
    }
  }, [draggedTask, onTaskDrop, dateStr]);

  return (
    <div className="relative">
      {/* Time grid */}
      <div className="border-l">
        {hours.map((hour) => (
          <div key={hour} className="flex border-b min-h-[60px]">
            <div className="w-16 py-1 px-2 text-xs text-muted-foreground text-right border-r">
              {String(hour).padStart(2, '0')}:00
            </div>
            <div 
              className={cn(
                "flex-1 relative transition-colors",
                draggedTask && "hover:bg-primary/5"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, hour)}
            >
              {/* Events for this hour */}
              {events
                .filter((event) => event.start.getHours() === hour)
                .map((event) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
            </div>
          </div>
        ))}
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
}: Readonly<{
  startDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  draggedTask?: Task | null;
  onTaskDrop?: (task: Task, date: string, time: string) => void;
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
          <div key={hour} className="flex border-b min-h-[50px]">
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
}: Readonly<{
  day: Date;
  hour: number;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  draggedTask?: Task | null;
  onTaskDrop?: (task: Task, date: string, time: string) => void;
}>) {
  const dayStr = day.toISOString().split('T')[0];
  
  const dayEvents = events.filter((event) => {
    const eventDate = event.start.toISOString().split('T')[0];
    return eventDate === dayStr && event.start.getHours() === hour;
  });

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    if (draggedTask) {
      e.preventDefault();
      e.currentTarget.classList.add('bg-primary/20');
    }
  }, [draggedTask]);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-primary/20');
  }, []);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-primary/20');
    if (draggedTask && onTaskDrop) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      onTaskDrop(draggedTask, dayStr, time);
    }
  }, [draggedTask, onTaskDrop, dayStr, hour]);

  return (
    <div 
      className={cn(
        "flex-1 border-r relative transition-colors",
        draggedTask && "hover:bg-primary/5 cursor-pointer"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dayEvents.map((event) => (
        <EventBlock
          key={event.id}
          event={event}
          compact
          onClick={() => onEventClick?.(event)}
        />
      ))}
    </div>
  );
}

// Month View Component
function MonthView({
  month,
  year,
  events,
  onEventClick,
}: Readonly<{
  month: number;
  year: number;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
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
            return <div key={`empty-before-day-${startDayOfWeek - index}`} className="min-h-[80px]" />;
          }

          const dayDate = new Date(year, month, day);
          const dayEvents = events.filter((event) => {
            const eventDate = event.start.toISOString().split('T')[0];
            const dayStr = dayDate.toISOString().split('T')[0];
            return eventDate === dayStr;
          });

          const isToday = dayDate.toDateString() === new Date().toDateString();

          return (
            <MonthDayCell
              key={`day-${day}`}
              day={day}
              isToday={isToday}
              events={dayEvents}
              onEventClick={onEventClick}
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
  isToday,
  events,
  onEventClick,
}: Readonly<{
  day: number;
  isToday: boolean;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}>) {
  return (
    <div
      className={cn(
        'min-h-[80px] border rounded-lg p-1',
        isToday && 'bg-primary/5 border-primary'
      )}
    >
      <div
        className={cn(
          'text-sm font-medium mb-1',
          isToday && 'text-primary'
        )}
      >
        {day}
      </div>
      <div className="space-y-1">
        {events.slice(0, 3).map((event) => (
          <button
            key={event.id}
            type="button"
            className="text-xs truncate px-1 py-0.5 rounded cursor-pointer hover:opacity-80 w-full text-left"
            style={{ backgroundColor: event.color || '#6B7280', color: 'white' }}
            onClick={() => onEventClick?.(event)}
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
}: Readonly<{
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}>) {
  return (
    <button
      type="button"
      className={cn(
        'absolute left-1 right-1 rounded px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden text-left',
        compact ? 'text-xs' : 'text-sm'
      )}
      style={{
        backgroundColor: event.color || '#6B7280',
        color: 'white',
        top: compact ? 2 : 4,
      }}
      onClick={onClick}
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
