/**
 * Security Operations Center Offline Queue Hook
 * Queues failed operations for retry when network comes online
 * Following patrol-command-center pattern
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '../../../services/logger';
import { showSuccess, showInfo } from '../../../utils/toast';
import * as securityOpsService from '../services/securityOperationsCenterService';
import type { UpdateCameraPayload } from '../types/security-operations.types';

const QUEUE_KEY = 'security-operations.queue';
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

export type QueuedOperationType =
  | 'CAMERA_UPDATE'
  | 'CAMERA_TOGGLE_RECORDING'
  | 'CAMERA_TOGGLE_MOTION'
  | 'EVIDENCE_STATUS_UPDATE'
  | 'SETTINGS_UPDATE';

export interface QueuedOperation {
  id: string;
  type: QueuedOperationType;
  payload: {
    cameraId?: string;
    itemId?: string;
    status?: 'pending' | 'reviewed' | 'archived';
    updatePayload?: UpdateCameraPayload;
    settings?: unknown;
  };
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
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    // Silently fail - queue persistence is best-effort
  }
}

function backoffMs(retryCount: number): number {
  return Math.min(BASE_BACKOFF_MS * Math.pow(2, retryCount), MAX_BACKOFF_MS);
}

export interface UseSecurityOperationsQueueOptions {
  onSynced?: () => void;
  /** Flush interval in ms. Default 30000 (30 seconds) */
  flushIntervalMs?: number;
}

export function useSecurityOperationsQueue(options: UseSecurityOperationsQueueOptions = {}) {
  const [queue, setQueue] = useState<QueuedOperation[]>(loadQueue);
  const onSyncedRef = useRef(options.onSynced);
  onSyncedRef.current = options.onSynced;

  const persist = useCallback((q: QueuedOperation[]) => {
    setQueue(q);
    saveQueue(q);
  }, []);

  const enqueue = useCallback(
    (operation: Omit<QueuedOperation, 'id' | 'sync_status' | 'retry_count' | 'last_retry' | 'queuedAt'>) => {
      const id = crypto.randomUUID();
      const full: QueuedOperation = {
        ...operation,
        id,
        queuedAt: new Date().toISOString(),
        sync_status: 'pending',
        retry_count: 0,
        last_retry: new Date(0).toISOString(),
      };
      const q = loadQueue();
      q.push(full);
      persist(q);
      logger.info('Operation queued for retry', {
        module: 'SecurityOperationsQueue',
        operationType: operation.type,
        operationId: id,
      });
      return id;
    },
    [persist]
  );

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
        let success = false;

        switch (e.type) {
          case 'CAMERA_UPDATE':
            if (e.payload.cameraId && e.payload.updatePayload) {
              const result = await securityOpsService.updateCamera(
                e.payload.cameraId,
                e.payload.updatePayload
              );
              success = !!result;
            }
            break;

          case 'CAMERA_TOGGLE_RECORDING':
            if (e.payload.cameraId && e.payload.updatePayload) {
              const result = await securityOpsService.updateCamera(e.payload.cameraId, {
                isRecording: e.payload.updatePayload.isRecording,
              });
              success = !!result;
            }
            break;

          case 'CAMERA_TOGGLE_MOTION':
            if (e.payload.cameraId && e.payload.updatePayload) {
              const result = await securityOpsService.updateCamera(e.payload.cameraId, {
                motionDetectionEnabled: e.payload.updatePayload.motionDetectionEnabled,
              });
              success = !!result;
            }
            break;

          case 'EVIDENCE_STATUS_UPDATE':
            if (e.payload.itemId && e.payload.status) {
              success = await securityOpsService.updateEvidenceStatus(
                e.payload.itemId,
                e.payload.status
              );
            }
            break;

          case 'SETTINGS_UPDATE':
            if (e.payload.settings) {
              const result = await securityOpsService.updateSettings(
                e.payload.settings as any
              );
              success = !!result;
            }
            break;
        }

        if (success) {
          updated[i] = { ...e, sync_status: 'synced' };
          changed = true;
        } else {
          throw new Error('Operation returned false');
        }
      } catch (err) {
        const statusCode = err && typeof (err as any).statusCode === 'number' ? (err as any).statusCode : undefined;
        const is4xx = statusCode >= 400 && statusCode < 500;
        const nextRetry = is4xx ? MAX_RETRIES : e.retry_count + 1;
        updated[i] = {
          ...e,
          sync_status: nextRetry >= MAX_RETRIES ? 'failed' : 'pending',
          retry_count: nextRetry,
          last_retry: new Date().toISOString(),
          error: err instanceof Error ? err.message : String(err),
        };
        changed = true;
      }
    }

    if (changed) {
      const remaining = updated.filter((e) => e.sync_status !== 'synced');
      persist(remaining);
      const syncedCount = updated.filter((e) => e.sync_status === 'synced').length;
      if (syncedCount > 0) {
        showSuccess(`${syncedCount} queued operation${syncedCount > 1 ? 's' : ''} synced`);
        onSyncedRef.current?.();
      }
    }
  }, [persist]);

  const retryFailed = useCallback(() => {
    const q = loadQueue();
    const updated = q.map((e) =>
      e.sync_status === 'failed'
        ? {
            ...e,
            sync_status: 'pending' as const,
            retry_count: 0,
            last_retry: new Date(0).toISOString(),
            error: undefined,
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

  const intervalMs = options.flushIntervalMs ?? 30000;

  useEffect(() => {
    const handleOnline = () => {
      logger.info('Network online, flushing queue', { module: 'SecurityOperationsQueue' });
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
