/**
 * Request Deduplication Hook for Incident Log
 * Prevents duplicate refreshIncidents calls when tabs switch rapidly or double-refresh occurs
 * Following patrol-command-center pattern
 */

import { useRef, useCallback, useMemo } from 'react';
import { logger } from '../../../services/logger';

interface PendingRequest {
    timestamp: number;
    filters?: string; // Serialized filters for comparison
}

const REQUEST_DEDUP_WINDOW_MS = 1000; // 1 second window to prevent duplicates

export function useIncidentLogRequestDeduplication() {
    const pendingRequests = useRef<Map<string, PendingRequest>>(new Map());

    /**
     * Check if a refresh request is a duplicate (within dedup window)
     */
    const isDuplicate = useCallback((requestKey: string): boolean => {
        const existing = pendingRequests.current.get(requestKey);
        if (!existing) {
            return false;
        }

        const now = Date.now();
        const age = now - existing.timestamp;

        if (age > REQUEST_DEDUP_WINDOW_MS) {
            // Request is old, remove it
            pendingRequests.current.delete(requestKey);
            return false;
        }

        logger.debug('Duplicate refreshIncidents request detected, skipping', {
            module: 'IncidentLogRequestDeduplication',
            requestKey,
            age
        });
        return true;
    }, []);

    /**
     * Record a pending request
     */
    const recordRequest = useCallback((requestKey: string, filters?: any) => {
        // Clean up old entries
        const now = Date.now();
        for (const [key, request] of pendingRequests.current.entries()) {
            if (now - request.timestamp > REQUEST_DEDUP_WINDOW_MS) {
                pendingRequests.current.delete(key);
            }
        }

        pendingRequests.current.set(requestKey, {
            timestamp: Date.now(),
            filters: filters ? JSON.stringify(filters) : undefined
        });
    }, []);

    /**
     * Clear a completed request
     */
    const clearRequest = useCallback((requestKey: string) => {
        pendingRequests.current.delete(requestKey);
    }, []);

    /**
     * Clear all pending requests
     */
    const clearAll = useCallback(() => {
        pendingRequests.current.clear();
    }, []);

    // Return stable object reference to prevent unnecessary re-renders
    return useMemo(() => ({
        isDuplicate,
        recordRequest,
        clearRequest,
        clearAll
    }), [isDuplicate, recordRequest, clearRequest, clearAll]);
}
