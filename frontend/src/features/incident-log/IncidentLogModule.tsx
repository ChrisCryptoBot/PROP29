import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Incident } from './types/incident-log.types';
import { IncidentLogContext, useIncidentLogContext, IncidentLogContextValue } from './context/IncidentLogContext';
import { useIncidentLogState } from './hooks/useIncidentLogState';
import { useIncidentLogWebSocket } from './hooks/useIncidentLogWebSocket';
import { useIncidentLogTelemetry } from './hooks/useIncidentLogTelemetry';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';
import { logger } from '../../services/logger';
import {
  OverviewTab,
  IncidentsTab,
  ReviewQueueTab,
  TrendsTab,
  SettingsTab,
  CreateIncidentModal,
  EditIncidentModal,
  IncidentDetailsModal,
  EscalationModal,
  AdvancedFiltersModal,
  ReportModal,
  EmergencyAlertModal,
  ConflictResolutionModal
} from './components';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { BulkOperationConfirmModal } from './components/modals/BulkOperationConfirmModal';
import ModuleShell from '../../components/Layout/ModuleShell';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import { Button } from '../../components/UI/Button';
import { showSuccess } from '../../utils/toast';

const IncidentLogGlobalRefresh: React.FC = () => {
  const { register, unregister } = useGlobalRefresh();
  const { refreshIncidents, refreshAgentPerformance, refreshHardwareDevices, refreshEnhancedSettings } = useIncidentLogContext();

  // Use refs to store latest function references to prevent re-registration loops
  const refreshFunctionsRef = useRef({ refreshIncidents, refreshAgentPerformance, refreshHardwareDevices, refreshEnhancedSettings });
  useEffect(() => {
    refreshFunctionsRef.current = { refreshIncidents, refreshAgentPerformance, refreshHardwareDevices, refreshEnhancedSettings };
  }, [refreshIncidents, refreshAgentPerformance, refreshHardwareDevices, refreshEnhancedSettings]);

  useEffect(() => {
    const handler = async () => {
      await Promise.all([
        refreshFunctionsRef.current.refreshIncidents(),
        refreshFunctionsRef.current.refreshAgentPerformance(),
        refreshFunctionsRef.current.refreshHardwareDevices(),
        refreshFunctionsRef.current.refreshEnhancedSettings()
      ]);
    };
    register('incident-log', handler);
    return () => unregister('incident-log');
  }, [register, unregister]);

  return null;
};

