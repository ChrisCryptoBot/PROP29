/**
 * Unified IoT Monitoring Orchestrator
 * Combines Environmental and Sound Monitoring into a single module
 */

import React, { useState } from 'react';
import ModuleShell from '../../components/Layout/ModuleShell';
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
    analytics,
    handleExportData,
    loadData,
    showAddModal,
    showEditModal,
    viewingSensor,
  } = useIoTEnvironmentalContext();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4" role="status" aria-label="Loading environmental data">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading environmental data...</p>
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
    <div className="space-y-8">
      {/* Environmental Section */}
      <div>
        <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tighter">Environmental Sensors</h3>
        <ErrorBoundary moduleName="IoTMonitoringEnvironmentalOverview">
          <EnvironmentalOverviewTab />
        </ErrorBoundary>
      </div>

      {/* Sound Section */}
      <div>
        <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tighter">Sound Monitoring</h3>
        <ErrorBoundary moduleName="IoTMonitoringSoundOverview">
          <SoundOverviewTab onViewAlert={soundContext.viewAlert} />
        </ErrorBoundary>
      </div>
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
          <Button onClick={envContext.handleExportData} variant="outline">
            <i className="fas fa-download mr-2" />
            Export
          </Button>
          <Button onClick={envContext.loadData} variant="outline">
            <i className="fas fa-sync-alt mr-2" />
            Refresh
          </Button>
          {soundContext.audioVisualization.isRecording && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg animate-pulse border border-red-500/20">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="text-[10px] font-black uppercase tracking-widest">Live Audio</span>
            </div>
          )}
        </>
      }
    >
      {/* Content-first: no extra wrapper; ModuleShell main already has px-6 py-8. Use space-y for rhythm. */}
      <div className="space-y-8">
        {/* Combined Metrics (overview only) */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="group" aria-label="IoT metrics">
            {[
              { label: 'Total Sensors', value: combinedMetrics.totalSensors, icon: 'fa-server', color: 'blue' as const },
              { label: 'Active Sensors', value: combinedMetrics.activeSensors, icon: 'fa-wifi', color: 'green' as const },
              { label: 'Total Alerts', value: combinedMetrics.totalAlerts, icon: 'fa-bell', color: 'blue' as const },
              { label: 'Critical Alerts', value: combinedMetrics.criticalAlerts, icon: 'fa-exclamation-triangle', color: 'red' as const },
            ].map((metric, i) => (
              <div
                key={i}
                className="group bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl rounded-xl p-6 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={metric.color === 'red'
                    ? 'w-12 h-12 bg-gradient-to-br from-red-600/80 to-slate-900 border border-white/5 rounded-xl shadow-2xl flex items-center justify-center'
                    : metric.color === 'green'
                    ? 'w-12 h-12 bg-gradient-to-br from-emerald-600/80 to-slate-900 border border-white/5 rounded-xl shadow-2xl flex items-center justify-center'
                    : 'w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 border border-white/5 rounded-xl shadow-2xl flex items-center justify-center'
                  }>
                    <i className={`fas ${metric.icon} text-xl ${metric.color === 'red' ? 'text-red-400' : metric.color === 'green' ? 'text-emerald-400' : 'text-blue-400'}`} />
                  </div>
                  <span className={metric.color === 'red'
                    ? 'px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20'
                    : metric.color === 'green'
                    ? 'px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }>
                    {metric.color === 'red' ? 'CRITICAL' : metric.color === 'green' ? 'ONLINE' : 'SYSTEM'}
                  </span>
                </div>
                <h3 className="text-3xl font-black text-white tracking-tighter mb-1">{metric.value}</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">{metric.label}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'overview' && <UnifiedOverviewContent />}
        <EnvironmentalContent activeTab={activeTab} />
        <SoundContent activeTab={activeTab} />
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
