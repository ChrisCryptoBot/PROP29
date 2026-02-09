/**
 * Incident Log State Hook
 * Centralized state management for Incident Log feature
 * Extracted from monolithic component - contains ALL business logic
 * 
 * Following Gold Standard: Zero business logic in components, 100% in hooks
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { logger } from '../../../services/logger';
import { useAuth } from '../../../contexts/AuthContext';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { retryWithBackoff } from '../../../utils/retryWithBackoff';
import { useIncidentLogHeartbeat } from './useIncidentLogHeartbeat';
import { useIncidentLogQueue } from './useIncidentLogQueue';
import { useIncidentLogRequestDeduplication } from './useIncidentLogRequestDeduplication';
import { useIncidentLogOperationLock } from './useIncidentLogOperationLock';
import { useIncidentLogStateReconciliation } from './useIncidentLogStateReconciliation';
import {
    showLoading,
    dismissLoadingAndShowSuccess,
    dismissLoadingAndShowError,
    showSuccess,
    showError
} from '../../../utils/toast';
import type {
    Incident,
    IncidentCreate,
    IncidentUpdate,
    EmergencyAlertResponse,
    IncidentFilters,
    EscalationRule,
    UserActivity,
    PatternRecognitionRequest,
    PatternRecognitionResponse,
    // Production Readiness Enhancement Types
    AgentPerformanceMetrics,
    DeviceHealthStatus,
    BulkOperationResult,
    EnhancedIncidentSettings,
    HardwareIncidentMetadata
} from '../types/incident-log.types';
import { IncidentStatus, IncidentSeverity, AgentTrustLevel } from '../types/incident-log.types';
import incidentService from '../services/IncidentService';

export interface UseIncidentLogStateReturn {
    // Data - Core
    incidents: Incident[];
    selectedIncident: Incident | null;
    escalationRules: EscalationRule[];
    activityByIncident: Record<string, UserActivity[]>;
    lastSynced: Date | null;
    
    // Offline Queue Status
    queuePendingCount: number;
    queueFailedCount: number;
    
    // Property Context
    propertyId: string | undefined;

    // Data - Production Readiness Enhancements
    agentPerformanceMetrics: AgentPerformanceMetrics[];
    hardwareDevices: DeviceHealthStatus[];
    enhancedSettings: EnhancedIncidentSettings | null;
    bulkOperationResult: BulkOperationResult | null;

    // Loading states
    loading: {
        incidents: boolean;
        incident: boolean;
        ai: boolean;
        related: boolean;
        evidence: boolean;
        activity: boolean;
        // New loading states
        agentPerformance: boolean;
        hardwareDevices: boolean;
        bulkOperation: boolean;
        settings: boolean;
    };

    // Modal states - New enhanced modal management
    modals: {
        showCreateModal: boolean;
        showEditModal: boolean;
        showDetailsModal: boolean;
        showEscalationModal: boolean;
        showAdvancedFilters: boolean;
        showReportModal: boolean;
        showEmergencyAlertModal: boolean;
        // New production-ready modals
        showAgentPerformanceModal: boolean;
        showAutoApprovalSettingsModal: boolean;
        showBulkOperationModal: boolean;
        showDeleteConfirmModal: boolean;
        deleteIncidentId: string | null;
        selectedAgentId: string | null;
        bulkOperation: {
            type: 'approve' | 'reject' | 'delete' | 'status_change' | null;
            incidentIds: string[];
            reason?: string;
            newStatus?: IncidentStatus;
            title: string;
            description: string;
        } | null;
    };

    // Actions - CRUD Operations
    refreshIncidents: (filters?: IncidentFilters) => Promise<void>;
    getIncident: (incidentId: string) => Promise<Incident | null>;
    createIncident: (incident: IncidentCreate) => Promise<Incident | null>;
    updateIncident: (
        incidentId: string, 
        updates: IncidentUpdate,
        conflictResolution?: 'overwrite' | 'merge' | 'cancel',
        onConflict?: (conflict: { localIncident: Incident; serverIncident: Incident; localChanges: Partial<Incident> }) => void
    ) => Promise<Incident | null>;
    deleteIncident: (incidentId: string) => void;
    confirmDeleteIncident: () => Promise<boolean>;
    cancelDeleteIncident: () => void;

    // Actions - Incident Management
    assignIncident: (incidentId: string, assigneeId: string) => Promise<boolean>;
    resolveIncident: (incidentId: string) => Promise<boolean>;
    escalateIncident: (incidentId: string, reason: string) => Promise<boolean>;

    // Actions - AI & Analysis
    getIncidentActivity: (incidentId: string) => Promise<UserActivity[]>;
    getPatternRecognition: (request: PatternRecognitionRequest) => Promise<PatternRecognitionResponse | null>;

    // Actions - Emergency
    createEmergencyAlert: (alert: any) => Promise<EmergencyAlertResponse | null>;
    convertEmergencyAlert: (alertId: string, overrides?: Partial<IncidentCreate>) => Promise<Incident | null>;

    // Actions - Selection
    setSelectedIncident: (incident: Incident | null) => void;

    // Actions - Bulk Operations (Enhanced)
    bulkDelete: (incidentIds: string[]) => void;
    confirmBulkDelete: (incidentIds: string[], reason?: string) => Promise<BulkOperationResult | null>;
    bulkStatusChange: (incidentIds: string[], status: IncidentStatus) => Promise<boolean>;
    bulkApprove: (incidentIds: string[], reason?: string) => Promise<BulkOperationResult | null>;
    bulkReject: (incidentIds: string[], reason: string) => Promise<BulkOperationResult | null>;

    // Actions - Mobile Agent Performance
    refreshAgentPerformance: (agentId?: string) => Promise<void>;
    getAgentTrustLevel: (agentId: string) => AgentTrustLevel;
    calculateAgentTrustScore: (agentId: string) => Promise<number>;

    // Actions - Hardware Device Integration
    refreshHardwareDevices: () => Promise<void>;
    getHardwareDeviceStatus: (deviceId: string) => Promise<DeviceHealthStatus | null>;
    getHardwareMetadata: (incident: Incident) => HardwareIncidentMetadata | null;

    // Actions - Enhanced Settings
    refreshEnhancedSettings: () => Promise<void>;
    updateEnhancedSettings: (settings: EnhancedIncidentSettings) => Promise<boolean>;

    // Actions - Modal UI Controls (Enhanced)
    setShowCreateModal: (show: boolean) => void;
    setShowEditModal: (show: boolean) => void;
    setShowDetailsModal: (show: boolean) => void;
    setShowEscalationModal: (show: boolean) => void;
    setShowAdvancedFilters: (show: boolean) => void;
    setShowReportModal: (show: boolean) => void;
    setShowEmergencyAlertModal: (show: boolean) => void;
    
    // New modal controls for production-ready features
    setShowAgentPerformanceModal: (show: boolean, agentId?: string) => void;
    setShowAutoApprovalSettingsModal: (show: boolean) => void;
    setShowBulkOperationModal: (show: boolean, operation?: {
        type: 'approve' | 'reject' | 'delete' | 'status_change';
        incidentIds: string[];
        reason?: string;
        newStatus?: IncidentStatus;
        title: string;
        description: string;
    }) => void;
    setShowDeleteConfirmModal: (show: boolean, incidentId?: string) => void;
    operationLock: ReturnType<typeof useIncidentLogOperationLock>;
}

export function useIncidentLogState(): UseIncidentLogStateReturn {
    const { user: currentUser } = useAuth();

    // Offline queue integration
    const { enqueue, pendingCount, failedCount } = useIncidentLogQueue({
        onSynced: () => {
            setLastSynced(new Date()); // Update lastSynced after queue flush
        }
    });

    // Request deduplication to prevent duplicate refreshIncidents calls
    const requestDedup = useIncidentLogRequestDeduplication();

    // Operation lock to prevent WebSocket race conditions
    const operationLock = useIncidentLogOperationLock();

    // State - Core
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
    const [activityByIncident, setActivityByIncident] = useState<Record<string, UserActivity[]>>({});
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    // State - Production Readiness Enhancements
    const [agentPerformanceMetrics, setAgentPerformanceMetrics] = useState<AgentPerformanceMetrics[]>([]);
    const [hardwareDevices, setHardwareDevices] = useState<DeviceHealthStatus[]>([]);
    const [enhancedSettings, setEnhancedSettings] = useState<EnhancedIncidentSettings | null>(null);
    const [bulkOperationResult, setBulkOperationResult] = useState<BulkOperationResult | null>(null);

    // Loading states
    const [loading, setLoading] = useState({
        incidents: false,
        incident: false,
        ai: false,
        related: false,
        evidence: false,
        activity: false,
        // New loading states
        agentPerformance: false,
        hardwareDevices: false,
        bulkOperation: false,
        settings: false,
    });

    // Modal states - Enhanced modal management
    const [modals, setModals] = useState({
        showCreateModal: false,
        showEditModal: false,
        showDetailsModal: false,
        showEscalationModal: false,
        showAdvancedFilters: false,
        showReportModal: false,
        showEmergencyAlertModal: false,
        // New production-ready modals
        showAgentPerformanceModal: false,
        showAutoApprovalSettingsModal: false,
        showBulkOperationModal: false,
        showDeleteConfirmModal: false,
        deleteIncidentId: null as string | null,
        selectedAgentId: null as string | null,
        bulkOperation: null as {
            type: 'approve' | 'reject' | 'delete' | 'status_change' | null;
            incidentIds: string[];
            reason?: string;
            newStatus?: IncidentStatus;
            title: string;
            description: string;
        } | null
    });

    // State reconciliation
    useIncidentLogStateReconciliation({
        incidents,
        setIncidents
    });

    // Property context for incident scoping. Use user.property_id when available; fallback to first role for compatibility.
    const propertyId = useMemo(() => {
        return (currentUser as { property_id?: string })?.property_id ?? currentUser?.roles?.[0] ?? undefined;
    }, [currentUser]);

    // Fetch Incidents
    const refreshIncidents = useCallback(async (filters?: IncidentFilters) => {
        // Request deduplication: prevent duplicate calls within 1 second
        const requestKey = `refreshIncidents-${JSON.stringify(filters || {})}`;
        if (requestDedup.isDuplicate(requestKey)) {
            logger.debug('Skipping duplicate refreshIncidents request', { module: 'IncidentLog', filters });
            return;
        }
        requestDedup.recordRequest(requestKey, filters);

        setLoading(prev => ({ ...prev, incidents: true }));
        try {
            // Derive property_id from currentUser if not provided in filters
            const effectivePropertyId = filters?.property_id || propertyId;
            
            // Backend GET /incidents does not support start_date/end_date; filter client-side when provided
            const response = await incidentService.getIncidents({
                property_id: effectivePropertyId,
                status: filters?.status,
                severity: filters?.severity
            });

            if (response.data) {
                let list = response.data;
                if (filters?.start_date || filters?.end_date) {
                    const start = filters.start_date ? new Date(filters.start_date).getTime() : 0;
                    const end = filters.end_date ? new Date(filters.end_date).getTime() : Number.MAX_SAFE_INTEGER;
                    list = list.filter((inc) => {
                        const created = inc.created_at ? new Date(inc.created_at).getTime() : 0;
                        return created >= start && created <= end;
                    });
                }
                setIncidents(list);
                setLastSynced(new Date()); // Update lastSynced on successful refresh
                logger.info('Incidents refreshed', { module: 'IncidentLog', count: list.length });
                try {
                    localStorage.setItem('incident-log-cache', JSON.stringify({
                        incidents: list,
                        last_sync: new Date().toISOString()
                    }));
                } catch (e) {
                    // Best-effort; ignore localStorage errors (e.g. private mode)
                }
            }
        } catch (error) {
            logger.error('Failed to fetch incidents', error instanceof Error ? error : new Error(String(error)));
            showError('Failed to load incidents. Please try again.');
        } finally {
            // Clear request deduplication in finally to ensure it's always cleared
            requestDedup.clearRequest(requestKey);
            setLoading(prev => ({ ...prev, incidents: false }));
        }
    }, [propertyId, requestDedup]);

    // Get Single Incident
    const getIncident = useCallback(async (incidentId: string): Promise<Incident | null> => {
        setLoading(prev => ({ ...prev, incident: true }));
        try {
            const response = await incidentService.getIncident(incidentId);
            if (response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            logger.error('Failed to fetch incident details', error instanceof Error ? error : new Error(String(error)), { incidentId });
            return null;
        } finally {
            setLoading(prev => ({ ...prev, incident: false }));
        }
    }, []);

    // Create Incident
    const createIncident = useCallback(async (incident: IncidentCreate): Promise<Incident | null> => {
        // Acquire operation lock
        const tempId = `create-${Date.now()}`;
        if (!operationLock.acquireLock('create_incident', tempId)) {
            logger.warn('Create operation already in progress', { module: 'IncidentLog' });
            return null;
        }

        try {
            // Check if offline - enqueue if so
            if (!navigator.onLine) {
                enqueue({
                    type: 'create_incident',
                    payload: incident as unknown as Record<string, unknown>,
                    queuedAt: new Date().toISOString()
                });
                showSuccess('Incident queued for sync when connection is restored');
                // Optimistically add to local state
                const optimisticIncident: Incident = {
                    ...incident as any,
                    incident_id: `temp-${Date.now()}`,
                    status: IncidentStatus.PENDING_REVIEW,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                setIncidents(prev => [...prev, optimisticIncident]);
                operationLock.releaseLock('create_incident', tempId);
                return optimisticIncident;
            }

            const toastId = showLoading('Creating incident...');
            try {
                const response = await retryWithBackoff(
                    () => incidentService.createIncident(incident),
                    {
                        maxRetries: 3,
                        baseDelay: 1000,
                        maxDelay: 10000,
                        shouldRetry: (error) => {
                            // Don't retry on 4xx errors
                            if (error && typeof error === 'object' && 'response' in error) {
                                const axiosError = error as { response?: { status?: number } };
                                return axiosError.response?.status ? axiosError.response.status >= 500 : true;
                            }
                            return true; // Retry network errors
                        }
                    }
                );
                if (response.data) {
                    // Refresh incidents to get latest state from server
                    await refreshIncidents();
                    
                    // Notify other tabs
                    try {
                        localStorage.setItem('incident-log:incident-created', JSON.stringify({
                            incidentId: response.data.incident_id,
                            timestamp: Date.now()
                        }));
                        // Remove after a short delay to allow other tabs to process
                        setTimeout(() => localStorage.removeItem('incident-log:incident-created'), 100);
                    } catch (e) {
                        // Ignore localStorage errors (e.g., in private mode)
                    }
                    
                    dismissLoadingAndShowSuccess(toastId, 'Incident created successfully');
                    operationLock.releaseLock('create_incident', tempId);
                    return response.data;
                }
                throw new Error('No data returned from server');
            } catch (error) {
            // If network error and not a 4xx, enqueue for retry
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number } };
                if (!axiosError.response?.status || axiosError.response.status >= 500) {
                    enqueue({
                        type: 'create_incident',
                        payload: incident as unknown as Record<string, unknown>,
                        queuedAt: new Date().toISOString()
                    });
                    showSuccess('Incident queued for sync when connection is restored');
                    operationLock.releaseLock('create_incident', tempId);
                    return null;
                }
            }
            dismissLoadingAndShowError(toastId, 'Failed to create incident');
            ErrorHandlerService.logError(error, 'createIncident');
            operationLock.releaseLock('create_incident', tempId);
            return null;
            }
        } catch (error) {
            // Outer catch for any unexpected errors
            ErrorHandlerService.logError(error, 'createIncident');
            operationLock.releaseLock('create_incident', tempId);
            return null;
        } finally {
            operationLock.releaseLock('create_incident', tempId);
        }
    }, [refreshIncidents, enqueue, operationLock]);

    // Update Incident with conflict detection
    const updateIncident = useCallback(async (
        incidentId: string, 
        updates: IncidentUpdate,
        conflictResolution?: 'overwrite' | 'merge' | 'cancel',
        onConflict?: (conflict: { localIncident: Incident; serverIncident: Incident; localChanges: Partial<Incident> }) => void
    ): Promise<Incident | null> => {
        // Acquire operation lock
        if (!operationLock.acquireLock('update_incident', incidentId)) {
            logger.warn('Update operation already in progress', { module: 'IncidentLog', incidentId });
            return null;
        }

        try {
            // Check if offline - enqueue if so (skip conflict resolution when offline)
            if (!navigator.onLine && !conflictResolution) {
                enqueue({
                    type: 'update_incident',
                    payload: { incidentId, updates },
                    queuedAt: new Date().toISOString()
                });
                showSuccess('Update queued for sync when connection is restored');
                // Optimistically update local state
                setIncidents(prev => prev.map(i => 
                    i.incident_id === incidentId ? { ...i, ...updates } : i
                ));
                if (selectedIncident?.incident_id === incidentId) {
                    setSelectedIncident(prev => prev ? { ...prev, ...updates } : null);
                }
                operationLock.releaseLock('update_incident', incidentId);
                return incidents.find(i => i.incident_id === incidentId) || null;
            }

            const toastId = showLoading('Updating incident...');
            try {
                // Get current incident from state
                const currentIncident = incidents.find(i => i.incident_id === incidentId);
                if (!currentIncident) {
                    dismissLoadingAndShowError(toastId, 'Incident not found');
                    operationLock.releaseLock('update_incident', incidentId);
                    return null;
                }

                // Check for local conflicts: if incident was updated elsewhere
                if (!conflictResolution && updates.updated_at && currentIncident.updated_at !== updates.updated_at) {
                    const currentUpdateTime = new Date(currentIncident.updated_at).getTime();
                    const incomingUpdateTime = new Date(updates.updated_at as string).getTime();
                    if (incomingUpdateTime < currentUpdateTime) {
                        // Conflict detected - need to fetch latest from server
                        dismissLoadingAndShowError(toastId, '');
                        const latestIncident = await getIncident(incidentId);
                        if (latestIncident && onConflict) {
                            onConflict({
                                localIncident: currentIncident,
                                serverIncident: latestIncident,
                                localChanges: updates
                            });
                        }
                        operationLock.releaseLock('update_incident', incidentId);
                        return null;
                    }
                }

                // Handle conflict resolution
                let finalUpdates = updates;
                if (conflictResolution === 'cancel') {
                    dismissLoadingAndShowError(toastId, 'Update cancelled');
                    await refreshIncidents();
                    operationLock.releaseLock('update_incident', incidentId);
                    return null;
                } else if (conflictResolution === 'merge') {
                    // Merge: combine local changes with server version
                    const latestIncident = await getIncident(incidentId);
                    if (latestIncident) {
                        finalUpdates = {
                            ...latestIncident,
                            ...updates,
                            // Preserve server's updated_at to avoid another conflict
                            updated_at: latestIncident.updated_at
                        } as IncidentUpdate;
                    }
                } else if (conflictResolution === 'overwrite') {
                    // Overwrite: use local changes, but update updated_at to current time
                    finalUpdates = {
                        ...updates,
                        updated_at: new Date().toISOString()
                    };
                }

                const response = await retryWithBackoff(
                    () => incidentService.updateIncident(incidentId, finalUpdates),
                    {
                        maxRetries: 3,
                        baseDelay: 1000,
                        maxDelay: 10000,
                        shouldRetry: (error) => {
                            // Don't retry on 4xx errors (including 409 conflicts)
                            if (error && typeof error === 'object' && 'response' in error) {
                                const axiosError = error as { response?: { status?: number } };
                                return axiosError.response?.status ? axiosError.response.status >= 500 : true;
                            }
                            return true; // Retry network errors
                        }
                    }
                );
                
                if (response.data) {
                    // Refresh incidents to get latest state from server
                    await refreshIncidents();
                    // Update selected incident if it's the one being updated
                    if (selectedIncident?.incident_id === incidentId) {
                        const updatedIncident = incidents.find(i => i.incident_id === incidentId) || response.data;
                        setSelectedIncident(updatedIncident);
                    }
                    
                    // Notify other tabs
                    try {
                        localStorage.setItem('incident-log:incident-updated', JSON.stringify({
                            incidentId,
                            timestamp: Date.now()
                        }));
                        setTimeout(() => localStorage.removeItem('incident-log:incident-updated'), 100);
                    } catch (e) {
                        // Ignore localStorage errors
                    }
                    
                    dismissLoadingAndShowSuccess(toastId, 'Incident updated successfully');
                    operationLock.releaseLock('update_incident', incidentId);
                    return response.data;
                }
                throw new Error('No data returned from server');
            } catch (error: any) {
                // Handle specific error types
                if (error?.response?.status === 409) {
                    // Server returned 409 - fetch latest and trigger conflict resolution
                    dismissLoadingAndShowError(toastId, '');
                    const latestIncident = await getIncident(incidentId);
                    const currentIncidentForConflict = incidents.find(i => i.incident_id === incidentId);
                    if (latestIncident && currentIncidentForConflict && onConflict) {
                        onConflict({
                            localIncident: currentIncidentForConflict,
                            serverIncident: latestIncident,
                            localChanges: updates
                        });
                    }
                    operationLock.releaseLock('update_incident', incidentId);
                    return null;
                } else if (error?.response?.status === 429) {
                    dismissLoadingAndShowError(toastId, 'Rate limit exceeded. Please wait a moment and try again.');
                    operationLock.releaseLock('update_incident', incidentId);
                    return null;
                } else {
                    // If network error and not a 4xx, enqueue for retry (unless conflict resolution)
                    if (!conflictResolution && error && typeof error === 'object' && 'response' in error) {
                        const axiosError = error as { response?: { status?: number } };
                        if (!axiosError.response?.status || axiosError.response.status >= 500) {
                            enqueue({
                                type: 'update_incident',
                                payload: { incidentId, updates },
                                queuedAt: new Date().toISOString()
                            });
                            showSuccess('Update queued for sync when connection is restored');
                            operationLock.releaseLock('update_incident', incidentId);
                            return null;
                        }
                    }
                    dismissLoadingAndShowError(toastId, 'Failed to update incident');
                    ErrorHandlerService.logError(error, 'updateIncident');
                    operationLock.releaseLock('update_incident', incidentId);
                    return null;
                }
            }
        } catch (error: any) {
            // Outer catch for any unexpected errors
            ErrorHandlerService.logError(error, 'updateIncident');
            operationLock.releaseLock('update_incident', incidentId);
            return null;
        } finally {
            operationLock.releaseLock('update_incident', incidentId);
        }
    }, [selectedIncident, refreshIncidents, incidents, getIncident, enqueue, operationLock]);

    // Delete Incident - Opens confirmation modal
    const deleteIncident = useCallback((incidentId: string): void => {
        setModals(prev => ({
            ...prev,
            showDeleteConfirmModal: true,
            deleteIncidentId: incidentId
        }));
    }, []);

    // Confirm Delete Incident - Actually performs the delete
    const confirmDeleteIncident = useCallback(async (): Promise<boolean> => {
        const incidentId = modals.deleteIncidentId;
        if (!incidentId) return false;

        // Acquire operation lock
        if (!operationLock.acquireLock('delete_incident', incidentId)) {
            logger.warn('Delete operation already in progress', { module: 'IncidentLog', incidentId });
            return false;
        }

        try {
            // Check if offline - enqueue if so
            if (!navigator.onLine) {
                enqueue({
                    type: 'delete_incident',
                    payload: { incidentId },
                    queuedAt: new Date().toISOString()
                });
                showSuccess('Delete queued for sync when connection is restored');
                // Optimistically remove from local state
                setIncidents(prev => prev.filter(i => i.incident_id !== incidentId));
                if (selectedIncident?.incident_id === incidentId) {
                    setSelectedIncident(null);
                }
                setModals(prev => ({
                    ...prev,
                    showDeleteConfirmModal: false,
                    deleteIncidentId: null
                }));
                operationLock.releaseLock('delete_incident', incidentId);
                return true;
            }

            const toastId = showLoading('Deleting incident...');
            try {
                const response = await incidentService.deleteIncident(incidentId);
                if (!response.success) {
                    dismissLoadingAndShowError(toastId, response.error || 'Failed to delete incident');
                    operationLock.releaseLock('delete_incident', incidentId);
                    setModals(prev => ({
                        ...prev,
                        showDeleteConfirmModal: false,
                        deleteIncidentId: null
                    }));
                    return false;
                }
                await refreshIncidents();
                if (selectedIncident?.incident_id === incidentId) {
                    setSelectedIncident(null);
                }
                dismissLoadingAndShowSuccess(toastId, 'Incident deleted successfully');
                setModals(prev => ({
                    ...prev,
                    showDeleteConfirmModal: false,
                    deleteIncidentId: null
                }));
                operationLock.releaseLock('delete_incident', incidentId);
                return true;
            } catch (error) {
                // Network/other error: enqueue for retry when back online
                enqueue({
                    type: 'delete_incident',
                    payload: { incidentId },
                    queuedAt: new Date().toISOString()
                });
                showSuccess('Delete queued for sync when connection is restored');
                setIncidents(prev => prev.filter(i => i.incident_id !== incidentId));
                if (selectedIncident?.incident_id === incidentId) {
                    setSelectedIncident(null);
                }
                dismissLoadingAndShowSuccess(toastId, 'Delete queued for sync');
                setModals(prev => ({
                    ...prev,
                    showDeleteConfirmModal: false,
                    deleteIncidentId: null
                }));
                operationLock.releaseLock('delete_incident', incidentId);
                ErrorHandlerService.logError(error, 'deleteIncident');
                return true;
            }
        } catch (error) {
            // Fallback error handling for outer try
            ErrorHandlerService.logError(error, 'confirmDeleteIncident');
            operationLock.releaseLock('delete_incident', incidentId);
            setModals(prev => ({
                ...prev,
                showDeleteConfirmModal: false,
                deleteIncidentId: null
            }));
            return false;
        }
    }, [modals.deleteIncidentId, selectedIncident, refreshIncidents, enqueue, operationLock]);

    // Cancel Delete - Closes modal without deleting
    const cancelDeleteIncident = useCallback(() => {
        setModals(prev => ({
            ...prev,
            showDeleteConfirmModal: false,
            deleteIncidentId: null
        }));
    }, []);

    // Assign Incident
    const assignIncident = useCallback(async (incidentId: string, assigneeId: string): Promise<boolean> => {
        const result = await updateIncident(incidentId, { assigned_to: assigneeId });
        return !!result;
    }, [updateIncident]);

    // Resolve Incident
    const resolveIncident = useCallback(async (incidentId: string): Promise<boolean> => {
        const result = await updateIncident(incidentId, { status: IncidentStatus.RESOLVED });
        return !!result;
    }, [updateIncident]);

    // Escalate Incident
    const escalateIncident = useCallback(async (incidentId: string, reason: string): Promise<boolean> => {
        // Find current incident to get escalation level
        const currentIncident = incidents.find(i => i.incident_id === incidentId);
        const currentLevel = currentIncident?.escalation_level || 0;
        const newLevel = currentLevel + 1;
        
        // Update incident with escalated status, increased level, and critical severity
        const result = await updateIncident(incidentId, {
            status: IncidentStatus.OPEN, // Ensure it's open if it was closed
            severity: IncidentSeverity.CRITICAL,
            source_metadata: {
                ...(currentIncident?.source_metadata || {}),
                escalation_level: newLevel,
                escalation_reason: reason,
                escalated_at: new Date().toISOString()
            }
        });
        
        if (result) {
            showSuccess(`Incident escalated to level ${newLevel}: ${reason}`);
        }
        return !!result;
    }, [updateIncident, incidents]);


    const getPatternRecognition = useCallback(async (request: PatternRecognitionRequest): Promise<PatternRecognitionResponse | null> => {
        setLoading(prev => ({ ...prev, related: true }));
        try {
            const response = await incidentService.getPatternRecognition(request);
            return response.data || null;
        } catch (error) {
            logger.error('Pattern recognition failed', error instanceof Error ? error : new Error(String(error)));
            return null;
        } finally {
            setLoading(prev => ({ ...prev, related: false }));
        }
    }, []);

    // Incident Activity Timeline
    const getIncidentActivity = useCallback(async (incidentId: string): Promise<UserActivity[]> => {
        setLoading(prev => ({ ...prev, activity: true }));
        try {
            const response = await incidentService.getIncidentActivity(incidentId);
            const activities = response.data || [];
            setActivityByIncident(prev => ({ ...prev, [incidentId]: activities }));
            return activities;
        } catch (error) {
            logger.error('Failed to fetch incident activity', error instanceof Error ? error : new Error(String(error)), { incidentId });
            return [];
        } finally {
            setLoading(prev => ({ ...prev, activity: false }));
        }
    }, []);

    // Emergency Alert
    const createEmergencyAlert = useCallback(async (alert: any): Promise<EmergencyAlertResponse | null> => {
        // Check if offline - enqueue if so
        if (!navigator.onLine) {
            enqueue({
                type: 'create_emergency_alert',
                payload: { alert },
                queuedAt: new Date().toISOString()
            });
            showSuccess('Emergency alert queued for sync when connection is restored');
            return null;
        }

        const toastId = showLoading('Sending emergency alert...');
        try {
            const response = await retryWithBackoff(
                () => incidentService.createEmergencyAlert(alert),
                {
                    maxRetries: 5, // More retries for critical emergency alerts
                    baseDelay: 1000,
                    maxDelay: 10000,
                    shouldRetry: (error) => {
                        // Don't retry on 4xx errors
                        if (error && typeof error === 'object' && 'response' in error) {
                            const axiosError = error as { response?: { status?: number } };
                            return axiosError.response?.status ? axiosError.response.status >= 500 : true;
                        }
                        return true; // Retry network errors
                    }
                }
            );
            if (response.data) {
                dismissLoadingAndShowSuccess(toastId, 'Emergency alert broadcasted!');
                return response.data;
            }
            throw new Error('Failed to send alert');
        } catch (error) {
            // If network error and not a 4xx, enqueue for retry
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number } };
                if (!axiosError.response?.status || axiosError.response.status >= 500) {
                    enqueue({
                        type: 'create_emergency_alert',
                        payload: { alert },
                        queuedAt: new Date().toISOString()
                    });
                    showSuccess('Emergency alert queued for sync when connection is restored');
                    return null;
                }
            }
            dismissLoadingAndShowError(toastId, 'Failed to send alert');
            ErrorHandlerService.logError(error, 'createEmergencyAlert');
            return null;
        }
    }, [enqueue]);

    // Bulk Operations with Transaction Safety
    const bulkDelete = useCallback((incidentIds: string[]): void => {
        setModals(prev => ({
            ...prev,
            showBulkOperationModal: true,
            bulkOperation: {
                type: 'delete',
                incidentIds,
                title: `Delete ${incidentIds.length} Incidents`,
                description: `Are you sure you want to permanently delete ${incidentIds.length} incident(s)? This action cannot be undone.`
            }
        }));
    }, []);

    // Confirm Bulk Delete - Actually performs the bulk delete
    const confirmBulkDelete = useCallback(async (incidentIds: string[], reason?: string): Promise<BulkOperationResult | null> => {
        // Check if offline - enqueue if so
        if (!navigator.onLine) {
            enqueue({
                type: 'bulk_delete',
                payload: { incidentIds, propertyId },
                queuedAt: new Date().toISOString()
            });
            showSuccess(`Bulk delete queued for sync when connection is restored`);
            // Optimistically remove from local state
            setIncidents(prev => prev.filter(i => !incidentIds.includes(i.incident_id)));
            setModals(prev => ({
                ...prev,
                showBulkOperationModal: false,
                bulkOperation: null
            }));
            return {
                operation_type: 'bulk_delete',
                total: incidentIds.length,
                successful: incidentIds.length,
                failed: 0,
                skipped: 0,
                errors: [],
                execution_time_ms: 0,
                executed_by: 'current_user',
                executed_at: new Date().toISOString()
            };
        }

        setLoading(prev => ({ ...prev, bulkOperation: true }));
        const toastId = showLoading(`Deleting ${incidentIds.length} incidents...`);
        
        // Track operation state for recovery
        const operationState = {
            incidentIds,
            successful: [] as string[],
            failed: [] as { incidentId: string; error: string }[],
            startTime: Date.now()
        };
        
        try {
            // Use Promise.allSettled for transaction safety - don't fail all if one fails
            const results = await Promise.allSettled(
                incidentIds.map(id => 
                    retryWithBackoff(
                        () => incidentService.deleteIncident(id),
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
                    )
                )
            );
            
            // Track results
            results.forEach((result, index) => {
                const incidentId = incidentIds[index];
                if (result.status === 'fulfilled') {
                    operationState.successful.push(incidentId);
                } else {
                    operationState.failed.push({
                        incidentId,
                        error: result.reason?.message || 'Unknown error'
                    });
                }
            });
            
            // Refresh incidents to get latest state from server
            await refreshIncidents();
            
            const result: BulkOperationResult = {
                operation_type: 'bulk_delete',
                total: incidentIds.length,
                successful: operationState.successful.length,
                failed: operationState.failed.length,
                skipped: 0,
                errors: operationState.failed.map(f => ({
                    incident_id: f.incidentId,
                    error_code: 'DELETE_FAILED',
                    error_message: f.error
                })),
                execution_time_ms: Date.now() - operationState.startTime,
                executed_by: 'current_user',
                executed_at: new Date().toISOString()
            };

            if (operationState.failed.length === 0) {
                dismissLoadingAndShowSuccess(toastId, `Successfully deleted all ${incidentIds.length} incidents`);
                logger.info('Bulk delete completed', {
                    module: 'IncidentLog',
                    operation: 'bulkDelete',
                    total: incidentIds.length,
                    successful: operationState.successful.length,
                    duration: Date.now() - operationState.startTime
                });
            } else {
                showError(`${operationState.successful.length} deleted, ${operationState.failed.length} failed. Check logs for details.`);
                logger.warn('Bulk delete partially failed', {
                    module: 'IncidentLog',
                    operation: 'bulkDelete',
                    total: incidentIds.length,
                    successful: operationState.successful.length,
                    failed: operationState.failed.length,
                    errors: operationState.failed
                });
            }
            return result;
        } catch (error) {
            // If network error and not a 4xx, enqueue for retry
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number } };
                if (!axiosError.response?.status || axiosError.response.status >= 500) {
                    enqueue({
                        type: 'bulk_delete',
                        payload: { incidentIds, propertyId },
                        queuedAt: new Date().toISOString()
                    });
                    showSuccess('Bulk delete queued for sync when connection is restored');
                    await refreshIncidents();
                    return {
                        operation_type: 'bulk_delete',
                        total: incidentIds.length,
                        successful: incidentIds.length,
                        failed: 0,
                        skipped: 0,
                        errors: [],
                        execution_time_ms: 0,
                        executed_by: 'current_user',
                        executed_at: new Date().toISOString()
                    };
                }
            }
            dismissLoadingAndShowError(toastId, 'Bulk delete operation failed');
            ErrorHandlerService.logError(error, 'bulkDelete');
            await refreshIncidents();
            return {
                operation_type: 'bulk_delete',
                total: incidentIds.length,
                successful: 0,
                failed: incidentIds.length,
                skipped: 0,
                errors: [{ incident_id: 'unknown', error_code: 'OPERATION_FAILED', error_message: String(error) }],
                execution_time_ms: 0,
                executed_by: 'current_user',
                executed_at: new Date().toISOString()
            };
        } finally {
            setLoading(prev => ({ ...prev, bulkOperation: false }));
        }
    }, [refreshIncidents, enqueue, propertyId]);

    const bulkStatusChange = useCallback(async (incidentIds: string[], status: IncidentStatus): Promise<boolean> => {
        // Check if offline - enqueue if so
        if (!navigator.onLine) {
            enqueue({
                type: 'bulk_status_change',
                payload: { incidentIds, status, propertyId },
                queuedAt: new Date().toISOString()
            });
            showSuccess(`Bulk status change queued for sync when connection is restored`);
            // Optimistically update local state
            setIncidents(prev => prev.map(i => 
                incidentIds.includes(i.incident_id) ? { ...i, status } : i
            ));
            return true;
        }

        setLoading(prev => ({ ...prev, bulkOperation: true }));
        const toastId = showLoading(`Updating ${incidentIds.length} incidents...`);
        
        // Track operation state for recovery
        const operationState = {
            incidentIds,
            status,
            successful: [] as string[],
            failed: [] as { incidentId: string; error: string }[],
            startTime: Date.now()
        };
        
        try {
            // Use Promise.allSettled with retry logic for transaction safety
            const results = await Promise.allSettled(
                incidentIds.map(id => 
                    retryWithBackoff(
                        () => incidentService.updateIncident(id, { status }),
                        {
                            maxRetries: 3,
                            baseDelay: 1000,
                            maxDelay: 10000,
                            shouldRetry: (error) => {
                                if (error && typeof error === 'object' && 'response' in error) {
                                    const axiosError = error as { response?: { status?: number } };
                                    // Don't retry on 4xx errors (including 409 conflicts)
                                    return axiosError.response?.status ? axiosError.response.status >= 500 : true;
                                }
                                return true;
                            }
                        }
                    )
                )
            );
            
            // Track results
            results.forEach((result, index) => {
                const incidentId = incidentIds[index];
                if (result.status === 'fulfilled') {
                    operationState.successful.push(incidentId);
                } else {
                    operationState.failed.push({
                        incidentId,
                        error: result.reason?.message || 'Unknown error'
                    });
                }
            });
            
            // Refresh incidents to get latest state from server
            await refreshIncidents();
            
            if (operationState.failed.length === 0) {
                dismissLoadingAndShowSuccess(toastId, `Successfully updated all ${incidentIds.length} incidents`);
                logger.info('Bulk status change completed', {
                    module: 'IncidentLog',
                    operation: 'bulkStatusChange',
                    status,
                    total: incidentIds.length,
                    successful: operationState.successful.length,
                    duration: Date.now() - operationState.startTime
                });
                return true;
            } else {
                showError(`${operationState.successful.length} updated, ${operationState.failed.length} failed. Check logs for details.`);
                logger.warn('Bulk status change partially failed', {
                    module: 'IncidentLog',
                    operation: 'bulkStatusChange',
                    status,
                    total: incidentIds.length,
                    successful: operationState.successful.length,
                    failed: operationState.failed.length,
                    errors: operationState.failed
                });
                return false;
            }
        } catch (error: any) {
            // If network error and not a 4xx, enqueue for retry
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number } };
                if (!axiosError.response?.status || axiosError.response.status >= 500) {
                    enqueue({
                        type: 'bulk_status_change',
                        payload: { incidentIds, status, propertyId },
                        queuedAt: new Date().toISOString()
                    });
                    showSuccess('Bulk status change queued for sync when connection is restored');
                    await refreshIncidents();
                    return true;
                }
            }
            if (error?.response?.status === 429) {
                dismissLoadingAndShowError(toastId, 'Rate limit exceeded. Please wait and try again.');
            } else {
                dismissLoadingAndShowError(toastId, 'Bulk status change operation failed');
            }
            ErrorHandlerService.logError(error, 'bulkStatusChange');
            await refreshIncidents();
            return false;
        } finally {
            setLoading(prev => ({ ...prev, bulkOperation: false }));
        }
    }, [refreshIncidents, enqueue, propertyId]);

    // =======================================================
    // PRODUCTION READINESS ENHANCEMENTS
    // Mobile Agent Integration & Hardware Device Support
    // =======================================================

    // Mobile Agent Performance Methods
    const refreshAgentPerformance = useCallback(async (agentId?: string): Promise<void> => {
        setLoading(prev => ({ ...prev, agentPerformance: true }));
        try {
            const response = await incidentService.getAgentPerformanceMetrics(agentId);
            if (response.data) {
                setAgentPerformanceMetrics(response.data);
                logger.info('Agent performance metrics refreshed', { module: 'IncidentLog', count: response.data.length });
            }
        } catch (error) {
            logger.error('Failed to fetch agent performance metrics', error instanceof Error ? error : new Error(String(error)));
        } finally {
            setLoading(prev => ({ ...prev, agentPerformance: false }));
        }
    }, []);

    const getAgentTrustLevel = useCallback((agentId: string): AgentTrustLevel => {
        const agent = agentPerformanceMetrics.find(a => a.agent_id === agentId);
        if (!agent) return AgentTrustLevel.UNKNOWN;
        
        if (agent.trust_score >= 80) return AgentTrustLevel.HIGH;
        if (agent.trust_score >= 50) return AgentTrustLevel.MEDIUM;
        return AgentTrustLevel.LOW;
    }, [agentPerformanceMetrics]);

    const calculateAgentTrustScore = useCallback(async (agentId: string): Promise<number> => {
        try {
            const response = await incidentService.getAgentTrustScore(agentId);
            if (response.data) {
                return response.data.trust_score;
            }
            return 0;
        } catch (error) {
            logger.error('Failed to calculate agent trust score', error instanceof Error ? error : new Error(String(error)));
            return 0;
        }
    }, []);

    // Enhanced Bulk Operations with Transaction Safety
    const bulkApprove = useCallback(async (
        incidentIds: string[], 
        reason?: string
    ): Promise<BulkOperationResult | null> => {
        // Prevent concurrent bulk operations
        if (loading.bulkOperation) {
            showError('A bulk operation is already in progress. Please wait.');
            return null;
        }

        // Check if offline - enqueue if so
        if (!navigator.onLine) {
            enqueue({
                type: 'bulk_approve',
                payload: { incidentIds, reason, propertyId },
                queuedAt: new Date().toISOString()
            });
            showSuccess(`Bulk approve queued for sync when connection is restored`);
            return {
                successful: incidentIds.length,
                failed: 0,
                total: incidentIds.length,
                operation_type: 'approve' as const,
                skipped: 0,
                errors: [],
                execution_time_ms: 0,
                executed_by: '',
                executed_at: new Date().toISOString()
            };
        }
        
        setLoading(prev => ({ ...prev, bulkOperation: true }));
        const toastId = showLoading(`Approving ${incidentIds.length} incidents...`);
        
        // Track operation state for recovery
        const operationState = {
            incidentIds,
            operation: 'approve' as const,
            startTime: Date.now()
        };
        
        try {
            const response = await retryWithBackoff(
                () => incidentService.bulkApproveIncidents(incidentIds, reason, propertyId),
                {
                    maxRetries: 3,
                    baseDelay: 1000,
                    maxDelay: 10000,
                    shouldRetry: (error) => {
                        // Don't retry on 4xx errors
                        if (error && typeof error === 'object' && 'response' in error) {
                            const axiosError = error as { response?: { status?: number } };
                            return axiosError.response?.status ? axiosError.response.status >= 500 : true;
                        }
                        return true; // Retry network errors
                    }
                }
            );
            
            if (response.data) {
                setBulkOperationResult(response.data);
                await refreshIncidents(); // Refresh to get latest state
                
                const { successful, failed, total } = response.data;
                
                // Log operation completion
                logger.info('Bulk approve completed', {
                    module: 'IncidentLog',
                    operation: 'bulkApprove',
                    total,
                    successful,
                    failed,
                    duration: Date.now() - operationState.startTime
                });
                
                // Notify other tabs
                try {
                    localStorage.setItem('incident-log:bulk-operation', JSON.stringify({
                        operation: 'approve',
                        total,
                        successful,
                        failed,
                        timestamp: Date.now()
                    }));
                    setTimeout(() => localStorage.removeItem('incident-log:bulk-operation'), 100);
                } catch (e) {
                    // Ignore localStorage errors
                }
                
                if (failed === 0) {
                    dismissLoadingAndShowSuccess(toastId, `Successfully approved all ${total} incidents`);
                } else {
                    showError(`${successful} approved, ${failed} failed. Check operation details.`);
                    logger.warn('Bulk approve partially failed', {
                        module: 'IncidentLog',
                        operation: 'bulkApprove',
                        total,
                        successful,
                        failed,
                        errors: response.data.errors
                    });
                }
                return response.data;
            }
            throw new Error('No response data');
        } catch (error) {
            // If network error and not a 4xx, enqueue for retry
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number } };
                if (!axiosError.response?.status || axiosError.response.status >= 500) {
                    enqueue({
                        type: 'bulk_approve',
                        payload: { incidentIds, reason, propertyId },
                        queuedAt: new Date().toISOString()
                    });
                    showSuccess('Bulk approve queued for sync when connection is restored');
                    return {
                successful: incidentIds.length,
                failed: 0,
                total: incidentIds.length,
                operation_type: 'approve' as const,
                skipped: 0,
                errors: [],
                execution_time_ms: 0,
                executed_by: '',
                executed_at: new Date().toISOString()
            };
                }
            }
            dismissLoadingAndShowError(toastId, 'Bulk approval failed');
            ErrorHandlerService.logError(error, 'bulkApprove');
            return null;
        } finally {
            setLoading(prev => ({ ...prev, bulkOperation: false }));
        }
    }, [refreshIncidents, loading.bulkOperation, enqueue, propertyId]);

    const bulkReject = useCallback(async (
        incidentIds: string[], 
        reason: string
    ): Promise<BulkOperationResult | null> => {
        // Prevent concurrent bulk operations
        if (loading.bulkOperation) {
            showError('A bulk operation is already in progress. Please wait.');
            return null;
        }
        
        setLoading(prev => ({ ...prev, bulkOperation: true }));
        const toastId = showLoading(`Rejecting ${incidentIds.length} incidents...`);
        
        // Track operation state for recovery
        const operationState = {
            incidentIds,
            operation: 'reject' as const,
            startTime: Date.now()
        };
        
        try {
            const response = await retryWithBackoff(
                () => incidentService.bulkRejectIncidents(incidentIds, reason, propertyId),
                {
                    maxRetries: 3,
                    baseDelay: 1000,
                    maxDelay: 10000,
                    shouldRetry: (error) => {
                        // Don't retry on 4xx errors
                        if (error && typeof error === 'object' && 'response' in error) {
                            const axiosError = error as { response?: { status?: number } };
                            return axiosError.response?.status ? axiosError.response.status >= 500 : true;
                        }
                        return true; // Retry network errors
                    }
                }
            );
            
            if (response.data) {
                setBulkOperationResult(response.data);
                await refreshIncidents(); // Refresh to get latest state
                
                const { successful, failed, total } = response.data;
                
                // Log operation completion
                logger.info('Bulk reject completed', {
                    module: 'IncidentLog',
                    operation: 'bulkReject',
                    total,
                    successful,
                    failed,
                    duration: Date.now() - operationState.startTime
                });
                
                // Notify other tabs
                try {
                    localStorage.setItem('incident-log:bulk-operation', JSON.stringify({
                        operation: 'reject',
                        total,
                        successful,
                        failed,
                        timestamp: Date.now()
                    }));
                    setTimeout(() => localStorage.removeItem('incident-log:bulk-operation'), 100);
                } catch (e) {
                    // Ignore localStorage errors
                }
                
                if (failed === 0) {
                    dismissLoadingAndShowSuccess(toastId, `Successfully rejected all ${total} incidents`);
                } else {
                    showError(`${successful} rejected, ${failed} failed. Check operation details.`);
                    logger.warn('Bulk reject partially failed', {
                        module: 'IncidentLog',
                        operation: 'bulkReject',
                        total,
                        successful,
                        failed,
                        errors: response.data.errors
                    });
                }
                return response.data;
            }
            throw new Error('No response data');
        } catch (error) {
            // If network error and not a 4xx, enqueue for retry
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number } };
                if (!axiosError.response?.status || axiosError.response.status >= 500) {
                    enqueue({
                        type: 'bulk_reject',
                        payload: { incidentIds, reason, propertyId },
                        queuedAt: new Date().toISOString()
                    });
                    showSuccess('Bulk reject queued for sync when connection is restored');
                    return {
                successful: incidentIds.length,
                failed: 0,
                total: incidentIds.length,
                operation_type: 'reject' as const,
                skipped: 0,
                errors: [],
                execution_time_ms: 0,
                executed_by: '',
                executed_at: new Date().toISOString()
            };
                }
            }
            dismissLoadingAndShowError(toastId, 'Bulk rejection failed');
            ErrorHandlerService.logError(error, 'bulkReject');
            return null;
        } finally {
            setLoading(prev => ({ ...prev, bulkOperation: false }));
        }
    }, [refreshIncidents, loading.bulkOperation, enqueue, propertyId]);

    // Hardware Device Integration Methods
    const refreshHardwareDevices = useCallback(async (): Promise<void> => {
        setLoading(prev => ({ ...prev, hardwareDevices: true }));
        try {
            const response = await retryWithBackoff(
                () => incidentService.getAllDeviceHealth(propertyId),
                {
                    maxRetries: 3,
                    baseDelay: 1000,
                    maxDelay: 10000,
                    shouldRetry: (error) => {
                        // Don't retry on 4xx errors
                        if (error && typeof error === 'object' && 'response' in error) {
                            const axiosError = error as { response?: { status?: number } };
                            return axiosError.response?.status ? axiosError.response.status >= 500 : true;
                        }
                        return true; // Retry network errors
                    }
                }
            );
            if (response.data) {
                setHardwareDevices(response.data);
                logger.info('Hardware devices status refreshed', { module: 'IncidentLog', count: response.data.length });
            }
        } catch (error) {
            logger.error('Failed to fetch hardware devices', error instanceof Error ? error : new Error(String(error)));
            // Don't show error to user - this is background data
        } finally {
            setLoading(prev => ({ ...prev, hardwareDevices: false }));
        }
    }, [propertyId]);

    const getHardwareDeviceStatus = useCallback(async (deviceId: string): Promise<DeviceHealthStatus | null> => {
        try {
            const response = await incidentService.getHardwareDeviceStatus(deviceId);
            return response.data || null;
        } catch (error) {
            logger.error('Failed to get hardware device status', error instanceof Error ? error : new Error(String(error)), { deviceId });
            return null;
        }
    }, []);

    const getHardwareMetadata = useCallback((incident: Incident): HardwareIncidentMetadata | null => {
        if (!incident.source_metadata || !incident.source_device_id) return null;
        
        // Try to extract hardware metadata from incident
        const metadata = incident.source_metadata as any;
        if (metadata.device_type) {
            return {
                device_id: incident.source_device_id,
                device_name: metadata.device_name,
                device_type: metadata.device_type,
                device_status: metadata.device_status || 'unknown',
                signal_strength: metadata.signal_strength,
                battery_level: metadata.battery_level,
                location_accuracy: metadata.location_accuracy,
                data_quality_score: metadata.data_quality_score,
                firmware_version: metadata.firmware_version,
                last_maintenance: metadata.last_maintenance,
                coordinates: metadata.coordinates
            } as HardwareIncidentMetadata;
        }
        
        return null;
    }, []);

    // Emergency Alert Conversion
    const convertEmergencyAlert = useCallback(async (
        alertId: string, 
        overrides?: Partial<IncidentCreate>
    ): Promise<Incident | null> => {
        const toastId = showLoading('Converting emergency alert to incident...');
        try {
            const response = await incidentService.convertEmergencyAlertToIncident(alertId, overrides);
            if (response.data) {
                await refreshIncidents(); // Refresh to show new incident
                dismissLoadingAndShowSuccess(toastId, 'Emergency alert converted to incident');
                return response.data;
            }
            throw new Error('No data returned from server');
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to convert emergency alert');
            ErrorHandlerService.logError(error, 'convertEmergencyAlert');
            return null;
        }
    }, [refreshIncidents]);

    // Enhanced Settings Management
    const refreshEnhancedSettings = useCallback(async (): Promise<void> => {
        setLoading(prev => ({ ...prev, settings: true }));
        try {
            const response = await incidentService.getEnhancedSettings(propertyId);
            if (response.data) {
                setEnhancedSettings(response.data);
                logger.info('Enhanced settings loaded', { module: 'IncidentLog' });
            }
        } catch (error) {
            logger.error('Failed to load enhanced settings', error instanceof Error ? error : new Error(String(error)));
            // Use default settings if API unavailable
            setEnhancedSettings({
                agent_settings: {
                    auto_approval_enabled: false,
                    auto_approval_threshold: 80,
                    bulk_approval_enabled: true,
                    agent_performance_alerts: true,
                    low_trust_score_threshold: 50,
                    require_manager_review_below_threshold: true,
                    performance_metrics_retention_days: 90,
                    auto_flag_declining_agents: true,
                    notification_preferences: {
                        email_low_trust_alerts: true,
                        email_bulk_operation_results: false,
                        email_agent_performance_reports: true
                    }
                },
                hardware_settings: {
                    auto_create_incidents_from_events: false,
                    device_offline_alert_enabled: true,
                    device_offline_threshold_minutes: 15,
                    supported_device_types: ['camera', 'sensor', 'access_control'],
                    auto_assign_hardware_incidents: false,
                    hardware_incident_default_severity: IncidentSeverity.MEDIUM,
                    device_maintenance_alerts: true,
                    low_battery_alert_threshold: 20
                },
                emergency_alert_settings: {
                    auto_convert_to_incident: true,
                    default_converted_severity: IncidentSeverity.HIGH,
                    require_manager_approval: false,
                    preserve_original_alert: true,
                    notification_workflow: 'immediate',
                    auto_assign_converted_incidents: true
                }
            });
        } finally {
            setLoading(prev => ({ ...prev, settings: false }));
        }
    }, [propertyId]);

    const updateEnhancedSettings = useCallback(async (settings: EnhancedIncidentSettings): Promise<boolean> => {
        const toastId = showLoading('Saving enhanced settings...');
        try {
            const response = await incidentService.updateEnhancedSettings(settings, propertyId);
            if (response.data) {
                setEnhancedSettings(response.data);
                dismissLoadingAndShowSuccess(toastId, 'Settings saved successfully');
                return true;
            }
            throw new Error('No data returned from server');
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to save settings');
            ErrorHandlerService.logError(error, 'updateEnhancedSettings');
            return false;
        }
    }, []);

    // Modal UI Controls - Enhanced
    const setShowCreateModal = useCallback((show: boolean) => {
        setModals(prev => ({ ...prev, showCreateModal: show }));
    }, []);

    const setShowEditModal = useCallback((show: boolean) => {
        setModals(prev => ({ ...prev, showEditModal: show }));
    }, []);

    const setShowDetailsModal = useCallback((show: boolean) => {
        setModals(prev => ({ ...prev, showDetailsModal: show }));
    }, []);

    const setShowEscalationModal = useCallback((show: boolean) => {
        setModals(prev => ({ ...prev, showEscalationModal: show }));
    }, []);

    const setShowAdvancedFilters = useCallback((show: boolean) => {
        setModals(prev => ({ ...prev, showAdvancedFilters: show }));
    }, []);

    const setShowReportModal = useCallback((show: boolean) => {
        setModals(prev => ({ ...prev, showReportModal: show }));
    }, []);

    const setShowEmergencyAlertModal = useCallback((show: boolean) => {
        setModals(prev => ({ ...prev, showEmergencyAlertModal: show }));
    }, []);

    const setShowDeleteConfirmModal = useCallback((show: boolean, incidentId?: string) => {
        setModals(prev => ({ 
            ...prev, 
            showDeleteConfirmModal: show,
            deleteIncidentId: show ? (incidentId || null) : null
        }));
    }, []);

    // New production-ready modal controls
    const setShowAgentPerformanceModal = useCallback((show: boolean, agentId?: string) => {
        setModals(prev => ({ 
            ...prev, 
            showAgentPerformanceModal: show,
            selectedAgentId: show ? (agentId || null) : null
        }));
    }, []);

    const setShowBulkOperationModal = useCallback((show: boolean, operation?: {
        type: 'approve' | 'reject' | 'delete' | 'status_change';
        incidentIds: string[];
        reason?: string;
        newStatus?: IncidentStatus;
        title: string;
        description: string;
    }) => {
        setModals(prev => ({ 
            ...prev, 
            showBulkOperationModal: show,
            bulkOperation: show ? (operation || null) : null
        }));
    }, []);

    const setShowAutoApprovalSettingsModal = useCallback((show: boolean) => {
        setModals(prev => ({ ...prev, showAutoApprovalSettingsModal: show }));
    }, []);

    // Hardware heartbeat tracking - automatic offline detection
    useIncidentLogHeartbeat({
        hardwareDevices,
        setHardwareDevices,
        heartbeatOfflineThresholdMinutes: enhancedSettings?.hardware_settings?.device_offline_threshold_minutes || 15
    });

    // Initial load - Enhanced for Production Readiness
    // Only depend on currentUser and propertyId to prevent infinite loops
    // The refresh functions are stable (useCallback with proper deps), but we don't want to re-run when they change
    // Use ref to prevent duplicate calls from React StrictMode double-rendering in development
    const hasLoadedRef = useRef<string | null>(null);
    useEffect(() => {
        const loadKey = `${currentUser?.user_id || ''}-${propertyId || ''}`;
        if (currentUser && propertyId && hasLoadedRef.current !== loadKey) {
            hasLoadedRef.current = loadKey;
            // Load core data
            refreshIncidents();
            
            // Load production readiness enhancements in background
            refreshAgentPerformance();
            refreshHardwareDevices();
            refreshEnhancedSettings();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, propertyId]);

    return {
        // Data - Core
        incidents,
        selectedIncident,
        escalationRules,
        activityByIncident,
        lastSynced,
        
        // Offline Queue Status
        queuePendingCount: pendingCount,
        queueFailedCount: failedCount,
        
        // Property Context
        propertyId,

        // Data - Production Readiness Enhancements
        agentPerformanceMetrics,
        hardwareDevices,
        enhancedSettings,
        bulkOperationResult,

        // Loading states (enhanced)
        loading,

        // Modal states - New enhanced modal management
        modals,

        // Actions - CRUD Operations
        refreshIncidents,
        getIncident,
        createIncident,
        updateIncident,
        deleteIncident,
        confirmDeleteIncident,
        cancelDeleteIncident,

        // Actions - Incident Management
        assignIncident,
        resolveIncident,
        escalateIncident,

        // Actions - AI & Analysis
        getIncidentActivity,
        getPatternRecognition,

        // Actions - Emergency
        createEmergencyAlert,
        convertEmergencyAlert,

        // Actions - Selection
        setSelectedIncident,

        // Actions - Bulk Operations (Enhanced)
        bulkDelete,
        confirmBulkDelete,
        bulkStatusChange,
        bulkApprove,
        bulkReject,

        // Actions - Mobile Agent Performance
        refreshAgentPerformance,
        getAgentTrustLevel,
        calculateAgentTrustScore,

        // Actions - Hardware Device Integration
        refreshHardwareDevices,
        getHardwareDeviceStatus,
        getHardwareMetadata,

        // Actions - Enhanced Settings
        refreshEnhancedSettings,
        updateEnhancedSettings,

        // Actions - Modal UI Controls (Enhanced)
        setShowCreateModal,
        setShowEditModal,
        setShowDetailsModal,
        setShowEscalationModal,
        setShowAdvancedFilters,
        setShowReportModal,
        setShowEmergencyAlertModal,
        
        // New modal controls for production-ready features
        setShowAgentPerformanceModal,
        setShowAutoApprovalSettingsModal,
        setShowBulkOperationModal,
        setShowDeleteConfirmModal,
        operationLock
    };
}
