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

import React, { useState } from 'react';
import { GuestSafetyProvider } from './context/GuestSafetyContext';
import {
  IncidentsTab,
  MassNotificationTab,
  ResponseTeamsTab,
  AnalyticsTab,
  SettingsTab,
} from './components/tabs';
import {
  IncidentDetailsModal,
  AssignTeamModal,
  SendMessageModal,
} from './components/modals';
import ModuleShell from '../../components/Layout/ModuleShell';
import type { TabId } from './types/guest-safety.types';

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: 'incidents', label: 'Incidents' },
  { id: 'mass-notification', label: 'Mass Notification' },
  { id: 'response-teams', label: 'Response Teams' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
];

const OrchestratorContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('incidents');

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'incidents':
        return <IncidentsTab />;
      case 'mass-notification':
        return <MassNotificationTab />;
      case 'response-teams':
        return <ResponseTeamsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <IncidentsTab />;
    }
  };

  return (
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
      <IncidentDetailsModal />
      <AssignTeamModal />
      <SendMessageModal />
    </ModuleShell>
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


