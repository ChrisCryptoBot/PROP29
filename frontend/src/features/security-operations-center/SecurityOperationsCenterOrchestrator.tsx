import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SecurityOperationsProvider, useSecurityOperationsContext } from './context/SecurityOperationsContext';
import { CameraModalManagerProvider, useCameraModalManager } from './context/CameraModalManagerContext';
import { CameraWallLayoutProvider } from './context/CameraWallLayoutContext';
import { LiveViewTab } from './components/tabs/LiveViewTab';
import { RecordingsTab } from './components/tabs/RecordingsTab';
import { EvidenceManagementTab } from './components/tabs/EvidenceManagementTab';
import { AnalyticsTab } from './components/tabs/AnalyticsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { ProvisioningTab } from './components/tabs/ProvisioningTab';
import { AuditTrailTab } from './components/tabs/AuditTrailTab';
import { EvidenceDetailsModal } from './components/modals';
import { SecurityOperationsWebSocketIntegration } from './components/SecurityOperationsWebSocketIntegration';
import { CameraModalRenderer } from './components/CameraModalRenderer';
import { OfflineQueueIndicator } from './components/OfflineQueueIndicator';
import { OfflineBanner } from './components/OfflineBanner';
import type { TabId } from './types/security-operations.types';
import ModuleShell from '../../components/Layout/ModuleShell';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';
import { electronBridge } from '../../services/ElectronBridge';
import { showSuccess, showError, showInfo } from '../../utils/toast';
import ErrorBoundaryProvider from '../../components/ErrorBoundary/ErrorBoundaryProvider';
import { offlineStorageService } from '../../services/OfflineStorageService';
import { ErrorHandlerService } from '../../services/ErrorHandlerService';

const tabs: { id: TabId; label: string }[] = [
  { id: 'live', label: 'Live View' },
  { id: 'recordings', label: 'Recordings' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'provisioning', label: 'Provisioning' },
  { id: 'audit-trail', label: 'Audit Trail' },
  { id: 'settings', label: 'Settings' },
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { triggerGlobalRefresh } = useGlobalRefresh();
  const { cameras, refreshCameras, refreshEvidence, refreshRecordings, emergencyStopAllRecording } = useSecurityOperationsContext();
  const { openModal: openCameraModal } = useCameraModalManager();
  const deepLinkHandled = useRef(false);

  // Deep link: ?cameraId=xxx from e.g. IoT module — switch to Live View and open camera modal
  useEffect(() => {
    const cameraId = searchParams.get('cameraId');
    if (!cameraId || deepLinkHandled.current || cameras.length === 0) return;
    const camera = cameras.find((c) => c.id === cameraId);
    if (camera) {
      setActiveTab('live');
      openCameraModal(camera);
      deepLinkHandled.current = true;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('cameraId');
        return next;
      }, { replace: true });
    }
  }, [cameras, searchParams, setSearchParams, openCameraModal]);

  useEffect(() => {
    // Setup desktop integration
    const setupDesktopFeatures = async () => {
      const status = electronBridge.getElectronStatus();
      
      if (status.isElectron) {
        // Setup application menu and shortcuts
        electronBridge.setupApplicationMenu();
        electronBridge.setupSecurityShortcuts();
        // Show desktop mode notification at most once per session
        try {
          if (!sessionStorage.getItem('soc-desktop-mode-shown')) {
            showInfo('Desktop mode active - Enhanced features available');
            sessionStorage.setItem('soc-desktop-mode-shown', '1');
          }
        } catch {
          showInfo('Desktop mode active - Enhanced features available');
        }
        
        // Setup event listeners
        electronBridge.on('global-refresh', () => {
          triggerGlobalRefresh();
          showSuccess('All data refreshed');
        });
        
        electronBridge.on('emergency-stop', async () => {
          await emergencyStopAllRecording();
        });
        
        electronBridge.on('show-alerts', () => {
          setActiveTab('analytics');
          showInfo('Viewing security alerts and analytics');
        });
        
        electronBridge.on('import-evidence', async () => {
          const filePath = await electronBridge.selectEvidenceFile();
          if (filePath) {
            refreshEvidence();
            showSuccess(`Evidence folder selected; list refreshed.`);
          }
        });

        electronBridge.on('export-recordings', async () => {
          const directory = await electronBridge.selectExportDirectory();
          if (directory) {
            refreshRecordings();
            showSuccess(`Export directory selected: ${directory}. Use Recordings tab to export files.`);
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
  }, [triggerGlobalRefresh, refreshCameras, refreshEvidence, refreshRecordings, emergencyStopAllRecording]);

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
      case 'audit-trail':
        return <AuditTrailTab />;
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
      actions={<OfflineQueueIndicator />}
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
        ErrorHandlerService.handle(error, 'Security Operations Center Error - SecurityOperationsCenterOrchestrator');
      }}
    >
      <SecurityOperationsProvider>
        <CameraModalManagerProvider>
          <CameraWallLayoutProvider>
            <OfflineBanner />
            <SecurityOperationsGlobalRefresh />
            <SecurityOperationsWebSocketIntegration />
            <OrchestratorContent />
            <CameraModalRenderer />
          </CameraWallLayoutProvider>
        </CameraModalManagerProvider>
      </SecurityOperationsProvider>
    </ErrorBoundaryProvider>
  );
};

export default SecurityOperationsCenterOrchestrator;


