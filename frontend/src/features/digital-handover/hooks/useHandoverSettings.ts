/**
 * useHandoverSettings Hook
 * 
 * Custom hook for handover settings management.
 */

import { useState, useEffect, useCallback } from 'react';
import { handoverSettingsService } from '../services/handoverSettingsService';
import { logger } from '../../../services/logger';
import type { HandoverSettings, UpdateHandoverSettingsRequest } from '../types';

export interface UseHandoverSettingsReturn {
  // Data
  settings: HandoverSettings | null;

  // Loading states
  loading: boolean;
  error: Error | null;
  saving: boolean;

  // Operations
  loadSettings: () => Promise<void>;
  updateSettings: (data: UpdateHandoverSettingsRequest) => Promise<HandoverSettings>;

  // Local state updates (for form editing before save)
  updateLocalSettings: (data: Partial<HandoverSettings>) => void;
  resetLocalSettings: () => void;
}

/**
 * Hook for managing handover settings
 */
export function useHandoverSettings(): UseHandoverSettingsReturn {
  // State
  const [settings, setSettings] = useState<HandoverSettings | null>(null);
  const [localSettings, setLocalSettings] = useState<HandoverSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load settings
   */
  const loadSettings = useCallback(async (propertyId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const activePropertyId = propertyId || localStorage.getItem('propertyId') || '';
      const data = await handoverSettingsService.getSettings(activePropertyId);
      setSettings(data);
      setLocalSettings(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to load handover settings', error, { module: 'useHandoverSettings', action: 'loadSettings' });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load settings on mount
   */
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /**
   * Update settings
   */
  const updateSettings = useCallback(async (propertyId: string | UpdateHandoverSettingsRequest, data?: UpdateHandoverSettingsRequest): Promise<HandoverSettings> => {
    try {
      setSaving(true);
      setError(null);

      let activePropertyId: string;
      let updates: UpdateHandoverSettingsRequest;

      if (typeof propertyId === 'string') {
        activePropertyId = propertyId;
        updates = data!;
      } else {
        activePropertyId = localStorage.getItem('propertyId') || '';
        updates = propertyId;
      }

      const updated = await handoverSettingsService.updateSettings(activePropertyId, updates);
      setSettings(updated);
      setLocalSettings(updated);
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to update handover settings', error, { module: 'useHandoverSettings', action: 'updateSettings' });
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Update local settings (for form editing before save)
   */
  const updateLocalSettings = useCallback((data: Partial<HandoverSettings>) => {
    setLocalSettings(prev => prev ? { ...prev, ...data } : null);
  }, []);

  /**
   * Reset local settings to saved settings
   */
  const resetLocalSettings = useCallback(() => {
    setLocalSettings(settings);
  }, [settings]);

  return {
    // Data (return local settings for form editing)
    settings: localSettings,

    // Loading states
    loading,
    error,
    saving,

    // Operations
    loadSettings,
    updateSettings,

    // Local state management
    updateLocalSettings,
    resetLocalSettings,
  };
}
