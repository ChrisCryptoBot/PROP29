/**
 * Sound Monitoring State Hook
 * Centralized state management for Sound Monitoring feature
 * Contains ALL business logic with RBAC integration
 * 
 * Following Gold Standard: Zero business logic in components, 100% in hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../services/logger';
import { showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showError, showSuccess } from '../../../utils/toast';
import * as soundMonitoringService from '../services/soundMonitoringService';
import type {
  SoundAlert,
  SoundZone,
  SoundMetrics,
  AudioVisualization,
  SoundMonitoringSettings,
  SoundMonitoringFilters
} from '../types/sound-monitoring.types';

export interface UseSoundMonitoringStateReturn {
  // Data
  soundAlerts: SoundAlert[];
  soundZones: SoundZone[];
  metrics: SoundMetrics | null;
  audioVisualization: AudioVisualization;
  selectedAlert: SoundAlert | null;
  
  // Loading states
  loading: {
    alerts: boolean;
    zones: boolean;
    metrics: boolean;
    audio: boolean;
    actions: boolean;
  };
  
  // RBAC flags (exposed for UI conditional rendering)
  canAcknowledgeAlert: boolean;
  canResolveAlert: boolean;
  canUpdateSettings: boolean;
  
  // Actions
  acknowledgeAlert: (alertId: number) => Promise<void>;
  resolveAlert: (alertId: number) => Promise<void>;
  viewAlert: (alert: SoundAlert) => void;
  clearSelectedAlert: () => void;
  refreshAlerts: (filters?: SoundMonitoringFilters) => Promise<void>;
  refreshZones: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshAudioVisualization: () => Promise<void>;
  
  // Settings
  settings: SoundMonitoringSettings | null;
  settingsForm: SoundMonitoringSettings;
  setSettingsForm: (settings: SoundMonitoringSettings) => void;
  getSettings: () => Promise<SoundMonitoringSettings | null>;
  updateSettings: (settings: Partial<SoundMonitoringSettings>) => Promise<void>;
  resetSettings: () => void;
}

export function useSoundMonitoringState(): UseSoundMonitoringStateReturn {
  const { user } = useAuth();
  
  // ============================================
  // RBAC HELPER FUNCTIONS
  // ============================================
  
  /**
   * Check if user has management access (ADMIN or SECURITY_OFFICER)
   */
  const hasManagementAccess = useMemo(() => {
    if (!user) return false;
    return user.roles.some(role => 
      ['ADMIN', 'SECURITY_OFFICER'].includes(role.toUpperCase())
    );
  }, [user]);
  
  /**
   * Check if user has admin access
   */
  const isAdmin = useMemo(() => {
    if (!user) return false;
    return user.roles.some(role => role.toUpperCase() === 'ADMIN');
  }, [user]);
  
  // ============================================
  // RBAC FLAGS (for UI conditional rendering)
  // ============================================
  
  const canAcknowledgeAlert = hasManagementAccess;
  const canResolveAlert = hasManagementAccess;
  const canUpdateSettings = isAdmin; // Only admins can manage settings
  
  // ============================================
  // STATE DECLARATIONS
  // ============================================
  
  const [soundAlerts, setSoundAlerts] = useState<SoundAlert[]>([]);
  const [soundZones, setSoundZones] = useState<SoundZone[]>([]);
  const [metrics, setMetrics] = useState<SoundMetrics | null>(null);
  const [audioVisualization, setAudioVisualization] = useState<AudioVisualization>({
    waveform: [],
    spectrum: [],
    realTimeLevel: 0,
    isRecording: false,
    timestamp: new Date().toISOString()
  });
  const [selectedAlert, setSelectedAlert] = useState<SoundAlert | null>(null);
  const [settings, setSettings] = useState<SoundMonitoringSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<SoundMonitoringSettings>({
    alertThreshold: 70,
    notificationEnabled: true,
    autoAcknowledge: false,
    zones: [],
  });
  
  const [loading, setLoading] = useState({
    alerts: false,
    zones: false,
    metrics: false,
    audio: false,
    actions: false,
  });
  
  // ============================================
  // DEFAULT METRICS
  // ============================================
  
  const defaultMetrics: SoundMetrics = {
    totalAlerts: 0,
    activeAlerts: 0,
    resolvedToday: 0,
    averageDecibelLevel: 0,
    peakDecibelLevel: 0,
    systemUptime: 0,
    falsePositiveRate: 0,
    responseTime: 0,
    zonesMonitored: 0,
    sensorsActive: 0
  };
  
  // ============================================
  // REFRESH ACTIONS
  // ============================================
  
  /**
   * Refresh alerts list
   */
  const refreshAlerts = useCallback(async (filters?: SoundMonitoringFilters) => {
    setLoading(prev => ({ ...prev, alerts: true }));
    try {
      const data = await soundMonitoringService.getAlerts(filters);
      setSoundAlerts(data);
      logger.info('Sound alerts refreshed', { module: 'SoundMonitoring', count: data.length });
    } catch (error) {
      logger.error('Failed to refresh sound alerts', error instanceof Error ? error : new Error(String(error)), {
        module: 'SoundMonitoring',
        action: 'refreshAlerts'
      });
      showError('Failed to load sound alerts. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }));
    }
  }, []);
  
  /**
   * Refresh zones list
   */
  const refreshZones = useCallback(async () => {
    setLoading(prev => ({ ...prev, zones: true }));
    try {
      const data = await soundMonitoringService.getZones();
      setSoundZones(data);
      logger.info('Sound zones refreshed', { module: 'SoundMonitoring', count: data.length });
    } catch (error) {
      logger.error('Failed to refresh sound zones', error instanceof Error ? error : new Error(String(error)), {
        module: 'SoundMonitoring',
        action: 'refreshZones'
      });
      // Don't show error toast for zones (non-critical)
    } finally {
      setLoading(prev => ({ ...prev, zones: false }));
    }
  }, []);
  
  /**
   * Refresh metrics
   */
  const refreshMetrics = useCallback(async () => {
    setLoading(prev => ({ ...prev, metrics: true }));
    try {
      const data = await soundMonitoringService.getMetrics();
      setMetrics(data || defaultMetrics);
      logger.info('Sound metrics refreshed', { module: 'SoundMonitoring' });
    } catch (error) {
      logger.error('Failed to refresh sound metrics', error instanceof Error ? error : new Error(String(error)), {
        module: 'SoundMonitoring',
        action: 'refreshMetrics'
      });
      // Set default metrics on error
      setMetrics(defaultMetrics);
    } finally {
      setLoading(prev => ({ ...prev, metrics: false }));
    }
  }, []);
  
  /**
   * Refresh audio visualization
   */
  const refreshAudioVisualization = useCallback(async () => {
    setLoading(prev => ({ ...prev, audio: true }));
    try {
      const data = await soundMonitoringService.getAudioVisualization();
      if (data) {
        setAudioVisualization(data);
      }
      logger.info('Audio visualization refreshed', { module: 'SoundMonitoring' });
    } catch (error) {
      logger.error('Failed to refresh audio visualization', error instanceof Error ? error : new Error(String(error)), {
        module: 'SoundMonitoring',
        action: 'refreshAudioVisualization'
      });
      // Don't show error toast (non-critical)
    } finally {
      setLoading(prev => ({ ...prev, audio: false }));
    }
  }, []);
  
  // ============================================
  // ALERT ACTIONS
  // ============================================
  
  /**
   * Acknowledge an alert (with RBAC check)
   */
  const acknowledgeAlert = useCallback(async (alertId: number) => {
    // RBAC CHECK
    if (!canAcknowledgeAlert) {
      showError('You do not have permission to acknowledge alerts');
      throw new Error('Unauthorized');
    }
    
    const toastId = showLoading('Acknowledging sound alert...');
    setLoading(prev => ({ ...prev, actions: true }));
    try {
      const updatedAlert = await soundMonitoringService.acknowledgeAlert(alertId);
      
      if (updatedAlert) {
        setSoundAlerts(prev => prev.map(alert => 
          alert.id === alertId ? updatedAlert : alert
        ));
        dismissLoadingAndShowSuccess(toastId, 'Sound alert acknowledged successfully');
        logger.info('Sound alert acknowledged', { module: 'SoundMonitoring', alertId });
      } else {
        // Fallback: Update state optimistically
        setSoundAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, status: 'investigating' } : alert
        ));
        dismissLoadingAndShowSuccess(toastId, 'Sound alert acknowledged successfully');
      }
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to acknowledge sound alert');
      logger.error('Failed to acknowledge sound alert', error instanceof Error ? error : new Error(String(error)), {
        module: 'SoundMonitoring',
        action: 'acknowledgeAlert',
        alertId
      });
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  }, [canAcknowledgeAlert]);
  
  /**
   * Resolve an alert (with RBAC check)
   */
  const resolveAlert = useCallback(async (alertId: number) => {
    // RBAC CHECK
    if (!canResolveAlert) {
      showError('You do not have permission to resolve alerts');
      throw new Error('Unauthorized');
    }
    
    const toastId = showLoading('Resolving sound alert...');
    setLoading(prev => ({ ...prev, actions: true }));
    try {
      const updatedAlert = await soundMonitoringService.resolveAlert(alertId);
      
      if (updatedAlert) {
        setSoundAlerts(prev => prev.map(alert => 
          alert.id === alertId ? updatedAlert : alert
        ));
        
        // Update metrics optimistically
        setMetrics(prev => prev ? {
          ...prev,
          activeAlerts: Math.max(0, prev.activeAlerts - 1),
          resolvedToday: prev.resolvedToday + 1
        } : defaultMetrics);
        
        dismissLoadingAndShowSuccess(toastId, 'Sound alert resolved successfully');
        logger.info('Sound alert resolved', { module: 'SoundMonitoring', alertId });
      } else {
        // Fallback: Update state optimistically
        setSoundAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, status: 'resolved' } : alert
        ));
        setMetrics(prev => prev ? {
          ...prev,
          activeAlerts: Math.max(0, prev.activeAlerts - 1),
          resolvedToday: prev.resolvedToday + 1
        } : defaultMetrics);
        dismissLoadingAndShowSuccess(toastId, 'Sound alert resolved successfully');
      }
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to resolve sound alert');
      logger.error('Failed to resolve sound alert', error instanceof Error ? error : new Error(String(error)), {
        module: 'SoundMonitoring',
        action: 'resolveAlert',
        alertId
      });
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  }, [canResolveAlert]);
  
  /**
   * View alert details
   */
  const viewAlert = useCallback((alert: SoundAlert) => {
    setSelectedAlert(alert);
  }, []);
  
  /**
   * Clear selected alert
   */
  const clearSelectedAlert = useCallback(() => {
    setSelectedAlert(null);
  }, []);
  
  // ============================================
  // SETTINGS ACTIONS (Future)
  // ============================================
  
  /**
   * Get settings
   */
  const getSettings = useCallback(async (): Promise<SoundMonitoringSettings | null> => {
    try {
      const data = await soundMonitoringService.getSettings();
      if (data) {
        setSettings(data);
        setSettingsForm(data);
      }
      return data;
    } catch (error) {
      logger.error('Failed to get sound monitoring settings', error instanceof Error ? error : new Error(String(error)), {
        module: 'SoundMonitoring',
        action: 'getSettings'
      });
      return null;
    }
  }, []);
  
  /**
   * Update settings (with RBAC check)
   */
  const updateSettings = useCallback(async (settingsUpdate: Partial<SoundMonitoringSettings>): Promise<void> => {
    // RBAC CHECK
    if (!canUpdateSettings) {
      showError('You do not have permission to update settings');
      throw new Error('Unauthorized');
    }
    
    const toastId = showLoading('Updating settings...');
    try {
      await soundMonitoringService.updateSettings(settingsUpdate);
      const updatedSettings = { ...settingsForm, ...settingsUpdate };
      setSettings(updatedSettings);
      setSettingsForm(updatedSettings);
      dismissLoadingAndShowSuccess(toastId, 'Settings updated successfully');
      logger.info('Sound monitoring settings updated', { module: 'SoundMonitoring' });
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Failed to update settings');
      logger.error('Failed to update sound monitoring settings', error instanceof Error ? error : new Error(String(error)), {
        module: 'SoundMonitoring',
        action: 'updateSettings'
      });
      throw error;
    }
  }, [canUpdateSettings, settingsForm]);
  
  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(() => {
    const defaults: SoundMonitoringSettings = {
      alertThreshold: 70,
      notificationEnabled: true,
      autoAcknowledge: false,
      zones: [],
    };
    setSettingsForm(defaults);
    showSuccess('Settings reset to defaults');
  }, []);
  
  // ============================================
  // INITIAL DATA LOAD
  // ============================================
  
  useEffect(() => {
    // Initial load
    refreshAlerts();
    refreshZones();
    refreshMetrics();
    refreshAudioVisualization();
    getSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    // Data
    soundAlerts,
    soundZones,
    metrics: metrics || defaultMetrics,
    audioVisualization,
    selectedAlert,
    
    // Loading states
    loading,
    
    // RBAC flags
    canAcknowledgeAlert,
    canResolveAlert,
    canUpdateSettings,
    
    // Actions
    acknowledgeAlert,
    resolveAlert,
    viewAlert,
    clearSelectedAlert,
    refreshAlerts,
    refreshZones,
    refreshMetrics,
    refreshAudioVisualization,
    settings,
    settingsForm,
    setSettingsForm,
    getSettings,
    updateSettings,
    resetSettings,
  };
}
