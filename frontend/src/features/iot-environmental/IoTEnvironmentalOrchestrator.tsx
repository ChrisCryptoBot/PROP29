import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { cn } from '../../utils/cn';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import { IoTEnvironmentalProvider, useIoTEnvironmentalContext } from './context/IoTEnvironmentalContext';
import ModuleShell from '../../components/Layout/ModuleShell';
import OverviewTab from './components/tabs/OverviewTab';
import SensorsTab from './components/tabs/SensorsTab';
import AlertsTab from './components/tabs/AlertsTab';
import AnalyticsTab from './components/tabs/AnalyticsTab';
import SettingsTab from './components/tabs/SettingsTab';
import ViewSensorModal from './components/modals/ViewSensorModal';
import AddSensorModal from './components/modals/AddSensorModal';
import EditSensorModal from './components/modals/EditSensorModal';

const OrchestratorContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
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
      <div className="flex items-center justify-center min-h-screen ">
        <div className="text-center">
          <i className="fas fa-sync-alt text-blue-600 text-4xl animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading environmental data...</p>
        </div>
      </div>
    );
  }

  return (
    <ModuleShell
      icon={<i className="fas fa-thermometer-half" />}
      title="IoT Environmental Monitoring"
      subtitle="Real-time sensor data and environmental analytics"
      tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'sensors', label: 'Sensors' },
        { id: 'alerts', label: 'Alerts' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'settings', label: 'Settings' },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={
        <>
          <Button onClick={handleExportData} variant="outline">
            <i className="fas fa-download mr-2" />
            Export
          </Button>
          <Button onClick={loadData} variant="outline">
            <i className="fas fa-sync-alt mr-2" />
            Refresh
          </Button>
        </>
      }
    >
      <div className="p-6">
        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Sensors', value: analytics.total_sensors, icon: 'fa-server', color: 'blue', sub: 'Sensor Count' },
            { label: 'Active Sensors', value: analytics.active_sensors, icon: 'fa-wifi', color: 'green', sub: 'Active Now' },
            { label: 'Total Alerts', value: analytics.alerts_count, icon: 'fa-bell', color: 'blue', sub: 'Alert History' },
            { label: 'Critical Alerts', value: analytics.critical_alerts, icon: 'fa-exclamation-triangle', color: 'red', sub: 'Priority' },
          ].map((metric, i) => (
            <div
              key={i}
              className="group bg-black/20 border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:bg-black/30"
            >
              <div className={cn(
                "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-5 transition-opacity group-hover:opacity-10",
                metric.color === 'red' ? 'bg-red-600' : metric.color === 'green' ? 'bg-green-600' : 'bg-blue-600'
              )} />

              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                  metric.color === 'red' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                    metric.color === 'green' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                      'bg-blue-500/10 border-blue-500/20 text-blue-500'
                )}>
                  <i className={cn("fas", metric.icon, "text-xl")} />
                </div>
                <span className={cn(
                  "px-2.5 py-1 text-[9px] font-black rounded uppercase tracking-widest border transition-colors",
                  metric.color === 'red' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    metric.color === 'green' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      'bg-blue-500/10 text-blue-500 border-blue-500/20'
                )}>
                  {metric.color === 'red' ? 'CRITICAL' : metric.color === 'green' ? 'ONLINE' : 'SYSTEM'}
                </span>
              </div>

              <div className="relative z-10">
                <h3 className="text-3xl font-black text-white tracking-tighter mb-1 group-hover:text-blue-400 transition-colors">
                  {metric.value}
                </h3>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{metric.label}</p>
                <div className="mt-4 flex items-center text-[8px] font-bold text-white/20 uppercase tracking-widest border-t border-white/5 pt-3">
                  <i className="fas fa-microchip mr-2 opacity-50" />
                  {metric.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeTab === 'overview' && (
          <ErrorBoundary moduleName="IoTEnvironmentalOverviewTab">
            <OverviewTab />
          </ErrorBoundary>
        )}
        {activeTab === 'sensors' && (
          <ErrorBoundary moduleName="IoTEnvironmentalSensorsTab">
            <SensorsTab />
          </ErrorBoundary>
        )}
        {activeTab === 'alerts' && (
          <ErrorBoundary moduleName="IoTEnvironmentalAlertsTab">
            <AlertsTab />
          </ErrorBoundary>
        )}
        {activeTab === 'analytics' && (
          <ErrorBoundary moduleName="IoTEnvironmentalAnalyticsTab">
            <AnalyticsTab />
          </ErrorBoundary>
        )}
        {activeTab === 'settings' && (
          <ErrorBoundary moduleName="IoTEnvironmentalSettingsTab">
            <SettingsTab />
          </ErrorBoundary>
        )}
      </div>

      {viewingSensor && (
        <ErrorBoundary moduleName="IoTEnvironmentalViewSensorModal">
          <ViewSensorModal />
        </ErrorBoundary>
      )}
      {showAddModal && (
        <ErrorBoundary moduleName="IoTEnvironmentalAddSensorModal">
          <AddSensorModal />
        </ErrorBoundary>
      )}
      {showEditModal && (
        <ErrorBoundary moduleName="IoTEnvironmentalEditSensorModal">
          <EditSensorModal />
        </ErrorBoundary>
      )}
    </ModuleShell>
  );
};

const IoTEnvironmentalOrchestrator: React.FC = () => (
  <IoTEnvironmentalProvider>
    <OrchestratorContent />
  </IoTEnvironmentalProvider>
);

export default IoTEnvironmentalOrchestrator;




