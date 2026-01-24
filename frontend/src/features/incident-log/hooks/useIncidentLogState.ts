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
    PatternRecognitionResponse
} from '../types/incident-log.types';
import { IncidentStatus, IncidentSeverity } from '../types/incident-log.types';
import incidentService from '../services/IncidentService';

export interface UseIncidentLogStateReturn {
    // Data
    incidents: Incident[];
    selectedIncident: Incident | null;
    aiSuggestion: AIClassificationResponse | null;
    escalationRules: EscalationRule[];
    activityByIncident: Record<string, UserActivity[]>;
    lastSynced: Date | null;

    // Loading states
    loading: {
        incidents: boolean;
        incident: boolean;
        ai: boolean;
        related: boolean;
        evidence: boolean;
        activity: boolean;
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

    // Actions - Selection
    setSelectedIncident: (incident: Incident | null) => void;

    // Actions - Bulk Operations
    bulkDelete: (incidentIds: string[]) => Promise<boolean>;
    bulkStatusChange: (incidentIds: string[], status: IncidentStatus) => Promise<boolean>;
}

export function useIncidentLogState(): UseIncidentLogStateReturn {
    const { user: currentUser } = useAuth();

    // State
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [aiSuggestion, setAiSuggestion] = useState<AIClassificationResponse | null>(null);
    const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
    const [activityByIncident, setActivityByIncident] = useState<Record<string, UserActivity[]>>({});
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    // Loading states
    const [loading, setLoading] = useState({
        incidents: false,
        incident: false,
        ai: false,
        related: false,
        evidence: false,
        activity: false,
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

    // Initial load
    useEffect(() => {
        if (currentUser) {
            refreshIncidents();
        }
    }, [currentUser, refreshIncidents]);

    return {
        incidents,
        selectedIncident,
        aiSuggestion,
        escalationRules,
        activityByIncident,
        lastSynced,
        loading,
        refreshIncidents,
        getIncident,
        createIncident,
        updateIncident,
        deleteIncident,
        assignIncident,
        resolveIncident,
        escalateIncident,
        getAIClassification,
        getIncidentActivity,
        getPatternRecognition,
        createEmergencyAlert,
        setSelectedIncident,
        bulkDelete,
        bulkStatusChange,
    };
}
