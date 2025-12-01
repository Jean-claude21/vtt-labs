/**
 * Current Time Indicator Component
 * 
 * Shows current time line in the timeline view.
 * 
 * @module lifeos/components/planning
 */
'use client';

import { useState, useEffect } from 'react';

interface CurrentTimeIndicatorProps {
  dayStart: number; // Hour (e.g., 7 for 7:00)
  dayEnd: number; // Hour (e.g., 22 for 22:00)
  pixelsPerHour: number;
}

export function CurrentTimeIndicator({
  dayStart,
  dayEnd,
  pixelsPerHour,
}: CurrentTimeIndicatorProps) {
  const [now, setNow] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Check if current time is within day bounds
  const totalMinutes = currentHour * 60 + currentMinute;
  const dayStartMinutes = dayStart * 60;
  const dayEndMinutes = dayEnd * 60;

  if (totalMinutes < dayStartMinutes || totalMinutes > dayEndMinutes) {
    return null;
  }

  // Calculate position
  const minutesSinceDayStart = totalMinutes - dayStartMinutes;
  const position = (minutesSinceDayStart / 60) * pixelsPerHour;

  const timeString = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${position}px` }}
    >
      <div className="flex items-center">
        {/* Time label */}
        <div className="bg-primary text-primary-foreground text-xs font-medium px-1.5 py-0.5 rounded-r">
          {timeString}
        </div>
        
        {/* Line */}
        <div className="flex-1 h-0.5 bg-primary" />
        
        {/* Dot */}
        <div className="w-2 h-2 rounded-full bg-primary" />
      </div>
    </div>
  );
}
