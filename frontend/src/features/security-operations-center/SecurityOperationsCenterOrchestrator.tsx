import React, { useEffect, useState } from 'react';
import { SecurityOperationsProvider, useSecurityOperationsContext } from './context/SecurityOperationsContext';
import { LiveViewTab } from './components/tabs/LiveViewTab';
import { RecordingsTab } from './components/tabs/RecordingsTab';
import { EvidenceManagementTab } from './components/tabs/EvidenceManagementTab';
import { AnalyticsTab } from './components/tabs/AnalyticsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { ProvisioningTab } from './components/tabs/ProvisioningTab';
import { EvidenceDetailsModal } from './components/modals';
import type { TabId } from './types/security-operations.types';
import ModuleShell from '../../components/Layout/ModuleShell';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';

const tabs: { id: TabId; label: string }[] = [
  { id: 'live', label: 'Live View' },
  { id: 'recordings', label: 'Recordings' },
  { id: 'evidence', label: 'Evidence Management' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
  { id: 'provisioning', label: 'Provisioning' },
];

const SecurityOperationsGlobalRefresh: React.FC = () => {
  const { register, unregister } = useGlobalRefresh();
  const {
    refreshCameras,
    refreshRecordings,
    refreshEvidence,
    refreshMetrics,
    refreshAnalytics,
    refreshSettings,
  } = useSecurityOperationsContext();

  useEffect(() => {
    const handler = async () => {
      await Promise.allSettled([
        refreshCameras(),
        refreshRecordings(),
        refreshEvidence(),
        refreshMetrics(),
        refreshAnalytics(),
        refreshSettings(),
      ]);
    };
    register('security-operations-center', handler);
    return () => unregister('security-operations-center');
  }, [
    register,
    unregister,
    refreshCameras,
    refreshRecordings,
    refreshEvidence,
    refreshMetrics,
    refreshAnalytics,
    refreshSettings,
  ]);

  return null;
};

const OrchestratorContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('live');
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

  const renderTab = () => {
    switch (activeTab) {
      case 'live':
        return <LiveViewTab />;
      case 'recordings':
        return <RecordingsTab />;
      case 'evidence':
        return <EvidenceManagementTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <SettingsTab />;
      case 'provisioning':
        return <ProvisioningTab />;
      default:
        return null;
    }
  };

  return (
    <ModuleShell
      icon={<i className="fas fa-tower-observation" />}
      title="Security Operations Center"
      subtitle="Security monitoring and video management system"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {renderTab()}
      </div>
      <EvidenceDetailsModal />
    </ModuleShell>
  );
};

export const SecurityOperationsCenterOrchestrator: React.FC = () => {
  return (
    <SecurityOperationsProvider>
      <SecurityOperationsGlobalRefresh />
      <OrchestratorContent />
    </SecurityOperationsProvider>
  );
};

export default SecurityOperationsCenterOrchestrator;


