/**
 * Incident Log Heartbeat Hook
 * Automatic offline detection for hardware devices based on heartbeat threshold
 * Following access-control heartbeat pattern
 */

import { useCallback, useEffect } from 'react';
import { logger } from '../../../services/logger';
import type { DeviceHealthStatus } from '../types/incident-log.types';

export interface UseIncidentLogHeartbeatOptions {
  hardwareDevices: DeviceHealthStatus[];
  setHardwareDevices: React.Dispatch<React.SetStateAction<DeviceHealthStatus[]>>;
  heartbeatOfflineThresholdMinutes?: number;
}

export function useIncidentLogHeartbeat(options: UseIncidentLogHeartbeatOptions) {
  const {
    hardwareDevices,
    setHardwareDevices,
    heartbeatOfflineThresholdMinutes = 15
  } = options;

  const updateOfflineStatus = useCallback(() => {
    if (!heartbeatOfflineThresholdMinutes) return;

    const thresholdMs = heartbeatOfflineThresholdMinutes * 60 * 1000;
    const now = Date.now();

    setHardwareDevices(prev => prev.map(device => {
      // Check last_heartbeat timestamp
      if (!device.last_heartbeat) {
        // No heartbeat data - keep current status or mark as offline
        return device.status === 'offline' ? device : { ...device, status: 'offline' as const };
      }

      try {
        const lastHeartbeat = new Date(device.last_heartbeat).getTime();
        const elapsed = now - lastHeartbeat;
        const shouldBeOffline = elapsed > thresholdMs;

        // Mark as offline if threshold exceeded and currently online/degraded
        if (shouldBeOffline && (device.status === 'online' || device.status === 'degraded')) {
          logger.warn('Hardware device detected as offline via heartbeat', {
            module: 'IncidentLogHeartbeat',
            deviceId: device.device_id,
            deviceName: device.device_name,
            elapsedMinutes: Math.round(elapsed / 60000)
          });
          return {
            ...device,
            status: 'offline' as const
          };
        }
        
        // Mark as online if threshold not exceeded and currently offline
        if (!shouldBeOffline && device.status === 'offline') {
          logger.info('Hardware device reconnected', {
            module: 'IncidentLogHeartbeat',
            deviceId: device.device_id,
            deviceName: device.device_name
          });
          return {
            ...device,
            status: 'online' as const
          };
        }
      } catch (error) {
        // Invalid date - mark as unknown
        logger.warn('Invalid heartbeat timestamp', {
          module: 'IncidentLogHeartbeat',
          deviceId: device.device_id,
          error: error instanceof Error ? error.message : String(error)
        });
        return { ...device, status: 'offline' as const };
      }

      return device;
    }));
  }, [heartbeatOfflineThresholdMinutes, setHardwareDevices]);

  useEffect(() => {
    // Check every minute
    const interval = setInterval(updateOfflineStatus, 60000);
    updateOfflineStatus(); // Initial check

    return () => clearInterval(interval);
  }, [updateOfflineStatus]);
}
