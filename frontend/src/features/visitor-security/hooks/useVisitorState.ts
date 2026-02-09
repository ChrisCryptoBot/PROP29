/**
 * Visitor State Hook
 * Centralized state management for Visitor Security feature
 * Contains ALL business logic following Gold Standard pattern
 */

import { useState, useEffect, useCallback, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import { logger } from '../../../services/logger';
import { useAuth } from '../../../contexts/AuthContext';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { retryWithBackoff } from '../../../utils/retryWithBackoff';
import {
  showLoading,
  dismissLoadingAndShowSuccess,
  dismissLoadingAndShowError,
  showSuccess,
  showError
} from '../../../utils/toast';
import type {
  Visitor,
  VisitorCreate,
  VisitorUpdate,
  VisitorFilters,
  Event,
  EventCreate,
  EventUpdate,
  EventFilters,
  SecurityRequest,
  SecurityRequestCreate,
  SecurityRequestFilters,
  VisitorStatus,
  VisitorMetrics,
  // Mobile Agent & Hardware Integration Types
  MobileAgentDevice,
  MobileAgentSubmission,
  HardwareDevice,
  SystemConnectivity,
  EnhancedVisitorSettings,
  BulkVisitorOperation
} from '../types/visitor-security.types';
import { VisitorStatus as StatusEnum } from '../types/visitor-security.types';
import visitorService from '../services/VisitorService';
import { useVisitorQueue } from './useVisitorQueue';

export interface VisitorConflictInfo {
  localVisitor: Visitor;
  serverVisitor: Visitor;
  localChanges: Partial<Visitor>;
}

export interface UseVisitorStateReturn {
  // Data - Core
  visitors: Visitor[];
  events: Event[];
  securityRequests: SecurityRequest[];
  selectedVisitor: Visitor | null;
  selectedEvent: Event | null;
  metrics: VisitorMetrics | null;

  // Data - Mobile Agent & Hardware Integration
  mobileAgentDevices: MobileAgentDevice[];
  setMobileAgentDevices: Dispatch<SetStateAction<MobileAgentDevice[]>>;
  mobileAgentSubmissions: MobileAgentSubmission[];
  hardwareDevices: HardwareDevice[];
  setHardwareDevices: Dispatch<SetStateAction<HardwareDevice[]>>;
  systemConnectivity: SystemConnectivity | null;
  enhancedSettings: EnhancedVisitorSettings | null;
  bulkOperations: BulkVisitorOperation[];

  // Loading states
  loading: {
    visitors: boolean;
    visitor: boolean;
    events: boolean;
    event: boolean;
    securityRequests: boolean;
    // Mobile Agent & Hardware Loading States
    mobileAgents: boolean;
    agentSubmissions: boolean;
    hardwareDevices: boolean;
    systemStatus: boolean;
    settings: boolean;
    bulkOperation: boolean;
  };

  // Filters
  filter: 'all' | 'registered' | 'checked_in' | 'checked_out' | 'overdue' | 'cancelled';
  setFilter: (filter: 'all' | 'registered' | 'checked_in' | 'checked_out' | 'overdue' | 'cancelled') => void;

  // Modal states
  showRegisterModal: boolean;
  setShowRegisterModal: (show: boolean) => void;
  showEventModal: boolean;
  setShowEventModal: (show: boolean) => void;
  showQRModal: boolean;
  setShowQRModal: (show: boolean) => void;
  showBadgeModal: boolean;
  setShowBadgeModal: (show: boolean) => void;
  showVisitorDetailsModal: boolean;
  setShowVisitorDetailsModal: (show: boolean) => void;
  showEventDetailsModal: boolean;
  setShowEventDetailsModal: (show: boolean) => void;

  // Computed
  filteredVisitors: Visitor[];

  // Actions - Visitor CRUD Operations
  refreshVisitors: (filters?: VisitorFilters) => Promise<void>;
  getVisitor: (visitorId: string) => Promise<Visitor | null>;
  createVisitor: (visitor: VisitorCreate) => Promise<Visitor | null>;
  updateVisitor: (
    visitorId: string, 
    updates: VisitorUpdate,
    conflictResolution?: 'overwrite' | 'merge' | 'cancel',
    onConflict?: (conflict: { localVisitor: Visitor; serverVisitor: Visitor; localChanges: Partial<Visitor> }) => void
  ) => Promise<Visitor | null>;
  deleteVisitor: (visitorId: string) => Promise<boolean>;

    // Actions - Visitor Management
    checkInVisitor: (visitorId: string) => Promise<boolean>;
    checkOutVisitor: (visitorId: string) => Promise<boolean>;
    getVisitorQRCode: (visitorId: string) => Promise<string | null>;
    checkBannedIndividual: (name: string) => Promise<{ is_banned: boolean; matches: any[] }>;

  // Actions - Event CRUD Operations
  refreshEvents: (filters?: EventFilters) => Promise<void>;
  getEvent: (eventId: string) => Promise<Event | null>;
  createEvent: (event: EventCreate) => Promise<Event | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;

  // Actions - Security Requests
  refreshSecurityRequests: (filters?: SecurityRequestFilters) => Promise<void>;
  createSecurityRequest: (request: SecurityRequestCreate) => Promise<SecurityRequest | null>;
  assignSecurityRequest: (requestId: string, assignedTo: string, status?: 'in_progress' | 'completed' | 'cancelled') => Promise<SecurityRequest | null>;

  // Actions - Selection
  setSelectedVisitor: (visitor: Visitor | null) => void;
  setSelectedEvent: (event: Event | null) => void;

  // Actions - Bulk Operations
  bulkDeleteVisitors: (visitorIds: string[]) => Promise<boolean>;
  bulkStatusChange: (visitorIds: string[], status: VisitorStatus | string) => Promise<boolean>;

  // Actions - Mobile Agent Management  
  refreshMobileAgents: () => Promise<void>;
  registerMobileAgent: (agentData: any) => Promise<MobileAgentDevice | null>;
  refreshAgentSubmissions: (agentId?: string) => Promise<void>;
  processAgentSubmission: (submissionId: string, action: 'approve' | 'reject', reason?: string) => Promise<boolean>;
  syncMobileAgent: (agentId: string) => Promise<boolean>;

  // Actions - Hardware Device Management
  refreshHardwareDevices: () => Promise<void>;
  getDeviceStatus: (deviceId: string) => Promise<HardwareDevice | null>;
  printVisitorBadge: (visitorId: string, printerId?: string) => Promise<boolean>;

  // Actions - System Connectivity & Health
  refreshSystemStatus: () => Promise<void>;
  checkSystemHealth: () => Promise<boolean>;

  // Actions - Enhanced Settings Management
  refreshEnhancedSettings: () => Promise<void>;
  updateEnhancedSettings: (settings: EnhancedVisitorSettings) => Promise<boolean>;

  // Actions - MSO Desktop Support
  getCachedDataSummary: () => { visitors_count: number; events_count: number; last_sync: string | null; offline_mode: boolean };
  enableOfflineMode: () => void;
  syncOfflineData: () => Promise<boolean>;

  // Observability
  lastSynced: string | null;

  // Conflict resolution
  conflictInfo: VisitorConflictInfo | null;
  setConflictInfo: (info: VisitorConflictInfo | null) => void;
  handleConflictResolution: (action: 'overwrite' | 'merge' | 'cancel') => Promise<void>;

  // Offline queue
  queuePendingCount: number;
  queueFailedCount: number;
  retryQueue: () => void;
}

export function useVisitorState(): UseVisitorStateReturn {
  const { user: currentUser } = useAuth();

  // Property ID for scoping: prefer backend-provided property_id/assigned_property_ids when available
  const propertyId = useMemo(() => {
    const user = currentUser as { property_id?: string; assigned_property_ids?: string[] } | undefined;
    return user?.property_id ?? user?.assigned_property_ids?.[0] ?? currentUser?.roles?.[0] ?? 'default-property-id';
  }, [currentUser]);

  // State - Core
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [securityRequests, setSecurityRequests] = useState<SecurityRequest[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // State - Mobile Agent & Hardware Integration
  const [mobileAgentDevices, setMobileAgentDevices] = useState<MobileAgentDevice[]>([]);
  const [mobileAgentSubmissions, setMobileAgentSubmissions] = useState<MobileAgentSubmission[]>([]);
  const [hardwareDevices, setHardwareDevices] = useState<HardwareDevice[]>([]);
  const [systemConnectivity, setSystemConnectivity] = useState<SystemConnectivity | null>(null);
  const [enhancedSettings, setEnhancedSettings] = useState<EnhancedVisitorSettings | null>(null);
  const [bulkOperations, setBulkOperations] = useState<BulkVisitorOperation[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Loading states
  const [loading, setLoading] = useState({
    visitors: false,
    visitor: false,
    events: false,
    event: false,
    securityRequests: false,
    // Mobile Agent & Hardware Loading States
    mobileAgents: false,
    agentSubmissions: false,
    hardwareDevices: false,
    systemStatus: false,
    settings: false,
    bulkOperation: false,
  });

  // Filters
  const [filter, setFilter] = useState<'all' | 'registered' | 'checked_in' | 'checked_out' | 'overdue' | 'cancelled'>('all');

  // Modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showVisitorDetailsModal, setShowVisitorDetailsModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<VisitorConflictInfo | null>(null);

  const refreshAfterSyncRef = useRef<{ refreshVisitors: () => void; refreshEvents: () => void; refreshSecurityRequests: () => void }>({
    refreshVisitors: () => {},
    refreshEvents: () => {},
    refreshSecurityRequests: () => {}
  });

  // Offline queue (onSynced uses ref so refresh functions are available when flush runs)
  const operationQueue = useVisitorQueue({
    onSynced: () => {
      refreshAfterSyncRef.current.refreshVisitors?.();
      refreshAfterSyncRef.current.refreshEvents?.();
      refreshAfterSyncRef.current.refreshSecurityRequests?.();
    }
  });

  // Computed: Filtered visitors
  const filteredVisitors = useMemo(() => {
    return visitors.filter(visitor => {
      if (filter === 'all') return true;
      return visitor.status === filter;
    });
  }, [visitors, filter]);

  // Computed: Metrics
  const metrics = useMemo<VisitorMetrics | null>(() => {
    if (visitors.length === 0) return null;
    return {
      total: visitors.length,
      checked_in: visitors.filter(v => v.status === 'checked_in').length,
      pending: visitors.filter(v => v.security_clearance === 'pending').length,
      active_events: events.length,
      security_requests: securityRequests.filter(sr => sr.status === 'pending' || sr.status === 'in_progress').length,
      overdue: visitors.filter(v => v.status === 'overdue').length
    };
  }, [visitors, events, securityRequests]);

  // Fetch Visitors
  const refreshVisitors = useCallback(async (filters?: VisitorFilters) => {
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      const response = await retryWithBackoff(
        () => visitorService.getVisitors({
          ...filters,
          property_id: filters?.property_id || propertyId
        }),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          shouldRetry: (error) => {
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response?: { status?: number } };
              return axiosError.response?.status ? axiosError.response.status >= 500 : true;
            }
            return true;
          }
        }
      );

      if (response.data) {
        setVisitors(response.data);
        setLastSynced(new Date().toISOString());
      }
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'refreshVisitors');
      showError('Failed to load visitors');
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, [propertyId]);

  // Get Single Visitor
  const getVisitor = useCallback(async (visitorId: string): Promise<Visitor | null> => {
    setLoading(prev => ({ ...prev, visitor: true }));
    try {
      const response = await visitorService.getVisitor(visitorId);
      if (response.data) {
        setSelectedVisitor(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'getVisitor');
      showError('Failed to load visitor');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, visitor: false }));
    }
  }, []);

  // Create Visitor
  // Check banned individual
  const checkBannedIndividual = useCallback(async (name: string): Promise<{ is_banned: boolean; matches: any[] }> => {
    try {
      const result = await visitorService.checkBannedIndividual(name);
      return result;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'checkBannedIndividual');
      return { is_banned: false, matches: [] };
    }
  }, []);

  const createVisitor = useCallback(async (visitor: VisitorCreate): Promise<Visitor | null> => {
    if (!navigator.onLine) {
      operationQueue.enqueue({
        type: 'create_visitor',
        payload: { ...visitor, property_id: visitor.property_id || propertyId }
      });
      showSuccess('Queued for sync when online');
      return null;
    }

    // Check banned individuals before creating
    const fullName = `${visitor.first_name} ${visitor.last_name}`.trim();
    const bannedCheck = await checkBannedIndividual(fullName);
    
    if (bannedCheck.is_banned && bannedCheck.matches.length > 0) {
      // Show warning but allow override for admins
      const isAdmin = currentUser?.roles?.some((role: string) => role.toUpperCase() === 'ADMIN');
      // TODO: Replace with proper modal (Phase 2.6)
      const shouldProceed = isAdmin 
        ? window.confirm(
            `⚠️ WARNING: Visitor "${fullName}" matches ${bannedCheck.matches.length} banned individual(s).\n\n` +
            `Reason: ${bannedCheck.matches[0]?.reason || 'Unknown'}\n\n` +
            `As an administrator, do you want to proceed with registration?`
          )
        : false;
      
      if (!shouldProceed) {
        showError(`Registration blocked: Visitor matches banned individual database. Please contact security.`);
        return null;
      }
    }

    const toastId = showLoading('Issuing ingress credentials...');
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      const response = await retryWithBackoff(
        () => visitorService.createVisitor({
          ...visitor,
          property_id: visitor.property_id || propertyId
        }),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          shouldRetry: (error) => {
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response?: { status?: number } };
              return axiosError.response?.status ? axiosError.response.status >= 500 : true;
            }
            return true;
          }
        }
      );
      if (response.data) {
        const newVisitor = response.data;
        setVisitors(prev => [newVisitor, ...prev]);
        setLastSynced(new Date().toISOString());
        
        // Notify other tabs
        try {
          const key = 'visitor-security:visitor-created';
          localStorage.setItem(key, JSON.stringify(newVisitor.id));
          setTimeout(() => localStorage.removeItem(key), 100);
        } catch {
          // Ignore localStorage errors (e.g., private browsing)
        }
        
        dismissLoadingAndShowSuccess(toastId, bannedCheck.is_banned 
          ? 'Ingress registration complete (Banned match overridden by admin)'
          : 'Ingress registration complete'
        );
        return newVisitor;
      }
      dismissLoadingAndShowError(toastId, 'Failed to process ingress registration');
      return null;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'createVisitor');
      dismissLoadingAndShowError(toastId, 'Failed to process ingress registration');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, [propertyId, checkBannedIndividual, currentUser, operationQueue]);

  // Update Visitor
  const updateVisitor = useCallback(async (
    visitorId: string, 
    updates: VisitorUpdate,
    conflictResolution?: 'overwrite' | 'merge' | 'cancel',
    onConflict?: (conflict: { localVisitor: Visitor; serverVisitor: Visitor; localChanges: Partial<Visitor> }) => void
  ): Promise<Visitor | null> => {
    if (!navigator.onLine) {
      operationQueue.enqueue({
        type: 'update_visitor',
        payload: { visitorId, updates }
      });
      showSuccess('Queued for sync when online');
      return null;
    }

    const toastId = showLoading('Updating record...');
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      // Get current visitor for conflict detection
      const currentVisitor = visitors.find(v => v.id === visitorId);
      if (!currentVisitor) {
        dismissLoadingAndShowError(toastId, 'Visitor not found');
        return null;
      }

      // Conflict detection: check if updated_at is older than current
      if (updates.updated_at && currentVisitor.updated_at) {
        const localUpdatedAt = new Date(updates.updated_at).getTime();
        const currentUpdatedAt = new Date(currentVisitor.updated_at).getTime();
        
        if (localUpdatedAt < currentUpdatedAt && onConflict) {
          // Fetch latest from server
          const latestResponse = await visitorService.getVisitor(visitorId);
          if (latestResponse.data) {
            const serverVisitor = latestResponse.data;
            onConflict({
              localVisitor: currentVisitor,
              serverVisitor,
              localChanges: updates
            });
            dismissLoadingAndShowError(toastId, 'Update cancelled due to conflict');
            return null;
          }
        }
      }

      // Handle conflict resolution
      let finalUpdates = updates;
      if (conflictResolution === 'cancel') {
        dismissLoadingAndShowError(toastId, 'Update cancelled');
        await refreshVisitors();
        return null;
      } else if (conflictResolution === 'merge') {
        // Merge: combine local changes with server version
        const latestResponse = await visitorService.getVisitor(visitorId);
        if (latestResponse.data) {
          const latestVisitor = latestResponse.data;
          finalUpdates = {
            ...latestVisitor,
            ...updates,
            // Preserve server's updated_at to avoid another conflict
            updated_at: latestVisitor.updated_at
          } as VisitorUpdate;
        }
      } else if (conflictResolution === 'overwrite') {
        // Overwrite: use local changes, but update updated_at to current time
        finalUpdates = {
          ...updates,
          updated_at: new Date().toISOString()
        };
      }

      // Handle 409 Conflict response
      const response = await retryWithBackoff(
        () => visitorService.updateVisitor(visitorId, finalUpdates),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          shouldRetry: (error) => {
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response?: { status?: number } };
              const status = axiosError.response?.status;
              // Don't retry on 409 conflicts - set conflict state for modal
              if (status === 409) {
                visitorService.getVisitor(visitorId).then(latestResponse => {
                  if (latestResponse.data) {
                    setConflictInfo({
                      localVisitor: currentVisitor,
                      serverVisitor: latestResponse.data,
                      localChanges: updates
                    });
                    onConflict?.({
                      localVisitor: currentVisitor,
                      serverVisitor: latestResponse.data,
                      localChanges: updates
                    });
                  }
                });
                return false;
              }
              return status ? status >= 500 : true;
            }
            return true;
          }
        }
      );

      if (response.data) {
        const updatedVisitor = response.data;
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        setLastSynced(new Date().toISOString());
        if (selectedVisitor?.id === visitorId) {
          setSelectedVisitor(updatedVisitor);
        }
        dismissLoadingAndShowSuccess(toastId, 'Record updated successfully');
        return updatedVisitor;
      }
      dismissLoadingAndShowError(toastId, 'Failed to update record');
      return null;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'updateVisitor');
      dismissLoadingAndShowError(toastId, 'Failed to update record');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, [selectedVisitor, visitors, refreshVisitors, operationQueue]);

  // Handle conflict resolution from modal
  const handleConflictResolution = useCallback(async (action: 'overwrite' | 'merge' | 'cancel') => {
    if (!conflictInfo) return;
    if (action === 'cancel') {
      setConflictInfo(null);
      return;
    }
    const result = await updateVisitor(conflictInfo.localVisitor.id, conflictInfo.localChanges, action);
    if (result) setConflictInfo(null);
  }, [conflictInfo, updateVisitor]);

  // Delete Visitor
  const deleteVisitor = useCallback(async (visitorId: string): Promise<boolean> => {
    if (!navigator.onLine) {
      operationQueue.enqueue({ type: 'delete_visitor', payload: { visitorId } });
      showSuccess('Queued for sync when online');
      return false;
    }

    const toastId = showLoading('Purging record...');
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      const response = await retryWithBackoff(
        () => visitorService.deleteVisitor(visitorId),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          shouldRetry: (error) => {
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response?: { status?: number } };
              return axiosError.response?.status ? axiosError.response.status >= 500 : true;
            }
            return true;
          }
        }
      );
      if (!response.error) {
        setVisitors(prev => prev.filter(v => v.id !== visitorId));
        setLastSynced(new Date().toISOString());
        if (selectedVisitor?.id === visitorId) {
          setSelectedVisitor(null);
        }
        
        // Notify other tabs
        try {
          const key = 'visitor-security:visitor-deleted';
          localStorage.setItem(key, JSON.stringify(visitorId));
          setTimeout(() => localStorage.removeItem(key), 100);
        } catch {
          // Ignore localStorage errors
        }
        
        dismissLoadingAndShowSuccess(toastId, 'Record purged successfully');
        return true;
      }
      dismissLoadingAndShowError(toastId, 'Failed to purge record');
      return false;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'deleteVisitor');
      dismissLoadingAndShowError(toastId, 'Failed to purge record');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, [selectedVisitor]);

  // Check In Visitor
  const checkInVisitor = useCallback(async (visitorId: string): Promise<boolean> => {
    if (!navigator.onLine) {
      operationQueue.enqueue({ type: 'check_in_visitor', payload: { visitorId } });
      showSuccess('Queued for sync when online');
      return false;
    }

    const toastId = showLoading('Authorizing site ingress...');
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      const response = await visitorService.checkInVisitor(visitorId);
      if (response.data) {
        const updatedVisitor = response.data;
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        if (selectedVisitor?.id === visitorId) {
          setSelectedVisitor(updatedVisitor);
        }
        dismissLoadingAndShowSuccess(toastId, 'Ingress authorized');
        return true;
      }
      dismissLoadingAndShowError(toastId, 'Ingress authorization failed');
      return false;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'checkInVisitor');
      dismissLoadingAndShowError(toastId, 'Ingress authorization failed');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, [selectedVisitor]);

  // Check Out Visitor
  const checkOutVisitor = useCallback(async (visitorId: string): Promise<boolean> => {
    if (!navigator.onLine) {
      operationQueue.enqueue({ type: 'check_out_visitor', payload: { visitorId } });
      showSuccess('Queued for sync when online');
      return false;
    }

    const toastId = showLoading('Authorizing site egress...');
    setLoading(prev => ({ ...prev, visitors: true }));
    try {
      const response = await retryWithBackoff(
        () => visitorService.checkOutVisitor(visitorId),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          shouldRetry: (error) => {
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response?: { status?: number } };
              return axiosError.response?.status ? axiosError.response.status >= 500 : true;
            }
            return true;
          }
        }
      );
      if (response.data) {
        const updatedVisitor = response.data;
        setVisitors(prev => prev.map(v => v.id === visitorId ? updatedVisitor : v));
        setLastSynced(new Date().toISOString());
        if (selectedVisitor?.id === visitorId) {
          setSelectedVisitor(updatedVisitor);
        }
        dismissLoadingAndShowSuccess(toastId, 'Egress authorized');
        return true;
      }
      dismissLoadingAndShowError(toastId, 'Egress authorization failed');
      return false;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'checkOutVisitor');
      dismissLoadingAndShowError(toastId, 'Egress authorization failed');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false }));
    }
  }, [selectedVisitor]);

  // Get Visitor QR Code
  const getVisitorQRCode = useCallback(async (visitorId: string): Promise<string | null> => {
    try {
      const response = await visitorService.getVisitorQRCode(visitorId);
      if (response.data) {
        return response.data.qr_code;
      }
      return null;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'getVisitorQRCode');
      showError('Failed to get QR code');
      return null;
    }
  }, []);

  // Fetch Events
  const refreshEvents = useCallback(async (filters?: EventFilters) => {
    setLoading(prev => ({ ...prev, events: true }));
    try {
      const response = await retryWithBackoff(
        () => visitorService.getEvents({
          ...filters,
          property_id: filters?.property_id || propertyId
        }),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          shouldRetry: (error) => {
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response?: { status?: number } };
              return axiosError.response?.status ? axiosError.response.status >= 500 : true;
            }
            return true;
          }
        }
      );

      if (response.data) {
        setEvents(response.data);
        setLastSynced(new Date().toISOString());
      }
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'refreshEvents');
      showError('Failed to load events');
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  }, [propertyId]);

  // Get Single Event
  const getEvent = useCallback(async (eventId: string): Promise<Event | null> => {
    setLoading(prev => ({ ...prev, event: true }));
    try {
      const fromList = events.find(e => e.id === eventId);
      if (fromList) {
        setSelectedEvent(fromList);
        return fromList;
      }
      const response = await visitorService.getEvent(eventId);
      if (response.data) {
        const event = response.data;
        setSelectedEvent(event);
        setEvents(prev => (prev.some(e => e.id === event.id) ? prev : [event, ...prev]));
        return event;
      }
      return null;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'getEvent');
      showError('Failed to load event');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, event: false }));
    }
  }, [events]);

  // Create Event
  const createEvent = useCallback(async (event: EventCreate): Promise<Event | null> => {
    const toastId = showLoading('Registering event profile...');
    setLoading(prev => ({ ...prev, events: true }));
    try {
      const response = await retryWithBackoff(
        () => visitorService.createEvent({
          ...event,
          property_id: event.property_id || propertyId
        }),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          shouldRetry: (error) => {
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response?: { status?: number } };
              return axiosError.response?.status ? axiosError.response.status >= 500 : true;
            }
            return true;
          }
        }
      );
      if (response.data) {
        const newEvent = response.data;
        setEvents(prev => [newEvent, ...prev]);
        setLastSynced(new Date().toISOString());
        dismissLoadingAndShowSuccess(toastId, 'Event profile registered');
        return newEvent;
      }
      dismissLoadingAndShowError(toastId, 'Failed to register event profile');
      return null;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'createEvent');
      dismissLoadingAndShowError(toastId, 'Failed to register event profile');
      return null;
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  }, [propertyId]);

  // Delete Event
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!navigator.onLine) {
      operationQueue.enqueue({ type: 'delete_event', payload: { eventId } });
      showSuccess('Queued for sync when online');
      return false;
    }

    const toastId = showLoading('Purging event profile...');
    setLoading(prev => ({ ...prev, events: true }));
    try {
      const response = await retryWithBackoff(
        () => visitorService.deleteEvent(eventId),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          shouldRetry: (error) => {
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response?: { status?: number } };
              return axiosError.response?.status ? axiosError.response.status >= 500 : true;
            }
            return true;
          }
        }
      );
      if (!response.error) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        setLastSynced(new Date().toISOString());
        if (selectedEvent?.id === eventId) {
          setSelectedEvent(null);
        }
        
        // Notify other tabs
        try {
          const key = 'visitor-security:event-deleted';
          localStorage.setItem(key, JSON.stringify(eventId));
          setTimeout(() => localStorage.removeItem(key), 100);
        } catch {
          // Ignore localStorage errors
        }
        
        dismissLoadingAndShowSuccess(toastId, 'Event profile purged');
        return true;
      }
      dismissLoadingAndShowError(toastId, 'Failed to purge event profile');
      return false;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'deleteEvent');
      dismissLoadingAndShowError(toastId, 'Failed to purge event profile');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  }, [selectedEvent]);

  // Fetch Security Requests
  const refreshSecurityRequests = useCallback(async (filters?: SecurityRequestFilters) => {
    setLoading(prev => ({ ...prev, securityRequests: true }));
    try {
      const response = await visitorService.getSecurityRequests({
        ...filters,
        property_id: filters?.property_id || propertyId
      });

      if (response.data) {
        setSecurityRequests(response.data);
      }
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'refreshSecurityRequests');
      showError('Failed to load security requests');
    } finally {
      setLoading(prev => ({ ...prev, securityRequests: false }));
    }
  }, [propertyId]);

  useEffect(() => {
    refreshAfterSyncRef.current = {
      refreshVisitors,
      refreshEvents,
      refreshSecurityRequests
    };
  }, [refreshVisitors, refreshEvents, refreshSecurityRequests]);

  // Create Security Request
  const createSecurityRequest = useCallback(async (request: SecurityRequestCreate): Promise<SecurityRequest | null> => {
    if (!navigator.onLine) {
      operationQueue.enqueue({ type: 'create_security_request', payload: request as unknown as Record<string, unknown> });
      showSuccess('Queued for sync when online');
      return null;
    }

    const toastId = showLoading('Submitting clearance request...');
    try {
      const response = await retryWithBackoff(
        () => visitorService.createSecurityRequest(request),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          shouldRetry: (error) => {
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response?: { status?: number } };
              return axiosError.response?.status ? axiosError.response.status >= 500 : true;
            }
            return true;
          }
        }
      );
      if (response.data) {
        const newRequest = response.data;
        setSecurityRequests(prev => [newRequest, ...prev]);
        setLastSynced(new Date().toISOString());
        dismissLoadingAndShowSuccess(toastId, 'Clearance request submitted');
        return newRequest;
      }
      dismissLoadingAndShowError(toastId, 'Clearance request failed');
      return null;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'createSecurityRequest');
      dismissLoadingAndShowError(toastId, 'Clearance request failed');
      return null;
    }
  }, []);

  // Assign Security Request
  const assignSecurityRequest = useCallback(async (
    requestId: string,
    assignedTo: string,
    status: 'in_progress' | 'completed' | 'cancelled' = 'in_progress'
  ): Promise<SecurityRequest | null> => {
    if (!navigator.onLine) {
      showError('Assign when online to sync.');
      return null;
    }
    try {
      const response = await visitorService.assignSecurityRequest(requestId, assignedTo, status);
      if (response.data) {
        const updated = response.data;
        setSecurityRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updated } : r));
        setVisitors(prev => prev.map(v => ({
          ...v,
          security_requests: v.security_requests?.map(r => r.id === requestId ? { ...r, ...updated } : r) ?? []
        })));
        setLastSynced(new Date().toISOString());
        showSuccess('Request assigned');
        return updated;
      }
      return null;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'assignSecurityRequest');
      showError('Failed to assign request');
      return null;
    }
  }, []);

  // Bulk Delete Visitors
  const bulkDeleteVisitors = useCallback(async (visitorIds: string[]): Promise<boolean> => {
    if (loading.bulkOperation) {
      showError('Another bulk operation is in progress');
      return false;
    }

    const toastId = showLoading('Purging records...');
    setLoading(prev => ({ ...prev, visitors: true, bulkOperation: true }));
    const startTime = Date.now();
    
    try {
      const operationState = {
        successful: [] as string[],
        failed: [] as Array<{ id: string; error: string }>
      };

      const results = await Promise.allSettled(
        visitorIds.map(id =>
          retryWithBackoff(
            () => visitorService.deleteVisitor(id),
            {
              maxRetries: 2,
              baseDelay: 500,
              maxDelay: 5000,
              shouldRetry: (error) => {
                if (error && typeof error === 'object' && 'response' in error) {
                  const axiosError = error as { response?: { status?: number } };
                  return axiosError.response?.status ? axiosError.response.status >= 500 : true;
                }
                return true;
              }
            }
          )
        )
      );

      results.forEach((result, index) => {
        const id = visitorIds[index];
        if (result.status === 'fulfilled' && !result.value.error) {
          operationState.successful.push(id);
        } else {
          const errorMsg = result.status === 'rejected' 
            ? (result.reason instanceof Error ? result.reason.message : String(result.reason))
            : 'Unknown error';
          operationState.failed.push({ id, error: errorMsg });
        }
      });

      setVisitors(prev => prev.filter(v => !operationState.successful.includes(v.id)));
      setLastSynced(new Date().toISOString());
      
      if (selectedVisitor && operationState.successful.includes(selectedVisitor.id)) {
        setSelectedVisitor(null);
      }

      const duration = Date.now() - startTime;
      if (operationState.failed.length === 0) {
        dismissLoadingAndShowSuccess(toastId, `Successfully purged ${operationState.successful.length} record(s)`);
        logger.info('Bulk delete completed', {
          module: 'VisitorSecurity',
          action: 'bulkDeleteVisitors',
          successful: operationState.successful.length,
          duration
        });
      } else {
        dismissLoadingAndShowError(toastId, `${operationState.successful.length} succeeded, ${operationState.failed.length} failed`);
        logger.warn('Bulk delete partial failure', {
          module: 'VisitorSecurity',
          action: 'bulkDeleteVisitors',
          successful: operationState.successful.length,
          failed: operationState.failed.length,
          duration
        });
      }

      // Notify other tabs
      try {
        const key = 'visitor-security:bulk-operation';
        localStorage.setItem(key, JSON.stringify({ type: 'bulk_delete', count: operationState.successful.length }));
        setTimeout(() => localStorage.removeItem(key), 100);
      } catch {
        // Ignore localStorage errors
      }

      return operationState.failed.length === 0;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'bulkDeleteVisitors');
      dismissLoadingAndShowError(toastId, 'Failed to purge records');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false, bulkOperation: false }));
    }
  }, [selectedVisitor, loading.bulkOperation]);

  // Bulk Status Change
  const bulkStatusChange = useCallback(async (visitorIds: string[], status: VisitorStatus | string): Promise<boolean> => {
    if (loading.bulkOperation) {
      showError('Another bulk operation is in progress');
      return false;
    }

    const toastId = showLoading('Updating record state...');
    setLoading(prev => ({ ...prev, visitors: true, bulkOperation: true }));
    const startTime = Date.now();
    
    try {
      const operationState = {
        successful: [] as string[],
        failed: [] as Array<{ id: string; error: string }>
      };

      const results = await Promise.allSettled(
        visitorIds.map(id =>
          retryWithBackoff(
            () => visitorService.updateVisitor(id, { status } as VisitorUpdate),
            {
              maxRetries: 2,
              baseDelay: 500,
              maxDelay: 5000,
              shouldRetry: (error) => {
                if (error && typeof error === 'object' && 'response' in error) {
                  const axiosError = error as { response?: { status?: number } };
                  return axiosError.response?.status ? axiosError.response.status >= 500 : true;
                }
                return true;
              }
            }
          )
        )
      );

      results.forEach((result, index) => {
        const id = visitorIds[index];
        if (result.status === 'fulfilled' && result.value.data) {
          operationState.successful.push(id);
        } else {
          const errorMsg = result.status === 'rejected' 
            ? (result.reason instanceof Error ? result.reason.message : String(result.reason))
            : 'Unknown error';
          operationState.failed.push({ id, error: errorMsg });
        }
      });

      // Update successful items in state
      setVisitors(prev => prev.map(v =>
        operationState.successful.includes(v.id) ? { ...v, status } : v
      ));
      setLastSynced(new Date().toISOString());

      const duration = Date.now() - startTime;
      if (operationState.failed.length === 0) {
        dismissLoadingAndShowSuccess(toastId, `Successfully updated ${operationState.successful.length} record(s)`);
        logger.info('Bulk status change completed', {
          module: 'VisitorSecurity',
          action: 'bulkStatusChange',
          successful: operationState.successful.length,
          status,
          duration
        });
      } else {
        dismissLoadingAndShowError(toastId, `${operationState.successful.length} succeeded, ${operationState.failed.length} failed`);
        logger.warn('Bulk status change partial failure', {
          module: 'VisitorSecurity',
          action: 'bulkStatusChange',
          successful: operationState.successful.length,
          failed: operationState.failed.length,
          status,
          duration
        });
      }

      // Notify other tabs
      try {
        const key = 'visitor-security:bulk-operation';
        localStorage.setItem(key, JSON.stringify({ type: 'bulk_status_change', count: operationState.successful.length, status }));
        setTimeout(() => localStorage.removeItem(key), 100);
      } catch {
        // Ignore localStorage errors
      }

      return operationState.failed.length === 0;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'bulkStatusChange');
      dismissLoadingAndShowError(toastId, 'Failed to update record state');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, visitors: false, bulkOperation: false }));
    }
  }, [loading.bulkOperation]);

  // =======================================================
  // MOBILE AGENT & HARDWARE INTEGRATION - MSO PRODUCTION READINESS
  // =======================================================

  // Mobile Agent Management
  const refreshMobileAgents = useCallback(async (): Promise<void> => {
    setLoading(prev => ({ ...prev, mobileAgents: true }));
    try {
      const response = await visitorService.getMobileAgentDevices(propertyId);
      if (response.data) {
        setMobileAgentDevices(response.data);
        logger.info('Mobile agents refreshed', { 
          module: 'VisitorSecurity',
          action: 'refreshMobileAgents',
          count: response.data.length
        });
      }
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'refreshMobileAgents');
      // Don't show error for background refresh
    } finally {
      setLoading(prev => ({ ...prev, mobileAgents: false }));
    }
  }, [propertyId]);

  const registerMobileAgent = useCallback(async (agentData: {
    agent_name: string;
    device_id: string;
    device_model?: string;
    app_version: string;
    assigned_properties: string[];
  }): Promise<MobileAgentDevice | null> => {
    const toastId = showLoading('Registering mobile agent device...');
    try {
      const response = await visitorService.registerMobileAgent(agentData);
      if (response.data) {
        setMobileAgentDevices(prev => [response.data!, ...prev]);
        dismissLoadingAndShowSuccess(toastId, 'Mobile agent registered successfully');
        return response.data;
      }
      dismissLoadingAndShowError(toastId, 'Failed to register mobile agent');
      return null;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'registerMobileAgent');
      dismissLoadingAndShowError(toastId, 'Failed to register mobile agent');
      return null;
    }
  }, []);

  const refreshAgentSubmissions = useCallback(async (agentId?: string): Promise<void> => {
    setLoading(prev => ({ ...prev, agentSubmissions: true }));
    try {
      const response = await visitorService.getMobileAgentSubmissions(agentId, 'pending');
      if (response.data) {
        setMobileAgentSubmissions(response.data);
      }
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'refreshAgentSubmissions');
    } finally {
      setLoading(prev => ({ ...prev, agentSubmissions: false }));
    }
  }, []);

  const processAgentSubmission = useCallback(async (
    submissionId: string, 
    action: 'approve' | 'reject', 
    reason?: string
  ): Promise<boolean> => {
    const toastId = showLoading(`${action === 'approve' ? 'Approving' : 'Rejecting'} mobile agent submission...`);
    try {
      const response = await visitorService.processMobileAgentSubmission(submissionId, action, reason);
      if (!response.error) {
        // Update submissions list
        setMobileAgentSubmissions(prev => 
          prev.map(sub => sub.submission_id === submissionId 
            ? { ...sub, status: action === 'approve' ? 'processed' : 'rejected' }
            : sub
          )
        );
        // If approved and created a visitor, refresh visitors
        if (action === 'approve' && response.data) {
          await refreshVisitors();
        }
        dismissLoadingAndShowSuccess(toastId, `Submission ${action}ed successfully`);
        return true;
      }
      dismissLoadingAndShowError(toastId, `Failed to ${action} submission`);
      return false;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'processAgentSubmission');
      dismissLoadingAndShowError(toastId, `Failed to ${action} submission`);
      return false;
    }
  }, [refreshVisitors]);

  const syncMobileAgent = useCallback(async (agentId: string): Promise<boolean> => {
    const toastId = showLoading('Synchronizing mobile agent data...');
    try {
      const response = await visitorService.syncMobileAgentData(agentId);
      if (response.data) {
        const { synced_items, errors } = response.data;
        if (errors.length === 0) {
          dismissLoadingAndShowSuccess(toastId, `Synchronized ${synced_items} items successfully`);
        } else {
          showError(`Synchronized ${synced_items} items with ${errors.length} errors`);
        }
        await refreshVisitors();
        await refreshAgentSubmissions(agentId);
        return true;
      }
      dismissLoadingAndShowError(toastId, 'Failed to synchronize mobile agent');
      return false;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'syncMobileAgent');
      dismissLoadingAndShowError(toastId, 'Failed to synchronize mobile agent');
      return false;
    }
  }, [refreshVisitors, refreshAgentSubmissions]);

  // Hardware Device Management
  const refreshHardwareDevices = useCallback(async (): Promise<void> => {
    setLoading(prev => ({ ...prev, hardwareDevices: true }));
    try {
      const response = await retryWithBackoff(
        () => visitorService.getHardwareDevices(propertyId),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          shouldRetry: (error) => {
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response?: { status?: number } };
              return axiosError.response?.status ? axiosError.response.status >= 500 : true;
            }
            return true;
          }
        }
      );
      if (response.data) {
        setHardwareDevices(response.data);
        logger.info('Hardware devices refreshed', {
          module: 'VisitorSecurity',
          action: 'refreshHardwareDevices',
          count: response.data.length
        });
      }
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'refreshHardwareDevices');
      // Don't show error for background refresh
    } finally {
      setLoading(prev => ({ ...prev, hardwareDevices: false }));
    }
  }, [propertyId]);

  const getDeviceStatus = useCallback(async (deviceId: string): Promise<HardwareDevice | null> => {
    try {
      const response = await visitorService.getHardwareDeviceStatus(deviceId);
      if (response.data) {
        // Update device in the list
        setHardwareDevices(prev => 
          prev.map(device => device.device_id === deviceId ? response.data! : device)
        );
        return response.data;
      }
      return null;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'getDeviceStatus');
      return null;
    }
  }, []);

  const printVisitorBadge = useCallback(async (visitorId: string, printerId?: string): Promise<boolean> => {
    const toastId = showLoading('Sending badge to printer...');
    try {
      const response = await retryWithBackoff(
        () => visitorService.printVisitorBadge(visitorId, printerId),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          shouldRetry: (error) => {
            if (error && typeof error === 'object' && 'response' in error) {
              const axiosError = error as { response?: { status?: number } };
              return axiosError.response?.status ? axiosError.response.status >= 500 : true;
            }
            return true;
          }
        }
      );
      if (response.data) {
        const { print_job_id, status } = response.data;
        if (status === 'queued' || status === 'printing') {
          dismissLoadingAndShowSuccess(toastId, `Badge print job ${print_job_id} queued`);
          return true;
        } else if (status === 'completed') {
          dismissLoadingAndShowSuccess(toastId, 'Badge printed successfully');
          return true;
        }
      }
      dismissLoadingAndShowError(toastId, 'Failed to print badge');
      return false;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'printVisitorBadge');
      dismissLoadingAndShowError(toastId, 'Failed to print badge');
      return false;
    }
  }, []);

  // System Connectivity & Health
  const refreshSystemStatus = useCallback(async (): Promise<void> => {
    setLoading(prev => ({ ...prev, systemStatus: true }));
    try {
      const response = await visitorService.getSystemConnectivity();
      if (response.data) {
        setSystemConnectivity(response.data);
      }
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'refreshSystemStatus');
      // Set offline status on error
      setSystemConnectivity({
        network_status: 'offline',
        backend_status: 'disconnected',
        mobile_agents_connected: 0,
        hardware_devices_connected: 0,
        last_sync: new Date().toISOString(),
        pending_sync_items: 0,
        connectivity_errors: ['Connection failed']
      });
    } finally {
      setLoading(prev => ({ ...prev, systemStatus: false }));
    }
  }, []);

  const checkSystemHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await visitorService.checkSystemHealth();
      return response.data?.status === 'healthy';
    } catch {
      return false;
    }
  }, []);

  // Enhanced Settings Management
  const refreshEnhancedSettings = useCallback(async (): Promise<void> => {
    setLoading(prev => ({ ...prev, settings: true }));
    try {
      const response = await visitorService.getEnhancedSettings(propertyId);
      if (response.data) {
        setEnhancedSettings(response.data);
      }
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'refreshEnhancedSettings');
      // Set default settings on error
      setEnhancedSettings({
        visitor_retention_days: 365,
        auto_checkout_hours: 24,
        require_photo: true,
        require_host_approval: false,
        mobile_agent_settings: {
          enabled: true,
          require_location: true,
          auto_sync_enabled: true,
          offline_mode_duration_hours: 8,
          photo_quality: 'medium',
          allow_bulk_operations: true,
          require_supervisor_approval: false
        },
        hardware_settings: {
          card_reader_enabled: false,
          camera_integration_enabled: false,
          printer_integration_enabled: false,
          auto_badge_printing: false,
          device_health_monitoring: true,
          alert_on_device_offline: true,
          maintenance_reminder_days: 30
        },
        mso_settings: {
          offline_mode_enabled: true,
          cache_size_limit_mb: 500,
          sync_interval_seconds: 300,
          auto_backup_enabled: true,
          backup_retention_days: 30,
          hardware_timeout_seconds: 30,
          mobile_agent_timeout_seconds: 60,
          network_retry_attempts: 3
        },
        api_settings: {
          mobile_agent_endpoint: '/api/visitors/mobile-agents',
          hardware_device_endpoint: '/api/visitors/hardware',
          websocket_endpoint: '/api/visitors/ws',
          api_key_mobile: 'mobile_key_placeholder',
          api_key_hardware: 'hardware_key_placeholder',
          encryption_enabled: true
        }
      });
    } finally {
      setLoading(prev => ({ ...prev, settings: false }));
    }
  }, [propertyId]);

  const updateEnhancedSettings = useCallback(async (settings: EnhancedVisitorSettings): Promise<boolean> => {
    const toastId = showLoading('Updating settings...');
    try {
      const response = await visitorService.updateEnhancedSettings(settings, propertyId);
      if (response.data) {
        setEnhancedSettings(response.data);
        dismissLoadingAndShowSuccess(toastId, 'Settings updated successfully');
        return true;
      }
      dismissLoadingAndShowError(toastId, 'Failed to update settings');
      return false;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'updateEnhancedSettings');
      dismissLoadingAndShowError(toastId, 'Failed to update settings');
      return false;
    }
  }, [propertyId]);

  // MSO Desktop Support
  const getCachedDataSummary = useCallback(() => {
    return visitorService.getCachedDataSummary();
  }, []);

  const enableOfflineMode = useCallback(() => {
    // Cache current data for offline use
    visitorService.cacheDataLocally({
      visitors,
      events,
      securityRequests
    });
    showSuccess('Offline mode enabled - data cached locally');
  }, [visitors, events, securityRequests]);

  const syncOfflineData = useCallback(async (): Promise<boolean> => {
    const toastId = showLoading('Synchronizing offline data...');
    try {
      const filters = { property_id: propertyId };
      const [vRes, eRes, srRes] = await Promise.all([
        visitorService.getVisitors(filters),
        visitorService.getEvents(filters),
        visitorService.getSecurityRequests(filters)
      ]);
      const vList = vRes.data ?? [];
      const eList = eRes.data ?? [];
      const srList = srRes.data ?? [];
      setVisitors(vList);
      setEvents(eList);
      setSecurityRequests(srList);
      setLastSynced(new Date().toISOString());
      visitorService.cacheDataLocally({
        visitors: vList,
        events: eList,
        securityRequests: srList
      });
      await Promise.all([refreshMobileAgents(), refreshHardwareDevices()]);
      dismissLoadingAndShowSuccess(toastId, 'Data synchronized successfully');
      return true;
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'syncOfflineData');
      dismissLoadingAndShowError(toastId, 'Failed to synchronize data');
      return false;
    }
  }, [propertyId, refreshMobileAgents, refreshHardwareDevices]);

  // Auto-fetch on mount - Enhanced for Production Readiness
  useEffect(() => {
    if (propertyId && propertyId !== 'default-property-id') {
      // Core data
      refreshVisitors({ property_id: propertyId });
      refreshEvents({ property_id: propertyId });
      refreshSecurityRequests({ property_id: propertyId });
      
      // Mobile Agent & Hardware data
      refreshMobileAgents();
      refreshHardwareDevices();
      refreshSystemStatus();
      refreshEnhancedSettings();
      
      // Check for pending mobile agent submissions
      refreshAgentSubmissions();
    }
  }, [
    propertyId, 
    refreshVisitors, 
    refreshEvents, 
    refreshSecurityRequests,
    refreshMobileAgents,
    refreshHardwareDevices,
    refreshSystemStatus,
    refreshEnhancedSettings,
    refreshAgentSubmissions
  ]);

  return {
    // Data - Core
    visitors,
    events,
    securityRequests,
    selectedVisitor,
    selectedEvent,
    metrics,

    // Data - Mobile Agent & Hardware Integration
    mobileAgentDevices,
    setMobileAgentDevices,
    mobileAgentSubmissions,
    hardwareDevices,
    setHardwareDevices,
    systemConnectivity,
    enhancedSettings,
    bulkOperations,

    // Loading states
    loading,

    // Filters
    filter,
    setFilter,

    // Modal states
    showRegisterModal,
    setShowRegisterModal,
    showEventModal,
    setShowEventModal,
    showQRModal,
    setShowQRModal,
    showBadgeModal,
    setShowBadgeModal,
    showVisitorDetailsModal,
    setShowVisitorDetailsModal,
    showEventDetailsModal,
    setShowEventDetailsModal,

    // Computed
    filteredVisitors,

    // Actions - Visitor CRUD
    refreshVisitors,
    getVisitor,
    createVisitor,
    updateVisitor,
    deleteVisitor,

    // Actions - Visitor Management
    checkInVisitor,
    checkOutVisitor,
    getVisitorQRCode,
    checkBannedIndividual,

    // Actions - Event CRUD
    refreshEvents,
    getEvent,
    createEvent,
    deleteEvent,

    // Actions - Security Requests
    refreshSecurityRequests,
    createSecurityRequest,
    assignSecurityRequest,

    // Actions - Selection
    setSelectedVisitor,
    setSelectedEvent,

    // Actions - Bulk Operations
    bulkDeleteVisitors,
    bulkStatusChange,

    // Actions - Mobile Agent Management
    refreshMobileAgents,
    registerMobileAgent,
    refreshAgentSubmissions,
    processAgentSubmission,
    syncMobileAgent,

    // Actions - Hardware Device Management
    refreshHardwareDevices,
    getDeviceStatus,
    printVisitorBadge,

    // Actions - System Connectivity & Health
    refreshSystemStatus,
    checkSystemHealth,

    // Actions - Enhanced Settings Management
    refreshEnhancedSettings,
    updateEnhancedSettings,

  // Actions - MSO Desktop Support
  getCachedDataSummary,
  enableOfflineMode,
  syncOfflineData,

  // Observability
  lastSynced,

  // Conflict resolution
  conflictInfo,
  setConflictInfo,
  handleConflictResolution,

  // Offline queue
  queuePendingCount: operationQueue.pendingCount,
  queueFailedCount: operationQueue.failedCount,
  retryQueue: operationQueue.retryFailed,
  };
}
