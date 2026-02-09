/**
 * Unified IoT Monitoring Orchestrator
 * Combines Environmental and Sound Monitoring into a single module
 */

import React, { useState, useEffect } from 'react';
import ModuleShell from '../../components/Layout/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import { Button } from '../../components/UI/Button';

// Import both module providers and components
import { IoTEnvironmentalProvider, useIoTEnvironmentalContext } from '../iot-environmental/context/IoTEnvironmentalContext';
import { SoundMonitoringProvider, useSoundMonitoringContext } from '../sound-monitoring/context/SoundMonitoringContext';

// Environmental components
import EnvironmentalOverviewTab from '../iot-environmental/components/tabs/OverviewTab';
import EnvironmentalSensorsTab from '../iot-environmental/components/tabs/SensorsTab';
import EnvironmentalAlertsTab from '../iot-environmental/components/tabs/AlertsTab';
import EnvironmentalAnalyticsTab from '../iot-environmental/components/tabs/AnalyticsTab';
import EnvironmentalSettingsTab from '../iot-environmental/components/tabs/SettingsTab';
import ViewSensorModal from '../iot-environmental/components/modals/ViewSensorModal';
import AddSensorModal from '../iot-environmental/components/modals/AddSensorModal';
import EditSensorModal from '../iot-environmental/components/modals/EditSensorModal';

// Sound components
import {
  OverviewTab as SoundOverviewTab,
  LiveMonitoringTab,
  SoundAlertsTab,
  AnalyticsTab as SoundAnalyticsTab,
  SettingsTab as SoundSettingsTab
} from '../sound-monitoring/components/tabs';
import { AlertDetailsModal } from '../sound-monitoring/components/modals';

type TabId = 'overview' | 'environmental' | 'sound' | 'alerts' | 'analytics' | 'settings';

const EnvironmentalContent: React.FC<{ activeTab: TabId }> = ({ activeTab }) => {
  const {
    loading,
    loadError,
    loadData,
    handleExportData,
    showAddModal,
    showEditModal,
    viewingSensor,
  } = useIoTEnvironmentalContext();

  if (loading && !loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4" role="status" aria-label="Loading environmental data">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading environmental data...</p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="rounded-md border border-red-500/20 bg-red-500/10 p-6 text-center space-y-4" role="alert">
        <p className="text-sm font-bold text-red-400">{loadError}</p>
        <Button variant="outline" size="sm" onClick={loadData} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      {activeTab === 'environmental' && (
        <ErrorBoundary moduleName="IoTMonitoringEnvironmentalSensorsTab">
          <EnvironmentalSensorsTab />
        </ErrorBoundary>
      )}
      {activeTab === 'alerts' && (
        <ErrorBoundary moduleName="IoTMonitoringEnvironmentalAlertsTab">
          <EnvironmentalAlertsTab />
        </ErrorBoundary>
      )}
      {activeTab === 'analytics' && (
        <ErrorBoundary moduleName="IoTMonitoringEnvironmentalAnalyticsTab">
          <EnvironmentalAnalyticsTab />
        </ErrorBoundary>
      )}
      {activeTab === 'settings' && (
        <ErrorBoundary moduleName="IoTMonitoringEnvironmentalSettingsTab">
          <EnvironmentalSettingsTab />
        </ErrorBoundary>
      )}

      {viewingSensor && (
        <ErrorBoundary moduleName="IoTMonitoringViewSensorModal">
          <ViewSensorModal />
        </ErrorBoundary>
      )}
      {showAddModal && (
        <ErrorBoundary moduleName="IoTMonitoringAddSensorModal">
          <AddSensorModal />
        </ErrorBoundary>
      )}
      {showEditModal && (
        <ErrorBoundary moduleName="IoTMonitoringEditSensorModal">
          <EditSensorModal />
        </ErrorBoundary>
      )}
    </>
  );
};

const SoundContent: React.FC<{ activeTab: TabId }> = ({ activeTab }) => {
  const { selectedAlert, viewAlert, clearSelectedAlert, audioVisualization } = useSoundMonitoringContext();

  return (
    <>
      {activeTab === 'sound' && (
        <ErrorBoundary moduleName="IoTMonitoringSoundMonitoringTab">
          <LiveMonitoringTab />
        </ErrorBoundary>
      )}
      {activeTab === 'alerts' && (
        <ErrorBoundary moduleName="IoTMonitoringSoundAlertsTab">
          <SoundAlertsTab />
        </ErrorBoundary>
      )}
      {activeTab === 'analytics' && (
        <ErrorBoundary moduleName="IoTMonitoringSoundAnalyticsTab">
          <SoundAnalyticsTab />
        </ErrorBoundary>
      )}
      {activeTab === 'settings' && (
        <ErrorBoundary moduleName="IoTMonitoringSoundSettingsTab">
          <SoundSettingsTab />
        </ErrorBoundary>
      )}

      <AlertDetailsModal
        isOpen={!!selectedAlert}
        onClose={clearSelectedAlert}
        alert={selectedAlert}
      />
    </>
  );
};

const UnifiedOverviewContent: React.FC = () => {
  const envContext = useIoTEnvironmentalContext();
  const soundContext = useSoundMonitoringContext();

  return (
    <div className="space-y-6">
      {/* Environmental Section — Card with icon + title (gold standard §3) */}
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
              <i className="fas fa-thermometer-half text-white" aria-hidden />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-white">Environmental sensors</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <ErrorBoundary moduleName="IoTMonitoringEnvironmentalOverview">
            <EnvironmentalOverviewTab />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Sound Section — Card with icon + title (gold standard §3) */}
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
              <i className="fas fa-volume-up text-white" aria-hidden />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-white">Sound monitoring</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <ErrorBoundary moduleName="IoTMonitoringSoundOverview">
            <SoundOverviewTab onViewAlert={soundContext.viewAlert} />
          </ErrorBoundary>
        </CardContent>
      </Card>
    </div>
  );
};

