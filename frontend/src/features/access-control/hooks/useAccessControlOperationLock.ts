/**
 * Access Control Operation Lock Hook
 * Prevents WebSocket updates from racing with in-flight mutations
 * Tracks operations in progress to prevent state conflicts
 */

import { useRef, useCallback, useMemo } from 'react';

interface OperationLock {
  operation: string;
  entityId: string;
  timestamp: number;
}

const LOCK_TIMEOUT_MS = 30000; // 30 seconds max lock time

export function useAccessControlOperationLock() {
  const locksRef = useRef<Map<string, OperationLock>>(new Map());

  const acquireLock = useCallback((operation: string, entityId: string): boolean => {
    const lockKey = `${operation}-${entityId}`;
    const existing = locksRef.current.get(lockKey);

    if (existing) {
      const age = Date.now() - existing.timestamp;
      if (age < LOCK_TIMEOUT_MS) {
        // Lock still valid
        return false;
      }
      // Lock expired, remove it
      locksRef.current.delete(lockKey);
    }

    locksRef.current.set(lockKey, {
      operation,
      entityId,
      timestamp: Date.now()
    });
    return true;
  }, []);

  const releaseLock = useCallback((operation: string, entityId: string) => {
    const lockKey = `${operation}-${entityId}`;
    locksRef.current.delete(lockKey);
  }, []);

  const isLocked = useCallback((operation: string, entityId: string): boolean => {
    const lockKey = `${operation}-${entityId}`;
    const lock = locksRef.current.get(lockKey);
    if (!lock) return false;

    const age = Date.now() - lock.timestamp;
    if (age > LOCK_TIMEOUT_MS) {
      // Lock expired, remove it
      locksRef.current.delete(lockKey);
      return false;
    }
    return true;
  }, []);

  const clearExpiredLocks = useCallback(() => {
    const now = Date.now();
    for (const [key, lock] of locksRef.current.entries()) {
      if (now - lock.timestamp > LOCK_TIMEOUT_MS) {
        locksRef.current.delete(key);
      }
    }
  }, []);

  return useMemo(() => ({
    acquireLock,
    releaseLock,
    isLocked,
    clearExpiredLocks
  }), [acquireLock, releaseLock, isLocked, clearExpiredLocks]);
}
