/**
 * Patrol Operation Queue Hook
 * Handles offline queuing for all patrol operations (deploy, complete, reassign, cancel, CRUD, emergency alerts)
 * Uses idempotency and exponential backoff for reliable sync
 */

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { PatrolEndpoint } from '../../../services/PatrolEndpoint';
import { showSuccess } from '../../../utils/toast';
import { logger } from '../../../services/logger';

const QUEUE_KEY = 'patrol.operations.queue';
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

export type PatrolOperationType = 
    | 'deploy_officer'
    | 'complete_patrol'
    | 'reassign_officer'
    | 'cancel_patrol'
    | 'create_route'
    | 'update_route'
    | 'delete_route'
    | 'create_template'
    | 'update_template'
    | 'delete_template'
    | 'create_officer'
    | 'update_officer'
    | 'delete_officer'
    | 'emergency_alert';

export interface QueuedOperationEntry {
    id: string;
    operation: PatrolOperationType;
    payload: Record<string, unknown>;
    queuedAt: string;
    sync_status: 'pending' | 'synced' | 'failed';
    retry_count: number;
    last_retry: string;
    error?: string;
}

function loadQueue(): QueuedOperationEntry[] {
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveQueue(queue: QueuedOperationEntry[]) {
    try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        // Silently fail - queue persistence is best-effort
    }
}

function backoffMs(retryCount: number): number {
    return Math.min(BASE_BACKOFF_MS * Math.pow(2, retryCount), MAX_BACKOFF_MS);
}

export interface UsePatrolOperationQueueOptions {
    onSynced?: () => void;
    /** Flush interval in ms. Default 60000. Use 120000 when realTimeSync is off. */
    flushIntervalMs?: number;
}

export function usePatrolOperationQueue(options: UsePatrolOperationQueueOptions = {}) {
    const [queue, setQueue] = useState<QueuedOperationEntry[]>(loadQueue);

    // Use ref to store latest onSynced callback to prevent flush recreation
    const onSyncedRef = useRef(options.onSynced);
    useEffect(() => {
        onSyncedRef.current = options.onSynced;
    }, [options.onSynced]);

    const persist = useCallback((q: QueuedOperationEntry[]) => {
        setQueue(q);
        saveQueue(q);
    }, []);

    const enqueue = useCallback(
        (operation: PatrolOperationType, payload: Record<string, unknown>) => {
            const id = crypto.randomUUID();
            const full: QueuedOperationEntry = {
                id,
                operation,
                payload,
                queuedAt: new Date().toISOString(),
                sync_status: 'pending',
                retry_count: 0,
                last_retry: new Date(0).toISOString()
            };
            const q = loadQueue();
            q.push(full);
            persist(q);
            logger.info('Operation queued for offline sync', { module: 'PatrolOperationQueue', operation, id });
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
                // Execute operation based on type
                switch (e.operation) {
                    case 'deploy_officer':
                        await PatrolEndpoint.updatePatrol(
                            e.payload.patrolId as string,
                            { guard_id: e.payload.officerId as string, status: 'active', version: e.payload.version as number | undefined }
                        );
                        break;
                    case 'complete_patrol':
                        await PatrolEndpoint.completePatrol(
                            e.payload.patrolId as string,
                            { version: e.payload.version as number | undefined }
                        );
                        break;
                    case 'reassign_officer':
                        await PatrolEndpoint.updatePatrol(
                            e.payload.patrolId as string,
                            { guard_id: e.payload.newOfficerId as string, version: e.payload.version as number | undefined }
                        );
                        break;
                    case 'cancel_patrol':
                        await PatrolEndpoint.updatePatrol(
                            e.payload.patrolId as string,
                            { status: 'interrupted', version: e.payload.version as number | undefined }
                        );
                        break;
                    case 'create_route':
                        await PatrolEndpoint.createRoute(e.payload as any);
                        break;
                    case 'update_route':
                        await PatrolEndpoint.updateRoute(e.payload.routeId as string, e.payload.data as any);
                        break;
                    case 'delete_route':
                        await PatrolEndpoint.deleteRoute(e.payload.routeId as string);
                        break;
                    case 'create_template':
                        await PatrolEndpoint.createTemplate(e.payload as any);
                        break;
                    case 'update_template':
                        await PatrolEndpoint.updateTemplate(e.payload.templateId as string, e.payload.data as any);
                        break;
                    case 'delete_template':
                        await PatrolEndpoint.deleteTemplate(e.payload.templateId as string);
                        break;
                    case 'create_officer':
                        await PatrolEndpoint.createOfficer(e.payload as any);
                        break;
                    case 'update_officer':
                        await PatrolEndpoint.updateOfficer(e.payload.officerId as string, e.payload.data as any);
                        break;
                    case 'delete_officer':
                        await PatrolEndpoint.deleteOfficer(e.payload.officerId as string);
                        break;
                    case 'emergency_alert':
                        await PatrolEndpoint.createEmergencyAlert(e.payload as any);
                        break;
                    default:
                        logger.warn('Unknown operation type in queue', { module: 'PatrolOperationQueue', operation: e.operation });
                        continue;
                }
                updated[i] = { ...e, sync_status: 'synced' };
                changed = true;
                logger.info('Queued operation synced', { module: 'PatrolOperationQueue', operation: e.operation, id: e.id });
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
                logger.warn('Queued operation failed, will retry', {
                    module: 'PatrolOperationQueue',
                    operation: e.operation,
                    id: e.id,
                    retry: nextRetry,
                    error: err instanceof Error ? err.message : String(err)
                });
            }
        }

        if (changed) {
            const remaining = updated.filter((e) => e.sync_status !== 'synced');
            persist(remaining);
            const syncedCount = updated.filter((e) => e.sync_status === 'synced').length;
            if (syncedCount > 0) {
                showSuccess(`Synced ${syncedCount} queued operation${syncedCount !== 1 ? 's' : ''}`);
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

    // Return stable object reference to prevent unnecessary re-renders
    return useMemo(() => ({
        loadQueue: loadQueueFromStorage,
        enqueue,
        flush,
        retryFailed,
        removeQueuedOperation,
        queue,
        pendingCount,
        failedCount
    }), [loadQueueFromStorage, enqueue, flush, retryFailed, removeQueuedOperation, queue, pendingCount, failedCount]);
}
