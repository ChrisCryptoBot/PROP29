/**
 * Property Items Offline Hook
 * Manages offline state, caching, and sync for Property Items module
 */

import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '../../../contexts/NetworkStatusContext';
import { propertyItemsOfflineService, type LastKnownGoodState, type OfflineAction } from '../services/PropertyItemsOfflineService';
import { logger } from '../../../services/logger';
import { showError, showSuccess, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../utils/toast';
import type { LostFoundItem } from '../../lost-and-found/types/lost-and-found.types';
import type { Package } from '../../packages/types/package.types';

export interface UsePropertyItemsOfflineReturn {
  isOffline: boolean;
  lastKnownGoodState: LastKnownGoodState | null;
  queueSize: number;
  hasUnsyncedChanges: boolean;
  loadLastKnownGoodState: () => LastKnownGoodState | null;
  saveLastKnownGoodState: (lostFoundItems: LostFoundItem[], packages: Package[], propertyId?: string) => void;
  queueAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  syncOfflineQueue: () => Promise<boolean>;
  clearCache: () => void;
}

export function usePropertyItemsOffline(propertyId?: string): UsePropertyItemsOfflineReturn {
  const { status: networkStatus } = useNetworkStatus();
  const isOffline = networkStatus === 'offline' || networkStatus === 'reconnecting';
  
  const [lastKnownGoodState, setLastKnownGoodState] = useState<LastKnownGoodState | null>(null);
  const [queueSize, setQueueSize] = useState(0);

  /**
   * Load Last Known Good State from cache
   */
  const loadLastKnownGoodState = useCallback((): LastKnownGoodState | null => {
    const state = propertyItemsOfflineService.getLastKnownGoodState(propertyId);
    setLastKnownGoodState(state);
    return state;
  }, [propertyId]);

  /**
   * Save Last Known Good State to cache
   */
  const saveLastKnownGoodState = useCallback((
    lostFoundItems: LostFoundItem[],
    packages: Package[],
    propertyIdParam?: string
  ) => {
    propertyItemsOfflineService.saveLastKnownGoodState(
      lostFoundItems,
      packages,
      propertyIdParam || propertyId
    );
    setLastKnownGoodState({
      lostFoundItems,
      packages,
      timestamp: Date.now(),
      propertyId: propertyIdParam || propertyId
    });
  }, [propertyId]);

  /**
   * Queue action for offline sync
   */
  const queueAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    propertyItemsOfflineService.queueAction(action);
    setQueueSize(propertyItemsOfflineService.getQueueSize());
  }, []);

  /**
   * Sync offline queue when connection is restored
   */
  const syncOfflineQueue = useCallback(async (): Promise<boolean> => {
    if (isOffline) {
      showError('Cannot sync while offline');
      return false;
    }

    const queue = propertyItemsOfflineService.getQueue();
    if (queue.length === 0) {
      return true;
    }

    const toastId = showLoading(`Syncing ${queue.length} offline action(s)...`);
    
    try {
      // TODO: Implement actual sync logic
      // For now, we'll just clear the queue after a delay
      // In production, this would:
      // 1. Process each queued action
      // 2. Call appropriate API endpoints
      // 3. Handle conflicts and retries
      // 4. Remove successfully synced actions
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate successful sync
      propertyItemsOfflineService.clearQueue();
      setQueueSize(0);
      
      dismissLoadingAndShowSuccess(toastId, `Successfully synced ${queue.length} action(s)`);
      logger.info('Offline queue synced successfully', {
        module: 'PropertyItemsOffline',
        actionCount: queue.length
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to sync offline queue', error instanceof Error ? error : new Error(String(error)), {
        module: 'PropertyItemsOffline'
      });
      dismissLoadingAndShowError(toastId, 'Failed to sync offline actions');
      return false;
    }
  }, [isOffline]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    propertyItemsOfflineService.clearLastKnownGoodState();
    setLastKnownGoodState(null);
  }, []);

  // Update queue size periodically
  useEffect(() => {
    const updateQueueSize = () => {
      setQueueSize(propertyItemsOfflineService.getQueueSize());
    };
    
    updateQueueSize();
    const interval = setInterval(updateQueueSize, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load Last Known Good State on mount
  useEffect(() => {
    if (isOffline) {
      const state = loadLastKnownGoodState();
      if (state) {
        logger.info('Loaded Last Known Good State for offline mode', {
          module: 'PropertyItemsOffline',
          itemCount: state.lostFoundItems.length,
          packageCount: state.packages.length
        });
      }
    }
  }, [isOffline, loadLastKnownGoodState]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOffline && queueSize > 0) {
      const queue = propertyItemsOfflineService.getQueue();
      if (queue.length > 0) {
        logger.info('Connection restored, syncing offline queue', {
          module: 'PropertyItemsOffline',
          queueSize: queue.length
        });
        // Auto-sync after a short delay to ensure connection is stable
        const timeout = setTimeout(() => {
          syncOfflineQueue();
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [isOffline, queueSize, syncOfflineQueue]);

  return {
    isOffline,
    lastKnownGoodState,
    queueSize,
    hasUnsyncedChanges: queueSize > 0,
    loadLastKnownGoodState,
    saveLastKnownGoodState,
    queueAction,
    syncOfflineQueue,
    clearCache
  };
}
