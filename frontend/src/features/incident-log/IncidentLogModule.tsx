import React, { useState } from 'react';
import { IncidentLogContext, useIncidentLogContext, IncidentLogContextValue } from './context/IncidentLogContext';
import { useIncidentLogState } from './hooks/useIncidentLogState';
import {
  DashboardTab,
  IncidentsTab,
  ReviewQueueTab,
  TrendsTab,
  PredictionsTab,
  SettingsTab,
  CreateIncidentModal,
  EditIncidentModal,
  IncidentDetailsModal,
  EscalationModal,
  AdvancedFiltersModal,
  ReportModal,
  EmergencyAlertModal
} from './components';
import ModuleShell from '../../components/Layout/ModuleShell';

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
    incidents
  } = useIncidentLogContext();

  const pendingReviewCount = incidents.filter((incident) => incident.status === 'pending_review').length;
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'incidents', label: 'Incident Management' },
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
    { id: 'predictions', label: 'AI Predictions' },
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
      {currentTab === 'overview' && <DashboardTab />}
      {currentTab === 'incidents' && <IncidentsTab />}
      {currentTab === 'review' && <ReviewQueueTab />}
      {currentTab === 'trends' && <TrendsTab />}
      {currentTab === 'predictions' && <PredictionsTab />}
      {currentTab === 'settings' && <SettingsTab />}

      {/* Modals */}
      <CreateIncidentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <EditIncidentModal
        isOpen={showEditModal}
        onClose={handleCloseEdit}
        incident={selectedIncident}
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

      {/* Quick Action FABs - Gold Standard */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col space-y-4">
        {/* Emergency Alert FAB - Red, positioned above regular FAB */}
        <button
          onClick={() => setShowEmergencyAlertModal(true)}
          className="w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-red-700 hover:scale-110 transition-all group animate-pulse"
          title="Send Emergency Alert"
          aria-label="Send Emergency Alert"
        >
          <i className="fas fa-exclamation-triangle text-xl group-hover:scale-110 transition-transform" />
        </button>
        {/* Regular Create Incident FAB - Blue */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all group"
          title="Create New Incident"
          aria-label="Create New Incident"
        >
          <i className="fas fa-plus text-xl group-hover:rotate-90 transition-transform" />
        </button>
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
    setShowEmergencyAlertModal
  };

  return (
    <IncidentLogContext.Provider value={contextValue as IncidentLogContextValue}>
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
