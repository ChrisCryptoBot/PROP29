/**
 * Offline check-in queue with idempotency and exponential backoff.
 * Used when checkpoint check-ins fail due to network; flushed on online + periodic interval.
 */

import { useCallback, useEffect, useState } from 'react';
import { PatrolEndpoint } from '../../../services/PatrolEndpoint';
import { showSuccess } from '../../../utils/toast';

const QUEUE_KEY = 'patrol.checkin.queue';
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

export interface QueuedCheckInEntry {
    id: string;
    request_id: string;
    patrolId: string;
    checkpointId: string;
    payload: {
        method?: string;
        device_id?: string;
        request_id?: string;
        notes?: string;
        completed_at?: string;
        completed_by?: string;
    };
    queuedAt: string;
    sync_status: 'pending' | 'synced' | 'failed';
    retry_count: number;
    last_retry: string;
    error?: string;
}

function loadQueue(): QueuedCheckInEntry[] {
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveQueue(queue: QueuedCheckInEntry[]) {
    try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        // Silently fail - queue persistence is best-effort
        // ErrorHandlerService.handle would be too noisy for localStorage failures
    }
}

function backoffMs(retryCount: number): number {
    const ms = Math.min(BASE_BACKOFF_MS * Math.pow(2, retryCount), MAX_BACKOFF_MS);
    return ms;
}

export interface UseCheckInQueueOptions {
    onSynced?: () => void;
    /** Flush interval in ms. Default 60000. Use 120000 when realTimeSync is off. */
    flushIntervalMs?: number;
}

export function useCheckInQueue(options: UseCheckInQueueOptions = {}) {
    const [queue, setQueue] = useState<QueuedCheckInEntry[]>(loadQueue);

    const persist = useCallback((q: QueuedCheckInEntry[]) => {
        setQueue(q);
        saveQueue(q);
    }, []);

    const enqueue = useCallback(
        (entry: Omit<QueuedCheckInEntry, 'id' | 'sync_status' | 'retry_count' | 'last_retry'>) => {
            const id = crypto.randomUUID();
            const request_id = entry.payload.request_id || id;
            const full: QueuedCheckInEntry = {
                ...entry,
                id,
                request_id,
                payload: { ...entry.payload, request_id },
                sync_status: 'pending',
                retry_count: 0,
                last_retry: new Date(0).toISOString()
            };
            const q = loadQueue();
            q.push(full);
            persist(q);
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
                await PatrolEndpoint.checkInCheckpoint(e.patrolId, e.checkpointId, e.payload);
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
                showSuccess('Queued check-ins synced');
                options.onSynced?.();
            }
        }
    }, [options.onSynced, persist]);

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

    const removeQueuedCheckIn = useCallback(
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
        removeQueuedCheckIn,
        queue,
        pendingCount,
        failedCount
    };
}
