/**
 * Offline queue for access control operations
 * Queues operations when offline and syncs when online
 * Following patrol-command-center check-in queue pattern
 */

import { useCallback, useEffect, useState } from 'react';
import apiService from '../../../services/ApiService';
import { showSuccess } from '../../../utils/toast';
import { logger } from '../../../services/logger';
import type { AccessPoint, AccessControlUser } from '../../../shared/types/access-control.types';

const QUEUE_KEY = 'access-control.operation.queue';
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const MAX_QUEUE_SIZE = 100;

export type QueuedOperationType = 
  | 'create_access_point'
  | 'update_access_point'
  | 'delete_access_point'
  | 'toggle_access_point'
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'sync_cached_events'
  | 'emergency_lockdown'
  | 'emergency_unlock'
  | 'emergency_restore'
  | 'review_agent_event';

export interface QueuedOperation {
  id: string;
  type: QueuedOperationType;
  payload: Record<string, unknown>;
  queuedAt: string;
  sync_status: 'pending' | 'synced' | 'failed';
  retry_count: number;
  last_retry: string;
  error?: string;
}

function loadQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedOperation[]) {
  try {
    // Enforce queue size limit
    const limitedQueue = queue.slice(0, MAX_QUEUE_SIZE);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(limitedQueue));
  } catch (e) {
    // Silently fail - queue persistence is best-effort
    logger.warn('Failed to save operation queue', { module: 'AccessControlQueue', action: 'saveQueue' });
  }
}

function backoffMs(retryCount: number): number {
  return Math.min(BASE_BACKOFF_MS * Math.pow(2, retryCount), MAX_BACKOFF_MS);
}

export interface UseAccessControlQueueOptions {
  onSynced?: () => void;
  /** Flush interval in ms. Default 60000. */
  flushIntervalMs?: number;
}

export function useAccessControlQueue(options: UseAccessControlQueueOptions = {}) {
  const [queue, setQueue] = useState<QueuedOperation[]>(loadQueue);

  const persist = useCallback((q: QueuedOperation[]) => {
    setQueue(q);
    saveQueue(q);
  }, []);

  const enqueue = useCallback(
    (operation: Omit<QueuedOperation, 'id' | 'sync_status' | 'retry_count' | 'last_retry'>) => {
      const id = crypto.randomUUID();
      const full: QueuedOperation = {
        ...operation,
        id,
        sync_status: 'pending',
        retry_count: 0,
        last_retry: new Date(0).toISOString()
      };
      const q = loadQueue();
      q.push(full);
      persist(q);
      logger.info('Operation queued', { module: 'AccessControlQueue', action: 'enqueue', operationType: operation.type, id });
      return id;
    },
    [persist]
  );

  const executeOperation = useCallback(async (op: QueuedOperation): Promise<boolean> => {
    try {
      switch (op.type) {
        case 'create_access_point':
          await apiService.post('/access-control/points', op.payload);
          break;
        case 'update_access_point':
          await apiService.put(`/access-control/points/${op.payload.id}`, op.payload);
          break;
        case 'delete_access_point':
          await apiService.delete(`/access-control/points/${op.payload.id}`);
          break;
        case 'toggle_access_point':
          await apiService.put(`/access-control/points/${op.payload.id}`, { status: op.payload.status });
          break;
        case 'create_user':
          await apiService.post('/access-control/users', op.payload);
          break;
        case 'update_user':
          await apiService.put(`/access-control/users/${op.payload.id}`, op.payload);
          break;
        case 'delete_user':
          await apiService.delete(`/access-control/users/${op.payload.id}`);
          break;
        case 'sync_cached_events':
          await apiService.post('/access-control/events/sync', op.payload);
          break;
        case 'emergency_lockdown':
          await apiService.post('/access-control/emergency/lockdown', op.payload);
          break;
        case 'emergency_unlock':
          await apiService.post('/access-control/emergency/unlock', op.payload);
          break;
        case 'emergency_restore':
          await apiService.post('/access-control/emergency/restore', op.payload);
          break;
        case 'review_agent_event':
          await apiService.put(`/access-control/events/${op.payload.eventId}/review`, {}, {
            params: { action: op.payload.action, reason: op.payload.reason }
          });
          break;
        default:
          logger.warn('Unknown operation type', { module: 'AccessControlQueue', action: 'executeOperation', type: op.type });
          return false;
      }
      return true;
    } catch (error) {
      logger.error('Operation execution failed', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControlQueue',
        action: 'executeOperation',
        operationType: op.type,
        operationId: op.id
      });
      throw error;
    }
  }, []);

  const flush = useCallback(async () => {
    if (!navigator.onLine) return;
    const q = loadQueue();
    const pending = q.filter((e) => e.sync_status === 'pending' || e.sync_status === 'failed');
    if (pending.length === 0) return;

    const now = Date.now();
    const updated = [...q];
    let changed = false;

    for (let i = 0; i < updated.length; i++) {
      const e = updated[i];
      if (e.sync_status === 'synced') continue;

      const elapsed = now - new Date(e.last_retry).getTime();
      if (elapsed < backoffMs(e.retry_count)) continue;

      try {
        await executeOperation(e);
        updated[i] = { ...e, sync_status: 'synced' };
        changed = true;
      } catch (err) {
        const nextRetry = e.retry_count + 1;
        updated[i] = {
          ...e,
          sync_status: nextRetry >= MAX_RETRIES ? 'failed' : 'pending',
          retry_count: nextRetry,
          last_retry: new Date().toISOString(),
          error: err instanceof Error ? err.message : String(err)
        };
        changed = true;
      }
    }

    if (changed) {
      const remaining = updated.filter((e) => e.sync_status !== 'synced');
      persist(remaining);
      const syncedCount = updated.filter((e) => e.sync_status === 'synced').length;
      if (syncedCount > 0) {
        showSuccess(`Synced ${syncedCount} queued operation(s)`);
        options.onSynced?.();
      }
    }
  }, [options.onSynced, persist, executeOperation]);

  const retryFailed = useCallback(() => {
    const q = loadQueue();
    const updated = q.map((e) =>
      e.sync_status === 'failed'
        ? {
            ...e,
            sync_status: 'pending' as const,
            retry_count: 0,
            last_retry: new Date(0).toISOString(),
            error: undefined
          }
        : e
    );
    persist(updated);
    flush();
  }, [persist, flush]);

  const removeQueuedOperation = useCallback(
    (id: string) => {
      const q = loadQueue().filter((e) => e.id !== id);
      persist(q);
    },
    [persist]
  );

  const loadQueueFromStorage = useCallback(() => {
    const q = loadQueue();
    setQueue(q);
    return q;
  }, []);

  const intervalMs = options.flushIntervalMs ?? 60000;

  useEffect(() => {
    const handleOnline = () => flush();
    window.addEventListener('online', handleOnline);
    const interval = setInterval(flush, intervalMs);
    flush();
    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [flush, intervalMs]);

  const pendingCount = queue.filter((e) => e.sync_status === 'pending').length;
  const failedCount = queue.filter((e) => e.sync_status === 'failed').length;

  return {
    loadQueue: loadQueueFromStorage,
    enqueue,
    flush,
    retryFailed,
    removeQueuedOperation,
    queue,
    pendingCount,
    failedCount
  };
}
