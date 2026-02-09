/**
 * Sound Monitoring Orchestrator
 * Main component that orchestrates the Sound Monitoring module
 * Handles tab navigation and modal state management
 */

import React, { useState } from 'react';
import { SoundMonitoringProvider, useSoundMonitoringContext } from './context/SoundMonitoringContext';
import {
  OverviewTab,
  LiveMonitoringTab,
  SoundAlertsTab,
  AnalyticsTab,
  SettingsTab
} from './components/tabs';
import { AlertDetailsModal } from './components/modals';
import type { TabId } from './types/sound-monitoring.types';
import ModuleShell from '../../components/Layout/ModuleShell';

const OrchestratorContent: React.FC = () => {
  const { selectedAlert, viewAlert, clearSelectedAlert, audioVisualization } = useSoundMonitoringContext();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'monitoring', label: 'Live Monitoring' },
    { id: 'alerts', label: 'Sound Alerts' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' }
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab onViewAlert={viewAlert} />;
      case 'monitoring':
        return <LiveMonitoringTab />;
      case 'alerts':
        return <SoundAlertsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  return (
    <ModuleShell
      icon={<i className="fas fa-volume-up" />}
      title="Sound Monitoring"
      subtitle="Advanced audio surveillance and noise level monitoring"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={
        audioVisualization.isRecording ? (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg animate-pulse border border-red-500/20">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full " />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Live Audio Monitoring</span>
          </div>
        ) : null
      }
    >
      {/* Main Content */}
      <main className="relative max-w-[1800px] mx-auto px-6 py-6" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {renderTab()}
      </main>

      {/* Modals */}
      <AlertDetailsModal
        isOpen={!!selectedAlert}
        onClose={clearSelectedAlert}
        alert={selectedAlert}
      />
    </ModuleShell>
  );
};

export const SoundMonitoringOrchestrator: React.FC = () => {
  return (
    <SoundMonitoringProvider>
      <OrchestratorContent />
    </SoundMonitoringProvider>
  );
};


