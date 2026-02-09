/**
 * Video Timestamp Overlay Component
 * Displays real-time clock with millisecond precision on video feeds
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../../utils/cn';

export type TimestampPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface VideoTimestampOverlayProps {
  position?: TimestampPosition;
  className?: string;
  showMilliseconds?: boolean;
}

export const VideoTimestampOverlay: React.FC<VideoTimestampOverlayProps> = ({
  position = 'top-right',
  className,
  showMilliseconds = true,
}) => {
  const [timestamp, setTimestamp] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const intervalMs = showMilliseconds ? 100 : 1000;
    const updateTimestamp = () => setTimestamp(new Date());
    updateTimestamp();
    intervalRef.current = setInterval(updateTimestamp, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showMilliseconds]);

  const formatTimestamp = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    if (showMilliseconds) {
      const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
      return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
    
    return `${hours}:${minutes}:${seconds}`;
  };

  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };

  return (
    <div
      className={cn(
        'absolute bg-black/80 text-white font-mono text-sm px-2 py-1 rounded border border-white/20 z-10',
        positionClasses[position],
        className
      )}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      {formatTimestamp(timestamp)}
    </div>
  );
};
