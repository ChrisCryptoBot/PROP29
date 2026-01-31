/**
 * Access Control State Reconciliation Hook
 * Handles state reconciliation between WebSocket updates and API responses
 * Prevents race conditions and ensures data consistency
 */

import { useEffect, useCallback } from 'react';
import { StateUpdateService } from '../../../services/StateUpdateService';
import { logger } from '../../../services/logger';
import type { AccessPoint, AccessControlUser } from '../../../shared/types/access-control.types';

export interface UseAccessControlStateReconciliationOptions {
  accessPoints: AccessPoint[];
  users: AccessControlUser[];
  setAccessPoints: React.Dispatch<React.SetStateAction<AccessPoint[]>>;
  setUsers: React.Dispatch<React.SetStateAction<AccessControlUser[]>>;
}

export function useAccessControlStateReconciliation(options: UseAccessControlStateReconciliationOptions) {
  const {
    accessPoints,
    users,
    setAccessPoints,
    setUsers
  } = options;

  // Reconcile access points state
  const reconcileAccessPoints = useCallback(() => {
    // Check for duplicate IDs (shouldn't happen, but handle gracefully)
    const seenIds = new Set<string>();
    const duplicates: string[] = [];
    
    accessPoints.forEach(point => {
      if (seenIds.has(point.id)) {
        duplicates.push(point.id);
      } else {
        seenIds.add(point.id);
      }
    });

    if (duplicates.length > 0) {
      logger.warn('Duplicate access point IDs detected, removing duplicates', {
        module: 'AccessControlStateReconciliation',
        duplicateIds: duplicates
      });
      // Remove duplicates, keeping the first occurrence
      const unique = accessPoints.filter((point, index, self) =>
        index === self.findIndex(p => p.id === point.id)
      );
      setAccessPoints(unique);
    }

    // Reconcile offline status with lastStatusChange
    const now = Date.now();
    const reconciled = accessPoints.map(point => {
      if (!point.lastStatusChange) {
        return point;
      }

      const lastChange = new Date(point.lastStatusChange).getTime();
      const timeSinceLastChange = now - lastChange;
      const OFFLINE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

      // If lastStatusChange is too old and point is marked online, mark as offline
      if (timeSinceLastChange > OFFLINE_THRESHOLD_MS && point.isOnline) {
        logger.debug('Reconciling access point offline status', {
          module: 'AccessControlStateReconciliation',
          accessPointId: point.id,
          timeSinceLastChange: timeSinceLastChange
        });
        return { ...point, isOnline: false };
      }

      // If lastStatusChange is recent and point is marked offline, mark as online
      if (timeSinceLastChange <= OFFLINE_THRESHOLD_MS && !point.isOnline) {
        logger.debug('Reconciling access point online status', {
          module: 'AccessControlStateReconciliation',
          accessPointId: point.id,
          timeSinceLastChange: timeSinceLastChange
        });
        return { ...point, isOnline: true };
      }

      return point;
    });

    // Only update if changes were made
    const hasChanges = reconciled.some((point, index) => point !== accessPoints[index]);
    if (hasChanges) {
      setAccessPoints(reconciled);
    }
  }, [accessPoints, setAccessPoints]);

  // Reconcile users state
  const reconcileUsers = useCallback(() => {
    // Check for duplicate IDs
    const seenIds = new Set<string>();
    const duplicates: string[] = [];
    
    users.forEach(user => {
      if (seenIds.has(user.id)) {
        duplicates.push(user.id);
      } else {
        seenIds.add(user.id);
      }
    });

    if (duplicates.length > 0) {
      logger.warn('Duplicate user IDs detected, removing duplicates', {
        module: 'AccessControlStateReconciliation',
        duplicateIds: duplicates
      });
      // Remove duplicates, keeping the first occurrence
      const unique = users.filter((user, index, self) =>
        index === self.findIndex(u => u.id === user.id)
      );
      setUsers(unique);
    }
  }, [users, setUsers]);

  // Run reconciliation on data changes (debounced)
  useEffect(() => {
    if (accessPoints.length > 0) {
      const timeoutId = setTimeout(reconcileAccessPoints, 1000); // Debounce 1 second
      return () => clearTimeout(timeoutId);
    }
  }, [accessPoints, reconcileAccessPoints]);

  useEffect(() => {
    if (users.length > 0) {
      const timeoutId = setTimeout(reconcileUsers, 1000); // Debounce 1 second
      return () => clearTimeout(timeoutId);
    }
  }, [users, reconcileUsers]);

  return {
    reconcileAccessPoints,
    reconcileUsers
  };
}
