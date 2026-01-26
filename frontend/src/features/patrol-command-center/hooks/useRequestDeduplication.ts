/**
 * Request ID Deduplication Hook
 * Prevents duplicate check-in requests from being processed
 * Critical for mobile agent integration where network issues can cause retries
 */

import { useRef, useCallback } from 'react';
import { logger } from '../../../services/logger';

interface RequestCacheEntry {
    requestId: string;
    timestamp: number;
    patrolId: string;
    checkpointId: string;
}

const REQUEST_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000;

export function useRequestDeduplication() {
    const requestCache = useRef<Map<string, RequestCacheEntry>>(new Map());

    const isDuplicate = useCallback((requestId: string): boolean => {
        const entry = requestCache.current.get(requestId);
        if (!entry) {
            return false;
        }

        // Check if entry is expired
        const now = Date.now();
        if (now - entry.timestamp > REQUEST_CACHE_TTL) {
            requestCache.current.delete(requestId);
            return false;
        }

        logger.warn('Duplicate request detected', {
            module: 'RequestDeduplication',
            requestId,
            patrolId: entry.patrolId,
            checkpointId: entry.checkpointId
        });
        return true;
    }, []);

    const recordRequest = useCallback((requestId: string, patrolId: string, checkpointId: string) => {
        // Clean up expired entries periodically
        if (requestCache.current.size > MAX_CACHE_SIZE) {
            const now = Date.now();
            for (const [id, entry] of requestCache.current.entries()) {
                if (now - entry.timestamp > REQUEST_CACHE_TTL) {
                    requestCache.current.delete(id);
                }
            }
        }

        requestCache.current.set(requestId, {
            requestId,
            timestamp: Date.now(),
            patrolId,
            checkpointId
        });
    }, []);

    const clearRequest = useCallback((requestId: string) => {
        requestCache.current.delete(requestId);
    }, []);

    const clearAll = useCallback(() => {
        requestCache.current.clear();
    }, []);

    return {
        isDuplicate,
        recordRequest,
        clearRequest,
        clearAll
    };
}
