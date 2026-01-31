/**
 * Incident Log Feature Context
 * Provides data and actions to all Incident Log components
 * Eliminates prop drilling across tab components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useIncidentLogState } from '../hooks/useIncidentLogState';
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
  AgentTrustLevel,
  HardwareIncidentMetadata
} from '../types/incident-log.types';
import { IncidentStatus, IncidentType } from '../types/incident-log.types';

export interface IncidentLogContextValue {
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

    // Loading states (enhanced)
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
    operationLock: ReturnType<typeof import('../hooks/useIncidentLogOperationLock').useIncidentLogOperationLock>;
}

export const IncidentLogContext = createContext<IncidentLogContextValue | undefined>(undefined);

interface IncidentLogProviderProps {
  children: ReactNode;
}

/**
 * Incident Log Provider
 * Wraps components with context and provides state from useIncidentLogState hook
 * This is the connection point between the hook and the components
 */
export const IncidentLogProvider: React.FC<IncidentLogProviderProps> = ({ children }) => {
  const state = useIncidentLogState();

  // By default, it just provides the state
  // But IncidentLogModule can override this by providing its own Provider
  // Note: Modal state setters are added by IncidentLogModule, so we use Partial here
  return (
    <IncidentLogContext.Provider value={state as IncidentLogContextValue}>
      {children}
    </IncidentLogContext.Provider>
  );
};

export const useIncidentLogContext = (): IncidentLogContextValue => {
  const context = useContext(IncidentLogContext);
  if (!context) {
    throw new Error('useIncidentLogContext must be used within IncidentLogProvider');
  }
  return context;
};

