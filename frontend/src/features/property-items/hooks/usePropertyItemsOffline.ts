/**
 * Property Items Offline Hook
 * Manages offline state, caching, and sync for Property Items module
 */

import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from '../../../contexts/NetworkStatusContext';
import { propertyItemsOfflineService, type LastKnownGoodState, type OfflineAction } from '../services/PropertyItemsOfflineService';
import { logger } from '../../../services/logger';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../utils/toast';
import type { LostFoundItem } from '../../lost-and-found/types/lost-and-found.types';
import type { Package } from '../../packages/types/package.types';

/** Called for each queued action during sync. Return true to remove from queue, false to keep (retry later). */
export type SyncActionHandler = (action: OfflineAction) => Promise<boolean>;

export interface UsePropertyItemsOfflineOptions {
  /** Handlers to apply queued actions (create/update/delete for lost-found and package). If not provided, sync clears queue without API calls. */
  onSyncAction?: SyncActionHandler;
}

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

const MAX_RETRY_PER_ACTION = 3;

export function usePropertyItemsOffline(propertyId?: string, options: UsePropertyItemsOfflineOptions = {}): UsePropertyItemsOfflineReturn {
  const { onSyncAction } = options;
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
   * Sync offline queue when connection is restored.
   * Replays each queued action via onSyncAction; removes on success, keeps on 5xx or after max retries.
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
      if (!onSyncAction) {
        propertyItemsOfflineService.clearQueue();
        setQueueSize(0);
        dismissLoadingAndShowSuccess(toastId, 'Offline queue cleared.');
        return true;
      }

      let synced = 0;
      let failed = 0;
      for (const action of queue) {
        if (action.retryCount >= MAX_RETRY_PER_ACTION) {
          propertyItemsOfflineService.removeQueuedAction(action.id);
          failed++;
          continue;
        }
        try {
          const success = await onSyncAction(action);
          if (success) {
            propertyItemsOfflineService.removeQueuedAction(action.id);
            synced++;
          } else {
            propertyItemsOfflineService.incrementRetryCount(action.id);
            failed++;
          }
        } catch (err) {
          ErrorHandlerService.logError(err instanceof Error ? err : new Error(String(err)), `PropertyItems:syncAction:${action.entity}:${action.type}`);
          propertyItemsOfflineService.incrementRetryCount(action.id);
          failed++;
        }
      }

      setQueueSize(propertyItemsOfflineService.getQueueSize());

      if (failed === 0) {
        dismissLoadingAndShowSuccess(toastId, `Successfully synced ${synced} action(s).`);
        logger.info('Offline queue synced successfully', { module: 'PropertyItemsOffline', synced });
      } else if (synced > 0) {
        dismissLoadingAndShowSuccess(toastId, `Synced ${synced} action(s). ${failed} failed — will retry later.`);
      } else {
        dismissLoadingAndShowError(toastId, 'Sync failed. Actions will retry when you sync again.');
      }
      return failed === 0;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'PropertyItems:syncOfflineQueue');
      dismissLoadingAndShowError(toastId, 'Failed to sync offline actions');
      return false;
    }
  }, [isOffline, onSyncAction]);

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
