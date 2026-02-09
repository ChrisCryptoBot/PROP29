/**
 * Digital Handover Feature Context
 * Provides data and actions to all Digital Handover components
 * Eliminates prop drilling across tab components
 */

import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useHandovers } from '../hooks/useHandovers';
import { useHandoverSettings } from '../hooks/useHandoverSettings';
import { useHandoverMetrics } from '../hooks/useHandoverMetrics';
import { useHandoverTemplates } from '../hooks/useHandoverTemplates';
import { useEquipment } from '../hooks/useEquipment';
import { useHandoverDraft } from '../hooks/useHandoverDraft';
import { useHandoverVerification } from '../hooks/useHandoverVerification';
import { handoverService } from '../services/handoverService';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import type { Handover, CreateHandoverRequest, UpdateHandoverRequest, StaffMember, ShiftTimelineEntry } from '../types';

export interface HandoverContextValue {
  // Handovers data
  handovers: Handover[];
  selectedHandover: Handover | null;
  loading: {
    handovers: boolean;
    settings: boolean;
    metrics: boolean;
    templates: boolean;
    equipment: boolean;
    draft: boolean;
    verification: boolean;
  };

  // Handover operations
  createHandover: (data: CreateHandoverRequest) => Promise<Handover>;
  updateHandover: (id: string, data: UpdateHandoverRequest) => Promise<Handover>;
  deleteHandover: (id: string) => Promise<void>;
  completeHandover: (id: string) => Promise<Handover>;
  getHandover: (id: string) => Promise<Handover>;
  refreshHandovers: () => Promise<void>;
  setSelectedHandover: (handover: Handover | null) => void;

  // Settings
  settings: ReturnType<typeof useHandoverSettings>['settings'];
  updateSettings: ReturnType<typeof useHandoverSettings>['updateSettings'];
  refreshSettings: () => Promise<void>;

  // Metrics
  metrics: ReturnType<typeof useHandoverMetrics>['metrics'];
  refreshMetrics: ReturnType<typeof useHandoverMetrics>['refreshMetrics'];

  // Staff & Timeline
  staff: StaffMember[];
  timeline: ShiftTimelineEntry[];
  refreshStaff: () => Promise<void>;
  refreshTimeline: () => Promise<void>;

  // Templates
  templates: ReturnType<typeof useHandoverTemplates>['templates'];
  createTemplate: ReturnType<typeof useHandoverTemplates>['createTemplate'];
  updateTemplate: ReturnType<typeof useHandoverTemplates>['updateTemplate'];
  deleteTemplate: ReturnType<typeof useHandoverTemplates>['deleteTemplate'];
  refreshTemplates: () => Promise<void>;

  // Equipment
  equipment: ReturnType<typeof useEquipment>['equipment'];
  maintenanceRequests: ReturnType<typeof useEquipment>['maintenanceRequests'];
  createEquipment: (data: any) => Promise<any>;
  createMaintenanceRequest: (data: any) => Promise<any>;
  updateMaintenanceRequest: (id: string, data: any) => Promise<any>;
  refreshEquipment: () => Promise<void>;

  // Draft
  saveDraft: ReturnType<typeof useHandoverDraft>['saveDraft'];
  loadDraft: ReturnType<typeof useHandoverDraft>['loadDraft'];
  clearDraft: ReturnType<typeof useHandoverDraft>['clearDraft'];
  hasDraft: ReturnType<typeof useHandoverDraft>['hasDraft'];

  // Verification
  requestVerification: ReturnType<typeof useHandoverVerification>['requestVerification'];
  submitVerification: ReturnType<typeof useHandoverVerification>['submitSignature'];
  getVerificationStatus: ReturnType<typeof useHandoverVerification>['loadVerificationStatus'];

  // Modal UI Controls
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailsModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDetailsModal: (show: boolean) => void;

  // Confirm modal (e.g. delete handover)
  confirmModal: { isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'destructive' | 'warning' | 'default' };
  setConfirmModal: (v: { isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'destructive' | 'warning' | 'default' }) => void;

  // Global refresh & last sync
  lastSyncTimestamp: Date | null;
  refreshAll: () => Promise<void>;
}

export const HandoverContext = createContext<HandoverContextValue | undefined>(undefined);

interface HandoverProviderProps {
  children: ReactNode;
}

/**
 * Digital Handover Provider
 * Wraps components with context and provides state from hooks
 */
