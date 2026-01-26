/**
 * Unified Property Items Orchestrator
 * Combines Lost & Found and Packages into a single module
 */

import React, { useState, useEffect } from 'react';
import ModuleShell from '../../components/Layout/ModuleShell';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import { Button } from '../../components/UI/Button';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';
import { propertyItemsExportService, ExportFormat, ExportPeriod } from './services/PropertyItemsExportService';
import { Modal } from '../../components/UI/Modal';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../utils/toast';
import { useAuth } from '../../contexts/AuthContext';
import { usePropertyItemsOffline } from './hooks/usePropertyItemsOffline';
import { usePropertyItemsWebSocket } from './hooks/usePropertyItemsWebSocket';
import { usePropertyItemsTelemetry } from './hooks/usePropertyItemsTelemetry';

// Import both module providers and components
import { LostFoundProvider, useLostFoundContext } from '../lost-and-found/context/LostFoundContext';
import { PackageProvider, usePackageContext } from '../packages/context/PackageContext';

// Lost & Found components
import {
  OverviewTab as LostFoundOverviewTab,
  StorageTab,
  AnalyticsTab as LostFoundAnalyticsTab,
  SettingsTab as LostFoundSettingsTab
} from '../lost-and-found/components/tabs';
import {
  ItemDetailsModal,
  RegisterItemModal,
  ReportModal
} from '../lost-and-found/components/modals';

// Package components
import {
  OverviewTab as PackageOverviewTab,
  OperationsTab,
  AnalyticsTab as PackageAnalyticsTab,
  SettingsTab as PackageSettingsTab
} from '../packages/components/tabs';
import {
  RegisterPackageModal,
  ScanPackageModal,
  PackageDetailsModal
} from '../packages/components/modals';

type TabId = 'overview' | 'lost-found' | 'packages' | 'analytics' | 'settings';

const LostFoundContent: React.FC<{ activeTab: TabId }> = ({ activeTab }) => {
  const { selectedItem, setSelectedItem } = useLostFoundContext();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  React.useEffect(() => {
    if (selectedItem && !showDetailsModal) {
      setShowDetailsModal(true);
    }
  }, [selectedItem, showDetailsModal]);

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedItem(null);
  };

  return (
    <>
      {activeTab === 'lost-found' && (
        <ErrorBoundary moduleName="PropertyItemsLostFoundTab">
          <StorageTab />
        </ErrorBoundary>
      )}
      {activeTab === 'analytics' && (
        <ErrorBoundary moduleName="PropertyItemsLostFoundAnalyticsTab">
          <LostFoundAnalyticsTab />
        </ErrorBoundary>
      )}
      {activeTab === 'settings' && (
        <ErrorBoundary moduleName="PropertyItemsLostFoundSettingsTab">
          <LostFoundSettingsTab />
        </ErrorBoundary>
      )}

      {showDetailsModal && selectedItem && (
        <ErrorBoundary moduleName="PropertyItemsItemDetailsModal">
          <ItemDetailsModal
            isOpen={showDetailsModal}
            onClose={handleCloseDetails}
          />
        </ErrorBoundary>
      )}
      {showRegisterModal && (
        <ErrorBoundary moduleName="PropertyItemsRegisterItemModal">
          <RegisterItemModal
            isOpen={showRegisterModal}
            onClose={() => setShowRegisterModal(false)}
          />
        </ErrorBoundary>
      )}
      {showReportModal && (
        <ErrorBoundary moduleName="PropertyItemsReportModal">
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
          />
        </ErrorBoundary>
      )}
    </>
  );
};

