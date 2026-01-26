/**
 * Digital Handover Module
 * 
 * Main orchestrator component for the Digital Handover feature.
 * Integrates all tabs, components, and context providers.
 */

import React, { useState } from 'react';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import { HandoverProvider, useHandoverContext } from './context/HandoverContext';
import { HandoverForm } from './components/modals/HandoverForm';
import { HandoverDetailsModal } from './components/modals/HandoverDetailsModal';
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
 * Helper functions for badge rendering
 */
const getShiftTypeBadge = (shiftType: string) => {
  const badges: Record<string, { label: string; className: string }> = {
    morning: { label: 'Morning', className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    afternoon: { label: 'Afternoon', className: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    night: { label: 'Night', className: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  };

  const badge = badges[shiftType] || badges.morning;
  return (
    <span className={cn('px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border rounded transition-all', badge.className)}>
      {badge.label}
    </span>
  );
};

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'text-green-400 bg-green-500/10 border-green-500/20 px-2 py-0.5 rounded border font-black uppercase tracking-widest text-[10px]';
    case 'in_progress':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20 px-2 py-0.5 rounded border font-black uppercase tracking-widest text-[10px]';
    case 'pending':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20 px-2 py-0.5 rounded border font-black uppercase tracking-widest text-[10px]';
    case 'overdue':
      return 'text-red-400 bg-red-500/10 border-red-500/20 px-2 py-0.5 rounded border font-black uppercase tracking-widest text-[10px] animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    default:
      return 'text-white/40 bg-white/5 border-white/5 px-2 py-0.5 rounded border font-black uppercase tracking-widest text-[10px]';
  }
};

const getPriorityBadgeClass = (priority: string): string => {
  switch (priority) {
    case 'critical':
      return 'text-red-400 bg-red-500/10 border-red-500/20 px-2 py-0.5 rounded border font-black uppercase tracking-widest text-[10px] animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    case 'high':
      return 'text-orange-400 bg-orange-500/10 border-orange-500/20 px-2 py-0.5 rounded border font-black uppercase tracking-widest text-[10px]';
    case 'medium':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20 px-2 py-0.5 rounded border font-black uppercase tracking-widest text-[10px]';
    case 'low':
      return 'text-white/40 bg-white/5 border-white/5 px-2 py-0.5 rounded border font-black uppercase tracking-widest text-[10px]';
    default:
      return 'text-white/40 bg-white/5 border-white/5 px-2 py-0.5 rounded border font-black uppercase tracking-widest text-[10px]';
  }
};

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
  } = useHandoverContext();

  const [activeTab, setActiveTab] = useState<string>('management');

  // Handlers
  const handleCreateHandover = async (data: CreateHandoverRequest) => {
    try {
      await createHandover(data);
      setShowCreateModal(false);
      await refreshHandovers();
    } catch (error) {
      console.error('Failed to create handover:', error);
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
    } catch (error) {
      console.error('Failed to update handover:', error);
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
    } catch (error) {
      console.error('Failed to delete handover:', error);
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

  return (
    <ModuleShell
      title="Digital Handover"
      subtitle="Seamless shift transitions and operational continuity"
      icon={<i className="fas fa-exchange-alt" />}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
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
            getShiftTypeBadge={getShiftTypeBadge}
            getStatusBadgeClass={getStatusBadgeClass}
            getPriorityBadgeClass={getPriorityBadgeClass}
          />
        )}
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


