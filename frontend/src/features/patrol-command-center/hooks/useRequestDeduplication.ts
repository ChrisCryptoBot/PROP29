/**
 * Request Deduplication Hook
 * Prevents duplicate requests from being processed
 * Critical for mobile agent integration and rapid user actions where network issues can cause retries
 */

import { useRef, useCallback, useMemo } from 'react';
import { logger } from '../../../services/logger';

interface RequestCacheEntry {
    requestKey: string;
    timestamp: number;
}

const REQUEST_DEDUP_WINDOW_MS = 1000; // 1 second window to prevent duplicates
const MAX_CACHE_SIZE = 1000;

export function useRequestDeduplication() {
    const requestCache = useRef<Map<string, RequestCacheEntry>>(new Map());

    const isDuplicate = useCallback((requestKey: string): boolean => {
        const entry = requestCache.current.get(requestKey);
        if (!entry) {
            return false;
        }

        // Check if entry is expired
        const now = Date.now();
        if (now - entry.timestamp > REQUEST_DEDUP_WINDOW_MS) {
            requestCache.current.delete(requestKey);
            return false;
        }

        logger.debug('Duplicate request detected, skipping', {
            module: 'RequestDeduplication',
            requestKey,
            age: now - entry.timestamp
        });
        return true;
    }, []);

    const recordRequest = useCallback((requestKey: string, ...args: any[]) => {
        // Clean up expired entries periodically
        if (requestCache.current.size > MAX_CACHE_SIZE) {
            const now = Date.now();
            for (const [key, entry] of requestCache.current.entries()) {
                if (now - entry.timestamp > REQUEST_DEDUP_WINDOW_MS) {
                    requestCache.current.delete(key);
                }
            }
        }

        requestCache.current.set(requestKey, {
            requestKey,
            timestamp: Date.now()
        });
    }, []);

    const clearRequest = useCallback((requestId: string) => {
        requestCache.current.delete(requestId);
    }, []);

    const clearAll = useCallback(() => {
        requestCache.current.clear();
    }, []);

    // Return stable object reference to prevent unnecessary re-renders
    return useMemo(() => ({
        isDuplicate,
        recordRequest,
        clearRequest,
        clearAll
    }), [isDuplicate, recordRequest, clearRequest, clearAll]);
}
