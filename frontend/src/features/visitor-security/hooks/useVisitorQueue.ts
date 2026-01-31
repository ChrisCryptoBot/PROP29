/**
 * Visitor Security Offline Queue Hook
 * Queues visitor/event/security-request operations when offline and syncs when online.
 */

import { useCallback, useEffect, useState } from 'react';
import { showSuccess } from '../../../utils/toast';
import { logger } from '../../../services/logger';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import visitorService from '../services/VisitorService';
import type { VisitorCreate, VisitorUpdate, SecurityRequestCreate, EventCreate } from '../types/visitor-security.types';

const QUEUE_KEY = 'visitor-security.operation.queue';
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const MAX_QUEUE_SIZE = 100;

export type QueuedOperationType =
  | 'create_visitor'
  | 'update_visitor'
  | 'delete_visitor'
  | 'check_in_visitor'
  | 'check_out_visitor'
  | 'create_security_request'
  | 'create_event'
  | 'delete_event';

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
    const limitedQueue = queue.slice(0, MAX_QUEUE_SIZE);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(limitedQueue));
  } catch (e) {
    logger.warn('Failed to save visitor operation queue', { module: 'VisitorQueue', action: 'saveQueue' });
  }
}

function backoffMs(retryCount: number): number {
  return Math.min(BASE_BACKOFF_MS * Math.pow(2, retryCount), MAX_BACKOFF_MS);
}

export interface UseVisitorQueueOptions {
  onSynced?: () => void;
  flushIntervalMs?: number;
}

export function useVisitorQueue(options: UseVisitorQueueOptions = {}) {
  const [queue, setQueue] = useState<QueuedOperation[]>(loadQueue);

  const persist = useCallback((q: QueuedOperation[]) => {
    setQueue(q);
    saveQueue(q);
  }, []);

  const enqueue = useCallback(
    (operation: Omit<QueuedOperation, 'id' | 'sync_status' | 'retry_count' | 'last_retry' | 'queuedAt'> & { queuedAt?: string }) => {
      const id = crypto.randomUUID?.() ?? `q-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const full: QueuedOperation = {
        ...operation,
        queuedAt: operation.queuedAt ?? new Date().toISOString(),
        id,
        sync_status: 'pending',
        retry_count: 0,
        last_retry: new Date(0).toISOString()
      };
      const q = loadQueue();
      q.push(full);
      persist(q);
      logger.info('Visitor operation queued', { module: 'VisitorQueue', action: 'enqueue', operationType: operation.type, id });
      return id;
    },
    [persist]
  );

  const executeOperation = useCallback(async (op: QueuedOperation): Promise<boolean> => {
    try {
      switch (op.type) {
        case 'create_visitor':
          await visitorService.createVisitor(op.payload as unknown as VisitorCreate);
          break;
        case 'update_visitor':
          await visitorService.updateVisitor(op.payload.visitorId as string, op.payload.updates as VisitorUpdate);
          break;
        case 'delete_visitor':
          await visitorService.deleteVisitor(op.payload.visitorId as string);
          break;
        case 'check_in_visitor':
          await visitorService.checkInVisitor(op.payload.visitorId as string);
          break;
        case 'check_out_visitor':
          await visitorService.checkOutVisitor(op.payload.visitorId as string);
          break;
        case 'create_security_request':
          await visitorService.createSecurityRequest(op.payload as unknown as SecurityRequestCreate);
          break;
        case 'create_event':
          await visitorService.createEvent(op.payload as unknown as EventCreate);
          break;
        case 'delete_event':
          await visitorService.deleteEvent(op.payload.eventId as string);
          break;
        default:
          logger.warn('Unknown visitor operation type', { module: 'VisitorQueue', action: 'executeOperation', type: op.type });
          return false;
      }
      return true;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), `executeOperation-${op.type}`);
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
    enqueue,
    flush,
    retryFailed,
    queue,
    pendingCount,
    failedCount
  };
}
