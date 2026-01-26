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
  GuestMessage,
  GuestMessageFilters,
  EvacuationHeadcount,
  EvacuationCheckIn,
} from '../types/guest-safety.types';
import { logger } from '../../../services/logger';

/**
 * Retry utility with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on 4xx errors (client errors)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
          throw error;
        }
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
          module: 'guestSafetyService',
          attempt: attempt + 1,
          maxRetries
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Get all incidents
 */
export async function getIncidents(filters?: GuestSafetyFilters): Promise<GuestSafetyIncident[]> {
  return retryWithBackoff(async () => {
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
      throw error; // Re-throw for retry logic
    }
  });
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
 * Create incident (with retry for network failures)
 */
export async function createIncident(data: CreateIncidentRequest): Promise<GuestSafetyIncident> {
  return retryWithBackoff(async () => {
    try {
    // Transform CreateIncidentRequest to match API format (adds required fields)
    const apiData = {
      ...data,
      status: 'reported' as const,
      reported_by: 'system', // TODO: Get from auth context
      reported_at: new Date().toISOString(),
      source: 'MANAGER', // Manager-created incidents
      source_metadata: null,
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
      throw error; // Re-throw for retry logic
    }
  }, 3, 1000); // 3 retries with exponential backoff
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

/**
 * Get hardware devices status
 */
export async function getHardwareDevices(): Promise<any[]> {
  try {
    const response = await apiService.get<any[]>(
      '/guest-safety/hardware/devices'
    );
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    logger.error(
      'Failed to fetch hardware devices',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'getHardwareDevices' }
    );
    return [];
  }
}

/**
 * Get mobile agent metrics
 */
export async function getMobileAgentMetrics(): Promise<any> {
  try {
    const response = await apiService.get<any>(
      '/guest-safety/mobile-agents/metrics'
    );
    if (response.success && response.data) {
      return response.data;
    }
    return {
      totalAgents: 0,
      activeAgents: 0,
      submissionsToday: 0,
      averageResponseTime: 0,
      trustScoreAverage: 0
    };
  } catch (error) {
    logger.error(
      'Failed to fetch mobile agent metrics',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'getMobileAgentMetrics' }
    );
    return {
      totalAgents: 0,
      activeAgents: 0,
      submissionsToday: 0,
      averageResponseTime: 0,
      trustScoreAverage: 0
    };
  }
}

/**
 * Get guest messages
 */
export async function getGuestMessages(filters?: GuestMessageFilters): Promise<GuestMessage[]> {
  try {
    const params: Record<string, string> = {};
    
    if (filters?.incident_id) {
      params.incident_id = filters.incident_id;
    }
    if (filters?.unread_only) {
      params.unread_only = 'true';
    }
    if (filters?.message_type) {
      params.message_type = filters.message_type;
    }
    if (filters?.direction) {
      params.direction = filters.direction;
    }
    if (filters?.guest_id) {
      params.guest_id = filters.guest_id;
    }
    if (filters?.limit) {
      params.limit = filters.limit.toString();
    }
    
    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    const response = await apiService.get<GuestMessage[]>(
      `/guest-safety/messages${queryString}`
    );
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    logger.error(
      'Failed to fetch guest messages',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'getGuestMessages', filters }
    );
    return [];
  }
}

/**
 * Mark message as read
 */
export async function markMessageRead(messageId: string): Promise<GuestMessage> {
  try {
    const response = await apiService.put<GuestMessage>(
      `/guest-safety/messages/${messageId}/read`
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to mark message as read');
    }
    logger.info('Message marked as read', {
      module: 'guestSafetyService',
      action: 'markMessageRead',
      messageId
    });
    return response.data as GuestMessage;
  } catch (error) {
    logger.error(
      `Failed to mark message ${messageId} as read`,
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', action: 'markMessageRead', messageId }
    );
    throw error;
  }
}

/**
 * Get evacuation headcount
 */
export async function getEvacuationHeadcount(): Promise<EvacuationHeadcount> {
  try {
    const response = await apiService.get<EvacuationHeadcount>('/guest-safety/evacuation/headcount');
    if (!response.success || !response.data) {
      throw new Error('Failed to get evacuation headcount');
    }
    return response.data as EvacuationHeadcount;
  } catch (error) {
    logger.error(
      'Failed to get evacuation headcount',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService' }
    );
    // Return default headcount on error
    return {
      totalGuests: 0,
      safe: 0,
      unaccounted: 0,
      inProgress: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get evacuation check-ins
 */
export async function getEvacuationCheckIns(): Promise<EvacuationCheckIn[]> {
  try {
    const response = await apiService.get<EvacuationCheckIn[]>('/guest-safety/evacuation/check-ins');
    if (!response.success) {
      return [];
    }
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    logger.error(
      'Failed to get evacuation check-ins',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService' }
    );
    return [];
  }
}

/**
 * Guest check-in (from guest app)
 * This endpoint would be called by the guest app when a guest checks in as safe
 */
export async function submitEvacuationCheckIn(data: {
  guestId: string;
  status: 'safe' | 'in_progress';
  location?: string;
  notes?: string;
}): Promise<EvacuationCheckIn> {
  try {
    const response = await apiService.post<EvacuationCheckIn>('/guest-safety/evacuation/check-in', data);
    if (!response.success || !response.data) {
      throw new Error('Failed to submit evacuation check-in');
    }
    return response.data as EvacuationCheckIn;
  } catch (error) {
    logger.error(
      'Failed to submit evacuation check-in',
      error instanceof Error ? error : new Error(String(error)),
      { module: 'guestSafetyService', data }
    );
    throw error;
  }
}
