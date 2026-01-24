/**
 * Emergency Timeout Countdown Display Component
 * Displays remaining time until emergency unlock auto-relocks
 * Extracted from monolithic component for reusability
 */

import React, { useState, useEffect } from 'react';
import { AccessControlUtilities } from '../../../services/AccessControlUtilities';

interface EmergencyTimeoutCountdownDisplayProps {
  startTimestamp: string;
  durationSeconds: number;
}

export const EmergencyTimeoutCountdownDisplay: React.FC<EmergencyTimeoutCountdownDisplayProps> = React.memo(({
  startTimestamp,
  durationSeconds
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(durationSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      const startTime = new Date(startTimestamp).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    // Initial calculation
    const startTime = new Date(startTimestamp).getTime();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, durationSeconds - elapsed);
    setTimeRemaining(remaining);

    return () => clearInterval(interval);
  }, [startTimestamp, durationSeconds]);

  const isCritical = timeRemaining < 300; // Less than 5 minutes

  return (
    <span 
      className={`text-lg font-bold ${isCritical ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${AccessControlUtilities.formatDuration(timeRemaining)}`}
    >
      {AccessControlUtilities.formatDuration(timeRemaining)}
    </span>
  );
});

