/**
 * Property Items Offline Service
 * Manages offline state, Last Known Good State caching, and action queue
 */

import type { LostFoundItem } from '../../lost-and-found/types/lost-and-found.types';
import type { Package } from '../../packages/types/package.types';
import { logger } from '../../../services/logger';

const CACHE_KEY = 'property-items-lkg-state';
const QUEUE_KEY = 'property-items-offline-queue';
const CACHE_TIMESTAMP_KEY = 'property-items-cache-timestamp';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface LastKnownGoodState {
  lostFoundItems: LostFoundItem[];
  packages: Package[];
  timestamp: number;
  propertyId?: string;
}

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'lost-found' | 'package';
  data: unknown;
  timestamp: number;
  retryCount: number;
}

class PropertyItemsOfflineService {
  /**
   * Save Last Known Good State to localStorage
   */
  saveLastKnownGoodState(
    lostFoundItems: LostFoundItem[],
    packages: Package[],
    propertyId?: string
  ): void {
    try {
      const state: LastKnownGoodState = {
        lostFoundItems,
        packages,
        timestamp: Date.now(),
        propertyId
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(state));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
      logger.info('Last Known Good State saved', {
        module: 'PropertyItemsOffline',
        itemCount: lostFoundItems.length,
        packageCount: packages.length
      });
    } catch (error) {
      logger.error('Failed to save Last Known Good State', error instanceof Error ? error : new Error(String(error)), {
        module: 'PropertyItemsOffline'
      });
    }
  }

  /**
   * Get Last Known Good State from localStorage
   */
  getLastKnownGoodState(propertyId?: string): LastKnownGoodState | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const state: LastKnownGoodState = JSON.parse(cached);
      
      // Check if cache is expired
      const cacheAge = Date.now() - state.timestamp;
      if (cacheAge > CACHE_EXPIRY_MS) {
        logger.warn('Last Known Good State expired', {
          module: 'PropertyItemsOffline',
          age: cacheAge
        });
        this.clearLastKnownGoodState();
        return null;
      }

      // Check if property ID matches (if provided)
      if (propertyId && state.propertyId && state.propertyId !== propertyId) {
        logger.warn('Last Known Good State property ID mismatch', {
          module: 'PropertyItemsOffline',
          cached: state.propertyId,
          requested: propertyId
        });
        return null;
      }

      return state;
    } catch (error) {
      logger.error('Failed to get Last Known Good State', error instanceof Error ? error : new Error(String(error)), {
        module: 'PropertyItemsOffline'
      });
      return null;
    }
  }

  /**
   * Clear Last Known Good State
   */
  clearLastKnownGoodState(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
      logger.error('Failed to clear Last Known Good State', error instanceof Error ? error : new Error(String(error)), {
        module: 'PropertyItemsOffline'
      });
    }
  }

  /**
   * Add action to offline queue
   */
  queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): void {
    try {
      const queue = this.getQueue();
      const newAction: OfflineAction = {
        ...action,
        id: `${action.entity}-${action.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0
      };
      queue.push(newAction);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      logger.info('Action queued for offline sync', {
        module: 'PropertyItemsOffline',
        actionId: newAction.id,
        type: action.type,
        entity: action.entity
      });
    } catch (error) {
      logger.error('Failed to queue action', error instanceof Error ? error : new Error(String(error)), {
        module: 'PropertyItemsOffline'
      });
    }
  }

  /**
   * Get all queued actions
   */
  getQueue(): OfflineAction[] {
    try {
      const queue = localStorage.getItem(QUEUE_KEY);
      if (!queue) return [];
      return JSON.parse(queue) as OfflineAction[];
    } catch (error) {
      logger.error('Failed to get queue', error instanceof Error ? error : new Error(String(error)), {
        module: 'PropertyItemsOffline'
      });
      return [];
    }
  }

  /**
   * Remove action from queue (after successful sync)
   */
  removeQueuedAction(actionId: string): void {
    try {
      const queue = this.getQueue();
      const filtered = queue.filter(a => a.id !== actionId);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      logger.error('Failed to remove queued action', error instanceof Error ? error : new Error(String(error)), {
        module: 'PropertyItemsOffline',
        actionId
      });
    }
  }

  /**
   * Increment retry count for an action
   */
  incrementRetryCount(actionId: string): void {
    try {
      const queue = this.getQueue();
      const action = queue.find(a => a.id === actionId);
      if (action) {
        action.retryCount += 1;
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      logger.error('Failed to increment retry count', error instanceof Error ? error : new Error(String(error)), {
        module: 'PropertyItemsOffline',
        actionId
      });
    }
  }

  /**
   * Clear all queued actions
   */
  clearQueue(): void {
    try {
      localStorage.removeItem(QUEUE_KEY);
    } catch (error) {
      logger.error('Failed to clear queue', error instanceof Error ? error : new Error(String(error)), {
        module: 'PropertyItemsOffline'
      });
    }
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.getQueue().length;
  }

  /**
   * Check if cache is stale (older than threshold)
   */
  isCacheStale(thresholdMs: number = 5 * 60 * 1000): boolean {
    try {
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (!timestamp) return true;
      const age = Date.now() - parseInt(timestamp, 10);
      return age > thresholdMs;
    } catch {
      return true;
    }
  }
}

// Export singleton instance
export const propertyItemsOfflineService = new PropertyItemsOfflineService();
export default propertyItemsOfflineService;
