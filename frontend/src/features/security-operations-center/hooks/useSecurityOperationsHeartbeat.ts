/**
 * Security Operations Center Heartbeat Tracking Hook
 * Automatically detects offline cameras based on heartbeat threshold
 * Implements deterministic "last known good state" pattern
 */

import { useEffect, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { logger } from '../../../services/logger';
import type { CameraEntry } from '../types/security-operations.types';

export interface UseSecurityOperationsHeartbeatOptions {
  cameras: CameraEntry[];
  setCameras: Dispatch<SetStateAction<CameraEntry[]>>;
  /** Heartbeat offline threshold in minutes. Default: 15 minutes */
  heartbeatOfflineThresholdMinutes?: number;
}

export function useSecurityOperationsHeartbeat(options: UseSecurityOperationsHeartbeatOptions) {
  const {
    cameras,
    setCameras,
    heartbeatOfflineThresholdMinutes = 15
  } = options;

  const updateOfflineStatus = useCallback(() => {
    if (!heartbeatOfflineThresholdMinutes) return;

    const thresholdMs = heartbeatOfflineThresholdMinutes * 60 * 1000;
    const now = Date.now();

    setCameras(prev => prev.map(camera => {
      // If camera status is already offline or maintenance, preserve last known state
      if (camera.status === 'offline' || camera.status === 'maintenance') {
        return camera;
      }

      // Check heartbeat timestamp if available
      if (camera.lastHeartbeat) {
        try {
          const lastHeartbeatTime = new Date(camera.lastHeartbeat).getTime();
          const elapsed = now - lastHeartbeatTime;
          
          if (elapsed > thresholdMs) {
            // Camera has exceeded heartbeat threshold - mark as offline
            logger.warn('Camera heartbeat threshold exceeded', {
              module: 'SecurityOperationsHeartbeat',
              cameraId: camera.id,
              cameraName: camera.name,
              elapsedMinutes: Math.floor(elapsed / 60000),
              thresholdMinutes: heartbeatOfflineThresholdMinutes,
            });

            // Preserve last known good state before marking offline
            const lastKnownState = {
              timestamp: new Date().toISOString(),
              status: camera.status,
              imageUrl: camera.lastKnownImageUrl,
              isRecording: camera.isRecording,
              motionDetectionEnabled: camera.motionDetectionEnabled,
            };

            return {
              ...camera,
              status: 'offline' as const,
              lastKnownState,
            };
          }
        } catch (error) {
          logger.error(
            'Failed to parse heartbeat timestamp',
            error instanceof Error ? error : new Error(String(error)),
            { module: 'SecurityOperationsHeartbeat', cameraId: camera.id, lastHeartbeat: camera.lastHeartbeat }
          );
        }
      }

      // If no heartbeat timestamp but camera is online, check lastStatusChange
      if (camera.lastStatusChange && camera.status === 'online') {
        try {
          const lastStatusChangeTime = new Date(camera.lastStatusChange).getTime();
          const elapsed = now - lastStatusChangeTime;
          
          // Use a longer threshold for status change (30 minutes default)
          const statusThresholdMs = heartbeatOfflineThresholdMinutes * 2 * 60 * 1000;
          
          if (elapsed > statusThresholdMs) {
            logger.warn('Camera status change threshold exceeded', {
              module: 'SecurityOperationsHeartbeat',
              cameraId: camera.id,
              cameraName: camera.name,
              elapsedMinutes: Math.floor(elapsed / 60000),
            });

            const lastKnownState = {
              timestamp: new Date().toISOString(),
              status: camera.status,
              imageUrl: camera.lastKnownImageUrl,
              isRecording: camera.isRecording,
              motionDetectionEnabled: camera.motionDetectionEnabled,
            };

            return {
              ...camera,
              status: 'offline' as const,
              lastKnownState,
            };
          }
        } catch (error) {
          logger.error(
            'Failed to parse status change timestamp',
            error instanceof Error ? error : new Error(String(error)),
            { module: 'SecurityOperationsHeartbeat', cameraId: camera.id, lastStatusChange: camera.lastStatusChange }
          );
        }
      }

      return camera;
    }));
  }, [heartbeatOfflineThresholdMinutes, setCameras]);

  useEffect(() => {
    // Check every minute for heartbeat staleness
    const interval = setInterval(updateOfflineStatus, 60000);
    updateOfflineStatus(); // Initial check

    return () => clearInterval(interval);
  }, [updateOfflineStatus]);
}
