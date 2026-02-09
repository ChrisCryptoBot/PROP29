/**
 * Offline queue for system admin operations
 * Queues operations when offline and syncs when online
 * Ready for mobile agents, hardware devices, and external data sources
 */

import { useCallback, useEffect, useState } from 'react';
import apiService from '../../../services/ApiService';
import { showSuccess } from '../../../utils/toast';
import { logger } from '../../../services/logger';

const QUEUE_KEY = 'system-admin.operation.queue';
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const MAX_QUEUE_SIZE = 100;

export type QueuedOperationType =
    | 'create_user'
    | 'update_user'
    | 'delete_user'
    | 'create_role'
    | 'update_role'
    | 'delete_role'
    | 'create_property'
    | 'update_property'
    | 'delete_property'
    | 'create_integration'
    | 'update_integration'
    | 'delete_integration'
    | 'update_settings'
    | 'update_security_policies';

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
        logger.warn('Failed to save system-admin operation queue', { module: 'SystemAdminQueue', action: 'saveQueue' });
    }
}

function backoffMs(retryCount: number): number {
    return Math.min(BASE_BACKOFF_MS * Math.pow(2, retryCount), MAX_BACKOFF_MS);
}

export interface UseSystemAdminOfflineQueueOptions {
    onSynced?: () => void;
    flushIntervalMs?: number;
}

export function useSystemAdminOfflineQueue(options: UseSystemAdminOfflineQueueOptions = {}) {
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
            logger.info('System admin operation queued', { module: 'SystemAdminQueue', action: 'enqueue', operationType: operation.type, id });
            return id;
        },
        [persist]
    );

    const executeOperation = useCallback(async (op: QueuedOperation): Promise<boolean> => {
        try {
            switch (op.type) {
                case 'create_user':
                    await apiService.post('/system-admin/users', op.payload);
                    break;
                case 'update_user':
                    await apiService.put(`/system-admin/users/${op.payload.id}`, op.payload);
                    break;
                case 'delete_user':
                    await apiService.delete(`/system-admin/users/${op.payload.id}`);
                    break;
                case 'create_role':
                    await apiService.post('/system-admin/roles', op.payload);
                    break;
                case 'update_role':
                    await apiService.put(`/system-admin/roles/${op.payload.id}`, op.payload);
                    break;
                case 'delete_role':
                    await apiService.delete(`/system-admin/roles/${op.payload.id}`);
                    break;
                case 'create_property':
                    await apiService.post('/system-admin/properties', op.payload);
                    break;
                case 'update_property':
                    await apiService.put(`/system-admin/properties/${op.payload.id}`, op.payload);
                    break;
                case 'delete_property':
                    await apiService.delete(`/system-admin/properties/${op.payload.id}`);
                    break;
                case 'create_integration':
                    await apiService.post('/system-admin/integrations', op.payload);
                    break;
                case 'update_integration':
                    await apiService.put(`/system-admin/integrations/${op.payload.id}`, op.payload);
                    break;
                case 'delete_integration':
                    await apiService.delete(`/system-admin/integrations/${op.payload.id}`);
                    break;
                case 'update_settings':
                    await apiService.put('/system-admin/settings', op.payload);
                    break;
                case 'update_security_policies':
                    await apiService.put('/system-admin/security-policies', op.payload);
                    break;
                default:
                    logger.warn('Unknown system-admin operation type', { module: 'SystemAdminQueue', action: 'executeOperation', type: op.type });
                    return false;
            }
            return true;
        } catch (error) {
            logger.error('System admin operation execution failed', error instanceof Error ? error : new Error(String(error)), {
                module: 'SystemAdminQueue',
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
