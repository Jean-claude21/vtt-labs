/**
 * Day Navigator Component
 * 
 * Navigation between days with quick access to today.
 * 
 * @module lifeos/components/planning
 */
'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { fr } from 'date-fns/locale';

interface DayNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function DayNavigator({ currentDate, onDateChange }: DayNavigatorProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const current = new Date(currentDate);
  current.setHours(0, 0, 0, 0);
  
  const isToday = current.getTime() === today.getTime();
  
  const goToPreviousDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev);
  };
  
  const goToNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next);
  };
  
  const goToToday = () => {
    onDateChange(new Date());
  };
  
  const formatDate = (date: Date) => {
    const dayOfWeek = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    const dayMonth = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    
    // Capitalize first letter
    const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    
    return `${capitalizedDay} ${dayMonth}`;
  };
  
  const getRelativeLabel = (date: Date) => {
    const diff = Math.round((current.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    if (diff === -1) return 'Hier';
    if (diff > 1 && diff <= 7) return `Dans ${diff} jours`;
    if (diff < -1 && diff >= -7) return `Il y a ${Math.abs(diff)} jours`;
    
    return null;
  };
  
  const relativeLabel = getRelativeLabel(currentDate);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={goToPreviousDay}
        aria-label="Jour précédent"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[200px] justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              <span className="font-medium">{formatDate(currentDate)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarPicker
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && onDateChange(date)}
              locale={fr}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        {relativeLabel && (
          <span className={`text-sm ${isToday ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            {relativeLabel}
          </span>
        )}
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={goToNextDay}
        aria-label="Jour suivant"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      {!isToday && (
        <Button
          variant="ghost"
          size="sm"
          onClick={goToToday}
          className="text-primary"
        >
          Aujourd&apos;hui
        </Button>
      )}
    </div>
  );
}
