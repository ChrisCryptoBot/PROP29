/**
 * Sound Monitoring Service
 * API service layer for Sound Monitoring feature
 * Provides all API methods for sound monitoring operations
 */

import apiService from '../../../services/ApiService';
import type {
  SoundAlert,
  SoundZone,
  SoundMetrics,
  AudioVisualization,
  SoundMonitoringSettings,
  SoundMonitoringFilters
} from '../types/sound-monitoring.types';
import { logger } from '../../../services/logger';

/** Normalize alert id from API (may return string) to number for consistent frontend use. */
function normalizeSoundAlert(raw: SoundAlert & { id?: number | string }): SoundAlert {
  const id = raw.id != null ? Number(raw.id) : 0;
  return { ...raw, id } as SoundAlert;
}

/**
 * Get all sound alerts with optional filtering
 * GET /sound-monitoring/alerts
 */
export async function getAlerts(filters?: SoundMonitoringFilters): Promise<SoundAlert[]> {
  try {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.severity) params.severity = filters.severity;
    if (filters?.dateFrom) params.date_from = filters.dateFrom;
    if (filters?.dateTo) params.date_to = filters.dateTo;
    if (filters?.location) params.location = filters.location;

    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    const response = await apiService.get<SoundAlert[]>(`/sound-monitoring/alerts${queryString}`);
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch sound alerts');
    }
    return Array.isArray(response.data) ? response.data.map(normalizeSoundAlert) : [];
  } catch (error) {
    logger.error('Failed to fetch sound alerts', error instanceof Error ? error : new Error(String(error)), {
      module: 'SoundMonitoringService',
      action: 'getAlerts',
      filters
    });
    // Return empty array on error
    return [];
  }
}

/**
 * Get a single alert by ID
 * GET /sound-monitoring/alerts/{alertId}
 */
export async function getAlert(alertId: number): Promise<SoundAlert | null> {
  try {
    const response = await apiService.get<SoundAlert>(`/sound-monitoring/alerts/${alertId}`);
    if (!response.success || !response.data) {
      throw new Error(`Failed to fetch sound alert ${alertId}`);
    }
    return normalizeSoundAlert(response.data as SoundAlert & { id?: number | string });
  } catch (error) {
    logger.error('Failed to fetch sound alert', error instanceof Error ? error : new Error(String(error)), {
      module: 'SoundMonitoringService',
      action: 'getAlert',
      alertId
    });
    return null;
  }
}

/**
 * Acknowledge a sound alert
 * POST /sound-monitoring/alerts/{alertId}/acknowledge
 */
export async function acknowledgeAlert(alertId: number): Promise<SoundAlert | null> {
  try {
    const response = await apiService.post<SoundAlert>(`/sound-monitoring/alerts/${alertId}/acknowledge`);
    if (!response.success || !response.data) {
      throw new Error('Failed to acknowledge sound alert');
    }
    return normalizeSoundAlert(response.data as SoundAlert & { id?: number | string });
  } catch (error) {
    logger.error('Failed to acknowledge sound alert', error instanceof Error ? error : new Error(String(error)), {
      module: 'SoundMonitoringService',
      action: 'acknowledgeAlert',
      alertId
    });
    throw error;
  }
}

/**
 * Resolve a sound alert
 * POST /sound-monitoring/alerts/{alertId}/resolve
 */
export async function resolveAlert(alertId: number): Promise<SoundAlert | null> {
  try {
    const response = await apiService.post<SoundAlert>(`/sound-monitoring/alerts/${alertId}/resolve`);
    if (!response.success || !response.data) {
      throw new Error('Failed to resolve sound alert');
    }
    return normalizeSoundAlert(response.data as SoundAlert & { id?: number | string });
  } catch (error) {
    logger.error('Failed to resolve sound alert', error instanceof Error ? error : new Error(String(error)), {
      module: 'SoundMonitoringService',
      action: 'resolveAlert',
      alertId
    });
    throw error;
  }
}

/**
 * Get all monitoring zones
 * GET /sound-monitoring/zones
 */
export async function getZones(): Promise<SoundZone[]> {
  try {
    const response = await apiService.get<SoundZone[]>('/sound-monitoring/zones');
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch sound zones');
    }
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch sound zones', error instanceof Error ? error : new Error(String(error)), {
      module: 'SoundMonitoringService',
      action: 'getZones'
    });
    // Return empty array on error
    return [];
  }
}

/**
 * Get system metrics
 * GET /sound-monitoring/metrics
 */
export async function getMetrics(): Promise<SoundMetrics | null> {
  try {
    const response = await apiService.get<SoundMetrics>('/sound-monitoring/metrics');
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch sound metrics');
    }
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch sound metrics', error instanceof Error ? error : new Error(String(error)), {
      module: 'SoundMonitoringService',
      action: 'getMetrics'
    });
    // Return null on error
    return null;
  }
}

/**
 * Get audio visualization data
 * GET /sound-monitoring/audio-visualization
 */
export async function getAudioVisualization(): Promise<AudioVisualization | null> {
  try {
    const response = await apiService.get<AudioVisualization>('/sound-monitoring/audio-visualization');
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch audio visualization');
    }
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch audio visualization', error instanceof Error ? error : new Error(String(error)), {
      module: 'SoundMonitoringService',
      action: 'getAudioVisualization'
    });
    // Return null on error
    return null;
  }
}

/**
 * Get settings
 * GET /sound-monitoring/settings
 */
export async function getSettings(): Promise<SoundMonitoringSettings | null> {
  try {
    const response = await apiService.get<SoundMonitoringSettings>('/sound-monitoring/settings');
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch sound monitoring settings');
    }
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch sound monitoring settings', error instanceof Error ? error : new Error(String(error)), {
      module: 'SoundMonitoringService',
      action: 'getSettings'
    });
    return null;
  }
}

/**
 * Update settings
 * PUT /sound-monitoring/settings
 */
export async function updateSettings(settings: Partial<SoundMonitoringSettings>): Promise<SoundMonitoringSettings | null> {
  try {
    const response = await apiService.put<SoundMonitoringSettings>('/sound-monitoring/settings', settings);
    if (!response.success || !response.data) {
      throw new Error('Failed to update sound monitoring settings');
    }
    return response.data;
  } catch (error) {
    logger.error('Failed to update sound monitoring settings', error instanceof Error ? error : new Error(String(error)), {
      module: 'SoundMonitoringService',
      action: 'updateSettings',
      settings
    });
    throw error;
  }
}
