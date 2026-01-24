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
  AIClassificationResponse,
  EmergencyAlertResponse,
  IncidentFilters,
  EscalationRule,
  UserActivity,
  PatternRecognitionRequest,
  PatternRecognitionResponse
} from '../types/incident-log.types';
import { IncidentStatus, IncidentType } from '../types/incident-log.types';

export interface IncidentLogContextValue {
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

  // Actions - Modal UI Controls
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDetailsModal: (show: boolean) => void;
  setShowEscalationModal: (show: boolean) => void;
  setShowAdvancedFilters: (show: boolean) => void;
  setShowReportModal: (show: boolean) => void;
  setShowEmergencyAlertModal: (show: boolean) => void;
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

