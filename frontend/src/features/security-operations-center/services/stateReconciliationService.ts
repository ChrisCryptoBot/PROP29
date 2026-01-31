/**
 * State Reconciliation Service
 * Resolves conflicts between WebSocket updates and REST refreshes
 */

import { logger } from '../../../services/logger';
import type { CameraEntry } from '../types/security-operations.types';

export interface ReconciliationResult<T> {
  resolved: T;
  conflict: boolean;
  resolution: 'websocket' | 'rest' | 'merged';
}

/**
 * Reconcile camera state between WebSocket update and local state
 * Uses version/timestamp for deterministic conflict resolution
 */
export function reconcileCameraState(
  localCamera: CameraEntry,
  websocketCamera: Partial<CameraEntry>,
  websocketTimestamp?: string
): ReconciliationResult<CameraEntry> {
  // Use version for optimistic locking if available
  const localVersion = localCamera.version || 1;
  const wsVersion = (websocketCamera as any).version || localVersion;
  
  // Use lastUpdated timestamp if version not available
  const localTimestamp = localCamera.lastUpdated || localCamera.lastStatusChange || new Date().toISOString();
  const wsTimestamp = websocketTimestamp || (websocketCamera as any).lastUpdated || (websocketCamera as any).lastStatusChange || new Date().toISOString();
  
  // Compare versions first (more reliable than timestamps)
  const wsIsNewer = wsVersion > localVersion || (wsVersion === localVersion && new Date(wsTimestamp) > new Date(localTimestamp));
  
  // Check for conflicts (same field changed in both)
  const conflicts: string[] = [];
  const criticalFields = ['status', 'isRecording', 'motionDetectionEnabled', 'lastHeartbeat'];
  
  for (const field of criticalFields) {
    if (field in websocketCamera && (localCamera as any)[field] !== (websocketCamera as any)[field]) {
      conflicts.push(field);
    }
  }
  
  if (conflicts.length > 0 && !wsIsNewer) {
    // Conflict detected, prefer local (REST) if it's newer or same version
    logger.warn('Camera state conflict detected, preferring local state', {
      module: 'StateReconciliation',
      cameraId: localCamera.id,
      conflicts,
      localVersion,
      wsVersion,
    });
    return {
      resolved: localCamera,
      conflict: true,
      resolution: 'rest'
    };
  }
  
  // Merge states - prefer WebSocket for newer, preserve lastKnownState if transitioning offline
  const resolved: CameraEntry = {
    ...localCamera,
    ...websocketCamera,
    id: localCamera.id, // Never change ID
    // Preserve lastKnownState if camera is going offline
    lastKnownState: websocketCamera.status === 'offline' && localCamera.status === 'online' && localCamera.lastKnownState
      ? localCamera.lastKnownState
      : websocketCamera.lastKnownState || localCamera.lastKnownState,
  } as CameraEntry;
  
  logger.info('Camera state reconciled', {
    module: 'StateReconciliation',
    cameraId: localCamera.id,
    resolution: wsIsNewer ? 'websocket' : 'merged',
    localVersion,
    wsVersion,
  });
  
  return {
    resolved,
    conflict: conflicts.length > 0,
    resolution: wsIsNewer ? 'websocket' : 'merged'
  };
}

/**
 * Reconcile array of cameras
 */
export function reconcileCameraArray(
  localCameras: CameraEntry[],
  websocketUpdate: Partial<CameraEntry> & { id: string }
): CameraEntry[] {
  const localIndex = localCameras.findIndex(c => c.id === websocketUpdate.id);
  
  if (localIndex === -1) {
    // New camera from WebSocket
    return [...localCameras, websocketUpdate as CameraEntry];
  }
  
  const localCamera = localCameras[localIndex];
  const result = reconcileCameraState(localCamera, websocketUpdate);
  
  const updated = [...localCameras];
  updated[localIndex] = result.resolved;
  
  return updated;
}