const PackageContent: React.FC<{ activeTab: TabId }> = ({ activeTab }) => {
  const { selectedPackage, setSelectedPackage } = usePackageContext();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  React.useEffect(() => {
    if (selectedPackage && !showDetailsModal) {
      setShowDetailsModal(true);
    }
  }, [selectedPackage, showDetailsModal]);

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedPackage(null);
  };

  return (
    <>
      {activeTab === 'packages' && (
        <ErrorBoundary moduleName="PropertyItemsPackagesTab">
          <OperationsTab />
        </ErrorBoundary>
      )}
      {activeTab === 'analytics' && (
        <ErrorBoundary moduleName="PropertyItemsPackageAnalyticsTab">
          <PackageAnalyticsTab />
        </ErrorBoundary>
      )}
      {activeTab === 'settings' && (
        <ErrorBoundary moduleName="PropertyItemsPackageSettingsTab">
          <PackageSettingsTab />
        </ErrorBoundary>
      )}

      {showDetailsModal && selectedPackage && (
        <ErrorBoundary moduleName="PropertyItemsPackageDetailsModal">
          <PackageDetailsModal
            isOpen={showDetailsModal}
            onClose={handleCloseDetails}
          />
        </ErrorBoundary>
      )}
      {showRegisterModal && (
        <ErrorBoundary moduleName="PropertyItemsRegisterPackageModal">
          <RegisterPackageModal
            isOpen={showRegisterModal}
            onClose={() => setShowRegisterModal(false)}
          />
        </ErrorBoundary>
      )}
      {showScanModal && (
        <ErrorBoundary moduleName="PropertyItemsScanPackageModal">
          <ScanPackageModal
            isOpen={showScanModal}
            onClose={() => setShowScanModal(false)}
          />
        </ErrorBoundary>
      )}
    </>
  );
};

const UnifiedOverviewContent: React.FC = () => {
  const lostFoundContext = useLostFoundContext();
  const packageContext = usePackageContext();
  const [showLostFoundDetailsModal, setShowLostFoundDetailsModal] = useState(false);
  const [showPackageDetailsModal, setShowPackageDetailsModal] = useState(false);
  const [showLostFoundRegisterModal, setShowLostFoundRegisterModal] = useState(false);

  // Handle Lost & Found item selection
  React.useEffect(() => {
    if (lostFoundContext.selectedItem && !showLostFoundDetailsModal) {
      setShowLostFoundDetailsModal(true);
    }
  }, [lostFoundContext.selectedItem, showLostFoundDetailsModal]);

  // Handle Package selection
  React.useEffect(() => {
    if (packageContext.selectedPackage && !showPackageDetailsModal) {
      setShowPackageDetailsModal(true);
    }
  }, [packageContext.selectedPackage, showPackageDetailsModal]);

  const handleCloseLostFoundDetails = () => {
    setShowLostFoundDetailsModal(false);
    lostFoundContext.setSelectedItem(null);
  };

  const handleClosePackageDetails = () => {
    setShowPackageDetailsModal(false);
    packageContext.setSelectedPackage(null);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Gold Standard Page Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Overview</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
              Unified view of Lost & Found items and Packages
            </p>
          </div>
        </div>

        {/* Lost & Found Section */}
        <div>
          <ErrorBoundary moduleName="PropertyItemsLostFoundOverview">
            <LostFoundProvider
              modalControls={{
                setShowRegisterModal: setShowLostFoundRegisterModal,
                setShowEditModal: () => {},
                setShowDetailsModal: setShowLostFoundDetailsModal,
                setShowReportModal: () => {}
              }}
            >
              <LostFoundOverviewTab />
            </LostFoundProvider>
          </ErrorBoundary>
        </div>

        {/* Packages Section */}
        <div>
          <ErrorBoundary moduleName="PropertyItemsPackageOverview">
            <PackageOverviewTab />
          </ErrorBoundary>
        </div>
      </div>

      {/* Modals for Overview Tab */}
      {showLostFoundDetailsModal && lostFoundContext.selectedItem && (
        <ErrorBoundary moduleName="PropertyItemsOverviewItemDetailsModal">
          <ItemDetailsModal
            isOpen={showLostFoundDetailsModal}
            onClose={handleCloseLostFoundDetails}
          />
        </ErrorBoundary>
      )}
      {showLostFoundRegisterModal && (
        <ErrorBoundary moduleName="PropertyItemsOverviewRegisterItemModal">
          <RegisterItemModal
            isOpen={showLostFoundRegisterModal}
            onClose={() => setShowLostFoundRegisterModal(false)}
          />
        </ErrorBoundary>
      )}
      {showPackageDetailsModal && packageContext.selectedPackage && (
        <ErrorBoundary moduleName="PropertyItemsOverviewPackageDetailsModal">
          <PackageDetailsModal
            isOpen={showPackageDetailsModal}
            onClose={handleClosePackageDetails}
          />
        </ErrorBoundary>
      )}
    </>
  );
};

