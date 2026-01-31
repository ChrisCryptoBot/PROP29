/**
 * Access Control State Hook
 * Centralized state management for Access Control feature
 * Extracted from monolithic component - contains ALL business logic
 * 
 * Following Gold Standard: Zero business logic in components, 100% in hooks
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { logger } from '../../../services/logger';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/ApiService';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { AccessControlUtilities } from '../../../services/AccessControlUtilities';
import type { HeldOpenAlert } from '../../../services/AccessControlUtilities';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showSuccess, showError } from '../../../utils/toast';
import { retryWithBackoff } from '../../../utils/retryWithBackoff';
import { useAccessControlTelemetry } from './useAccessControlTelemetry';
import { useAccessControlHeartbeat } from './useAccessControlHeartbeat';
import { useAccessControlQueue } from './useAccessControlQueue';
import { useAccessControlRequestDeduplication } from './useAccessControlRequestDeduplication';
import { useAccessControlOperationLock } from './useAccessControlOperationLock';
import { useAccessControlStateReconciliation } from './useAccessControlStateReconciliation';
import type { AccessPoint, AccessControlUser, AccessEvent, AccessMetrics, AccessControlAuditEntry, AuditSource } from '../../../shared/types/access-control.types';
import type { GetAccessPointsResponse, GetUsersResponse, GetAccessEventsResponse } from '../../../shared/types/api-contracts';

export interface EmergencyController {
  mode: 'lockdown' | 'unlock';
  initiatedBy: string;
  timestamp: string;
  priority: number;
  timeoutDuration?: number;
  timeoutTimer?: ReturnType<typeof setTimeout>;
}

export interface UseAccessControlStateReturn {
  // Data
  accessPoints: AccessPoint[];
  users: AccessControlUser[];
  accessEvents: AccessEvent[];
  metrics: AccessMetrics | null;
  heldOpenAlerts: HeldOpenAlert[];
  auditLog: AccessControlAuditEntry[];
  
  // Emergency Mode
  emergencyMode: 'normal' | 'lockdown' | 'unlock';
  emergencyController: EmergencyController | null;
  emergencyTimeoutDuration: number; // in seconds
  
  // Loading states
  loading: {
    accessPoints: boolean;
    users: boolean;
    accessEvents: boolean;
    metrics: boolean;
  };
  
  // Setters for WebSocket updates (internal use)
  setAccessPoints: React.Dispatch<React.SetStateAction<AccessPoint[]>>;
  setUsers: React.Dispatch<React.SetStateAction<AccessControlUser[]>>;
  setAccessEvents: React.Dispatch<React.SetStateAction<AccessEvent[]>>;
  
  // Actions
  refreshAccessPoints: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshAccessEvents: (filters?: Record<string, string>) => Promise<void>;
  refreshMetrics: () => Promise<void>;
  createAccessPoint: (point: Partial<AccessPoint>) => Promise<AccessPoint>;
  updateAccessPoint: (id: string, updates: Partial<AccessPoint>) => Promise<AccessPoint>;
  deleteAccessPoint: (id: string) => Promise<void>;
  createUser: (user: Partial<AccessControlUser>) => Promise<AccessControlUser>;
  updateUser: (id: string, updates: Partial<AccessControlUser>) => Promise<AccessControlUser>;
  deleteUser: (id: string) => Promise<void>;
  
  // Emergency Actions (options.skipConfirm = caller already confirmed e.g. via modal; options.reason = audit + API)
  handleEmergencyLockdown: (options?: { skipConfirm?: boolean; reason?: string }) => Promise<void>;
  handleEmergencyUnlock: (options?: { skipConfirm?: boolean; reason?: string }) => Promise<void>;
  handleNormalMode: (options?: { reason?: string }) => Promise<void>;
  acknowledgeHeldOpenAlert: (alertId: string) => void;
  
  // Access Point Actions
  toggleAccessPoint: (pointId: string) => Promise<void>;
  syncCachedEvents: (accessPointId: string) => Promise<void>;
  reviewAgentEvent: (eventId: string, action: 'approve' | 'reject', reason?: string) => Promise<void>;
  exportAccessEvents: (format?: 'csv' | 'json') => Promise<void>;
  exportAccessReport: (format: 'pdf' | 'csv') => Promise<void>;
  recordAuditEntry: (entry: { action: string; status: 'success' | 'failure' | 'info'; target?: string; reason?: string; source?: 'web_admin' | 'mobile_agent' | 'system' }) => void;
  refreshAuditLog: () => Promise<void>;
  
  // Offline Queue Status
  queuePendingCount: number;
  queueFailedCount: number;
  retryQueue: () => void;
  
  // Operation Lock (for WebSocket race condition mitigation)
  operationLock: {
    acquireLock: (operation: string, entityId: string) => boolean;
    releaseLock: (operation: string, entityId: string) => void;
    isLocked: (operation: string, entityId: string) => boolean;
    clearExpiredLocks: () => void;
  };
  
  // Property ID (derived from currentUser)
  propertyId?: string;
  
  // Offline status
  isOffline: boolean;
}

export function useAccessControlState(): UseAccessControlStateReturn {
  const { user: currentUser } = useAuth();
  const { trackAction, trackPerformance, trackError } = useAccessControlTelemetry();
  const MAX_AUDIT_ENTRIES = 200;
  
  // Derive propertyId from currentUser (temporary: using roles[0] as placeholder)
  // TODO: Replace with actual property_id from user object when available
  const propertyId = useMemo(() => {
    return currentUser?.roles?.[0] || undefined;
  }, [currentUser]);
  // Default metrics to prevent null reference errors
  const defaultMetrics: AccessMetrics = {
    totalAccessPoints: 0,
    activeAccessPoints: 0,
    totalUsers: 0,
    activeUsers: 0,
    todayAccessEvents: 0,
    deniedAccessEvents: 0,
    averageResponseTime: '0ms',
    systemUptime: '0d 0h',
    topAccessPoints: [],
    recentAlerts: 0,
    securityScore: 0,
    lastSecurityScan: new Date().toISOString(),
  };

  // State
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [users, setUsers] = useState<AccessControlUser[]>([]);
  const [accessEvents, setAccessEvents] = useState<AccessEvent[]>([]);
  const [metrics, setMetrics] = useState<AccessMetrics | null>(defaultMetrics);
  const [heldOpenAlerts, setHeldOpenAlerts] = useState<HeldOpenAlert[]>([]);
  const [auditLog, setAuditLog] = useState<AccessControlAuditEntry[]>([]);
  const [emergencyMode, setEmergencyMode] = useState<'normal' | 'lockdown' | 'unlock'>('normal');
  const [emergencyController, setEmergencyController] = useState<EmergencyController | null>(null);
  const emergencyTimeoutDuration = 30 * 60; // 30 minutes in seconds (configurable)
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Refs to store refresh functions for queue onSynced callback
  const refreshFunctionsRef = useRef<{
    refreshAccessPoints?: () => Promise<void>;
    refreshUsers?: () => Promise<void>;
    refreshAccessEvents?: () => Promise<void>;
  }>({});

  // Pending side effects from held-open alarm check (must not run inside setState updater)
  const pendingHeldOpenSideEffectsRef = useRef<Array<
    { type: 'critical'; accessPointId: string; duration: number; pointName: string } |
    { type: 'warning'; accessPointId: string; duration: number } |
    { type: 'auto_ack'; accessPointId: string }
  >>([]);

  // Offline queue for operations (declared early so it can be used in useCallback dependencies)
  const operationQueue = useAccessControlQueue({
    flushIntervalMs: 60000, // 1 minute
    onSynced: () => {
      // Call refresh functions when queue syncs
      refreshFunctionsRef.current.refreshAccessPoints?.();
      refreshFunctionsRef.current.refreshUsers?.();
      refreshFunctionsRef.current.refreshAccessEvents?.();
    }
  });

  // Request deduplication for mobile agent integration (declared early)
  const requestDedup = useAccessControlRequestDeduplication();

  // Operation lock for WebSocket race condition mitigation (declared early)
  const operationLock = useAccessControlOperationLock();

  const resolveActor = useCallback(() => {
    if (!currentUser) {
      return 'System';
    }
    const fullName = `${currentUser.first_name} ${currentUser.last_name}`.trim();
    return fullName || currentUser.username || currentUser.email || 'System';
  }, [currentUser]);

  const recordAuditEntry = useCallback((entry: { action: string; status: 'success' | 'failure' | 'info'; target?: string; reason?: string; source?: AuditSource }) => {
    const source: AuditSource = entry.source ?? 'web_admin';
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextEntry: AccessControlAuditEntry = {
      id,
      timestamp: new Date().toISOString(),
      actor: resolveActor(),
      action: entry.action,
      status: entry.status,
      target: entry.target,
      reason: entry.reason,
      source,
    };
    setAuditLog((prev) => {
      return [nextEntry, ...prev].slice(0, MAX_AUDIT_ENTRIES);
    });
    apiService.post('/access-control/audit', {
      actor: nextEntry.actor,
      action: nextEntry.action,
      status: nextEntry.status,
      target: nextEntry.target,
      reason: nextEntry.reason,
      source: nextEntry.source,
    }).catch(() => {
      logger.warn('Audit sync failed', { module: 'AccessControl', action: 'recordAuditEntry' });
    });
  }, [resolveActor]);

  const refreshAuditLog = useCallback(async () => {
    try {
      const response = await apiService.get<{ data: AccessControlAuditEntry[] }>('/access-control/audit', { params: { limit: MAX_AUDIT_ENTRIES } });
      const data = response.data?.data || [];
      setAuditLog(data);
    } catch (error) {
      logger.warn('Failed to fetch audit log', { module: 'AccessControl', action: 'refreshAuditLog' });
    }
  }, []);

  // Loading states
  const [loading, setLoading] = useState({
    accessPoints: false,
    users: false,
    accessEvents: false,
    metrics: false,
  });

  // Fetch Access Points
  const refreshAccessPoints = useCallback(async () => {
    const requestKey = 'refreshAccessPoints';
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate refreshAccessPoints request', { module: 'AccessControl', action: 'refreshAccessPoints' });
      return;
    }
    requestDedup.recordRequest(requestKey);
    
    setLoading(prev => ({ ...prev, accessPoints: true }));
    const startTime = Date.now();
    try {
      const response = await retryWithBackoff(
        () => apiService.get<GetAccessPointsResponse>('/access-control/points'),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      const points = response.data?.data || [];
      setAccessPoints(points);
      const duration = Date.now() - startTime;
      trackPerformance('refresh_access_points', duration, { count: points.length });
      trackAction('access_points_refreshed', 'access_point', { count: points.length });
      logger.info('Access points refreshed', { module: 'AccessControl', action: 'refreshAccessPoints', count: points.length });
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'refreshAccessPoints',
        duration
      });
      ErrorHandlerService.logError(error, 'refreshAccessPoints');
      logger.error('Failed to fetch access points', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'refreshAccessPoints',
      });
      // Keep existing data on error
    } finally {
      setLoading(prev => ({ ...prev, accessPoints: false }));
      requestDedup.clearRequest(requestKey);
    }
  }, [trackAction, trackPerformance, trackError, requestDedup]);

  // Fetch Users
  const refreshUsers = useCallback(async () => {
    const requestKey = 'refreshUsers';
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate refreshUsers request', { module: 'AccessControl', action: 'refreshUsers' });
      return;
    }
    requestDedup.recordRequest(requestKey);
    
    setLoading(prev => ({ ...prev, users: true }));
    const startTime = Date.now();
    try {
      const response = await retryWithBackoff(
        () => apiService.get<GetUsersResponse>('/access-control/users'),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      const usersData = response.data?.data || [];
      setUsers(usersData);
      const duration = Date.now() - startTime;
      trackPerformance('refresh_users', duration, { count: usersData.length });
      trackAction('users_refreshed', 'user', { count: usersData.length });
      logger.info('Users refreshed', { module: 'AccessControl', action: 'refreshUsers', count: usersData.length });
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'refreshUsers',
        duration
      });
      ErrorHandlerService.logError(error, 'refreshUsers');
      logger.error('Failed to fetch users', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'refreshUsers',
      });
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
      requestDedup.clearRequest(requestKey);
    }
  }, [trackAction, trackPerformance, trackError, requestDedup]);

  // Fetch Access Events
  const refreshAccessEvents = useCallback(async (filters?: Record<string, string>) => {
    setLoading(prev => ({ ...prev, accessEvents: true }));
    const startTime = Date.now();
    try {
      const response = await retryWithBackoff(
        () => apiService.get<GetAccessEventsResponse>('/access-control/events', { params: filters }),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      const events = response.data?.data || [];
      setAccessEvents(events);
      const duration = Date.now() - startTime;
      trackPerformance('refresh_access_events', duration, { count: events.length, filters });
      trackAction('access_events_refreshed', 'event', { count: events.length });
      logger.info('Access events refreshed', { module: 'AccessControl', action: 'refreshAccessEvents', count: events.length });
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'refreshAccessEvents',
        duration,
        filters
      });
      ErrorHandlerService.logError(error, 'refreshAccessEvents');
      logger.error('Failed to fetch access events', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'refreshAccessEvents',
      });
    } finally {
      setLoading(prev => ({ ...prev, accessEvents: false }));
    }
  }, [trackAction, trackPerformance, trackError]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const exportAccessEvents = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    const toastId = showLoading(`Exporting access logs as ${format.toUpperCase()}...`);
    try {
      const response = await apiService.get<Blob>('/access-control/events/export', {
        params: { format },
        responseType: 'blob'
      });
      if (!response.data) {
        throw new Error('No export data returned');
      }
      const filename = `access_events_${new Date().toISOString().replace(/[:.]/g, '-')}.${format}`;
      downloadBlob(response.data, filename);
      dismissLoadingAndShowSuccess(toastId, 'Access logs exported.');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to export access logs');
      ErrorHandlerService.logError(error, 'exportAccessEvents');
      logger.error('Failed to export access events', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'exportAccessEvents',
      });
    }
  }, []);

  const exportAccessReport = useCallback(async (format: 'pdf' | 'csv') => {
    const toastId = showLoading(`Generating ${format.toUpperCase()} report...`);
    try {
      const response = await apiService.get<Blob>('/access-control/reports/export', {
        params: { format },
        responseType: 'blob'
      });
      if (!response.data) {
        throw new Error('No export data returned');
      }
      const filename = `access_control_report_${new Date().toISOString().replace(/[:.]/g, '-')}.${format}`;
      downloadBlob(response.data, filename);
      dismissLoadingAndShowSuccess(toastId, 'Report exported.');
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to export report');
      ErrorHandlerService.logError(error, 'exportAccessReport');
      logger.error('Failed to export access report', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'exportAccessReport',
      });
    }
  }, []);

  // Fetch Metrics
  const refreshMetrics = useCallback(async () => {
    const requestKey = 'refreshMetrics';
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate refreshMetrics request', { module: 'AccessControl', action: 'refreshMetrics' });
      return;
    }
    requestDedup.recordRequest(requestKey);
    
    setLoading(prev => ({ ...prev, metrics: true }));
    const startTime = Date.now();
    try {
      const response = await retryWithBackoff(
        () => apiService.get<{ data: AccessMetrics }>('/access-control/metrics'),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      setMetrics(response.data?.data || defaultMetrics);
      const duration = Date.now() - startTime;
      trackPerformance('refresh_metrics', duration);
      trackAction('metrics_refreshed', 'configuration');
      logger.info('Metrics refreshed', { module: 'AccessControl', action: 'refreshMetrics' });
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'refreshMetrics',
        duration
      });
      ErrorHandlerService.logError(error, 'refreshMetrics');
      logger.error('Failed to fetch metrics', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'refreshMetrics',
      });
      // Keep default metrics on error
      setMetrics(defaultMetrics);
    } finally {
      setLoading(prev => ({ ...prev, metrics: false }));
      requestDedup.clearRequest(requestKey);
    }
  }, [trackAction, trackPerformance, trackError, requestDedup]);

  // Create Access Point
  const createAccessPoint = useCallback(async (point: Partial<AccessPoint>): Promise<AccessPoint> => {
    const requestKey = `createAccessPoint-${point.name || 'new'}`;
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate createAccessPoint request', { module: 'AccessControl', action: 'createAccessPoint', name: point.name });
      throw new Error('Duplicate request - please wait');
    }
    requestDedup.recordRequest(requestKey);
    
    // Acquire operation lock
    if (!operationLock.acquireLock('create_access_point', 'new')) {
      requestDedup.clearRequest(requestKey);
      throw new Error('Operation already in progress');
    }
    
    const startTime = Date.now();
    
    // Check if offline - enqueue if so
    if (!navigator.onLine && operationQueue) {
      operationQueue.enqueue({
        type: 'create_access_point',
        payload: point as Record<string, unknown>,
        queuedAt: new Date().toISOString()
      });
      showSuccess('Access point creation queued for sync when connection is restored');
      // Return a mock point for optimistic update
      const mockPoint: AccessPoint = {
        id: `temp-${Date.now()}`,
        name: point.name || 'New Access Point',
        location: point.location || '',
        type: point.type || 'door',
        accessMethod: point.accessMethod || 'card',
        status: point.status || 'active',
        isOnline: true,
        sensorStatus: 'closed',
        lastStatusChange: new Date().toISOString(),
        cachedEvents: [],
        accessCount: 0,
        permissions: point.permissions || [],
        securityLevel: point.securityLevel || 'medium'
      };
      setAccessPoints(prev => [...prev, mockPoint]);
      operationLock.releaseLock('create_access_point', 'new');
      requestDedup.clearRequest(requestKey);
      return mockPoint;
    }

    try {
      const response = await retryWithBackoff(
        () => apiService.post<{ data: AccessPoint }>('/access-control/points', point),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      const newPoint = response.data?.data;
      if (!newPoint) {
        throw new Error('No data returned from API');
      }
      setAccessPoints(prev => [...prev, newPoint]);
      const duration = Date.now() - startTime;
      trackPerformance('create_access_point', duration, { accessPointId: newPoint.id });
      trackAction('access_point_created', 'access_point', { accessPointId: newPoint.id, name: newPoint.name });
      logger.info('Access point created', { module: 'AccessControl', action: 'createAccessPoint', id: newPoint.id });
      await refreshAccessPoints(); // Refresh to get server-generated fields
      return newPoint;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'createAccessPoint',
        duration
      });
      ErrorHandlerService.logError(error, 'createAccessPoint');
      logger.error('Failed to create access point', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'createAccessPoint',
      });
      // If network error and queue exists, enqueue for retry
      const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
      if (isNetworkIssue && operationQueue) {
        operationQueue.enqueue({
          type: 'create_access_point',
          payload: point as Record<string, unknown>,
          queuedAt: new Date().toISOString()
        });
        showSuccess('Access point creation queued for sync when connection is restored');
        // Return mock point for optimistic update
        const mockPoint: AccessPoint = {
          id: `temp-${Date.now()}`,
          name: point.name || 'New Access Point',
          location: point.location || '',
          type: point.type || 'door',
          accessMethod: point.accessMethod || 'card',
          status: point.status || 'active',
          isOnline: true,
          sensorStatus: 'closed',
          lastStatusChange: new Date().toISOString(),
          cachedEvents: [],
          accessCount: 0,
          permissions: point.permissions || [],
          securityLevel: point.securityLevel || 'medium'
        };
        setAccessPoints(prev => [...prev, mockPoint]);
        return mockPoint;
      }
      throw error;
    }
  }, [refreshAccessPoints, trackAction, trackPerformance, trackError, operationQueue]);

  // Update Access Point
  const updateAccessPoint = useCallback(async (id: string, updates: Partial<AccessPoint>): Promise<AccessPoint> => {
    const requestKey = `updateAccessPoint-${id}`;
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate updateAccessPoint request', { module: 'AccessControl', action: 'updateAccessPoint', id });
      throw new Error('Duplicate request - please wait');
    }
    requestDedup.recordRequest(requestKey);
    
    const startTime = Date.now();
    
    // Check if offline - enqueue if so
    if (!navigator.onLine && operationQueue) {
      operationQueue.enqueue({
        type: 'update_access_point',
        payload: { id, ...updates } as Record<string, unknown>,
        queuedAt: new Date().toISOString()
      });
      showSuccess('Access point update queued for sync when connection is restored');
      // Optimistic update
      const currentPoint = accessPoints.find(p => p.id === id);
      if (currentPoint) {
        const optimisticPoint = { ...currentPoint, ...updates } as AccessPoint;
        setAccessPoints(prev => prev.map(p => p.id === id ? optimisticPoint : p));
        return optimisticPoint;
      }
      throw new Error('Access point not found');
    }

    try {
      const response = await retryWithBackoff(
        () => apiService.put<{ data: AccessPoint }>(`/access-control/points/${id}`, updates),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      const updatedPoint = response.data?.data;
      if (!updatedPoint) {
        throw new Error('No data returned from API');
      }
      setAccessPoints(prev => prev.map(p => p.id === id ? updatedPoint : p));
      const duration = Date.now() - startTime;
      trackPerformance('update_access_point', duration, { accessPointId: id });
      trackAction('access_point_updated', 'access_point', { accessPointId: id });
      logger.info('Access point updated', { module: 'AccessControl', action: 'updateAccessPoint', id });
      return updatedPoint;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'updateAccessPoint',
        duration,
        accessPointId: id
      });
      ErrorHandlerService.logError(error, 'updateAccessPoint');
      logger.error('Failed to update access point', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'updateAccessPoint',
        id,
      });
      // If network error and queue exists, enqueue for retry
      const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
      if (isNetworkIssue && operationQueue) {
        operationQueue.enqueue({
          type: 'update_access_point',
          payload: { id, ...updates } as Record<string, unknown>,
          queuedAt: new Date().toISOString()
        });
        showSuccess('Access point update queued for sync when connection is restored');
        // Optimistic update
        const currentPoint = accessPoints.find(p => p.id === id);
        if (currentPoint) {
          const optimisticPoint = { ...currentPoint, ...updates } as AccessPoint;
          setAccessPoints(prev => prev.map(p => p.id === id ? optimisticPoint : p));
          return optimisticPoint;
        }
      }
      throw error;
    }
  }, [trackAction, trackPerformance, trackError, operationQueue, accessPoints]);

  // Delete Access Point
  const deleteAccessPoint = useCallback(async (id: string): Promise<void> => {
    const requestKey = `deleteAccessPoint-${id}`;
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate deleteAccessPoint request', { module: 'AccessControl', action: 'deleteAccessPoint', id });
      throw new Error('Duplicate request - please wait');
    }
    requestDedup.recordRequest(requestKey);
    
    // Acquire operation lock
    if (!operationLock.acquireLock('delete_access_point', id)) {
      requestDedup.clearRequest(requestKey);
      throw new Error('Operation already in progress');
    }
    
    const startTime = Date.now();
    
    // Check if offline - enqueue if so
    if (!navigator.onLine && operationQueue) {
      operationQueue.enqueue({
        type: 'delete_access_point',
        payload: { id } as Record<string, unknown>,
        queuedAt: new Date().toISOString()
      });
      showSuccess('Access point deletion queued for sync when connection is restored');
      // Optimistic update
      setAccessPoints(prev => prev.filter(p => p.id !== id));
      operationLock.releaseLock('delete_access_point', id);
      requestDedup.clearRequest(requestKey);
      return;
    }

    try {
      await retryWithBackoff(
        () => apiService.delete(`/access-control/points/${id}`),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      setAccessPoints(prev => prev.filter(p => p.id !== id));
      const duration = Date.now() - startTime;
      trackPerformance('delete_access_point', duration, { accessPointId: id });
      trackAction('access_point_deleted', 'access_point', { accessPointId: id });
      logger.info('Access point deleted', { module: 'AccessControl', action: 'deleteAccessPoint', id });
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'deleteAccessPoint',
        duration,
        accessPointId: id
      });
      ErrorHandlerService.logError(error, 'deleteAccessPoint');
      logger.error('Failed to delete access point', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'deleteAccessPoint',
        id,
      });
      // If network error and queue exists, enqueue for retry
      const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
      if (isNetworkIssue && operationQueue) {
        operationQueue.enqueue({
          type: 'delete_access_point',
          payload: { id } as Record<string, unknown>,
          queuedAt: new Date().toISOString()
        });
        showSuccess('Access point deletion queued for sync when connection is restored');
        // Optimistic update
        setAccessPoints(prev => prev.filter(p => p.id !== id));
        return;
      }
      throw error;
    }
  }, [trackAction, trackPerformance, trackError, operationQueue]);

  // Create User
  const createUser = useCallback(async (user: Partial<AccessControlUser>): Promise<AccessControlUser> => {
    const requestKey = `createUser-${user.email || 'new'}`;
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate createUser request', { module: 'AccessControl', action: 'createUser', email: user.email });
      throw new Error('Duplicate request - please wait');
    }
    requestDedup.recordRequest(requestKey);
    
    // Acquire operation lock
    if (!operationLock.acquireLock('create_user', 'new')) {
      requestDedup.clearRequest(requestKey);
      throw new Error('Operation already in progress');
    }
    
    const startTime = Date.now();
    
    // Check if offline - enqueue if so
    if (!navigator.onLine && operationQueue) {
      operationQueue.enqueue({
        type: 'create_user',
        payload: user as Record<string, unknown>,
        queuedAt: new Date().toISOString()
      });
      showSuccess('User creation queued for sync when connection is restored');
      // Return a mock user for optimistic update
      const mockUser: AccessControlUser = {
        id: `temp-${Date.now()}`,
        name: user.name || 'New User',
        email: user.email || '',
        department: user.department || '',
        role: user.role || 'employee',
        status: user.status || 'active',
        accessLevel: user.accessLevel || 'standard',
        phone: user.phone,
        employeeId: user.employeeId,
        accessSchedule: user.accessSchedule,
        autoRevokeAtCheckout: user.autoRevokeAtCheckout,
        lastAccess: undefined,
        accessCount: 0,
        avatar: user.avatar || '',
        permissions: user.permissions || []
      };
      setUsers(prev => [...prev, mockUser]);
      operationLock.releaseLock('create_user', 'new');
      requestDedup.clearRequest(requestKey);
      return mockUser;
    }

    try {
      const response = await retryWithBackoff(
        () => apiService.post<{ data: AccessControlUser }>('/access-control/users', user),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      const newUser = response.data?.data;
      if (!newUser) {
        throw new Error('No data returned from API');
      }
      setUsers(prev => [...prev, newUser]);
      const duration = Date.now() - startTime;
      trackPerformance('create_user', duration, { userId: newUser.id });
      trackAction('user_created', 'user', { userId: newUser.id, name: newUser.name });
      logger.info('User created', { module: 'AccessControl', action: 'createUser', id: newUser.id });
      await refreshUsers(); // Refresh to get server-generated fields
      return newUser;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'createUser',
        duration
      });
      ErrorHandlerService.logError(error, 'createUser');
      logger.error('Failed to create user', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'createUser',
      });
      // If network error and queue exists, enqueue for retry
      const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
      if (isNetworkIssue && operationQueue) {
        operationQueue.enqueue({
          type: 'create_user',
          payload: user as Record<string, unknown>,
          queuedAt: new Date().toISOString()
        });
        showSuccess('User creation queued for sync when connection is restored');
        // Return mock user for optimistic update
        const mockUser: AccessControlUser = {
          id: `temp-${Date.now()}`,
          name: user.name || 'New User',
          email: user.email || '',
          department: user.department || '',
          role: user.role || 'employee',
          status: user.status || 'active',
          accessLevel: user.accessLevel || 'standard',
          phone: user.phone,
          employeeId: user.employeeId,
          accessSchedule: user.accessSchedule,
          autoRevokeAtCheckout: user.autoRevokeAtCheckout,
          lastAccess: undefined,
          accessCount: 0,
          avatar: user.avatar || '',
          permissions: user.permissions || []
        };
        setUsers(prev => [...prev, mockUser]);
        return mockUser;
      }
      throw error;
    } finally {
      operationLock.releaseLock('create_user', 'new');
      requestDedup.clearRequest(requestKey);
    }
  }, [refreshUsers, trackAction, trackPerformance, trackError, operationQueue, requestDedup, operationLock]);

  // Update User
  const updateUser = useCallback(async (id: string, updates: Partial<AccessControlUser>): Promise<AccessControlUser> => {
    const requestKey = `updateUser-${id}`;
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate updateUser request', { module: 'AccessControl', action: 'updateUser', id });
      throw new Error('Duplicate request - please wait');
    }
    requestDedup.recordRequest(requestKey);
    
    const startTime = Date.now();
    
    // Check if offline - enqueue if so
    if (!navigator.onLine && operationQueue) {
      operationQueue.enqueue({
        type: 'update_user',
        payload: { id, ...updates } as Record<string, unknown>,
        queuedAt: new Date().toISOString()
      });
      showSuccess('User update queued for sync when connection is restored');
      // Optimistic update
      const currentUser = users.find(u => u.id === id);
      if (currentUser) {
        const optimisticUser = { ...currentUser, ...updates } as AccessControlUser;
        setUsers(prev => prev.map(u => u.id === id ? optimisticUser : u));
        requestDedup.clearRequest(requestKey);
        return optimisticUser;
      }
      requestDedup.clearRequest(requestKey);
      throw new Error('User not found');
    }

    try {
      const response = await retryWithBackoff(
        () => apiService.put<{ data: AccessControlUser }>(`/access-control/users/${id}`, updates),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      const updatedUser = response.data?.data;
      if (!updatedUser) {
        throw new Error('No data returned from API');
      }
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      const duration = Date.now() - startTime;
      trackPerformance('update_user', duration, { userId: id });
      trackAction('user_updated', 'user', { userId: id });
      logger.info('User updated', { module: 'AccessControl', action: 'updateUser', id });
      return updatedUser;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'updateUser',
        duration,
        userId: id
      });
      ErrorHandlerService.logError(error, 'updateUser');
      logger.error('Failed to update user', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'updateUser',
        id,
      });
      // If network error and queue exists, enqueue for retry
      const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
      if (isNetworkIssue && operationQueue) {
        operationQueue.enqueue({
          type: 'update_user',
          payload: { id, ...updates } as Record<string, unknown>,
          queuedAt: new Date().toISOString()
        });
        showSuccess('User update queued for sync when connection is restored');
        // Optimistic update
        const currentUser = users.find(u => u.id === id);
        if (currentUser) {
          const optimisticUser = { ...currentUser, ...updates } as AccessControlUser;
          setUsers(prev => prev.map(u => u.id === id ? optimisticUser : u));
          requestDedup.clearRequest(requestKey);
          return optimisticUser;
        }
      }
      throw error;
    } finally {
      operationLock.releaseLock('update_user', id);
      requestDedup.clearRequest(requestKey);
    }
  }, [trackAction, trackPerformance, trackError, operationQueue, users, requestDedup, operationLock]);

  // Delete User
  const deleteUser = useCallback(async (id: string): Promise<void> => {
    const requestKey = `deleteUser-${id}`;
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate deleteUser request', { module: 'AccessControl', action: 'deleteUser', id });
      throw new Error('Duplicate request - please wait');
    }
    requestDedup.recordRequest(requestKey);
    
    // Acquire operation lock
    if (!operationLock.acquireLock('delete_user', id)) {
      requestDedup.clearRequest(requestKey);
      throw new Error('Operation already in progress');
    }
    
    const startTime = Date.now();
    
    // Check if offline - enqueue if so
    if (!navigator.onLine && operationQueue) {
      operationQueue.enqueue({
        type: 'delete_user',
        payload: { id } as Record<string, unknown>,
        queuedAt: new Date().toISOString()
      });
      showSuccess('User deletion queued for sync when connection is restored');
      // Optimistic update
      setUsers(prev => prev.filter(u => u.id !== id));
      operationLock.releaseLock('delete_user', id);
      requestDedup.clearRequest(requestKey);
      return;
    }

    try {
      await retryWithBackoff(
        () => apiService.delete(`/access-control/users/${id}`),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      setUsers(prev => prev.filter(u => u.id !== id));
      const duration = Date.now() - startTime;
      trackPerformance('delete_user', duration, { userId: id });
      trackAction('user_deleted', 'user', { userId: id });
      logger.info('User deleted', { module: 'AccessControl', action: 'deleteUser', id });
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'deleteUser',
        duration,
        userId: id
      });
      ErrorHandlerService.logError(error, 'deleteUser');
      logger.error('Failed to delete user', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'deleteUser',
        id,
      });
      // If network error and queue exists, enqueue for retry
      const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
      if (isNetworkIssue && operationQueue) {
        operationQueue.enqueue({
          type: 'delete_user',
          payload: { id } as Record<string, unknown>,
          queuedAt: new Date().toISOString()
        });
        showSuccess('User deletion queued for sync when connection is restored');
        // Optimistic update
        setUsers(prev => prev.filter(u => u.id !== id));
        return;
      }
      throw error;
    }
  }, [trackAction, trackPerformance, trackError, operationQueue]);

  // Emergency Lockdown Handler
  // Note: Confirmation should be handled by calling component via modal
  // This function expects skipConfirm: true when called from UI components
  const handleEmergencyLockdown = useCallback(async (options?: { skipConfirm?: boolean; reason?: string }) => {
    const requestKey = 'handleEmergencyLockdown';
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate handleEmergencyLockdown request', { module: 'AccessControl', action: 'handleEmergencyLockdown' });
      return;
    }
    requestDedup.recordRequest(requestKey);
    // Confirmation is handled by calling component via modal
    // If skipConfirm is false, caller should show modal first
    if (!options?.skipConfirm) {
      // This should not happen - components should use modals
      // For safety, we'll still proceed but log a warning
      logger.warn('Emergency lockdown called without skipConfirm - confirmation should be handled by component', {
        module: 'AccessControl',
        action: 'handleEmergencyLockdown'
      });
    }

    const currentTimestamp = new Date().toISOString();
    const currentUserEmail = currentUser?.email || 'unknown';
    const currentPriority = 1; // Lockdown has priority 1 (highest)

    // Check for existing emergency mode and resolve conflicts
    // Standardize grace period to 5 seconds for consistency
    const GRACE_PERIOD_MS = 5000;
    if (emergencyMode === 'unlock' && emergencyController) {
      const existingTimestamp = new Date(emergencyController.timestamp);
      const timeDiff = new Date(currentTimestamp).getTime() - existingTimestamp.getTime();

      if (timeDiff < GRACE_PERIOD_MS && currentPriority >= emergencyController.priority) {
        // Allow override - lockdown has higher priority
        trackAction('emergency_lockdown_override', 'emergency', { 
          existingMode: 'unlock',
          timeDiff,
          existingPriority: emergencyController.priority
        });
      } else if (timeDiff < GRACE_PERIOD_MS && currentPriority < emergencyController.priority) {
        showError(
          `Emergency Conflict: Unlock was initiated ${Math.round(timeDiff / 1000)}s ago by ${emergencyController.initiatedBy}. ` +
          `Lockdown requires higher priority. Contact security administrator.`
        );
        trackAction('emergency_lockdown_conflict', 'emergency', { 
          conflictMode: 'unlock',
          timeDiff,
          existingPriority: emergencyController.priority
        });
        return;
      }
    }

    // Check if offline - enqueue if so
    if (!navigator.onLine && operationQueue) {
      operationQueue.enqueue({
        type: 'emergency_lockdown',
        payload: {
          timeout_minutes: Math.round(emergencyTimeoutDuration / 60),
          ...(options?.reason != null && options.reason.trim() !== '' && { reason: options.reason.trim() }),
        } as Record<string, unknown>,
        queuedAt: new Date().toISOString()
      });
      showSuccess('Emergency lockdown queued for sync when connection is restored');
      // Optimistic update - emergency actions should still update UI even when offline
      setEmergencyMode('lockdown');
      setEmergencyController({
        mode: 'lockdown',
        initiatedBy: currentUserEmail,
        timestamp: currentTimestamp,
        priority: currentPriority
      });
      return;
    }

    const toastId = showLoading('Initiating emergency lockdown...');
    const startTime = Date.now();
    try {
      // CRITICAL: Update state only after API success confirmation (fix race condition)
      await retryWithBackoff(
        () => apiService.post('/access-control/emergency/lockdown', {
          timeout_minutes: Math.round(emergencyTimeoutDuration / 60),
          ...(options?.reason != null && options.reason.trim() !== '' && { reason: options.reason.trim() }),
        }),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      // Only update state after API confirms success
      setEmergencyMode('lockdown');
      setEmergencyController({
        mode: 'lockdown',
        initiatedBy: currentUserEmail,
        timestamp: currentTimestamp,
        priority: currentPriority
      });
      await refreshAccessPoints();
      const duration = Date.now() - startTime;
      trackPerformance('emergency_lockdown', duration, { reason: options?.reason });
      trackAction('emergency_lockdown_activated', 'emergency', { 
        initiatedBy: currentUserEmail,
        reason: options?.reason
      });
      dismissLoadingAndShowSuccess(toastId, 'Emergency lockdown activated! All access points are now locked.');
      logger.warn('Emergency lockdown activated', { module: 'AccessControl', action: 'handleEmergencyLockdown', initiatedBy: currentUserEmail });
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'handleEmergencyLockdown',
        duration,
        reason: options?.reason
      });
      // If network error and queue exists, enqueue for retry
      const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
      if (isNetworkIssue && operationQueue) {
        operationQueue.enqueue({
          type: 'emergency_lockdown',
          payload: {
            timeout_minutes: Math.round(emergencyTimeoutDuration / 60),
            ...(options?.reason != null && options.reason.trim() !== '' && { reason: options.reason.trim() }),
          } as Record<string, unknown>,
          queuedAt: new Date().toISOString()
        });
        dismissLoadingAndShowError(toastId, 'Emergency lockdown queued for sync when connection is restored');
        // Optimistic update
        setEmergencyMode('lockdown');
        setEmergencyController({
          mode: 'lockdown',
          initiatedBy: currentUserEmail,
          timestamp: currentTimestamp,
          priority: currentPriority
        });
        return;
      }
      dismissLoadingAndShowError(toastId, 'Failed to initiate lockdown');
      ErrorHandlerService.logError(error, 'handleEmergencyLockdown');
      logger.error('Failed to initiate emergency lockdown', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'handleEmergencyLockdown',
      });
    }
  }, [emergencyMode, emergencyController, currentUser, emergencyTimeoutDuration, refreshAccessPoints, trackAction, trackPerformance, trackError, operationQueue]);

  // Emergency Unlock Handler
  // Note: Confirmation should be handled by calling component via modal
  // This function expects skipConfirm: true when called from UI components
  const handleEmergencyUnlock = useCallback(async (options?: { skipConfirm?: boolean; reason?: string }) => {
    const requestKey = 'handleEmergencyUnlock';
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate handleEmergencyUnlock request', { module: 'AccessControl', action: 'handleEmergencyUnlock' });
      return;
    }
    requestDedup.recordRequest(requestKey);
    // Confirmation is handled by calling component via modal
    // If skipConfirm is false, caller should show modal first
    if (!options?.skipConfirm) {
      // This should not happen - components should use modals
      // For safety, we'll still proceed but log a warning
      logger.warn('Emergency unlock called without skipConfirm - confirmation should be handled by component', {
        module: 'AccessControl',
        action: 'handleEmergencyUnlock'
      });
    }

    const currentTimestamp = new Date().toISOString();
    const currentUserEmail = currentUser?.email || 'unknown';
    const currentPriority = 0; // Unlock has lower priority than lockdown

    // Check for existing emergency mode and resolve conflicts
    if (emergencyMode === 'lockdown' && emergencyController) {
      const existingTimestamp = new Date(emergencyController.timestamp);
      const timeDiff = new Date(currentTimestamp).getTime() - existingTimestamp.getTime();

      // Standardize grace period to 5 seconds for consistency
      const GRACE_PERIOD_MS = 5000;
      if (timeDiff < GRACE_PERIOD_MS) {
        showError(
          `Emergency Conflict: Lockdown was initiated ${Math.round(timeDiff / 1000)}s ago by ${emergencyController.initiatedBy}. ` +
          `Unlock requires approval. Contact a security administrator.`
        );
        trackAction('emergency_unlock_conflict', 'emergency', { 
          conflictMode: 'lockdown',
          timeDiff,
          existingPriority: emergencyController.priority
        });
        return;
      }
    }

    // Check if offline - enqueue if so
    if (!navigator.onLine && operationQueue) {
      operationQueue.enqueue({
        type: 'emergency_unlock',
        payload: {
          timeout_minutes: Math.round(emergencyTimeoutDuration / 60),
          ...(options?.reason != null && options.reason.trim() !== '' && { reason: options.reason.trim() }),
        } as Record<string, unknown>,
        queuedAt: new Date().toISOString()
      });
      showSuccess('Emergency unlock queued for sync when connection is restored');
      // Optimistic update
      setEmergencyMode('unlock');
      setEmergencyController({
        mode: 'unlock',
        initiatedBy: currentUserEmail,
        timestamp: currentTimestamp,
        priority: currentPriority,
        timeoutDuration: emergencyTimeoutDuration
      });
      return;
    }

    const toastId = showLoading('Initiating emergency unlock...');
    const startTime = Date.now();
    try {
      // CRITICAL: Update state only after API success confirmation (fix race condition)
      await retryWithBackoff(
        () => apiService.post('/access-control/emergency/unlock', {
          timeout_minutes: Math.round(emergencyTimeoutDuration / 60),
          ...(options?.reason != null && options.reason.trim() !== '' && { reason: options.reason.trim() }),
        }),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      // Only update state after API confirms success
      setEmergencyMode('unlock');
      setEmergencyController({
        mode: 'unlock',
        initiatedBy: currentUserEmail,
        timestamp: currentTimestamp,
        priority: currentPriority,
        timeoutDuration: emergencyTimeoutDuration
      });
      await refreshAccessPoints();
      const duration = Date.now() - startTime;
      trackPerformance('emergency_unlock', duration, { reason: options?.reason });
      trackAction('emergency_unlock_activated', 'emergency', { 
        initiatedBy: currentUserEmail,
        reason: options?.reason
      });
      dismissLoadingAndShowSuccess(
        toastId,
        `Emergency unlock activated! All access points are now unlocked. ` +
        `Auto-relock will occur in ${AccessControlUtilities.formatDuration(emergencyTimeoutDuration)} if not manually restored.`
      );
      logger.warn('Emergency unlock activated', { module: 'AccessControl', action: 'handleEmergencyUnlock', initiatedBy: currentUserEmail });
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'handleEmergencyUnlock',
        duration,
        reason: options?.reason
      });
      // If network error and queue exists, enqueue for retry
      const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
      if (isNetworkIssue && operationQueue) {
        operationQueue.enqueue({
          type: 'emergency_unlock',
          payload: {
            timeout_minutes: Math.round(emergencyTimeoutDuration / 60),
            ...(options?.reason != null && options.reason.trim() !== '' && { reason: options.reason.trim() }),
          } as Record<string, unknown>,
          queuedAt: new Date().toISOString()
        });
        dismissLoadingAndShowError(toastId, 'Emergency unlock queued for sync when connection is restored');
        // Optimistic update
        setEmergencyMode('unlock');
        setEmergencyController({
          mode: 'unlock',
          initiatedBy: currentUserEmail,
          timestamp: currentTimestamp,
          priority: currentPriority,
          timeoutDuration: emergencyTimeoutDuration
        });
        return;
      }
      dismissLoadingAndShowError(toastId, 'Failed to initiate unlock');
      ErrorHandlerService.logError(error, 'handleEmergencyUnlock');
      logger.error('Failed to initiate emergency unlock', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'handleEmergencyUnlock',
      });
    }
  }, [emergencyMode, emergencyController, currentUser, emergencyTimeoutDuration, refreshAccessPoints, trackAction, trackPerformance, trackError, operationQueue]);

  // Restore Normal Mode Handler
  const handleNormalMode = useCallback(async (options?: { reason?: string }) => {
    const requestKey = 'handleNormalMode';
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate handleNormalMode request', { module: 'AccessControl', action: 'handleNormalMode' });
      return;
    }
    requestDedup.recordRequest(requestKey);
    
    // Acquire operation lock
    if (!operationLock.acquireLock('emergency_restore', 'system')) {
      requestDedup.clearRequest(requestKey);
      logger.warn('Emergency restore already in progress', { module: 'AccessControl', action: 'handleNormalMode' });
      return;
    }
    
    // Check if offline - enqueue if so
    if (!navigator.onLine && operationQueue) {
      // Clear emergency timeout timer if exists
      if (emergencyController?.timeoutTimer) {
        clearTimeout(emergencyController.timeoutTimer);
      }
      operationQueue.enqueue({
        type: 'emergency_restore',
        payload: {
          ...(options?.reason != null && options.reason.trim() !== '' && { reason: options.reason.trim() }),
        } as Record<string, unknown>,
        queuedAt: new Date().toISOString()
      });
      showSuccess('Normal mode restore queued for sync when connection is restored');
      // Optimistic update
      setEmergencyMode('normal');
      setEmergencyController(null);
      operationLock.releaseLock('emergency_restore', 'system');
      requestDedup.clearRequest(requestKey);
      return;
    }

    const toastId = showLoading('Restoring normal mode...');
    const startTime = Date.now();
    try {
      // Clear emergency timeout timer if exists
      if (emergencyController?.timeoutTimer) {
        clearTimeout(emergencyController.timeoutTimer);
      }

      await retryWithBackoff(
        () => apiService.post('/access-control/emergency/restore', {
          ...(options?.reason != null && options.reason.trim() !== '' && { reason: options.reason.trim() }),
        }),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      setEmergencyMode('normal');
      setEmergencyController(null);
      await refreshAccessPoints();
      const duration = Date.now() - startTime;
      trackPerformance('emergency_restore', duration, { reason: options?.reason });
      trackAction('emergency_normal_mode_restored', 'emergency', { reason: options?.reason });
      dismissLoadingAndShowSuccess(toastId, 'Normal mode restored.');
      logger.info('Normal mode restored', { module: 'AccessControl', action: 'handleNormalMode' });
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'handleNormalMode',
        duration,
        reason: options?.reason
      });
      // If network error and queue exists, enqueue for retry
      const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
      if (isNetworkIssue && operationQueue) {
        // Clear emergency timeout timer if exists
        if (emergencyController?.timeoutTimer) {
          clearTimeout(emergencyController.timeoutTimer);
        }
        operationQueue.enqueue({
          type: 'emergency_restore',
          payload: {
            ...(options?.reason != null && options.reason.trim() !== '' && { reason: options.reason.trim() }),
          } as Record<string, unknown>,
          queuedAt: new Date().toISOString()
        });
        dismissLoadingAndShowError(toastId, 'Normal mode restore queued for sync when connection is restored');
        // Optimistic update
        setEmergencyMode('normal');
        setEmergencyController(null);
        return;
      }
      dismissLoadingAndShowError(toastId, 'Failed to restore normal mode');
      ErrorHandlerService.logError(error, 'handleNormalMode');
      logger.error('Failed to restore normal mode', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'handleNormalMode',
      });
    } finally {
      operationLock.releaseLock('emergency_restore', 'system');
      requestDedup.clearRequest(requestKey);
    }
  }, [emergencyController, refreshAccessPoints, trackAction, trackPerformance, trackError, operationQueue, requestDedup, operationLock]);

  // Acknowledge Held-Open Alert
  const acknowledgeHeldOpenAlert = useCallback((alertId: string) => {
    setHeldOpenAlerts(prev => prev.map(a =>
      a.id === alertId
        ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString(), acknowledgedBy: currentUser?.email || 'System' }
        : a
    ));
    showSuccess('Held-open alarm acknowledged');
    logger.info('Held-open alert acknowledged', { module: 'AccessControl', action: 'acknowledgeHeldOpenAlert', alertId });
  }, [currentUser]);

  // Toggle Access Point Status
  const toggleAccessPoint = useCallback(async (pointId: string): Promise<void> => {
    const requestKey = `toggleAccessPoint-${pointId}`;
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate toggleAccessPoint request', { module: 'AccessControl', action: 'toggleAccessPoint', pointId });
      return;
    }
    requestDedup.recordRequest(requestKey);
    
    const accessPoint = accessPoints.find(p => p.id === pointId);
    if (!accessPoint) {
      requestDedup.clearRequest(requestKey);
      showError('Access point not found');
      trackAction('toggle_access_point_failed', 'access_point', { pointId, reason: 'not_found' });
      return;
    }

    if (accessPoint.isOnline === false) {
      requestDedup.clearRequest(requestKey);
      showError(
        `Hardware Disconnected: Cannot control "${accessPoint.name}". ` +
        `The access point is offline. Please check network connectivity and hardware status.`
      );
      trackAction('toggle_access_point_failed', 'access_point', { pointId, reason: 'offline' });
      return;
    }

    // Check if offline - enqueue if so (updateAccessPoint will handle queue, but we check here for better UX)
    if (!navigator.onLine && operationQueue) {
      const updatedStatus = accessPoint.status === 'active' ? 'disabled' : 'active';
      operationQueue.enqueue({
        type: 'toggle_access_point',
        payload: { id: pointId, status: updatedStatus } as Record<string, unknown>,
        queuedAt: new Date().toISOString()
      });
      showSuccess('Access point toggle queued for sync when connection is restored');
      // Optimistic update
      setAccessPoints(prev => prev.map(p => p.id === pointId ? { ...p, status: updatedStatus as AccessPoint['status'] } : p));
      return;
    }

    const toastId = showLoading('Updating access point...');
    const startTime = Date.now();
    const updatedStatus = accessPoint.status === 'active' ? 'disabled' : 'active';
    
    // CRITICAL: Store original status for rollback on failure
    const originalStatus = accessPoint.status;
    
    try {
      // Optimistic update with rollback on failure
      setAccessPoints(prev => prev.map(p => p.id === pointId ? { ...p, status: updatedStatus as AccessPoint['status'] } : p));
      
      await retryWithBackoff(
        () => updateAccessPoint(pointId, { status: updatedStatus as AccessPoint['status'] }),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      const duration = Date.now() - startTime;
      trackPerformance('toggle_access_point', duration, { pointId, newStatus: updatedStatus });
      trackAction('access_point_toggled', 'access_point', { pointId, newStatus: updatedStatus });
      showSuccess('Access point status updated!');
      dismissLoadingAndShowSuccess(toastId, 'Access point status updated!');
      logger.info('Access point toggled', { module: 'AccessControl', action: 'toggleAccessPoint', pointId, newStatus: updatedStatus });
    } catch (error) {
      // Rollback optimistic update on failure
      setAccessPoints(prev => prev.map(p => p.id === pointId ? { ...p, status: originalStatus as AccessPoint['status'] } : p));
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'toggleAccessPoint',
        duration,
        pointId
      });
      // If network error and queue exists, enqueue for retry
      const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
      if (isNetworkIssue && operationQueue) {
        operationQueue.enqueue({
          type: 'toggle_access_point',
          payload: { id: pointId, status: updatedStatus } as Record<string, unknown>,
          queuedAt: new Date().toISOString()
        });
        dismissLoadingAndShowError(toastId, 'Access point toggle queued for sync when connection is restored');
        // Keep optimistic update
        return;
      }
      dismissLoadingAndShowError(toastId, 'Failed to update access point');
      ErrorHandlerService.logError(error, 'toggleAccessPoint');
      logger.error('Failed to toggle access point', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'toggleAccessPoint',
        pointId,
      });
    } finally {
      operationLock.releaseLock('toggle_access_point', pointId);
      requestDedup.clearRequest(requestKey);
    }
  }, [accessPoints, updateAccessPoint, trackAction, trackPerformance, trackError, operationQueue, requestDedup, operationLock]);

  // Sync Cached Events
  const syncCachedEvents = useCallback(async (accessPointId: string): Promise<void> => {
    const requestKey = `syncCachedEvents-${accessPointId}`;
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate syncCachedEvents request', { module: 'AccessControl', action: 'syncCachedEvents', accessPointId });
      return;
    }
    requestDedup.recordRequest(requestKey);
    
    const accessPoint = accessPoints.find(ap => ap.id === accessPointId);
    if (!accessPoint || !accessPoint.cachedEvents || accessPoint.cachedEvents.length === 0) {
      requestDedup.clearRequest(requestKey);
      showError('No cached events found for this access point');
      trackAction('sync_cached_events_failed', 'event', { accessPointId, reason: 'no_cached_events' });
      return;
    }

    const unsyncedEvents = accessPoint.cachedEvents.filter(e => !e.synced);
    if (unsyncedEvents.length === 0) {
      requestDedup.clearRequest(requestKey);
      showSuccess('All events are already synced');
      trackAction('sync_cached_events_skipped', 'event', { accessPointId, reason: 'already_synced' });
      return;
    }

    // Check if offline - enqueue if so
    if (!navigator.onLine && operationQueue) {
      operationQueue.enqueue({
        type: 'sync_cached_events',
        payload: {
          access_point_id: accessPointId,
          events: unsyncedEvents
        } as Record<string, unknown>,
        queuedAt: new Date().toISOString()
      });
      showSuccess(`Syncing ${unsyncedEvents.length} cached event(s) queued for sync when connection is restored`);
      operationLock.releaseLock('sync_cached_events', accessPointId);
      requestDedup.clearRequest(requestKey);
      return;
    }

    const toastId = showLoading(`Syncing ${unsyncedEvents.length} cached event(s) from "${accessPoint.name}"...`);
    const startTime = Date.now();

    try {
      const response = await retryWithBackoff(
        () => apiService.post<{ data: AccessEvent[] }>('/access-control/events/sync', {
          access_point_id: accessPointId,
          events: unsyncedEvents
        }),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      const syncedEvents = response.data?.data || [];
      setAccessEvents(syncedEvents);

      // Mark cached events as synced in local state
      setAccessPoints(prev => prev.map(ap =>
        ap.id === accessPointId
          ? {
              ...ap,
              cachedEvents: ap.cachedEvents?.map(e => ({ ...e, synced: true })) || []
            }
          : ap
      ));

      const duration = Date.now() - startTime;
      trackPerformance('sync_cached_events', duration, { accessPointId, eventCount: unsyncedEvents.length });
      trackAction('cached_events_synced', 'event', { accessPointId, eventCount: unsyncedEvents.length });
      dismissLoadingAndShowSuccess(toastId, `Successfully synced ${unsyncedEvents.length} event(s) from "${accessPoint.name}"`);
      logger.info('Cached events synced', { module: 'AccessControl', action: 'syncCachedEvents', accessPointId, eventCount: unsyncedEvents.length });
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'syncCachedEvents',
        duration,
        accessPointId,
        eventCount: unsyncedEvents.length
      });
      // If network error and queue exists, enqueue for retry
      const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
      if (isNetworkIssue && operationQueue) {
        operationQueue.enqueue({
          type: 'sync_cached_events',
          payload: {
            access_point_id: accessPointId,
            events: unsyncedEvents
          } as Record<string, unknown>,
          queuedAt: new Date().toISOString()
        });
        dismissLoadingAndShowError(toastId, 'Sync queued for sync when connection is restored');
        return;
      }
      dismissLoadingAndShowError(toastId, 'Failed to sync cached events');
      ErrorHandlerService.logError(error, 'syncCachedEvents');
      logger.error('Failed to sync cached events', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'syncCachedEvents',
        accessPointId,
      });
    } finally {
      operationLock.releaseLock('sync_cached_events', accessPointId);
      requestDedup.clearRequest(`syncCachedEvents-${accessPointId}`);
    }
  }, [accessPoints, trackAction, trackPerformance, trackError, operationQueue, requestDedup, operationLock]);

  const reviewAgentEvent = useCallback(async (eventId: string, action: 'approve' | 'reject', reason?: string): Promise<void> => {
    const requestKey = `reviewAgentEvent-${eventId}`;
    if (requestDedup.isDuplicate(requestKey)) {
      logger.debug('Skipping duplicate reviewAgentEvent request', { module: 'AccessControl', action: 'reviewAgentEvent', eventId });
      return;
    }
    requestDedup.recordRequest(requestKey);
    
    // Acquire operation lock
    if (!operationLock.acquireLock('review_agent_event', eventId)) {
      requestDedup.clearRequest(requestKey);
      logger.debug('Skipping review - operation locked', { module: 'AccessControl', action: 'reviewAgentEvent', eventId });
      return;
    }
    
    // Check if offline - enqueue if so
    if (!navigator.onLine && operationQueue) {
      operationQueue.enqueue({
        type: 'review_agent_event',
        payload: {
          eventId,
          action,
          reason
        } as Record<string, unknown>,
        queuedAt: new Date().toISOString()
      });
      showSuccess(`Event review queued for sync when connection is restored`);
      // Optimistic update
      setAccessEvents(prev => prev.map(e => 
        e.id === eventId 
          ? { ...e, review_status: action === 'approve' ? 'approved' : 'rejected', rejection_reason: reason } as AccessEvent
          : e
      ));
      operationLock.releaseLock('review_agent_event', eventId);
      requestDedup.clearRequest(requestKey);
      return;
    }

    const toastId = showLoading(`Reviewing event (${action})...`);
    const startTime = Date.now();
    try {
      await retryWithBackoff(
        () => apiService.put<{ data: AccessEvent }>(`/access-control/events/${eventId}/review`, {}, {
          params: { action, ...(reason != null && reason.trim() !== '' && { reason: reason.trim() }) },
        }),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
        }
      );
      await refreshAccessEvents();
      const duration = Date.now() - startTime;
      trackPerformance('review_agent_event', duration, { eventId, action });
      trackAction('agent_event_reviewed', 'event', { eventId, action, reason });
      dismissLoadingAndShowSuccess(toastId, `Event ${action}d.`);
      logger.info('Agent event reviewed', { module: 'AccessControl', action: 'reviewAgentEvent', eventId, reviewAction: action });
    } catch (error) {
      const duration = Date.now() - startTime;
      trackError(error instanceof Error ? error : new Error(String(error)), {
        action: 'reviewAgentEvent',
        duration,
        eventId,
        reviewAction: action
      });
      // If network error and queue exists, enqueue for retry
      const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
      if (isNetworkIssue && operationQueue) {
        operationQueue.enqueue({
          type: 'review_agent_event',
          payload: {
            eventId,
            action,
            reason
          } as Record<string, unknown>,
          queuedAt: new Date().toISOString()
        });
        dismissLoadingAndShowError(toastId, 'Event review queued for sync when connection is restored');
        // Optimistic update
        setAccessEvents(prev => prev.map(e => 
          e.id === eventId 
            ? { ...e, review_status: action === 'approve' ? 'approved' : 'rejected', rejection_reason: reason } as AccessEvent
            : e
        ));
        return;
      }
      dismissLoadingAndShowError(toastId, `Failed to ${action} event`);
      ErrorHandlerService.logError(error, 'reviewAgentEvent');
      logger.error('Failed to review agent event', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'reviewAgentEvent',
        eventId,
        reviewAction: action,
      });
      throw error;
    }
  }, [refreshAccessEvents, trackAction, trackPerformance, trackError, operationQueue]);

  // CRITICAL FIX: Held-Open Alarm Monitoring System
  // Reduced check interval for critical alarms (5 seconds for critical, 15 seconds for warnings)
  // Side effects (showError, trackAction) run after setState to avoid "setState during render" warning
  useEffect(() => {
    const checkHeldOpenAlarms = () => {
      pendingHeldOpenSideEffectsRef.current = [];
      setHeldOpenAlerts(prev => {
        const newAlerts: HeldOpenAlert[] = [];
        let stateChanged = false;

        accessPoints.forEach(point => {
          if (point.sensorStatus === 'held-open' && point.lastStatusChange) {
            const alert = AccessControlUtilities.checkHeldOpenAlarm(
              point.id,
              point.name,
              point.location,
              point.sensorStatus,
              point.lastStatusChange
            );

            if (alert) {
              const existingAlert = prev.find(a => a.accessPointId === point.id && !a.acknowledged);
              if (!existingAlert) {
                newAlerts.push(alert);
                stateChanged = true;
                if (alert.severity === 'critical') {
                  pendingHeldOpenSideEffectsRef.current.push({
                    type: 'critical',
                    accessPointId: point.id,
                    duration: alert.duration,
                    pointName: point.name
                  });
                } else {
                  pendingHeldOpenSideEffectsRef.current.push({
                    type: 'warning',
                    accessPointId: point.id,
                    duration: alert.duration
                  });
                }
              }
            }
          }
        });

        // Auto-acknowledge alerts when door closes or update current ones
        const updatedPrev = prev.map(alert => {
          const point = accessPoints.find(ap => ap.id === alert.accessPointId);
          if (point && point.sensorStatus !== 'held-open' && !alert.acknowledged) {
            stateChanged = true;
            pendingHeldOpenSideEffectsRef.current.push({ type: 'auto_ack', accessPointId: alert.accessPointId });
            return { ...alert, acknowledged: true, acknowledgedAt: new Date().toISOString() };
          }
          return alert;
        });

        if (stateChanged || newAlerts.length > 0) {
          return [...updatedPrev, ...newAlerts];
        }
        return prev;
      });
      // Flush side effects after this tick so we're not inside a setState updater
      setTimeout(() => {
        pendingHeldOpenSideEffectsRef.current.forEach(e => {
          if (e.type === 'critical') {
            showError(
              `🚨 CRITICAL: Door "${e.pointName}" has been held open for ${AccessControlUtilities.formatDuration(e.duration)}. ` +
              `Security risk detected!`
            );
            trackAction('held_open_alarm_critical', 'access_point', { accessPointId: e.accessPointId, duration: e.duration });
          } else if (e.type === 'warning') {
            trackAction('held_open_alarm_warning', 'access_point', { accessPointId: e.accessPointId, duration: e.duration });
          } else {
            trackAction('held_open_alarm_auto_acknowledged', 'access_point', { accessPointId: e.accessPointId });
          }
        });
        pendingHeldOpenSideEffectsRef.current = [];
      }, 0);
    };

    // Check every 15 seconds (reduced from 30 for faster detection)
    // Critical alarms (>5 min) will be detected within 15 seconds
    const interval = setInterval(checkHeldOpenAlarms, 15000);
    checkHeldOpenAlarms(); // Initial check

    return () => clearInterval(interval);
  }, [accessPoints, trackAction]);

  // CRITICAL FIX: Emergency Timeout Mechanism
  // Timeout state is managed in emergencyController state (no localStorage needed)
  useEffect(() => {
    if (emergencyMode === 'unlock' && emergencyController) {
      const timeoutTimestamp = emergencyController.timestamp;
      const timeoutDuration = emergencyController.timeoutDuration || emergencyTimeoutDuration;
      const timeoutEndTime = new Date(timeoutTimestamp).getTime() + (timeoutDuration * 1000);

      // Calculate remaining time
      const now = Date.now();
      const remainingMs = timeoutEndTime - now;

      if (remainingMs > 0 && !emergencyController.timeoutTimer) {
        const timer = setTimeout(() => {
          handleNormalMode({ reason: 'Emergency unlock timeout reached' });
          showError('Emergency unlock timeout reached. Normal mode restored automatically.');
        }, remainingMs);

        setEmergencyController(prev => prev ? { ...prev, timeoutTimer: timer } : null);
      } else if (remainingMs <= 0) {
        // Timeout already passed, restore immediately
        handleNormalMode({ reason: 'Emergency unlock timeout already passed' });
      }
    }

    return () => {
      if (emergencyController?.timeoutTimer) {
        clearTimeout(emergencyController.timeoutTimer);
      }
    };
  }, [emergencyMode, emergencyController, emergencyTimeoutDuration, handleNormalMode]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Heartbeat tracking for automatic offline detection
  useAccessControlHeartbeat({
    accessPoints,
    setAccessPoints,
    heartbeatOfflineThresholdMinutes: 15 // Configurable, default 15 minutes
  });

  // Update refresh functions ref when they're available
  useEffect(() => {
    refreshFunctionsRef.current = {
      refreshAccessPoints,
      refreshUsers,
      refreshAccessEvents
    };
  }, [refreshAccessPoints, refreshUsers, refreshAccessEvents]);

  // State reconciliation for data consistency
  useAccessControlStateReconciliation({
    accessPoints,
    users,
    setAccessPoints,
    setUsers
  });

  // Initial data load
  useEffect(() => {
    refreshAccessPoints();
    refreshUsers();
    refreshAccessEvents();
    refreshMetrics();
    refreshAuditLog();
  }, [refreshAccessPoints, refreshUsers, refreshAccessEvents, refreshMetrics, refreshAuditLog]);

  return {
    accessPoints,
    users,
    accessEvents,
    metrics,
    heldOpenAlerts,
    auditLog,
    emergencyMode,
    emergencyController,
    emergencyTimeoutDuration,
    loading,
    setAccessPoints,
    setUsers,
    setAccessEvents,
    refreshAccessPoints,
    refreshUsers,
    refreshAccessEvents,
    refreshMetrics,
    createAccessPoint,
    updateAccessPoint,
    deleteAccessPoint,
    createUser,
    updateUser,
    deleteUser,
    handleEmergencyLockdown,
    handleEmergencyUnlock,
    handleNormalMode,
    acknowledgeHeldOpenAlert,
    toggleAccessPoint,
    syncCachedEvents,
    reviewAgentEvent,
    exportAccessEvents,
    exportAccessReport,
    recordAuditEntry,
    refreshAuditLog,
    // Offline Queue Status
    queuePendingCount: operationQueue.pendingCount,
    queueFailedCount: operationQueue.failedCount,
    retryQueue: operationQueue.retryFailed,
    // Operation Lock
    operationLock,
    // Property ID
    propertyId,
    // Offline status
    isOffline,
  };
}
