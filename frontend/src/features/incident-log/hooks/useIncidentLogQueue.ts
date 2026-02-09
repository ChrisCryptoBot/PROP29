/**
 * Offline queue for incident log operations
 * Queues operations when offline and syncs when online
 * Following access-control queue pattern
 */

import { useCallback, useEffect, useState } from 'react';
import { showSuccess } from '../../../utils/toast';
import { logger } from '../../../services/logger';
import incidentService from '../services/IncidentService';
import type { IncidentCreate, IncidentUpdate, IncidentStatus } from '../types/incident-log.types';

const QUEUE_KEY = 'incident-log.operation.queue';
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const MAX_QUEUE_SIZE = 100;

export type QueuedOperationType = 
  | 'create_incident'
  | 'update_incident'
  | 'delete_incident'
  | 'create_emergency_alert'
  | 'bulk_approve'
  | 'bulk_reject'
  | 'bulk_delete'
  | 'bulk_status_change';

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
    // Enforce queue size limit - remove oldest items if limit exceeded
    let limitedQueue = queue;
    if (limitedQueue.length > MAX_QUEUE_SIZE) {
      // Sort by queuedAt, keep most recent
      limitedQueue = limitedQueue
        .sort((a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime())
        .slice(0, MAX_QUEUE_SIZE);
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(limitedQueue));
  } catch (e) {
    // Silently fail - queue persistence is best-effort
    logger.warn('Failed to save operation queue', { module: 'IncidentLogQueue', action: 'saveQueue' });
  }
}

function backoffMs(retryCount: number): number {
  return Math.min(BASE_BACKOFF_MS * Math.pow(2, retryCount), MAX_BACKOFF_MS);
}

export interface UseIncidentLogQueueOptions {
  onSynced?: () => void;
  /** Flush interval in ms. Default 30000 (30 seconds). */
  flushIntervalMs?: number;
}

export function useIncidentLogQueue(options: UseIncidentLogQueueOptions = {}) {
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
      logger.info('Operation queued', { module: 'IncidentLogQueue', action: 'enqueue', operationType: operation.type, id });
      return id;
    },
    [persist]
  );

  const executeOperation = useCallback(async (op: QueuedOperation): Promise<boolean> => {
    const assertSuccess = (response: { success?: boolean; error?: string; statusCode?: number }) => {
      if (!response.success) {
        const err = new Error(response.error || 'Request failed') as Error & { statusCode?: number };
        err.statusCode = response.statusCode;
        throw err;
      }
    };
    try {
      switch (op.type) {
        case 'create_incident': {
          const res = await incidentService.createIncident(op.payload as unknown as IncidentCreate);
          assertSuccess(res);
          break;
        }
        case 'update_incident': {
          const res = await incidentService.updateIncident(op.payload.incidentId as string, op.payload.updates as unknown as IncidentUpdate);
          assertSuccess(res);
          break;
        }
        case 'delete_incident': {
          const res = await incidentService.deleteIncident(op.payload.incidentId as string);
          assertSuccess(res);
          break;
        }
        case 'create_emergency_alert': {
          const res = await incidentService.createEmergencyAlert(op.payload.alert as any);
          assertSuccess(res);
          break;
        }
        case 'bulk_approve': {
          const res = await incidentService.bulkApproveIncidents(
            op.payload.incidentIds as string[],
            op.payload.reason as string | undefined,
            op.payload.propertyId as string | undefined
          );
          assertSuccess(res);
          break;
        }
        case 'bulk_reject': {
          const res = await incidentService.bulkRejectIncidents(
            op.payload.incidentIds as string[],
            op.payload.reason as string,
            op.payload.propertyId as string | undefined
          );
          assertSuccess(res);
          break;
        }
        case 'bulk_delete': {
          const res = await incidentService.bulkDeleteIncidents(
            op.payload.incidentIds as string[],
            op.payload.propertyId as string | undefined
          );
          assertSuccess(res);
          break;
        }
        case 'bulk_status_change': {
          const res = await incidentService.bulkStatusChange(
            op.payload.incidentIds as string[],
            op.payload.status as IncidentStatus,
            op.payload.reason as string | undefined,
            op.payload.propertyId as string | undefined
          );
          assertSuccess(res);
          break;
        }
        default:
          logger.warn('Unknown operation type', { module: 'IncidentLogQueue', action: 'executeOperation', type: op.type });
          return false;
      }
      return true;
    } catch (error) {
      logger.error('Operation execution failed', error instanceof Error ? error : new Error(String(error)), {
        module: 'IncidentLogQueue',
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
        const statusCode = err && typeof (err as any).statusCode === 'number' ? (err as any).statusCode : undefined;
        const is4xx = statusCode >= 400 && statusCode < 500;
        const nextRetry = is4xx ? MAX_RETRIES : e.retry_count + 1;
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
    const failed = q.filter((e) => e.sync_status === 'failed');
    if (failed.length === 0) return;

    const updated = q.map((e) => {
      if (e.sync_status === 'failed') {
        return {
          ...e,
          sync_status: 'pending' as const,
          retry_count: 0,
          last_retry: new Date(0).toISOString(),
          error: undefined
        };
      }
      return e;
    });
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

  const intervalMs = options.flushIntervalMs ?? 30000;

  useEffect(() => {
    const handleOnline = () => {
      logger.info('Network online, flushing queue', { module: 'IncidentLogQueue' });
      flush();
    };
    window.addEventListener('online', handleOnline);
    const interval = setInterval(flush, intervalMs);
    flush(); // Initial flush
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
    failedCount,
  };
}
