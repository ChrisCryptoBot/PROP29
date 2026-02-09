/**
 * Guest Safety Module Orchestrator
 * Main orchestrator component that integrates all tabs, modals, and context providers
 * 
 * Gold Standard Checklist:
 * ✅ Only handles high-level layout and routing
 * ✅ Zero business logic - all moved to useGuestSafetyState hook
 * ✅ Tab navigation with sticky header
 * ✅ Provides GuestSafetyProvider context
 * ✅ Gold Standard UI uniformity
 */

import React, { useState, useEffect } from 'react';
import { GuestSafetyProvider, useGuestSafetyContext } from './context/GuestSafetyContext';
import {
  IncidentsTab,
  MassNotificationTab,
  EvacuationTab,
  AnalyticsTab,
  SettingsTab,
  MessagesTab,
} from './components/tabs';
import {
  IncidentDetailsModal,
  AssignTeamModal,
  SendMessageModal,
  CreateIncidentModal,
} from './components/modals';
import ModuleShell from '../../components/Layout/ModuleShell';
import { Button } from '../../components/UI/Button';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';
import { useGuestSafetyTelemetry } from './hooks/useGuestSafetyTelemetry';
import type { TabId } from './types/guest-safety.types';

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: 'incidents', label: 'Incidents' },
  { id: 'messages', label: 'Messages' },
  { id: 'mass-notification', label: 'Mass Notification' },
  { id: 'evacuation', label: 'Evacuation' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
];

const GuestSafetyGlobalRefresh: React.FC = () => {
  const { register, unregister } = useGlobalRefresh();
  const {
    refreshIncidents,
    refreshMessages,
    refreshTeams,
    refreshHardwareDevices,
    refreshAgentMetrics,
  } = useGuestSafetyContext();

  useEffect(() => {
    const handler = async () => {
      await Promise.allSettled([
        refreshIncidents(),
        refreshMessages(),
        refreshTeams(),
        refreshHardwareDevices(),
        refreshAgentMetrics(),
      ]);
    };
    register('guest-safety', handler);
    return () => unregister('guest-safety');
  }, [register, unregister, refreshIncidents, refreshMessages, refreshTeams, refreshHardwareDevices, refreshAgentMetrics]);

  return null;
};

interface OrchestratorContentProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

const OrchestratorContent: React.FC<OrchestratorContentProps> = ({ activeTab, onTabChange }) => {
  const { setShowCreateIncidentModal, isOffline } = useGuestSafetyContext();
  const { triggerGlobalRefresh } = useGlobalRefresh();
  const { trackAction } = useGuestSafetyTelemetry();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        triggerGlobalRefresh();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerGlobalRefresh]);

  const handleTabChange = (tabId: TabId) => {
    trackAction('tab_changed', 'tab', { tabId });
    onTabChange(tabId);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'incidents':
        return <IncidentsTab />;
      case 'messages':
        return <MessagesTab />;
      case 'mass-notification':
        return <MassNotificationTab />;
      case 'evacuation':
        return <EvacuationTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <IncidentsTab />;
    }
  };

  return (
    <>
      <GuestSafetyGlobalRefresh />
      <ModuleShell
        icon={<i className="fas fa-shield-heart" />}
        title="Guest Safety"
        subtitle="Advanced guest protection and emergency response coordination"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
      {isOffline && (
        <div className="bg-amber-500/20 border-b border-amber-500/50 px-4 py-2" role="alert">
          <p className="text-amber-400 text-xs font-black uppercase tracking-wider">
            You are offline. Data shown is last known state. Actions may fail until connection is restored.
          </p>
        </div>
      )}
      <main className="relative max-w-[1800px] mx-auto px-6 py-8" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {renderTab()}
      </main>

      {/* Modals */}
      <CreateIncidentModal />
      <IncidentDetailsModal />
      <AssignTeamModal />
      <SendMessageModal />

      {/* Quick Action FAB - Gold Standard */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          onClick={() => setShowCreateIncidentModal(true)}
          variant="primary"
          size="icon"
          className="w-14 h-14 rounded-full border-0"
          title="Create Incident"
          aria-label="Create Incident"
        >
          <i className="fas fa-exclamation-triangle text-xl" />
        </Button>
      </div>
    </ModuleShell>
    </>
  );
};

export const GuestSafetyOrchestrator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('incidents');
  return (
    <GuestSafetyProvider setActiveTab={setActiveTab}>
      <OrchestratorContent activeTab={activeTab} onTabChange={setActiveTab} />
    </GuestSafetyProvider>
  );
};

export default GuestSafetyOrchestrator;


