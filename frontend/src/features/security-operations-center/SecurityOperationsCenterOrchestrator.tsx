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
import { electronBridge } from '../../services/ElectronBridge';
import { showSuccess, showError, showInfo } from '../../utils/toast';
import ErrorBoundaryProvider from '../../components/ErrorBoundary/ErrorBoundaryProvider';
import { offlineStorageService } from '../../services/OfflineStorageService';

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
  const { refreshCameras, refreshEvidence, refreshRecordings } = useSecurityOperationsContext();

  useEffect(() => {
    // Setup desktop integration
    const setupDesktopFeatures = async () => {
      const status = electronBridge.getElectronStatus();
      
      if (status.isElectron) {
        // Setup application menu and shortcuts
        electronBridge.setupApplicationMenu();
        electronBridge.setupSecurityShortcuts();
        
        // Show desktop mode notification
        showInfo('Desktop mode active - Enhanced features available');
        
        // Setup event listeners
        electronBridge.on('global-refresh', () => {
          triggerGlobalRefresh();
          showSuccess('All data refreshed');
        });
        
        electronBridge.on('emergency-stop', () => {
          showError('Emergency stop activated - All recording stopped');
        });
        
        electronBridge.on('show-alerts', () => {
          setActiveTab('analytics');
          showInfo('Viewing security alerts and analytics');
        });
        
        electronBridge.on('import-evidence', async () => {
          const filePath = await electronBridge.selectEvidenceFile();
          if (filePath) {
            showSuccess(`Evidence file selected: ${filePath}`);
            refreshEvidence();
          }
        });
        
        electronBridge.on('export-recordings', async () => {
          const directory = await electronBridge.selectExportDirectory();
          if (directory) {
            showSuccess(`Export directory selected: ${directory}`);
            refreshRecordings();
          }
        });
      }
      
      // Check for offline actions to sync
      const queueSize = await offlineStorageService.getQueueSize();
      if (queueSize > 0) {
        showInfo(`${queueSize} offline actions queued for sync`);
      }
    };
    
    setupDesktopFeatures();

    // Standard keyboard handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        triggerGlobalRefresh();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerGlobalRefresh, refreshCameras, refreshEvidence, refreshRecordings]);

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
    <ErrorBoundaryProvider
      onError={(error, errorInfo) => {
        // Report to monitoring service in production
        console.error('Security Operations Center Error:', error, errorInfo);
      }}
    >
      <SecurityOperationsProvider>
        <SecurityOperationsGlobalRefresh />
        <OrchestratorContent />
      </SecurityOperationsProvider>
    </ErrorBoundaryProvider>
  );
};

export default SecurityOperationsCenterOrchestrator;


