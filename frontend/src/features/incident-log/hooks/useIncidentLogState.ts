/**
 * Incident Log State Hook
 * Centralized state management for Incident Log feature
 * Extracted from monolithic component - contains ALL business logic
 * 
 * Following Gold Standard: Zero business logic in components, 100% in hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '../../../services/logger';
import { useAuth } from '../../../contexts/AuthContext';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
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
    AIClassificationResponse,
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
    aiSuggestion: AIClassificationResponse | null;
    escalationRules: EscalationRule[];
    activityByIncident: Record<string, UserActivity[]>;
    lastSynced: Date | null;

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
        showBulkOperationModal: boolean;
        showAutoApprovalSettingsModal: boolean;
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
    createIncident: (incident: IncidentCreate, useAI?: boolean) => Promise<Incident | null>;
    updateIncident: (incidentId: string, updates: IncidentUpdate) => Promise<Incident | null>;
    deleteIncident: (incidentId: string) => Promise<boolean>;

    // Actions - Incident Management
    assignIncident: (incidentId: string, assigneeId: string) => Promise<boolean>;
    resolveIncident: (incidentId: string) => Promise<boolean>;
    escalateIncident: (incidentId: string, reason: string) => Promise<boolean>;

    // Actions - AI & Analysis
    getAIClassification: (title: string, description: string, location?: any) => Promise<AIClassificationResponse | null>;
    getIncidentActivity: (incidentId: string) => Promise<UserActivity[]>;
    getPatternRecognition: (request: PatternRecognitionRequest) => Promise<PatternRecognitionResponse | null>;

    // Actions - Emergency
    createEmergencyAlert: (alert: any) => Promise<EmergencyAlertResponse | null>;
    convertEmergencyAlert: (alertId: string, overrides?: Partial<IncidentCreate>) => Promise<Incident | null>;

    // Actions - Selection
    setSelectedIncident: (incident: Incident | null) => void;

    // Actions - Bulk Operations (Enhanced)
    bulkDelete: (incidentIds: string[]) => Promise<boolean>;
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
    setShowBulkOperationModal: (show: boolean, operation?: {
        type: 'approve' | 'reject' | 'delete' | 'status_change';
        incidentIds: string[];
        reason?: string;
        newStatus?: IncidentStatus;
        title: string;
        description: string;
    }) => void;
    setShowAutoApprovalSettingsModal: (show: boolean) => void;
}

export function useIncidentLogState(): UseIncidentLogStateReturn {
    const { user: currentUser } = useAuth();

    // State - Core
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [aiSuggestion, setAiSuggestion] = useState<AIClassificationResponse | null>(null);
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
        showBulkOperationModal: false,
        showAutoApprovalSettingsModal: false,
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

    // Fetch Incidents
    const refreshIncidents = useCallback(async (filters?: IncidentFilters) => {
        setLoading(prev => ({ ...prev, incidents: true }));
        try {
            const response = await incidentService.getIncidents({
                ...filters,
                property_id: filters?.property_id
            });

            if (response.data) {
                setIncidents(response.data);
                logger.info('Incidents refreshed', { module: 'IncidentLog', count: response.data.length });
            }
        } catch (error) {
            logger.error('Failed to fetch incidents', error instanceof Error ? error : new Error(String(error)));
            showError('Failed to load incidents. Please try again.');
        } finally {
            setLoading(prev => ({ ...prev, incidents: false }));
        }
    }, [currentUser]);

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
    const createIncident = useCallback(async (incident: IncidentCreate, useAI: boolean = false): Promise<Incident | null> => {
        const toastId = showLoading('Creating incident...');
        try {
            const response = await incidentService.createIncident(incident, useAI);
            if (response.data) {
                // Refresh incidents to get latest state from server
                await refreshIncidents();
                dismissLoadingAndShowSuccess(toastId, 'Incident created successfully');
                return response.data;
            }
            throw new Error('No data returned from server');
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to create incident');
            ErrorHandlerService.logError(error, 'createIncident');
            return null;
        }
    }, [refreshIncidents]);

    // Update Incident with conflict detection
    const updateIncident = useCallback(async (incidentId: string, updates: IncidentUpdate): Promise<Incident | null> => {
        const toastId = showLoading('Updating incident...');
        try {
            // Check for conflicts: if incident was updated elsewhere, show warning
            const currentIncident = incidents.find(i => i.incident_id === incidentId);
            if (currentIncident && updates.updated_at && currentIncident.updated_at !== updates.updated_at) {
                const currentUpdateTime = new Date(currentIncident.updated_at).getTime();
                const incomingUpdateTime = new Date(updates.updated_at as string).getTime();
                if (incomingUpdateTime < currentUpdateTime) {
                    // Conflict detected - incident was updated after this edit started
                    const shouldContinue = window.confirm(
                        'This incident was updated by another user. Your changes may overwrite their updates. Continue?'
                    );
                    if (!shouldContinue) {
                        dismissLoadingAndShowError(toastId, 'Update cancelled due to conflict.');
                        await refreshIncidents(); // Refresh to show latest state
                        return null;
                    }
                }
            }

            const response = await incidentService.updateIncident(incidentId, updates);
            if (response.data) {
                // Refresh incidents to get latest state from server
                await refreshIncidents();
                // Update selected incident if it's the one being updated
                if (selectedIncident?.incident_id === incidentId) {
                    const updatedIncident = incidents.find(i => i.incident_id === incidentId) || response.data;
                    setSelectedIncident(updatedIncident);
                }
                dismissLoadingAndShowSuccess(toastId, 'Incident updated successfully');
                return response.data;
            }
            throw new Error('No data returned from server');
        } catch (error: any) {
            // Handle specific error types
            if (error?.response?.status === 409) {
                dismissLoadingAndShowError(toastId, 'Conflict: Incident was modified by another user. Please refresh and try again.');
                await refreshIncidents();
            } else if (error?.response?.status === 429) {
                dismissLoadingAndShowError(toastId, 'Rate limit exceeded. Please wait a moment and try again.');
            } else {
                dismissLoadingAndShowError(toastId, 'Failed to update incident');
            }
            ErrorHandlerService.logError(error, 'updateIncident');
            return null;
        }
    }, [selectedIncident, refreshIncidents, incidents]);

    // Delete Incident
    const deleteIncident = useCallback(async (incidentId: string): Promise<boolean> => {
        if (!window.confirm('Are you sure you want to delete this incident? This action cannot be undone.')) {
            return false;
        }

        const toastId = showLoading('Deleting incident...');
        try {
            await incidentService.deleteIncident(incidentId);
            // Refresh incidents to get latest state from server
            await refreshIncidents();
            if (selectedIncident?.incident_id === incidentId) {
                setSelectedIncident(null);
            }
            dismissLoadingAndShowSuccess(toastId, 'Incident deleted successfully');
            return true;
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to delete incident');
            ErrorHandlerService.logError(error, 'deleteIncident');
            return false;
        }
    }, [selectedIncident, refreshIncidents]);

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

    // AI Classification
    const getAIClassification = useCallback(async (title: string, description: string, location?: any): Promise<AIClassificationResponse | null> => {
        setLoading(prev => ({ ...prev, ai: true }));
        try {
            const response = await incidentService.getAIClassification({ title, description, location });
            if (response.data) {
                setAiSuggestion(response.data);
                return response.data;
            }
            return null;
        } catch (error) {
            logger.error('AI Classification failed', error instanceof Error ? error : new Error(String(error)));
            return null;
        } finally {
            setLoading(prev => ({ ...prev, ai: false }));
        }
    }, []);

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
        const toastId = showLoading('Sending emergency alert...');
        try {
            const response = await incidentService.createEmergencyAlert(alert);
            if (response.data) {
                dismissLoadingAndShowSuccess(toastId, 'Emergency alert broadcasted!');
                return response.data;
            }
            throw new Error('Failed to send alert');
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to send alert');
            return null;
        }
    }, []);

    // Bulk Operations
    const bulkDelete = useCallback(async (incidentIds: string[]): Promise<boolean> => {
        if (!window.confirm(`Are you sure you want to delete ${incidentIds.length} incidents?`)) {
            return false;
        }
        const toastId = showLoading(`Deleting ${incidentIds.length} incidents...`);
        try {
            // Typically bulk delete would be a single API call, but if not available:
            await Promise.all(incidentIds.map(id => incidentService.deleteIncident(id)));
            // Refresh incidents to get latest state from server
            await refreshIncidents();
            dismissLoadingAndShowSuccess(toastId, 'Incidents deleted successfully');
            return true;
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Some incidents could not be deleted');
            // Still refresh to show current state
            await refreshIncidents();
            return false;
        }
    }, [refreshIncidents]);

    const bulkStatusChange = useCallback(async (incidentIds: string[], status: IncidentStatus): Promise<boolean> => {
        const toastId = showLoading(`Updating ${incidentIds.length} incidents...`);
        try {
            const results = await Promise.allSettled(incidentIds.map(id => incidentService.updateIncident(id, { status })));
            const successes = results.filter(r => r.status === 'fulfilled').length;
            const failures = results.filter(r => r.status === 'rejected').length;
            // Refresh incidents to get latest state from server
            await refreshIncidents();
            if (failures === 0) {
                dismissLoadingAndShowSuccess(toastId, `All ${incidentIds.length} incidents updated successfully`);
                return true;
            } else {
                dismissLoadingAndShowError(toastId, `${successes} updated, ${failures} failed. Please refresh and try again.`);
                return false;
            }
        } catch (error: any) {
            if (error?.response?.status === 429) {
                dismissLoadingAndShowError(toastId, 'Rate limit exceeded. Please wait and try again.');
            } else {
                dismissLoadingAndShowError(toastId, 'Some incidents could not be updated');
            }
            // Still refresh to show current state
            await refreshIncidents();
            return false;
        }
    }, [refreshIncidents]);

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

    // Enhanced Bulk Operations
    const bulkApprove = useCallback(async (
        incidentIds: string[], 
        reason?: string
    ): Promise<BulkOperationResult | null> => {
        setLoading(prev => ({ ...prev, bulkOperation: true }));
        const toastId = showLoading(`Approving ${incidentIds.length} incidents...`);
        
        try {
            const propertyId = localStorage.getItem('propertyId') || undefined;
            const response = await incidentService.bulkApproveIncidents(incidentIds, reason, propertyId);
            
            if (response.data) {
                setBulkOperationResult(response.data);
                await refreshIncidents(); // Refresh to get latest state
                
                const { successful, failed, total } = response.data;
                if (failed === 0) {
                    dismissLoadingAndShowSuccess(toastId, `Successfully approved all ${total} incidents`);
                } else {
                    showError(`${successful} approved, ${failed} failed. Check operation details.`);
                }
                return response.data;
            }
            throw new Error('No response data');
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Bulk approval failed');
            ErrorHandlerService.logError(error, 'bulkApprove');
            return null;
        } finally {
            setLoading(prev => ({ ...prev, bulkOperation: false }));
        }
    }, [refreshIncidents]);

    const bulkReject = useCallback(async (
        incidentIds: string[], 
        reason: string
    ): Promise<BulkOperationResult | null> => {
        setLoading(prev => ({ ...prev, bulkOperation: true }));
        const toastId = showLoading(`Rejecting ${incidentIds.length} incidents...`);
        
        try {
            const propertyId = localStorage.getItem('propertyId') || undefined;
            const response = await incidentService.bulkRejectIncidents(incidentIds, reason, propertyId);
            
            if (response.data) {
                setBulkOperationResult(response.data);
                await refreshIncidents(); // Refresh to get latest state
                
                const { successful, failed, total } = response.data;
                if (failed === 0) {
                    dismissLoadingAndShowSuccess(toastId, `Successfully rejected all ${total} incidents`);
                } else {
                    showError(`${successful} rejected, ${failed} failed. Check operation details.`);
                }
                return response.data;
            }
            throw new Error('No response data');
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Bulk rejection failed');
            ErrorHandlerService.logError(error, 'bulkReject');
            return null;
        } finally {
            setLoading(prev => ({ ...prev, bulkOperation: false }));
        }
    }, [refreshIncidents]);

    // Hardware Device Integration Methods
    const refreshHardwareDevices = useCallback(async (): Promise<void> => {
        setLoading(prev => ({ ...prev, hardwareDevices: true }));
        try {
            const propertyId = localStorage.getItem('propertyId') || undefined;
            const response = await incidentService.getAllDeviceHealth(propertyId);
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
    }, []);

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
            const propertyId = localStorage.getItem('propertyId') || undefined;
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
    }, []);

    const updateEnhancedSettings = useCallback(async (settings: EnhancedIncidentSettings): Promise<boolean> => {
        const toastId = showLoading('Saving enhanced settings...');
        try {
            const propertyId = localStorage.getItem('propertyId') || undefined;
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

    // Initial load - Enhanced for Production Readiness
    useEffect(() => {
        if (currentUser) {
            // Load core data
            refreshIncidents();
            
            // Load production readiness enhancements in background
            refreshAgentPerformance();
            refreshHardwareDevices();
            refreshEnhancedSettings();
        }
    }, [currentUser, refreshIncidents, refreshAgentPerformance, refreshHardwareDevices, refreshEnhancedSettings]);

    return {
        // Data - Core
        incidents,
        selectedIncident,
        aiSuggestion,
        escalationRules,
        activityByIncident,
        lastSynced,

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

        // Actions - Incident Management
        assignIncident,
        resolveIncident,
        escalateIncident,

        // Actions - AI & Analysis
        getAIClassification,
        getIncidentActivity,
        getPatternRecognition,

        // Actions - Emergency
        createEmergencyAlert,
        convertEmergencyAlert,

        // Actions - Selection
        setSelectedIncident,

        // Actions - Bulk Operations (Enhanced)
        bulkDelete,
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
        setShowBulkOperationModal,
        setShowAutoApprovalSettingsModal,
    };
}