export const HandoverProvider: React.FC<HandoverProviderProps> = ({ children }) => {
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'destructive' | 'warning' | 'default' }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Additional data state
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [timeline, setTimeline] = useState<ShiftTimelineEntry[]>([]);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<Date | null>(null);

  // Hooks
  const handoversHook = useHandovers();
  const settingsHook = useHandoverSettings();
  const metricsHook = useHandoverMetrics();
  const templatesHook = useHandoverTemplates();
  const equipmentHook = useEquipment();
  const draftHook = useHandoverDraft();
  const verificationHook = useHandoverVerification();

  // Load staff and timeline
  const refreshStaff = useCallback(async () => {
    const propertyId = localStorage.getItem('propertyId') || '';
    if (!propertyId) return;
    try {
      const data = await handoverService.getStaff(propertyId);
      setStaff(data);
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'DigitalHandover:refreshStaff');
    }
  }, []);

  const refreshTimeline = useCallback(async () => {
    const propertyId = localStorage.getItem('propertyId') || '';
    if (!propertyId) return;
    try {
      const data = await handoverService.getShiftTimeline(propertyId);
      setTimeline(data);
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'DigitalHandover:refreshTimeline');
    }
  }, []);

  useEffect(() => {
    refreshStaff();
    refreshTimeline();
  }, [refreshStaff, refreshTimeline]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      handoversHook.refreshHandovers(),
      settingsHook.loadSettings(),
      metricsHook.refreshMetrics(),
      templatesHook.refreshTemplates(),
      refreshStaff(),
      refreshTimeline(),
    ]);
    const propertyId = localStorage.getItem('propertyId') || '';
    if (propertyId) {
      await equipmentHook.refreshEquipment(propertyId);
    }
    setLastSyncTimestamp(new Date());
  }, [
    handoversHook.refreshHandovers,
    settingsHook.loadSettings,
    metricsHook.refreshMetrics,
    templatesHook.refreshTemplates,
    refreshStaff,
    refreshTimeline,
    equipmentHook.refreshEquipment,
  ]);

  // Context value
  const contextValue: HandoverContextValue = {
    // Handovers data
    handovers: handoversHook.handovers,
    selectedHandover: handoversHook.selectedHandover,
    loading: {
      handovers: handoversHook.loading,
      settings: settingsHook.loading,
      metrics: metricsHook.loading,
      templates: templatesHook.loading,
      equipment: equipmentHook.loading,
      draft: false,
      verification: false,
    },

    // Handover operations
    createHandover: handoversHook.createHandover,
    updateHandover: handoversHook.updateHandover,
    deleteHandover: handoversHook.deleteHandover,
    completeHandover: handoversHook.completeHandover,
    getHandover: handoversHook.getHandover,
    refreshHandovers: handoversHook.refreshHandovers,
    setSelectedHandover: handoversHook.setSelectedHandover,

    // Settings
    settings: settingsHook.settings,
    updateSettings: settingsHook.updateSettings,
    refreshSettings: settingsHook.loadSettings,

    // Metrics
    metrics: metricsHook.metrics,
    refreshMetrics: metricsHook.refreshMetrics,

    // Staff & Timeline
    staff,
    timeline,
    refreshStaff,
    refreshTimeline,

    // Templates
    templates: templatesHook.templates,
    createTemplate: templatesHook.createTemplate,
    updateTemplate: templatesHook.updateTemplate,
    deleteTemplate: templatesHook.deleteTemplate,
    refreshTemplates: templatesHook.refreshTemplates,

    // Equipment
    equipment: equipmentHook.equipment,
    maintenanceRequests: equipmentHook.maintenanceRequests,
    createEquipment: (data) => {
      const propertyId = localStorage.getItem('propertyId') || '';
      return equipmentHook.createEquipment(propertyId, data);
    },
    createMaintenanceRequest: (data) => {
      const propertyId = localStorage.getItem('propertyId') || '';
      return equipmentHook.createMaintenanceRequest(propertyId, data);
    },
    updateMaintenanceRequest: (id, data) => equipmentHook.updateMaintenanceRequest(id, data),
    refreshEquipment: () => {
      const propertyId = localStorage.getItem('propertyId') || '';
      return equipmentHook.refreshEquipment(propertyId);
    },

    // Draft
    saveDraft: draftHook.saveDraft,
    loadDraft: draftHook.loadDraft,
    clearDraft: draftHook.clearDraft,
    hasDraft: draftHook.hasDraft,

    // Verification
    requestVerification: (data) => {
      const propertyId = localStorage.getItem('propertyId') || '';
      return verificationHook.requestVerification(data, propertyId);
    },
    submitVerification: (data) => {
      const propertyId = localStorage.getItem('propertyId') || '';
      return verificationHook.submitSignature(data, propertyId);
    },
    getVerificationStatus: (id) => {
      const propertyId = localStorage.getItem('propertyId') || '';
      return verificationHook.loadVerificationStatus(id, propertyId);
    },

    // Modal UI Controls
    showCreateModal,
    showEditModal,
    showDetailsModal,
    setShowCreateModal,
    setShowEditModal,
    setShowDetailsModal,
    confirmModal,
    setConfirmModal,
    lastSyncTimestamp,
    refreshAll,
  };

  return <HandoverContext.Provider value={contextValue}>{children}</HandoverContext.Provider>;
};

/**
 * Hook to use HandoverContext
 */
export const useHandoverContext = (): HandoverContextValue => {
  const context = useContext(HandoverContext);
  if (!context) {
    throw new Error('useHandoverContext must be used within HandoverProvider');
  }
  return context;
};
