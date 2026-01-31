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
  ResponseTeamsTab,
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
import type { TabId } from './types/guest-safety.types';

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: 'incidents', label: 'Incidents' },
  { id: 'messages', label: 'Messages' },
  { id: 'mass-notification', label: 'Mass Notification' },
  { id: 'response-teams', label: 'Response Teams' },
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

const OrchestratorContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('incidents');
  const { setShowCreateIncidentModal } = useGuestSafetyContext();
  const { triggerGlobalRefresh } = useGlobalRefresh();

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
    setActiveTab(tabId);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'incidents':
        return <IncidentsTab />;
      case 'messages':
        return <MessagesTab />;
      case 'mass-notification':
        return <MassNotificationTab />;
      case 'response-teams':
        return <ResponseTeamsTab />;
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
          variant="destructive"
          size="icon"
          className="w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-transform"
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
  return (
    <GuestSafetyProvider>
      <OrchestratorContent />
    </GuestSafetyProvider>
  );
};

export default GuestSafetyOrchestrator;


