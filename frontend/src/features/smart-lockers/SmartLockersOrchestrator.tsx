/**
 * Smart Lockers Module Orchestrator
 * Main orchestrator component that integrates all tabs, modals, and context providers
 * 
 * Gold Standard Checklist:
 * ✅ Only handles high-level layout and routing
 * ✅ Zero business logic - all moved to useSmartLockersState hook
 * ✅ Tab navigation with sticky header
 * ✅ Provides SmartLockersProvider context
 */

import React, { useState } from 'react';
import { Button } from '../../components/UI/Button';
import { SmartLockersProvider, useSmartLockersContext } from './context/SmartLockersContext';
import {
  OverviewTab,
  LockersManagementTab,
  ReservationsTab,
  AnalyticsTab,
  SettingsTab,
} from './components/tabs';
import {
  CreateLockerModal,
  ReservationModal,
  LockerDetailsModal,
} from './components/modals';
import ModuleShell from '../../components/Layout/ModuleShell';

interface Tab {
  id: string;
  label: string;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'lockers', label: 'Lockers' },
  { id: 'reservations', label: 'Reservations' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
];

const OrchestratorContent: React.FC = () => {
  const { canCreateLocker, setShowCreateModal, setSelectedLocker } = useSmartLockersContext();
  const [activeTab, setActiveTab] = useState<string>('overview');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'lockers':
        return <LockersManagementTab />;
      case 'reservations':
        return <ReservationsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <ModuleShell
      icon={<i className="fas fa-lock" />}
      title="Smart Lockers"
      subtitle="Intelligent locker management and reservation system"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      actions={
        canCreateLocker ? (
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            className="font-black uppercase tracking-widest px-8 shadow-lg shadow-blue-500/20"
            title="Create New Locker"
            aria-label="Create New Locker"
          >
            <i className="fas fa-plus mr-2" />
            New Locker
          </Button>
        ) : null
      }
    >
      <main className="relative max-w-[1800px] mx-auto px-6 py-6" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {renderTab()}
      </main>

      {/* Modals */}
      <CreateLockerModal />
      <ReservationModal />
      <LockerDetailsModal />

      {/* Quick Action FAB - Gold Standard */}
      {canCreateLocker && (
        <div className="fixed bottom-8 right-8 z-50">
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="icon"
            className="w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-transform"
            title="Create New Locker"
            aria-label="Create New Locker"
          >
            <i className="fas fa-plus text-xl" />
          </Button>
        </div>
      )}
    </ModuleShell>
  );
};

export const SmartLockersOrchestrator: React.FC = () => {
  return (
    <SmartLockersProvider>
      <OrchestratorContent />
    </SmartLockersProvider>
  );
};

export default SmartLockersOrchestrator;


