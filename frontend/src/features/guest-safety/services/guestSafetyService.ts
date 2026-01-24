/**
 * Guest Safety Service
 * API service layer for Guest Safety operations
 */

import apiService from '../../../services/ApiService';
import type {
  GuestSafetyIncident,
  GuestSafetyAlert,
} from '../../../services/ApiService';
import type {
  CreateIncidentRequest,
  UpdateIncidentRequest,
  GuestSafetyFilters,
  ResponseTeam,
  GuestSafetySettings,
  MassNotificationData,
} from '../types/guest-safety.types';
import { logger } from '../../../services/logger';

/**
 * Get all incidents
 */
export async function getIncidents(filters?: GuestSafetyFilters): Promise<GuestSafetyIncident[]> {
  try {
    const params: Record<string, string> = {};
    
    if (filters?.status) {
      params.status = filters.status;
    }
    if (filters?.priority) {
      params.priority = filters.priority;
    }
    if (filters?.type) {
      params.type = filters.type;
    }
    if (filters?.searchQuery) {
      params.search = filters.searchQuery;
    }
    
    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    const response = await apiService.get<GuestSafetyIncident[]>(
      `/guest-safety/incidents${queryString}`
    );
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    logger.error(
      'Failed to fetch guest safety incidents',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'getIncidents', filters }
    );
    return [];
  }
}

/**
 * Get incident by ID
 */
export async function getIncident(id: string): Promise<GuestSafetyIncident | null> {
  try {
    const incidents = await getIncidents();
    return incidents.find(incident => incident.id === id) || null;
  } catch (error) {
    logger.error(
      `Failed to fetch incident ${id}`,
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'getIncident', incidentId: id }
    );
    return null;
  }
}

/**
 * Create incident
 */
export async function createIncident(data: CreateIncidentRequest): Promise<GuestSafetyIncident> {
  try {
    // Transform CreateIncidentRequest to match API format (adds required fields)
    const apiData = {
      ...data,
      status: 'reported' as const,
      reported_by: 'system', // TODO: Get from auth context
      reported_at: new Date().toISOString(),
    };
    const response = await apiService.post<GuestSafetyIncident>(
      '/guest-safety/incidents',
      apiData
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to create incident');
    }
    logger.info('Incident created successfully', {
      module: 'guestSafetyService',
      action: 'createIncident',
      incidentId: response.data.id
    });
    return response.data;
  } catch (error) {
    logger.error(
      'Failed to create incident',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'createIncident', data }
    );
    throw error;
  }
}

/**
 * Update incident
 */
export async function updateIncident(
  id: string,
  data: UpdateIncidentRequest
): Promise<GuestSafetyIncident> {
  try {
    const { assignedTeam, ...rest } = data;
    const payload: Partial<GuestSafetyIncident> & { assigned_team?: string } = {
      ...rest,
    };
    if (assignedTeam) {
      payload.assigned_team = assignedTeam;
    }
    const response = await apiService.put<GuestSafetyIncident>(
      `/guest-safety/incidents/${id}`,
      payload
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to update incident');
    }
    logger.info('Incident updated successfully', {
      module: 'guestSafetyService',
      action: 'updateIncident',
      incidentId: id
    });
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to update incident ${id}`,
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'updateIncident', incidentId: id, data }
    );
    throw error;
  }
}

/**
 * Delete incident
 */
export async function deleteIncident(id: string): Promise<void> {
  try {
    const response = await apiService.delete<void>(
      `/guest-safety/incidents/${id}`
    );
    if (!response.success) {
      throw new Error('Failed to delete incident');
    }
    logger.info('Incident deleted successfully', {
      module: 'guestSafetyService',
      action: 'deleteIncident',
      incidentId: id
    });
  } catch (error) {
    logger.error(
      `Failed to delete incident ${id}`,
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'deleteIncident', incidentId: id }
    );
    throw error;
  }
}

/**
 * Resolve incident
 */
export async function resolveIncident(id: string): Promise<GuestSafetyIncident> {
  try {
    const response = await apiService.put<GuestSafetyIncident>(
      `/guest-safety/incidents/${id}/resolve`
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to resolve incident');
    }
    logger.info('Incident resolved successfully', {
      module: 'guestSafetyService',
      action: 'resolveIncident',
      incidentId: id
    });
    return response.data;
  } catch (error) {
    logger.error(
      `Failed to resolve incident ${id}`,
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'resolveIncident', incidentId: id }
    );
    throw error;
  }
}

/**
 * Send message to guest (admin interface)
 */
export async function sendMessage(incidentId: string, message: string): Promise<void> {
  try {
    const response = await apiService.post(
      `/guest-safety/incidents/${incidentId}/message`,
      { message }
    );
    if (!response.success) {
      throw new Error('Failed to send message');
    }
  } catch (error) {
    logger.error(
      `Failed to send message for incident ${incidentId}`,
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'sendMessage', incidentId }
    );
    throw error;
  }
}

/**
 * Send mass notification (admin interface)
 */
export async function sendMassNotification(data: MassNotificationData): Promise<void> {
  try {
    const response = await apiService.post(
      '/guest-safety/notifications',
      data
    );
    if (!response.success) {
      throw new Error('Failed to send mass notification');
    }
  } catch (error) {
    logger.error(
      'Failed to send mass notification',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'sendMassNotification' }
    );
    throw error;
  }
}

/**
 * Get alerts
 */
export async function getAlerts(filters?: Record<string, unknown>): Promise<GuestSafetyAlert[]> {
  try {
    const response = await apiService.get<GuestSafetyAlert[]>(
      '/guest-safety/alerts',
      filters ? { params: filters } : undefined
    );
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    logger.error(
      'Failed to fetch alerts',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'getAlerts', filters }
    );
    return [];
  }
}

/**
 * Create alert
 */
export async function createAlert(data: Omit<GuestSafetyAlert, 'id'>): Promise<GuestSafetyAlert> {
  try {
    const response = await apiService.post<GuestSafetyAlert>(
      '/guest-safety/alerts',
      data
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to create alert');
    }
    logger.info('Alert created successfully', {
      module: 'guestSafetyService',
      action: 'createAlert',
      alertId: response.data.id
    });
    return response.data;
  } catch (error) {
    logger.error(
      'Failed to create alert',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'createAlert', data }
    );
    throw error;
  }
}

/**
 * Get response teams
 */
export async function getResponseTeams(): Promise<ResponseTeam[]> {
  try {
    const response = await apiService.get<ResponseTeam[]>(
      '/guest-safety/teams'
    );
    if (response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    logger.error(
      'Failed to fetch response teams',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'getResponseTeams' }
    );
    return [];
  }
}

/**
 * Get guest safety settings
 */
export async function getSettings(): Promise<GuestSafetySettings> {
  const response = await apiService.get<GuestSafetySettings>(
    '/guest-safety/settings'
  );
  if (!response.data) {
    throw new Error('Failed to load settings');
  }
  return response.data;
}

/**
 * Update guest safety settings
 */
export async function updateSettings(settings: Partial<GuestSafetySettings>): Promise<GuestSafetySettings> {
  const response = await apiService.put<GuestSafetySettings>(
    '/guest-safety/settings',
    settings
  );
  if (!response.data) {
    throw new Error('Failed to update settings');
  }
  return response.data;
}
