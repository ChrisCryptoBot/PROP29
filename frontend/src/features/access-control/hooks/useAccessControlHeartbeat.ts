/**
 * Access Control Heartbeat Tracking Hook
 * Automatically detects offline access points based on heartbeat threshold
 * Following patrol-command-center pattern
 */

import { useEffect, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { logger } from '../../../services/logger';
import type { AccessPoint } from '../../../shared/types/access-control.types';

export interface UseAccessControlHeartbeatOptions {
  accessPoints: AccessPoint[];
  setAccessPoints: Dispatch<SetStateAction<AccessPoint[]>>;
  /** Heartbeat offline threshold in minutes. Default: 15 minutes */
  heartbeatOfflineThresholdMinutes?: number;
}

export function useAccessControlHeartbeat(options: UseAccessControlHeartbeatOptions) {
  const {
    accessPoints,
    setAccessPoints,
    heartbeatOfflineThresholdMinutes = 15
  } = options;

  const updateOfflineStatus = useCallback(() => {
    if (!heartbeatOfflineThresholdMinutes) return;

    const thresholdMs = heartbeatOfflineThresholdMinutes * 60 * 1000;
    const now = Date.now();

    setAccessPoints(prev => prev.map(point => {
      // Check lastStatusChange as heartbeat indicator
      if (point.lastStatusChange) {
        const lastHeartbeat = new Date(point.lastStatusChange).getTime();
        const elapsed = now - lastHeartbeat;
        const shouldBeOffline = elapsed > thresholdMs;
        const currentOnlineStatus = point.isOnline ?? true; // undefined means online by default

        // Mark as offline if threshold exceeded and currently online
        if (shouldBeOffline && currentOnlineStatus) {
          logger.warn('Access point detected as offline via heartbeat', {
            module: 'AccessControlHeartbeat',
            accessPointId: point.id,
            elapsedMinutes: Math.round(elapsed / 60000)
          });
          return {
            ...point,
            isOnline: false
          };
        }
        
        // Mark as online if threshold not exceeded and currently offline
        if (!shouldBeOffline && point.isOnline === false) {
          logger.info('Access point reconnected', {
            module: 'AccessControlHeartbeat',
            accessPointId: point.id
          });
          return {
            ...point,
            isOnline: true
          };
        }
      }

      return point;
    }));
  }, [heartbeatOfflineThresholdMinutes, setAccessPoints]);

  useEffect(() => {
    // Check every minute
    const interval = setInterval(updateOfflineStatus, 60000);
    updateOfflineStatus(); // Initial check

    return () => clearInterval(interval);
  }, [updateOfflineStatus]);
}
