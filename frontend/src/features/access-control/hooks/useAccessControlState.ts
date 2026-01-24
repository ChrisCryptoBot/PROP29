/**
 * Access Control State Hook
 * Centralized state management for Access Control feature
 * Extracted from monolithic component - contains ALL business logic
 * 
 * Following Gold Standard: Zero business logic in components, 100% in hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '../../../services/logger';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/ApiService';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { AccessControlUtilities } from '../../../services/AccessControlUtilities';
import type { HeldOpenAlert } from '../../../services/AccessControlUtilities';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showSuccess, showError } from '../../../utils/toast';
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
}

export function useAccessControlState(): UseAccessControlStateReturn {
  const { user: currentUser } = useAuth();
  const AUDIT_STORAGE_KEY = 'accessControl.auditLog';
  const MAX_AUDIT_ENTRIES = 200;
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
  const [auditLog, setAuditLog] = useState<AccessControlAuditEntry[]>(() => {
    try {
      const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored) as AccessControlAuditEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  });
  const [emergencyMode, setEmergencyMode] = useState<'normal' | 'lockdown' | 'unlock'>('normal');
  const [emergencyController, setEmergencyController] = useState<EmergencyController | null>(null);
  const emergencyTimeoutDuration = 30 * 60; // 30 minutes in seconds (configurable)

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
      const nextLog = [nextEntry, ...prev].slice(0, MAX_AUDIT_ENTRIES);
      try {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(nextLog));
      } catch (error) {
        logger.warn('Failed to persist audit log', { module: 'AccessControl', action: 'recordAuditEntry' });
      }
      return nextLog;
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
      try {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        logger.warn('Failed to persist audit log', { module: 'AccessControl', action: 'refreshAuditLog' });
      }
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
    setLoading(prev => ({ ...prev, accessPoints: true }));
    try {
      const response = await apiService.get<GetAccessPointsResponse>('/access-control/points');
      const points = response.data?.data || [];
      setAccessPoints(points);
      logger.info('Access points refreshed', { module: 'AccessControl', action: 'refreshAccessPoints', count: points.length });
    } catch (error) {
      logger.error('Failed to fetch access points', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'refreshAccessPoints',
      });
      // Keep existing data on error
    } finally {
      setLoading(prev => ({ ...prev, accessPoints: false }));
    }
  }, []);

  // Fetch Users
  const refreshUsers = useCallback(async () => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const response = await apiService.get<GetUsersResponse>('/access-control/users');
      const usersData = response.data?.data || [];
      setUsers(usersData);
      logger.info('Users refreshed', { module: 'AccessControl', action: 'refreshUsers', count: usersData.length });
    } catch (error) {
      logger.error('Failed to fetch users', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'refreshUsers',
      });
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, []);

  // Fetch Access Events
  const refreshAccessEvents = useCallback(async (filters?: Record<string, string>) => {
    setLoading(prev => ({ ...prev, accessEvents: true }));
    try {
      const response = await apiService.get<GetAccessEventsResponse>('/access-control/events', { params: filters });
      const events = response.data?.data || [];
      setAccessEvents(events);
      logger.info('Access events refreshed', { module: 'AccessControl', action: 'refreshAccessEvents', count: events.length });
    } catch (error) {
      logger.error('Failed to fetch access events', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'refreshAccessEvents',
      });
    } finally {
      setLoading(prev => ({ ...prev, accessEvents: false }));
    }
  }, []);

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
    setLoading(prev => ({ ...prev, metrics: true }));
    try {
      const response = await apiService.get<{ data: AccessMetrics }>('/access-control/metrics');
      setMetrics(response.data?.data || defaultMetrics);
      logger.info('Metrics refreshed', { module: 'AccessControl', action: 'refreshMetrics' });
    } catch (error) {
      logger.error('Failed to fetch metrics', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'refreshMetrics',
      });
      // Keep default metrics on error
      setMetrics(defaultMetrics);
    } finally {
      setLoading(prev => ({ ...prev, metrics: false }));
    }
  }, []);

  // Create Access Point
  const createAccessPoint = useCallback(async (point: Partial<AccessPoint>): Promise<AccessPoint> => {
    try {
      const response = await apiService.post<{ data: AccessPoint }>('/access-control/points', point);
      const newPoint = response.data?.data;
      if (!newPoint) {
        throw new Error('No data returned from API');
      }
      setAccessPoints(prev => [...prev, newPoint]);
      logger.info('Access point created', { module: 'AccessControl', action: 'createAccessPoint', id: newPoint.id });
      await refreshAccessPoints(); // Refresh to get server-generated fields
      return newPoint;
    } catch (error) {
      logger.error('Failed to create access point', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'createAccessPoint',
      });
      throw error;
    }
  }, [refreshAccessPoints]);

  // Update Access Point
  const updateAccessPoint = useCallback(async (id: string, updates: Partial<AccessPoint>): Promise<AccessPoint> => {
    try {
      const response = await apiService.put<{ data: AccessPoint }>(`/access-control/points/${id}`, updates);
      const updatedPoint = response.data?.data;
      if (!updatedPoint) {
        throw new Error('No data returned from API');
      }
      setAccessPoints(prev => prev.map(p => p.id === id ? updatedPoint : p));
      logger.info('Access point updated', { module: 'AccessControl', action: 'updateAccessPoint', id });
      return updatedPoint;
    } catch (error) {
      logger.error('Failed to update access point', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'updateAccessPoint',
        id,
      });
      throw error;
    }
  }, []);

  // Delete Access Point
  const deleteAccessPoint = useCallback(async (id: string): Promise<void> => {
    try {
      await apiService.delete(`/access-control/points/${id}`);
      setAccessPoints(prev => prev.filter(p => p.id !== id));
      logger.info('Access point deleted', { module: 'AccessControl', action: 'deleteAccessPoint', id });
    } catch (error) {
      logger.error('Failed to delete access point', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'deleteAccessPoint',
        id,
      });
      throw error;
    }
  }, []);

  // Create User
  const createUser = useCallback(async (user: Partial<AccessControlUser>): Promise<AccessControlUser> => {
    try {
      const response = await apiService.post<{ data: AccessControlUser }>('/access-control/users', user);
      const newUser = response.data?.data;
      if (!newUser) {
        throw new Error('No data returned from API');
      }
      setUsers(prev => [...prev, newUser]);
      logger.info('User created', { module: 'AccessControl', action: 'createUser', id: newUser.id });
      await refreshUsers(); // Refresh to get server-generated fields
      return newUser;
    } catch (error) {
      logger.error('Failed to create user', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'createUser',
      });
      throw error;
    }
  }, [refreshUsers]);

  // Update User
  const updateUser = useCallback(async (id: string, updates: Partial<AccessControlUser>): Promise<AccessControlUser> => {
    try {
      const response = await apiService.put<{ data: AccessControlUser }>(`/access-control/users/${id}`, updates);
      const updatedUser = response.data?.data;
      if (!updatedUser) {
        throw new Error('No data returned from API');
      }
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      logger.info('User updated', { module: 'AccessControl', action: 'updateUser', id });
      return updatedUser;
    } catch (error) {
      logger.error('Failed to update user', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'updateUser',
        id,
      });
      throw error;
    }
  }, []);

  // Delete User
  const deleteUser = useCallback(async (id: string): Promise<void> => {
    try {
      await apiService.delete(`/access-control/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      logger.info('User deleted', { module: 'AccessControl', action: 'deleteUser', id });
    } catch (error) {
      logger.error('Failed to delete user', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'deleteUser',
        id,
      });
      throw error;
    }
  }, []);

  // Emergency Lockdown Handler
  const handleEmergencyLockdown = useCallback(async (options?: { skipConfirm?: boolean; reason?: string }) => {
    if (!options?.skipConfirm) {
      const confirmed = window.confirm('⚠️ EMERGENCY LOCKDOWN\n\nThis will lock ALL access points. Are you sure?');
      if (!confirmed) return;
    }

    const currentTimestamp = new Date().toISOString();
    const currentUserEmail = currentUser?.email || 'unknown';
    const currentPriority = 1; // Lockdown has priority 1 (highest)

    // Check for existing emergency mode and resolve conflicts
    if (emergencyMode === 'unlock' && emergencyController) {
      const existingTimestamp = new Date(emergencyController.timestamp);
      const timeDiff = new Date(currentTimestamp).getTime() - existingTimestamp.getTime();

      if (timeDiff < 5000 && currentPriority >= emergencyController.priority) {
        // Allow override
      } else if (timeDiff < 5000 && currentPriority < emergencyController.priority) {
        showError(
          `Emergency Conflict: Unlock was initiated ${Math.round(timeDiff / 1000)}s ago by ${emergencyController.initiatedBy}. ` +
          `Lockdown requires higher priority. Contact security administrator.`
        );
        return;
      }
    }

    const toastId = showLoading('Initiating emergency lockdown...');
    try {
      await apiService.post('/access-control/emergency/lockdown', {
        timeout_minutes: Math.round(emergencyTimeoutDuration / 60),
        ...(options?.reason != null && options.reason.trim() !== '' && { reason: options.reason.trim() }),
      });
      setEmergencyMode('lockdown');
      setEmergencyController({
        mode: 'lockdown',
        initiatedBy: currentUserEmail,
        timestamp: currentTimestamp,
        priority: currentPriority
      });
      await refreshAccessPoints();
      dismissLoadingAndShowSuccess(toastId, 'Emergency lockdown activated! All access points are now locked.');
      logger.warn('Emergency lockdown activated', { module: 'AccessControl', action: 'handleEmergencyLockdown', initiatedBy: currentUserEmail });
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to initiate lockdown');
      ErrorHandlerService.logError(error, 'handleEmergencyLockdown');
      logger.error('Failed to initiate emergency lockdown', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'handleEmergencyLockdown',
      });
    }
  }, [emergencyMode, emergencyController, currentUser, emergencyTimeoutDuration, refreshAccessPoints]);

  // Emergency Unlock Handler
  const handleEmergencyUnlock = useCallback(async (options?: { skipConfirm?: boolean; reason?: string }) => {
    if (!options?.skipConfirm) {
      const confirmed = window.confirm('⚠️ EMERGENCY UNLOCK\n\nThis will unlock ALL access points. Are you sure?');
      if (!confirmed) return;
    }

    const currentTimestamp = new Date().toISOString();
    const currentUserEmail = currentUser?.email || 'unknown';
    const currentPriority = 0; // Unlock has lower priority than lockdown

    // Check for existing emergency mode and resolve conflicts
    if (emergencyMode === 'lockdown' && emergencyController) {
      const existingTimestamp = new Date(emergencyController.timestamp);
      const timeDiff = new Date(currentTimestamp).getTime() - existingTimestamp.getTime();

      if (timeDiff < 10000) { // 10 seconds grace period
        showError(
          `Emergency Conflict: Lockdown was initiated ${Math.round(timeDiff / 1000)}s ago by ${emergencyController.initiatedBy}. ` +
          `Unlock requires approval. Contact a security administrator.`
        );
        return;
      }
    }

    const toastId = showLoading('Initiating emergency unlock...');
    try {
      await apiService.post('/access-control/emergency/unlock', {
        timeout_minutes: Math.round(emergencyTimeoutDuration / 60),
        ...(options?.reason != null && options.reason.trim() !== '' && { reason: options.reason.trim() }),
      });
      setEmergencyMode('unlock');
      setEmergencyController({
        mode: 'unlock',
        initiatedBy: currentUserEmail,
        timestamp: currentTimestamp,
        priority: currentPriority,
        timeoutDuration: emergencyTimeoutDuration
      });
      await refreshAccessPoints();
      dismissLoadingAndShowSuccess(
        toastId,
        `Emergency unlock activated! All access points are now unlocked. ` +
        `Auto-relock will occur in ${AccessControlUtilities.formatDuration(emergencyTimeoutDuration)} if not manually restored.`
      );
      logger.warn('Emergency unlock activated', { module: 'AccessControl', action: 'handleEmergencyUnlock', initiatedBy: currentUserEmail });
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to initiate unlock');
      ErrorHandlerService.logError(error, 'handleEmergencyUnlock');
      logger.error('Failed to initiate emergency unlock', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'handleEmergencyUnlock',
      });
    }
  }, [emergencyMode, emergencyController, currentUser, emergencyTimeoutDuration, refreshAccessPoints]);

  // Restore Normal Mode Handler
  const handleNormalMode = useCallback(async (options?: { reason?: string }) => {
    const toastId = showLoading('Restoring normal mode...');
    try {
      // Clear emergency timeout timer if exists
      if (emergencyController?.timeoutTimer) {
        clearTimeout(emergencyController.timeoutTimer);
      }

      await apiService.post('/access-control/emergency/restore', {
        ...(options?.reason != null && options.reason.trim() !== '' && { reason: options.reason.trim() }),
      });
      setEmergencyMode('normal');
      setEmergencyController(null);
      await refreshAccessPoints();
      dismissLoadingAndShowSuccess(toastId, 'Normal mode restored.');
      logger.info('Normal mode restored', { module: 'AccessControl', action: 'handleNormalMode' });
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to restore normal mode');
      ErrorHandlerService.logError(error, 'handleNormalMode');
      logger.error('Failed to restore normal mode', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'handleNormalMode',
      });
    }
  }, [emergencyController, refreshAccessPoints]);

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
    const accessPoint = accessPoints.find(p => p.id === pointId);
    if (!accessPoint) {
      showError('Access point not found');
      return;
    }

    if (accessPoint.isOnline === false) {
      showError(
        `Hardware Disconnected: Cannot control "${accessPoint.name}". ` +
        `The access point is offline. Please check network connectivity and hardware status.`
      );
      return;
    }

    const toastId = showLoading('Updating access point...');
    try {
      const updatedStatus = accessPoint.status === 'active' ? 'disabled' : 'active';
      await updateAccessPoint(pointId, { status: updatedStatus as AccessPoint['status'] });
      showSuccess('Access point status updated!');
      dismissLoadingAndShowSuccess(toastId, 'Access point status updated!');
      logger.info('Access point toggled', { module: 'AccessControl', action: 'toggleAccessPoint', pointId, newStatus: updatedStatus });
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to update access point');
      ErrorHandlerService.logError(error, 'toggleAccessPoint');
      logger.error('Failed to toggle access point', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'toggleAccessPoint',
        pointId,
      });
    }
  }, [accessPoints, updateAccessPoint]);

  // Sync Cached Events
  const syncCachedEvents = useCallback(async (accessPointId: string): Promise<void> => {
    const accessPoint = accessPoints.find(ap => ap.id === accessPointId);
    if (!accessPoint || !accessPoint.cachedEvents || accessPoint.cachedEvents.length === 0) {
      showError('No cached events found for this access point');
      return;
    }

    const unsyncedEvents = accessPoint.cachedEvents.filter(e => !e.synced);
    if (unsyncedEvents.length === 0) {
      showSuccess('All events are already synced');
      return;
    }

    const toastId = showLoading(`Syncing ${unsyncedEvents.length} cached event(s) from "${accessPoint.name}"...`);

    try {
      const response = await apiService.post<{ data: AccessEvent[] }>('/access-control/events/sync', {
        access_point_id: accessPointId,
        events: unsyncedEvents
      });
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

      dismissLoadingAndShowSuccess(toastId, `Successfully synced ${unsyncedEvents.length} event(s) from "${accessPoint.name}"`);
      logger.info('Cached events synced', { module: 'AccessControl', action: 'syncCachedEvents', accessPointId, eventCount: unsyncedEvents.length });
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to sync cached events');
      ErrorHandlerService.logError(error, 'syncCachedEvents');
      logger.error('Failed to sync cached events', error instanceof Error ? error : new Error(String(error)), {
        module: 'AccessControl',
        action: 'syncCachedEvents',
        accessPointId,
      });
    }
  }, [accessPoints]);

  const reviewAgentEvent = useCallback(async (eventId: string, action: 'approve' | 'reject', reason?: string): Promise<void> => {
    const toastId = showLoading(`Reviewing event (${action})...`);
    try {
      await apiService.put<{ data: AccessEvent }>(`/access-control/events/${eventId}/review`, {}, {
        params: { action, ...(reason != null && reason.trim() !== '' && { reason: reason.trim() }) },
      });
      await refreshAccessEvents();
      dismissLoadingAndShowSuccess(toastId, `Event ${action}d.`);
      logger.info('Agent event reviewed', { module: 'AccessControl', action: 'reviewAgentEvent', eventId, reviewAction: action });
    } catch (error) {
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
  }, [refreshAccessEvents]);

  // CRITICAL FIX: Held-Open Alarm Monitoring System
  useEffect(() => {
    const checkHeldOpenAlarms = () => {
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
                  showError(
                    `🚨 CRITICAL: Door "${point.name}" has been held open for ${AccessControlUtilities.formatDuration(alert.duration)}. ` +
                    `Security risk detected!`
                  );
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
            return { ...alert, acknowledged: true, acknowledgedAt: new Date().toISOString() };
          }
          return alert;
        });

        if (stateChanged || newAlerts.length > 0) {
          return [...updatedPrev, ...newAlerts];
        }
        return prev;
      });
    };

    // Check every 30 seconds
    const interval = setInterval(checkHeldOpenAlarms, 30000);
    checkHeldOpenAlarms(); // Initial check

    return () => clearInterval(interval);
  }, [accessPoints]);

  // CRITICAL FIX: Emergency Timeout Mechanism
  useEffect(() => {
    if (emergencyMode === 'unlock' && emergencyController && !emergencyController.timeoutTimer) {
      const timeoutMs = (emergencyController.timeoutDuration || emergencyTimeoutDuration) * 1000;
      const timer = setTimeout(() => {
        handleNormalMode();
        showError('Emergency unlock timeout reached. Normal mode restored automatically.');
      }, timeoutMs);

      setEmergencyController(prev => prev ? { ...prev, timeoutTimer: timer } : null);
    }

    return () => {
      if (emergencyController?.timeoutTimer) {
        clearTimeout(emergencyController.timeoutTimer);
      }
    };
  }, [emergencyMode, emergencyController, emergencyTimeoutDuration, handleNormalMode]);

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
  };
}
