/**
 * Visitor Security Heartbeat Hook
 * Automatic offline detection for hardware devices and mobile agents based on heartbeat threshold
 * Following incident-log heartbeat pattern
 */

import { useCallback, useEffect } from 'react';
import { logger } from '../../../services/logger';
import type { HardwareDevice, MobileAgentDevice } from '../types/visitor-security.types';

export interface UseVisitorHeartbeatOptions {
  hardwareDevices: HardwareDevice[];
  setHardwareDevices: React.Dispatch<React.SetStateAction<HardwareDevice[]>>;
  mobileAgentDevices: MobileAgentDevice[];
  setMobileAgentDevices: React.Dispatch<React.SetStateAction<MobileAgentDevice[]>>;
  heartbeatOfflineThresholdMinutes?: number;
}

export function useVisitorHeartbeat(options: UseVisitorHeartbeatOptions) {
  const {
    hardwareDevices,
    setHardwareDevices,
    mobileAgentDevices,
    setMobileAgentDevices,
    heartbeatOfflineThresholdMinutes = 15
  } = options;

  const updateOfflineStatus = useCallback(() => {
    if (!heartbeatOfflineThresholdMinutes) return;

    const thresholdMs = heartbeatOfflineThresholdMinutes * 60 * 1000;
    const now = Date.now();

    // Update hardware devices
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

        // Mark as offline if threshold exceeded and currently online
        if (shouldBeOffline && device.status === 'online') {
          logger.warn('Hardware device detected as offline via heartbeat', {
            module: 'VisitorHeartbeat',
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
            module: 'VisitorHeartbeat',
            deviceId: device.device_id,
            deviceName: device.device_name
          });
          return {
            ...device,
            status: 'online' as const
          };
        }
      } catch (error) {
        // Invalid date - mark as offline
        logger.warn('Invalid heartbeat timestamp', {
          module: 'VisitorHeartbeat',
          deviceId: device.device_id,
          error: error instanceof Error ? error.message : String(error)
        });
        return { ...device, status: 'offline' as const };
      }

      return device;
    }));

    // Update mobile agent devices
    setMobileAgentDevices(prev => prev.map(agent => {
      // Check last_sync timestamp (used as heartbeat for mobile agents)
      if (!agent.last_sync) {
        return agent.status === 'offline' ? agent : { ...agent, status: 'offline' as const };
      }

      try {
        const lastSync = new Date(agent.last_sync).getTime();
        const elapsed = now - lastSync;
        const shouldBeOffline = elapsed > thresholdMs;

        // Mark as offline if threshold exceeded and currently online
        if (shouldBeOffline && agent.status === 'online') {
          logger.warn('Mobile agent detected as offline via heartbeat', {
            module: 'VisitorHeartbeat',
            agentId: agent.agent_id,
            agentName: agent.agent_name,
            elapsedMinutes: Math.round(elapsed / 60000)
          });
          return {
            ...agent,
            status: 'offline' as const
          };
        }
        
        // Mark as online if threshold not exceeded and currently offline
        if (!shouldBeOffline && agent.status === 'offline') {
          logger.info('Mobile agent reconnected', {
            module: 'VisitorHeartbeat',
            agentId: agent.agent_id,
            agentName: agent.agent_name
          });
          return {
            ...agent,
            status: 'online' as const
          };
        }
      } catch (error) {
        logger.warn('Invalid sync timestamp', {
          module: 'VisitorHeartbeat',
          agentId: agent.agent_id,
          error: error instanceof Error ? error.message : String(error)
        });
        return { ...agent, status: 'offline' as const };
      }

      return agent;
    }));
  }, [heartbeatOfflineThresholdMinutes, setHardwareDevices, setMobileAgentDevices]);

  useEffect(() => {
    // Check every minute
    const interval = setInterval(updateOfflineStatus, 60000);
    updateOfflineStatus(); // Initial check

    return () => clearInterval(interval);
  }, [updateOfflineStatus]);
}