/** Offline banner: shows when navigator.onLine is false so users know data may be stale. */
const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  if (isOnline) return null;
  return (
    <div
      className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 flex items-center gap-2 text-sm font-bold text-amber-400"
      role="status"
      aria-live="polite"
    >
      <i className="fas fa-wifi fa-rotate-90 text-amber-400" aria-hidden />
      <span>You&apos;re offline. Data may be stale. Reconnect to refresh.</span>
    </div>
  );
};

const OrchestratorContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const envContext = useIoTEnvironmentalContext();
  const soundContext = useSoundMonitoringContext();

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview' },
    { id: 'environmental' as TabId, label: 'Environmental' },
    { id: 'sound' as TabId, label: 'Sound' },
    { id: 'alerts' as TabId, label: 'Alerts' },
    { id: 'analytics' as TabId, label: 'Analytics' },
    { id: 'settings' as TabId, label: 'Settings' },
  ];

  const combinedMetrics = {
    totalSensors: (envContext.analytics?.total_sensors || 0) + (soundContext.metrics?.sensorsActive || 0),
    activeSensors: (envContext.analytics?.active_sensors || 0) + (soundContext.metrics?.sensorsActive || 0),
    totalAlerts: (envContext.analytics?.alerts_count || 0) + (soundContext.metrics?.totalAlerts || 0),
    criticalAlerts: (envContext.analytics?.critical_alerts || 0) + (soundContext.metrics?.activeAlerts || 0),
  };

  return (
    <ModuleShell
      icon={<i className="fas fa-microchip" />}
      title="IoT Monitoring"
      subtitle="Unified environmental and sound sensor monitoring"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={
        <>
          <Button onClick={envContext.handleExportData} variant="outline" className="border-white/5 text-slate-400 hover:text-white">
            <i className="fas fa-download mr-2 text-slate-400" aria-hidden />
            Export
          </Button>
          <Button onClick={envContext.loadData} variant="outline" className="border-white/5 text-slate-400 hover:text-white" disabled={envContext.loading}>
            <i className="fas fa-sync-alt mr-2 text-slate-400" aria-hidden />
            Refresh
          </Button>
          {envContext.lastSyncTimestamp && (
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest" aria-live="polite">
              Last sync: {envContext.lastSyncTimestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
          {soundContext.audioVisualization.isRecording && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-md border border-red-500/20">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full " />
              <span className="text-[10px] font-black uppercase tracking-widest">Live Audio</span>
            </div>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <OfflineBanner />
        {envContext.mutationError && (
          <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4 flex items-center justify-between" role="alert">
            <div className="flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-red-400" aria-hidden />
              <p className="text-sm font-bold text-red-400">{envContext.mutationError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={envContext.clearMutationError}
              className="text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-widest"
            >
              Dismiss
            </Button>
          </div>
        )}
        {/* Overview tab: page header + metrics bar (gold standard §6) */}
        {activeTab === 'overview' && (
          <>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="page-title">Overview</h2>
                <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                  Unified environmental and sound sensor status
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 border-b border-white/5 text-sm mb-6 font-bold uppercase tracking-widest text-[color:var(--text-sub)]" role="group" aria-label="IoT metrics">
              <span>Total sensors <strong className="font-black text-white ml-1">{combinedMetrics.totalSensors}</strong></span>
              <span className="text-white/30" aria-hidden>·</span>
              <span>Active <strong className="font-black text-white ml-1">{combinedMetrics.activeSensors}</strong></span>
              <span className="text-white/30" aria-hidden>·</span>
              <span>Total alerts <strong className="font-black text-white ml-1">{combinedMetrics.totalAlerts}</strong></span>
              <span className="text-white/30" aria-hidden>·</span>
              <span>Critical <strong className="font-black text-white ml-1">{combinedMetrics.criticalAlerts}</strong></span>
            </div>
            <UnifiedOverviewContent />
          </>
        )}
        {activeTab === 'alerts' && (
          <>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="page-title">Alerts</h2>
                <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                  Environmental and sound alerts
                </p>
              </div>
            </div>
            <section aria-labelledby="iot-env-alerts-heading" className="mb-10">
              <h3 id="iot-env-alerts-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5 mr-3" aria-hidden>
                  <i className="fas fa-thermometer-half text-white" />
                </div>
                Environmental
              </h3>
              <ErrorBoundary moduleName="IoTMonitoringEnvironmentalAlertsTab">
                <EnvironmentalAlertsTab embedded />
              </ErrorBoundary>
            </section>
            <section aria-labelledby="iot-sound-alerts-heading">
              <h3 id="iot-sound-alerts-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center">
                <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center border border-white/5 mr-3" aria-hidden>
                  <i className="fas fa-volume-up text-white" />
                </div>
                Sound
              </h3>
              <ErrorBoundary moduleName="IoTMonitoringSoundAlertsTab">
                <SoundAlertsTab />
              </ErrorBoundary>
            </section>
          </>
        )}
        {activeTab !== 'alerts' && <EnvironmentalContent activeTab={activeTab} />}
        {activeTab !== 'alerts' && <SoundContent activeTab={activeTab} />}
      </div>
    </ModuleShell>
  );
};

const IoTMonitoringOrchestrator: React.FC = () => {
  return (
    <IoTEnvironmentalProvider>
      <SoundMonitoringProvider>
        <OrchestratorContent />
      </SoundMonitoringProvider>
    </IoTEnvironmentalProvider>
  );
};

export default IoTMonitoringOrchestrator;
