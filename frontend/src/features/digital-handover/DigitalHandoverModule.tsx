/**
 * Digital Handover Module
 * 
 * Main orchestrator component for the Digital Handover feature.
 * Integrates all tabs, components, and context providers.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import { HandoverProvider, useHandoverContext } from './context/HandoverContext';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';
import { useHandoverTelemetry } from './hooks/useHandoverTelemetry';
import { HandoverForm } from './components/modals/HandoverForm';
import { HandoverDetailsModal } from './components/modals/HandoverDetailsModal';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { ErrorHandlerService } from '../../services/ErrorHandlerService';
import {
  ManagementTab,
  TrackingTab,
  EquipmentTab,
  AnalyticsTab,
  SettingsTab,
} from './components/tabs';
import { cn } from '../../utils/cn';
import type { Handover, CreateHandoverRequest, UpdateHandoverRequest } from './types';
import ModuleShell from '../../components/Layout/ModuleShell';
import { getShiftTypeBadge, getStatusBadgeClass, getPriorityBadgeClass } from './utils/badgeHelpers';

/**
 * Tab configuration
 */
const tabs = [
  { id: 'management', label: 'Management', path: '#' }, // Path is just a placeholder for ModuleShell if it uses it for routing, or ID if it uses ID. AccessControl used ID.
  { id: 'tracking', label: 'Tracking', path: '#' },
  { id: 'equipment', label: 'Equipment & Tasks', path: '#' },
  { id: 'analytics', label: 'Analytics', path: '#' },
  { id: 'settings', label: 'Settings', path: '#' },
];

/**
 * Internal module content (uses context)
 */
const DigitalHandoverContent: React.FC = () => {
  const {
    handovers,
    selectedHandover,
    createHandover,
    updateHandover,
    deleteHandover,
    setSelectedHandover,
    refreshHandovers,
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
  } = useHandoverContext();

  const [activeTab, setActiveTab] = useState<string>('management');
  const { trackAction } = useHandoverTelemetry();

  const refreshAllRef = useRef(refreshAll);
  refreshAllRef.current = refreshAll;
  const { register, unregister, triggerGlobalRefresh } = useGlobalRefresh();
  useEffect(() => {
    const handler = async () => {
      await refreshAllRef.current();
    };
    register('digital-handover', handler);
    return () => unregister('digital-handover');
  }, [register, unregister]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        triggerGlobalRefresh();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerGlobalRefresh]);

  // Handlers
  const handleCreateHandover = async (data: CreateHandoverRequest) => {
    try {
      const created = await createHandover(data);
      setShowCreateModal(false);
      await refreshHandovers();
      trackAction('handover_created', 'handover', { handoverId: created.id });
    } catch (error) {
      throw error;
    }
  };

  const handleEditHandover = async (data: CreateHandoverRequest) => {
    if (!selectedHandover) return;
    try {
      const updateData: UpdateHandoverRequest = {
        shiftType: data.shiftType,
        handoverFrom: data.handoverFrom,
        handoverTo: data.handoverTo,
        handoverDate: data.handoverDate,
        startTime: data.startTime,
        endTime: data.endTime,
        priority: data.priority,
        handoverNotes: data.handoverNotes,
        linkedIncidentIds: data.linkedIncidentIds,
        checklistItems: data.checklistItems.map((item, index) => {
          const existingItem = selectedHandover.checklistItems[index];
          return {
            id: existingItem?.id || `temp-${index}`,
            title: item.title,
            description: item.description,
            category: item.category,
            priority: item.priority,
            assignedTo: item.assignedTo,
            dueDate: item.dueDate,
            status: existingItem?.status || 'pending',
          };
        }),
      };
      await updateHandover(selectedHandover.id, updateData);
      setShowEditModal(false);
      setSelectedHandover(null);
      await refreshHandovers();
      trackAction('handover_updated', 'handover', { handoverId: selectedHandover.id });
    } catch (error) {
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'DigitalHandover:handleEditHandover');
      throw error;
    }
  };

  const handleDeleteHandover = async (id: string) => {
    try {
      await deleteHandover(id);
      if (selectedHandover?.id === id) {
        setSelectedHandover(null);
        setShowDetailsModal(false);
      }
      await refreshHandovers();
    } catch {
      // Error surfaced via toast/context where applicable
    }
  };

  const handleHandoverSelect = (handover: Handover) => {
    setSelectedHandover(handover);
    setShowDetailsModal(true);
  };

  const handleEditClick = (handover: Handover) => {
    setSelectedHandover(handover);
    setShowEditModal(true);
    setShowDetailsModal(false);
  };

  const handleDeleteRequest = (handover: Handover) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete handover',
      message: `Are you sure you want to delete this handover (${handover.handoverFrom} → ${handover.handoverTo})? This cannot be undone.`,
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await deleteHandover(handover.id);
          setSelectedHandover(null);
          setShowDetailsModal(false);
          await refreshHandovers();
          trackAction('handover_deleted', 'handover', { handoverId: handover.id });
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      },
    });
  };

  return (
    <ModuleShell
      title="Digital Handover"
      subtitle="Seamless shift transitions and operational continuity"
      icon={<i className="fas fa-exchange-alt" />}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={
        lastSyncTimestamp ? (
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest" aria-live="polite">
            Last refreshed {lastSyncTimestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        ) : null
      }
    >
      <div className="space-y-6">
        {/* Tab Content */}
        <ErrorBoundary>
          {activeTab === 'management' && (
            <ManagementTab
              onHandoverSelect={handleHandoverSelect}
              onCreateClick={() => setShowCreateModal(true)}
            />
          )}
          {activeTab === 'tracking' && <TrackingTab onHandoverSelect={handleHandoverSelect} />}
          {activeTab === 'equipment' && <EquipmentTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </ErrorBoundary>

        {/* Modals */}
        {showCreateModal && (
          <HandoverForm
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateHandover}
            mode="create"
          />
        )}

        {showEditModal && selectedHandover && (
          <HandoverForm
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedHandover(null);
            }}
            onSubmit={handleEditHandover}
            initialData={selectedHandover}
            mode="edit"
          />
        )}

        {showDetailsModal && selectedHandover && (
          <HandoverDetailsModal
            handover={selectedHandover}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedHandover(null);
            }}
            onEdit={(handover) => handleEditClick(handover)}
            onDelete={handleDeleteHandover}
            onDeleteRequest={handleDeleteRequest}
            getShiftTypeBadge={getShiftTypeBadge}
            getStatusBadgeClass={getStatusBadgeClass}
            getPriorityBadgeClass={getPriorityBadgeClass}
          />
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant || 'destructive'}
        />
      </div>
    </ModuleShell>

  );
};

/**
 * Main Digital Handover Module Component
 * Wraps content with context provider
 */
export const DigitalHandoverModule: React.FC = () => {
  return (
    <ErrorBoundary>
      <HandoverProvider>
        <DigitalHandoverContent />
      </HandoverProvider>
    </ErrorBoundary>
  );
};

export default DigitalHandoverModule;