const IncidentLogContent: React.FC<{
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  showDetailsModal: boolean;
  setShowDetailsModal: (show: boolean) => void;
  showEscalationModal: boolean;
  setShowEscalationModal: (show: boolean) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  showReportModal: boolean;
  setShowReportModal: (show: boolean) => void;
  showEmergencyAlertModal: boolean;
  setShowEmergencyAlertModal: (show: boolean) => void;
}> = ({
  currentTab,
  setCurrentTab,
  showCreateModal,
  setShowCreateModal,
  showEditModal,
  setShowEditModal,
  showDetailsModal,
  setShowDetailsModal,
  showEscalationModal,
  setShowEscalationModal,
  showAdvancedFilters,
  setShowAdvancedFilters,
  showReportModal,
  setShowReportModal,
  showEmergencyAlertModal,
  setShowEmergencyAlertModal
}) => {
  const {
    selectedIncident,
    setSelectedIncident,
    incidents,
    refreshIncidents,
    refreshAgentPerformance,
    refreshHardwareDevices,
    updateIncident,
    lastSynced,
    queuePendingCount,
    queueFailedCount,
    modals,
    confirmDeleteIncident,
    cancelDeleteIncident,
    loading,
    bulkDelete,
    confirmBulkDelete,
    bulkApprove,
    bulkReject,
    bulkStatusChange,
    setShowBulkOperationModal
  } = useIncidentLogContext();
  const { triggerGlobalRefresh } = useGlobalRefresh();
  const { trackAction } = useIncidentLogTelemetry();
  
  // Conflict resolution state
  const [conflictInfo, setConflictInfo] = useState<{
    localIncident: Incident;
    serverIncident: Incident;
    localChanges: Partial<Incident>;
  } | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<{
    incidentId: string;
    updates: any;
  } | null>(null);
  
  // Offline detection
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator === 'undefined' ? false : !navigator.onLine
  );
  
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
  
  // Conflict resolution handler
  const handleConflictResolution = async (action: 'overwrite' | 'merge' | 'cancel') => {
    if (!conflictInfo || !pendingUpdate) return;
    
    if (action === 'cancel') {
      setConflictInfo(null);
      setPendingUpdate(null);
      await refreshIncidents();
      return;
    }
    
    // Retry update with conflict resolution
    const result = await updateIncident(
      pendingUpdate.incidentId,
      pendingUpdate.updates,
      action
    );
    
    if (result) {
      trackAction('conflict_resolved', 'incident', { 
        incidentId: pendingUpdate.incidentId,
        resolution: action 
      });
    }
    
    setConflictInfo(null);
    setPendingUpdate(null);
  };

  // WebSocket integration for real-time updates
  useIncidentLogWebSocket({
    onIncidentCreated: (incident) => {
      // Refresh incidents to get latest state from server
      refreshIncidents();
      trackAction('incident_created', 'incident', { incidentId: incident.incident_id });
    },
    onIncidentUpdated: (incident) => {
      // Refresh incidents to get latest state from server
      refreshIncidents();
      trackAction('incident_updated', 'incident', { incidentId: incident.incident_id });
    },
    onIncidentDeleted: (incidentId) => {
      // Refresh incidents to get latest state from server
      refreshIncidents();
      trackAction('incident_deleted', 'incident', { incidentId });
    },
    onEmergencyAlert: (alert) => {
      trackAction('emergency_alert_received', 'emergency', { alertId: alert.alert_id });
    },
    onHardwareDeviceStatus: (device) => {
      // Refresh hardware devices to get latest state from server
      refreshHardwareDevices();
      trackAction('hardware_device_status_updated', 'hardware', { deviceId: device.device_id });
    },
    onAgentSubmission: (data) => {
      // Refresh incidents to get latest state from server
      refreshIncidents();
      trackAction('agent_submission_received', 'agent', { incidentId: data.incident.incident_id, agentId: data.agentId });
    }
  });

  // Keyboard shortcut for global refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        triggerGlobalRefresh();
        showSuccess('Data refreshed');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerGlobalRefresh]);
  
  // Cross-tab state synchronization
  // Use refs to store latest function references to prevent re-registration loops
  const storageRefreshFunctionsRef = useRef({ refreshIncidents, refreshAgentPerformance, refreshHardwareDevices, setSelectedIncident });
  useEffect(() => {
    storageRefreshFunctionsRef.current = { refreshIncidents, refreshAgentPerformance, refreshHardwareDevices, setSelectedIncident };
  }, [refreshIncidents, refreshAgentPerformance, refreshHardwareDevices, setSelectedIncident]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only handle incident-log related storage events
      if (!e.key || !e.key.startsWith('incident-log:')) return;
      
      // Ignore events from this tab
      if (e.newValue === e.oldValue) return;
      
      try {
        const data = e.newValue ? JSON.parse(e.newValue) : null;
        
        if (e.key === 'incident-log:refresh') {
          // Another tab requested a refresh
          logger.info('Cross-tab refresh triggered', { module: 'IncidentLog' });
          storageRefreshFunctionsRef.current.refreshIncidents();
          storageRefreshFunctionsRef.current.refreshAgentPerformance();
          storageRefreshFunctionsRef.current.refreshHardwareDevices();
        } else if (e.key === 'incident-log:incident-updated') {
          // Another tab updated an incident
          if (data?.incidentId) {
            logger.info('Cross-tab incident update detected', {
              module: 'IncidentLog',
              incidentId: data.incidentId
            });
            storageRefreshFunctionsRef.current.refreshIncidents();
          }
        } else if (e.key === 'incident-log:incident-created') {
          // Another tab created an incident
          if (data?.incidentId) {
            logger.info('Cross-tab incident creation detected', {
              module: 'IncidentLog',
              incidentId: data.incidentId
            });
            storageRefreshFunctionsRef.current.refreshIncidents();
          }
        } else if (e.key === 'incident-log:incident-deleted') {
          // Another tab deleted an incident
          if (data?.incidentId) {
            logger.info('Cross-tab incident deletion detected', {
              module: 'IncidentLog',
              incidentId: data.incidentId
            });
            storageRefreshFunctionsRef.current.refreshIncidents();
            // Clear selection if deleted incident was selected
            if (selectedIncident?.incident_id === data.incidentId) {
              storageRefreshFunctionsRef.current.setSelectedIncident(null);
            }
          }
        } else if (e.key === 'incident-log:bulk-operation') {
          // Another tab performed a bulk operation
          if (data?.operation) {
            logger.info('Cross-tab bulk operation detected', {
              module: 'IncidentLog',
              operation: data.operation
            });
            storageRefreshFunctionsRef.current.refreshIncidents();
            storageRefreshFunctionsRef.current.refreshAgentPerformance();
          }
        }
      } catch (error) {
        logger.warn('Failed to parse cross-tab storage event', {
          module: 'IncidentLog',
          key: e.key,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [selectedIncident]);

  const pendingReviewCount = incidents.filter((incident) => incident.status === 'pending_review').length;
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'incidents', label: 'Incidents' },
    {
      id: 'review',
      label: (
        <span className="inline-flex items-center gap-2">
          Review Queue
          {pendingReviewCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-200 text-[10px] font-black px-2 py-0.5">
              {pendingReviewCount}
            </span>
          )}
        </span>
      )
    },
    { id: 'trends', label: 'Trends' },
    { id: 'settings', label: 'Settings' }
  ];

  // Sync state with context-selected incident
  React.useEffect(() => {
    if (selectedIncident && !showDetailsModal && !showEditModal && !showEscalationModal) {
      setShowDetailsModal(true);
    }
  }, [selectedIncident, showDetailsModal, showEditModal, showEscalationModal, setShowDetailsModal]);

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedIncident(null);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setSelectedIncident(null);
  };

  return (
    <ModuleShell
      icon={<i className="fas fa-clipboard-list" />}
      title="Incident Log"
      subtitle="Comprehensive incident logging, management, and analytics"
      tabs={tabs}
      activeTab={currentTab}
      onTabChange={setCurrentTab}
        >
      {isOffline && (
        <div className="bg-amber-500/20 border-b border-amber-500/50 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-amber-400 text-xs font-black uppercase tracking-wider">
                Offline mode — changes will sync when connection is restored
              </p>
              {queuePendingCount > 0 && (
                <span className="text-[9px] font-mono text-amber-300/70 uppercase tracking-widest">
                  {queuePendingCount} pending sync{queuePendingCount !== 1 ? 's' : ''}
                </span>
              )}
              {queueFailedCount > 0 && (
                <span className="text-[9px] font-mono text-red-300/70 uppercase tracking-widest">
                  {queueFailedCount} failed
                </span>
              )}
            </div>
            {lastSynced && (
              <p className="text-[9px] font-mono text-amber-300/70 uppercase tracking-widest ml-4">
                Last sync: {lastSynced.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      )}
      {currentTab === 'overview' && (
        <ErrorBoundary moduleName="Incident Log - Overview">
          <OverviewTab />
        </ErrorBoundary>
      )}
      {currentTab === 'incidents' && (
        <ErrorBoundary moduleName="Incident Log - Incident Management">
          <IncidentsTab />
        </ErrorBoundary>
      )}
      {currentTab === 'review' && (
        <ErrorBoundary moduleName="Incident Log - Review Queue">
          <ReviewQueueTab />
        </ErrorBoundary>
      )}
      {currentTab === 'trends' && (
        <ErrorBoundary moduleName="Incident Log - Trends">
          <TrendsTab />
        </ErrorBoundary>
      )}
      {currentTab === 'settings' && (
        <ErrorBoundary moduleName="Incident Log - Settings">
          <SettingsTab />
        </ErrorBoundary>
      )}

      {/* Modals */}
      <CreateIncidentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <EditIncidentModal
        isOpen={showEditModal}
        onClose={handleCloseEdit}
        incident={selectedIncident}
        onConflict={(conflict: { localIncident: Incident; serverIncident: Incident; localChanges: Partial<Incident> }) => {
          setConflictInfo(conflict);
          setPendingUpdate({
            incidentId: conflict.localIncident.incident_id,
            updates: conflict.localChanges
          });
          setShowEditModal(false);
        }}
      />

      <IncidentDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetails}
        incident={selectedIncident}
      />

      <EscalationModal
        isOpen={showEscalationModal}
        onClose={() => setShowEscalationModal(false)}
        incident={selectedIncident}
      />

      <AdvancedFiltersModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      <EmergencyAlertModal
        isOpen={showEmergencyAlertModal}
        onClose={() => setShowEmergencyAlertModal(false)}
      />
      <ConfirmDeleteModal
        isOpen={modals.showDeleteConfirmModal}
        onClose={cancelDeleteIncident}
        onConfirm={confirmDeleteIncident}
        title="Delete Incident"
        message="Are you sure you want to delete this incident? This action cannot be undone."
        itemName={modals.deleteIncidentId ? incidents.find(i => i.incident_id === modals.deleteIncidentId)?.title : undefined}
        isDeleting={loading.incident}
      />

      <BulkOperationConfirmModal
        isOpen={modals.showBulkOperationModal}
        onClose={() => {
          setShowBulkOperationModal(false);
        }}
        operation={modals.bulkOperation}
        onConfirm={async (reason?: string) => {
          if (!modals.bulkOperation) return null;
          if (modals.bulkOperation.type === 'delete') {
            return await confirmBulkDelete(modals.bulkOperation.incidentIds, reason);
          }
          if (modals.bulkOperation.type === 'approve') {
            return await bulkApprove(modals.bulkOperation.incidentIds, reason);
          }
          if (modals.bulkOperation.type === 'reject') {
            const rejectReason = reason ?? 'Bulk rejection';
            return await bulkReject(modals.bulkOperation.incidentIds, rejectReason);
          }
          if (modals.bulkOperation.type === 'status_change' && modals.bulkOperation.newStatus) {
            await bulkStatusChange(modals.bulkOperation.incidentIds, modals.bulkOperation.newStatus);
            return null;
          }
          return null;
        }}
      />

      {/* Conflict Resolution Modal */}
      {conflictInfo && (
        <ConflictResolutionModal
          isOpen={!!conflictInfo}
          onClose={() => {
            setConflictInfo(null);
            setPendingUpdate(null);
          }}
          incident={conflictInfo.localIncident}
          localChanges={conflictInfo.localChanges}
          serverVersion={conflictInfo.serverIncident}
          onResolve={handleConflictResolution}
        />
      )}

      {/* Quick Action FABs - Gold Standard: solid colors, circular */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col space-y-4">
        <Button
          onClick={() => setShowEmergencyAlertModal(true)}
          variant="destructive"
          size="icon"
          className="w-14 h-14 rounded-full border-0"
          title="Send Emergency Alert"
          aria-label="Send Emergency Alert"
        >
          <i className="fas fa-exclamation-triangle text-xl" />
        </Button>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          size="icon"
          className="w-14 h-14 rounded-full border-0"
          title="Create New Incident"
          aria-label="Create New Incident"
        >
          <i className="fas fa-plus text-xl" />
        </Button>
      </div>
    </ModuleShell>
  );
};

export const IncidentLogModule: React.FC = () => {
  const state = useIncidentLogState();
  const [currentTab, setCurrentTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEmergencyAlertModal, setShowEmergencyAlertModal] = useState(false);

  const contextValue = {
    ...state,
    setShowCreateModal,
    setShowEditModal,
    setShowDetailsModal,
    setShowEscalationModal,
    setShowAdvancedFilters,
    setShowReportModal,
    setShowEmergencyAlertModal,
    confirmDeleteIncident: state.confirmDeleteIncident,
    cancelDeleteIncident: state.cancelDeleteIncident,
    confirmBulkDelete: state.confirmBulkDelete
  };

  return (
    <IncidentLogContext.Provider value={contextValue as IncidentLogContextValue}>
      <IncidentLogGlobalRefresh />
      <IncidentLogContent
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        showDetailsModal={showDetailsModal}
        setShowDetailsModal={setShowDetailsModal}
        showEscalationModal={showEscalationModal}
        setShowEscalationModal={setShowEscalationModal}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        showEmergencyAlertModal={showEmergencyAlertModal}
        setShowEmergencyAlertModal={setShowEmergencyAlertModal}
      />
    </IncidentLogContext.Provider>
  );
};

export default IncidentLogModule;