const PropertyItemsGlobalRefresh: React.FC = () => {
  const { register, unregister } = useGlobalRefresh();
  const lostFoundContext = useLostFoundContext();
  const packageContext = usePackageContext();

  useEffect(() => {
    const handler = async () => {
      await Promise.allSettled([
        lostFoundContext.refreshItems(),
        lostFoundContext.refreshMetrics(),
        packageContext.refreshPackages(),
      ]);
    };
    register('property-items', handler);
    return () => unregister('property-items');
  }, [register, unregister, lostFoundContext.refreshItems, lostFoundContext.refreshMetrics, packageContext.refreshPackages]);

  return null;
};

const OrchestratorContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const lostFoundContext = useLostFoundContext();
  const packageContext = usePackageContext();
  const { lastRefreshedAt } = useGlobalRefresh();
  const { user } = useAuth();
  const propertyId = user?.roles?.[0] || undefined;
  const { isOffline, queueSize, hasUnsyncedChanges, saveLastKnownGoodState, syncOfflineQueue } = usePropertyItemsOffline(propertyId);
  const { trackAction, trackPerformance } = usePropertyItemsTelemetry();

  // WebSocket integration for real-time updates
  usePropertyItemsWebSocket({
    onLostFoundItemCreated: (item) => {
      lostFoundContext.refreshItems();
      trackAction('item_created', 'lost-found', { itemId: item.item_id });
    },
    onLostFoundItemUpdated: (item) => {
      lostFoundContext.refreshItems();
      trackAction('item_updated', 'lost-found', { itemId: item.item_id });
    },
    onLostFoundItemDeleted: (itemId) => {
      lostFoundContext.refreshItems();
      trackAction('item_deleted', 'lost-found', { itemId });
    },
    onPackageCreated: (pkg) => {
      packageContext.refreshPackages();
      trackAction('package_created', 'package', { packageId: pkg.package_id });
    },
    onPackageUpdated: (pkg) => {
      packageContext.refreshPackages();
      trackAction('package_updated', 'package', { packageId: pkg.package_id });
    },
    onPackageDeleted: (packageId) => {
      packageContext.refreshPackages();
      trackAction('package_deleted', 'package', { packageId });
    }
  });

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview' },
    { id: 'lost-found' as TabId, label: 'Lost & Found' },
    { id: 'packages' as TabId, label: 'Packages' },
    { id: 'analytics' as TabId, label: 'Analytics' },
    { id: 'settings' as TabId, label: 'Settings' },
  ];

  // Combined metrics with null safety
  const combinedMetrics = {
    totalItems: (Array.isArray(lostFoundContext.items) ? lostFoundContext.items.length : 0) + 
                (Array.isArray(packageContext.packages) ? packageContext.packages.length : 0),
    pendingItems: (Array.isArray(lostFoundContext.items) ? lostFoundContext.items.filter(i => i.status === 'found').length : 0) + 
                  (Array.isArray(packageContext.packages) ? packageContext.packages.filter(p => p.status === 'pending').length : 0),
    resolvedItems: (Array.isArray(lostFoundContext.items) ? lostFoundContext.items.filter(i => i.status === 'claimed').length : 0) + 
                   (Array.isArray(packageContext.packages) ? packageContext.packages.filter(p => p.status === 'delivered').length : 0),
  };

  const handleRefresh = async () => {
    const startTime = Date.now();
    trackAction('refresh_initiated', 'property-items');
    
    try {
      const results = await Promise.allSettled([
        lostFoundContext.refreshItems(),
        lostFoundContext.refreshMetrics(),
        packageContext.refreshPackages(),
      ]);
      
      const duration = Date.now() - startTime;
      trackPerformance('refresh', duration, {
        successCount: results.filter(r => r.status === 'fulfilled').length,
        failureCount: results.filter(r => r.status === 'rejected').length
      });
      
      // Check for partial failures
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0 && failures.length < results.length) {
        console.warn('Partial refresh failure:', failures);
        trackAction('refresh_partial_failure', 'property-items', { failureCount: failures.length });
        // Still update timestamp if at least one succeeded
      }
      
      // Save Last Known Good State after successful refresh
      if (failures.length < results.length) {
        const items = Array.isArray(lostFoundContext.items) ? lostFoundContext.items : [];
        const packages = Array.isArray(packageContext.packages) ? packageContext.packages : [];
        saveLastKnownGoodState(items, packages, propertyId);
        trackAction('refresh_success', 'property-items');
      } else {
        trackAction('refresh_failure', 'property-items');
      }
      
      setLastRefreshAt(new Date());
    } catch (error) {
      const duration = Date.now() - startTime;
      trackPerformance('refresh', duration, { success: false });
      console.error('Failed to refresh property items:', error);
      // Don't update timestamp on complete failure
    }
  };

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('monthly');

  const handleExport = async () => {
    const startTime = Date.now();
    trackAction('export_initiated', 'property-items', { format: exportFormat, period: exportPeriod });
    const toastId = showLoading('Preparing export...');
    
    try {
      // Export both Lost & Found and Packages
      const result = await propertyItemsExportService.exportUnifiedReport({
        format: exportFormat,
        period: exportPeriod,
        propertyId,
        includeLostFound: true,
        includePackages: true
      });

      const duration = Date.now() - startTime;
      trackPerformance('export', duration, { format: exportFormat, success: result.success });

      if (result.success) {
        trackAction('export_success', 'property-items', { format: exportFormat, filename: result.filename });
        dismissLoadingAndShowSuccess(toastId, `Export completed: ${result.filename}`);
        setShowExportModal(false);
      } else {
        trackAction('export_failure', 'property-items', { error: result.error });
        dismissLoadingAndShowError(toastId, result.error || 'Export failed');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      trackPerformance('export', duration, { success: false });
      trackAction('export_error', 'property-items', { error: error instanceof Error ? error.message : 'Unknown error' });
      dismissLoadingAndShowError(toastId, 'Failed to export property items');
      console.error('Export error:', error);
    }
  };

  const isStale = !lastRefreshAt || Date.now() - lastRefreshAt.getTime() > 30000;

  return (
    <>
      <PropertyItemsGlobalRefresh />
      <ModuleShell
        icon={<i className="fas fa-archive" />}
        title="Property Items"
        subtitle="Unified lost & found and package management"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <>
            <Button onClick={() => setShowExportModal(true)} variant="outline" disabled={lostFoundContext.loading.items || packageContext.loading.packages}>
              <i className="fas fa-download mr-2" />
              Export
            </Button>
            <Button onClick={handleRefresh} variant="outline" disabled={lostFoundContext.loading.items || packageContext.loading.packages}>
              <i className={`fas fa-sync-alt mr-2 ${(lostFoundContext.loading.items || packageContext.loading.packages) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {isStale && (
              <span className="px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                STALE
              </span>
            )}
            {isOffline && (
              <span className="px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
                OFFLINE
              </span>
            )}
            {hasUnsyncedChanges && !isOffline && (
              <Button
                onClick={syncOfflineQueue}
                variant="outline"
                className="text-[9px] font-black uppercase tracking-widest h-8 px-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
              >
                <i className="fas fa-sync mr-1" />
                Sync {queueSize}
              </Button>
            )}
          </>
        }
      >
        <div className="p-6">
          {activeTab === 'overview' && <UnifiedOverviewContent />}
          <LostFoundContent activeTab={activeTab} />
          <PackageContent activeTab={activeTab} />
        </div>
      </ModuleShell>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Property Items"
        size="sm"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
              >
                <option value="csv" className="bg-slate-900 text-white">CSV</option>
                <option value="pdf" className="bg-slate-900 text-white">PDF</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                Time Period
              </label>
              <select
                value={exportPeriod}
                onChange={(e) => setExportPeriod(e.target.value as ExportPeriod)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono"
              >
                <option value="daily" className="bg-slate-900 text-white">Today</option>
                <option value="weekly" className="bg-slate-900 text-white">Last 7 Days</option>
                <option value="monthly" className="bg-slate-900 text-white">Last 30 Days</option>
                <option value="custom" className="bg-slate-900 text-white">Custom Range</option>
              </select>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowExportModal(false)}
                className="text-[10px] font-black uppercase tracking-widest h-10 px-6 bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:text-white hover:border-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={lostFoundContext.loading.items || packageContext.loading.packages}
                className="text-[10px] font-black uppercase tracking-widest h-10 px-6 bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:text-white hover:border-white/20"
              >
                <i className="fas fa-download mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

const PropertyItemsOrchestrator: React.FC = () => {
  return (
    <LostFoundProvider>
      <PackageProvider>
        <OrchestratorContent />
      </PackageProvider>
    </LostFoundProvider>
  );
};

export default PropertyItemsOrchestrator;
