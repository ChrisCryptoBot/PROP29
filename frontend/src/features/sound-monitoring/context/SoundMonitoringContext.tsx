/**
 * Sound Monitoring Feature Context
 * Provides data and actions to all Sound Monitoring components
 * Eliminates prop drilling across tab components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useSoundMonitoringState } from '../hooks/useSoundMonitoringState';

export interface SoundMonitoringContextValue {
  // Data
  soundAlerts: ReturnType<typeof useSoundMonitoringState>['soundAlerts'];
  soundZones: ReturnType<typeof useSoundMonitoringState>['soundZones'];
  metrics: ReturnType<typeof useSoundMonitoringState>['metrics'];
  audioVisualization: ReturnType<typeof useSoundMonitoringState>['audioVisualization'];
  selectedAlert: ReturnType<typeof useSoundMonitoringState>['selectedAlert'];
  
  // Loading states
  loading: ReturnType<typeof useSoundMonitoringState>['loading'];
  
  // RBAC flags
  canAcknowledgeAlert: ReturnType<typeof useSoundMonitoringState>['canAcknowledgeAlert'];
  canResolveAlert: ReturnType<typeof useSoundMonitoringState>['canResolveAlert'];
  canUpdateSettings: ReturnType<typeof useSoundMonitoringState>['canUpdateSettings'];
  
  // Actions
  acknowledgeAlert: ReturnType<typeof useSoundMonitoringState>['acknowledgeAlert'];
  resolveAlert: ReturnType<typeof useSoundMonitoringState>['resolveAlert'];
  viewAlert: ReturnType<typeof useSoundMonitoringState>['viewAlert'];
  clearSelectedAlert: ReturnType<typeof useSoundMonitoringState>['clearSelectedAlert'];
  refreshAlerts: ReturnType<typeof useSoundMonitoringState>['refreshAlerts'];
  refreshZones: ReturnType<typeof useSoundMonitoringState>['refreshZones'];
  refreshMetrics: ReturnType<typeof useSoundMonitoringState>['refreshMetrics'];
  refreshAudioVisualization: ReturnType<typeof useSoundMonitoringState>['refreshAudioVisualization'];
  settings: ReturnType<typeof useSoundMonitoringState>['settings'];
  settingsForm: ReturnType<typeof useSoundMonitoringState>['settingsForm'];
  setSettingsForm: ReturnType<typeof useSoundMonitoringState>['setSettingsForm'];
  getSettings: ReturnType<typeof useSoundMonitoringState>['getSettings'];
  updateSettings: ReturnType<typeof useSoundMonitoringState>['updateSettings'];
  resetSettings: ReturnType<typeof useSoundMonitoringState>['resetSettings'];
}

const SoundMonitoringContext = createContext<SoundMonitoringContextValue | undefined>(undefined);

interface SoundMonitoringProviderProps {
  children: ReactNode;
}

/**
 * Sound Monitoring Provider
 * Wraps components with context and provides state from useSoundMonitoringState hook
 * This is the connection point between the hook and the components
 */
export const SoundMonitoringProvider: React.FC<SoundMonitoringProviderProps> = ({ children }) => {
  // Use the hook to get all state and actions
  const state = useSoundMonitoringState();

  // The hook return type matches our context value, so we can pass it directly
  return (
    <SoundMonitoringContext.Provider value={state}>
      {children}
    </SoundMonitoringContext.Provider>
  );
};

export const useSoundMonitoringContext = (): SoundMonitoringContextValue => {
  const context = useContext(SoundMonitoringContext);
  if (!context) {
    throw new Error('useSoundMonitoringContext must be used within SoundMonitoringProvider');
  }
  return context;
};

