import ApiService from './ApiService';
import type { AccessPoint, Credential, AccessEvent, AccessEventFilters } from '../shared/types/access-control.types';
import { logger } from './logger';
import type { ApiResponse } from './ApiService';

// Types for all modules
export interface ServicePatrol {
  id: string;
  route_name: string;
  assigned_officer: string;
  route_description: string;
  start_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  location?: string;
  duration?: string;
  checkpoints: string[];
  completedCheckpoints?: number;
}

export interface PredictionEvent {
  id: number;
  type: string;
  probability: number;
  location: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'false_positive';
}

export interface PredictionEventFilters {
  type?: string;
  severity?: PredictionEvent['severity'] | 'all';
  status?: PredictionEvent['status'] | 'all';
  startDate?: string;
  endDate?: string;
  location?: string;
}

// Service class for all module operations
export class ModuleService {
  private static instance: ModuleService;
  private apiService: typeof ApiService;

  private constructor() {
    this.apiService = ApiService;
  }

  public static getInstance(): ModuleService {
    if (!ModuleService.instance) {
      ModuleService.instance = new ModuleService();
    }
    return ModuleService.instance;
  }

  // Patrol Operations
  async getPatrols(): Promise<ServicePatrol[]> {
    try {
      const response = await this.apiService.get<ServicePatrol[]>('/patrols');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch patrols', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getPatrols' });
      return [];
    }
  }

  async createPatrol(patrolData: Partial<ServicePatrol>): Promise<ServicePatrol> {
    try {
      const response = await this.apiService.post<ServicePatrol>('/patrols', patrolData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to create patrol', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'createPatrol', patrolData });
      throw new Error('Failed to create patrol');
    }
  }

  async updatePatrol(id: string, updates: Partial<ServicePatrol>): Promise<ServicePatrol> {
    try {
      const response = await this.apiService.put<ServicePatrol>(`/patrols/${id}`, updates);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to update patrol', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'updatePatrol', id, updates });
      throw new Error('Failed to update patrol');
    }
  }

  async startPatrol(id: string): Promise<ServicePatrol> {
    try {
      const response = await this.apiService.post<ServicePatrol>(`/patrols/${id}/start`);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to start patrol', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'startPatrol', id });
      throw new Error('Failed to start patrol');
    }
  }

  async completePatrol(id: string): Promise<ServicePatrol> {
    try {
      const response = await this.apiService.post<ServicePatrol>(`/patrols/${id}/complete`);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to complete patrol', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'completePatrol', id });
      throw new Error('Failed to complete patrol');
    }
  }

  // Access Control Operations
  async getAccessPoints(): Promise<AccessPoint[]> {
    try {
      const response = await this.apiService.get<AccessPoint[]>('/access-points');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch access points', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getAccessPoints' });
      return [];
    }
  }

  async createAccessPoint(accessPointData: Partial<AccessPoint>): Promise<AccessPoint> {
    try {
      const response = await this.apiService.post<AccessPoint>('/access-points', accessPointData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to create access point', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'createAccessPoint', accessPointData });
      throw new Error('Failed to create access point');
    }
  }

  async updateAccessPoint(id: number, updates: Partial<AccessPoint>): Promise<AccessPoint> {
    try {
      const response = await this.apiService.put<AccessPoint>(`/access-points/${id}`, updates);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to update access point', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'updateAccessPoint', id, updates });
      throw new Error('Failed to update access point');
    }
  }

  async deleteAccessPoint(id: number): Promise<void> {
    try {
      await this.apiService.delete<void>(`/access-points/${id}`);
    } catch (error) {
      logger.error('Failed to delete access point', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'deleteAccessPoint', id });
      throw new Error('Failed to delete access point');
    }
  }

  async refreshAccessPoints(): Promise<AccessPoint[]> {
    try {
      const response = await this.apiService.get<AccessPoint[]>('/access-points/refresh');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to refresh access points', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'refreshAccessPoints' });
      return [];
    }
  }

  async getCredentials(): Promise<Credential[]> {
    try {
      const response = await this.apiService.get<Credential[]>('/credentials');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch credentials', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getCredentials' });
      return [];
    }
  }

  async createCredential(credentialData: Partial<Credential>): Promise<Credential> {
    try {
      const response = await this.apiService.post<Credential>('/credentials', credentialData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to create credential', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'createCredential', credentialData });
      throw new Error('Failed to create credential');
    }
  }

  async updateCredential(id: number, updates: Partial<Credential>): Promise<Credential> {
    try {
      const response = await this.apiService.put<Credential>(`/credentials/${id}`, updates);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to update credential', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'updateCredential', id, updates });
      throw new Error('Failed to update credential');
    }
  }

  async revokeCredential(id: number): Promise<Credential> {
    try {
      const response = await this.apiService.post<Credential>(`/credentials/${id}/revoke`);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to revoke credential', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'revokeCredential', id });
      throw new Error('Failed to revoke credential');
    }
  }

  async getAccessEvents(): Promise<AccessEvent[]> {
    try {
      const response = await this.apiService.get<AccessEvent[]>('/access-events');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch access events', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getAccessEvents' });
      return [];
    }
  }

  async exportAccessEvents(format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const response = await this.apiService.get<Blob>(`/access-events/export?format=${format}`, {
        responseType: 'blob'
      });
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to export access events', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'exportAccessEvents', format });
      throw new Error('Failed to export access events');
    }
  }

  async filterAccessEvents(filters: AccessEventFilters): Promise<AccessEvent[]> {
    try {
      const response = await this.apiService.post<AccessEvent[]>('/access-events/filter', filters);
      return response.data || [];
    } catch (error) {
      logger.error('Failed to filter access events', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'filterAccessEvents', filters });
      return [];
    }
  }

  // Predictive Event Intel Operations
  async getPredictionEvents(): Promise<PredictionEvent[]> {
    try {
      const response = await this.apiService.get<PredictionEvent[]>('/prediction-events');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch prediction events', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getPredictionEvents' });
      return [];
    }
  }

  async updatePredictionStatus(id: number, status: PredictionEvent['status']): Promise<PredictionEvent> {
    try {
      const response = await this.apiService.put<PredictionEvent>(`/prediction-events/${id}`, { status });
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to update prediction status', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'updatePredictionStatus', id, status });
      throw new Error('Failed to update prediction status');
    }
  }

  async generatePredictionReport(): Promise<Blob> {
    try {
      const response = await this.apiService.get<Blob>('/prediction-events/report', {
        responseType: 'blob'
      });
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to generate prediction report', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'generatePredictionReport' });
      throw new Error('Failed to generate prediction report');
    }
  }

  async filterPredictions(filters: PredictionEventFilters): Promise<PredictionEvent[]> {
    try {
      const response = await this.apiService.post<PredictionEvent[]>('/prediction-events/filter', filters);
      return response.data || [];
    } catch (error) {
      logger.error('Failed to filter predictions', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'filterPredictions', filters });
      return [];
    }
  }

  async trainModels(): Promise<void> {
    try {
      await this.apiService.post<void>('/prediction-events/train-models');
    } catch (error) {
      logger.error('Failed to train models', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'trainModels' });
      throw new Error('Failed to train models');
    }
  }

  async deployModel(modelId: string): Promise<void> {
    try {
      await this.apiService.post<void>(`/prediction-events/deploy-model/${modelId}`);
    } catch (error) {
      logger.error('Failed to deploy model', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'deployModel', modelId });
      throw new Error('Failed to deploy model');
    }
  }

  // Admin Operations
  async createUser(userData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/admin/users', userData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to create user', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'createUser', userData });
      throw new Error('Failed to create user');
    }
  }

  async getUsers(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/admin/users');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch users', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getUsers' });
      return [];
    }
  }

  async updateUser(userId: number, updates: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.put<Record<string, unknown>>(`/admin/users/${userId}`, updates);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to update user', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'updateUser', userId: String(userId), updates });
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      await this.apiService.delete<void>(`/admin/users/${userId}`);
    } catch (error) {
      logger.error('Failed to delete user', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'deleteUser', userId: String(userId) });
      throw new Error('Failed to delete user');
    }
  }

  async getSystemConfigs(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/admin/system-configs');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch system configs', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getSystemConfigs' });
      return [];
    }
  }

  async updateSystemConfig(configId: string, value: unknown): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.put<Record<string, unknown>>(`/admin/system-configs/${configId}`, { value });
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to update system config', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'updateSystemConfig', configId, value });
      throw new Error('Failed to update system config');
    }
  }

  async createIntegration(integrationData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/admin/integrations', integrationData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to create integration', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'createIntegration', integrationData });
      throw new Error('Failed to create integration');
    }
  }

  async getIntegrations(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/admin/integrations');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch integrations', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getIntegrations' });
      return [];
    }
  }

  async testIntegration(integrationId: string): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>(`/admin/integrations/${integrationId}/test`);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to test integration', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'testIntegration', integrationId });
      throw new Error('Failed to test integration');
    }
  }


  // Guest Safety Operations
  async createSafetyIncident(incidentData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/guest-safety/incidents', incidentData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to create safety incident', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'createSafetyIncident', incidentData });
      throw new Error('Failed to create safety incident');
    }
  }

  async getSafetyIncidents(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/guest-safety/incidents');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch safety incidents', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getSafetyIncidents' });
      return [];
    }
  }

  async updateSafetyIncident(incidentId: number, updates: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.put<Record<string, unknown>>(`/guest-safety/incidents/${incidentId}`, updates);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to update safety incident', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'updateSafetyIncident', incidentId, updates });
      throw new Error('Failed to update safety incident');
    }
  }

  // Visitors Operations
  async createVisitor(visitorData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/visitors', visitorData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to create visitor', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'createVisitor', visitorData });
      throw new Error('Failed to create visitor');
    }
  }

  async getVisitors(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/visitors');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch visitors', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getVisitors' });
      return [];
    }
  }

  async checkOutVisitor(visitorId: number): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>(`/visitors/${visitorId}/checkout`);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to check out visitor', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'checkOutVisitor', visitorId });
      throw new Error('Failed to check out visitor');
    }
  }

  // Lost and Found Operations
  async createLostItem(itemData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/lost-found/items', itemData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to create lost item', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'createLostItem', itemData });
      throw new Error('Failed to create lost item');
    }
  }

  async getLostItems(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/lost-found/items');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch lost items', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getLostItems' });
      return [];
    }
  }

  async claimItem(itemId: number, claimData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>(`/lost-found/items/${itemId}/claim`, claimData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to claim item', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'claimItem', itemId, claimData });
      throw new Error('Failed to claim item');
    }
  }

  // Emergency Operations
  async createEmergencyAlert(alertData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/emergency/alerts', alertData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to create emergency alert', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'createEmergencyAlert', alertData });
      throw new Error('Failed to create emergency alert');
    }
  }

  async getEmergencyAlerts(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/emergency/alerts');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch emergency alerts', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getEmergencyAlerts' });
      return [];
    }
  }

  async resolveAlert(alertId: number): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>(`/emergency/alerts/${alertId}/resolve`);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to resolve alert', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'resolveAlert', alertId });
      throw new Error('Failed to resolve alert');
    }
  }

  // Incident Operations
  async getIncidents(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/incidents');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch incidents', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getIncidents' });
      return [];
    }
  }

  async createIncident(incidentData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/incidents', incidentData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to create incident', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'createIncident', incidentData });
      throw new Error('Failed to create incident');
    }
  }

  async updateIncident(incidentId: number, updates: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.put<Record<string, unknown>>(`/incidents/${incidentId}`, updates);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to update incident', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'updateIncident', incidentId, updates });
      throw new Error('Failed to update incident');
    }
  }

  async escalateIncident(incidentId: number): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>(`/incidents/${incidentId}/escalate`);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to escalate incident', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'escalateIncident', incidentId });
      throw new Error('Failed to escalate incident');
    }
  }

  // Guest Safety Alert Operations
  async getGuestSafetyAlerts(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/guest-safety/alerts');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch guest safety alerts', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getGuestSafetyAlerts' });
      return [];
    }
  }

  async respondToAlert(alertId: number, responseData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const apiResponse = await this.apiService.post<Record<string, unknown>>(`/guest-safety/alerts/${alertId}/respond`, responseData);
      if (!apiResponse.data) {
        throw new Error('No data returned from API');
      }
      return apiResponse.data;
    } catch (error) {
      logger.error('Failed to respond to alert', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'respondToAlert', alertId, responseData });
      throw new Error('Failed to respond to alert');
    }
  }

  // Emergency Operations (Additional)
  async triggerEmergencyAlert(alertData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/emergency/trigger', alertData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to trigger emergency alert', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'triggerEmergencyAlert', alertData });
      throw new Error('Failed to trigger emergency alert');
    }
  }

  // ============= LOCKDOWN OPERATIONS =============
  async getLockdownStatus(): Promise<{ isActive: boolean; initiatedAt?: string; initiatedBy?: string; reason?: string; affectedZones: string[] }> {
    try {
      const response = await this.apiService.get<{ isActive: boolean; initiatedAt?: string; initiatedBy?: string; reason?: string; affectedZones: string[] }>('/lockdown/status');
      return response.data || { isActive: false, affectedZones: [] };
    } catch (error) {
      logger.error('Failed to get lockdown status', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getLockdownStatus' });
      return { isActive: false, affectedZones: [] };
    }
  }

  async getLockdownHardware(): Promise<Array<{ id: string; name: string; type: string; location: string; status: string; lastActivity: string }>> {
    try {
      const response = await this.apiService.get<Array<{ id: string; name: string; type: string; location: string; status: string; lastActivity: string }>>('/lockdown/hardware');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to get lockdown hardware', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getLockdownHardware' });
      return [];
    }
  }

  async getLockdownHistory(): Promise<Array<{ id: string; type: string; timestamp: string; initiatedBy: string; reason?: string; affectedHardware: string[]; status: string }>> {
    try {
      const response = await this.apiService.get<Array<{ id: string; type: string; timestamp: string; initiatedBy: string; reason?: string; affectedHardware: string[]; status: string }>>('/lockdown/history');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to get lockdown history', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getLockdownHistory' });
      return [];
    }
  }

  async initiateLockdown(lockdownData?: { reason?: string; affectedZones?: string[] }): Promise<{ isActive: boolean; initiatedAt: string; initiatedBy: string; reason?: string; affectedZones: string[] }> {
    try {
      const response = await this.apiService.post<{ isActive: boolean; initiatedAt: string; initiatedBy: string; reason?: string; affectedZones: string[] }>('/lockdown/initiate', lockdownData || {});
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to initiate lockdown', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'initiateLockdown', lockdownData });
      throw new Error('Failed to initiate lockdown');
    }
  }

  async cancelLockdown(): Promise<{ isActive: boolean; affectedZones: string[] }> {
    try {
      const response = await this.apiService.post<{ isActive: boolean; affectedZones: string[] }>('/lockdown/cancel', {});
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to cancel lockdown', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'cancelLockdown' });
      throw new Error('Failed to cancel lockdown');
    }
  }

  async testLockdown(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.apiService.post<{ success: boolean; message: string }>('/lockdown/test', {});
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to test lockdown', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'testLockdown' });
      throw new Error('Failed to test lockdown');
    }
  }

  async initiateEvacuation(evacuationData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/emergency/evacuation', evacuationData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to initiate evacuation', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'initiateEvacuation', evacuationData });
      throw new Error('Failed to initiate evacuation');
    }
  }

  // IoT Environmental Operations
  async getEnvironmentalData(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/iot/environmental');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch environmental data', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getEnvironmentalData' });
      return [];
    }
  }

  async adjustEnvironmentalSettings(settings: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/iot/environmental/settings', settings);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to adjust environmental settings', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'adjustEnvironmentalSettings', settings });
      throw new Error('Failed to adjust environmental settings');
    }
  }

  // Smart Lockers Operations
  async getLockerStatus(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/smart-lockers/status');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch locker status', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getLockerStatus' });
      return [];
    }
  }

  async assignLocker(assignmentData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/smart-lockers/assign', assignmentData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to assign locker', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'assignLocker', assignmentData });
      throw new Error('Failed to assign locker');
    }
  }

  // Smart Parking Operations
  async getParkingStatus(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/smart-parking/status');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch parking status', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getParkingStatus' });
      return [];
    }
  }

  async reserveParking(reservationData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/smart-parking/reserve', reservationData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to reserve parking', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'reserveParking', reservationData });
      throw new Error('Failed to reserve parking');
    }
  }

  // Lost and Found Operations (Alternative)
  async getLostAndFoundItems(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/lost-found');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch lost and found items', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getLostAndFoundItems' });
      return [];
    }
  }

  async reportItem(itemData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/lost-found/report', itemData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to report item', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'reportItem', itemData });
      throw new Error('Failed to report item');
    }
  }

  // Packages Operations
  async getPackages(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/packages');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch packages', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getPackages' });
      return [];
    }
  }

  async registerPackage(packageData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/packages/register', packageData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to register package', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'registerPackage', packageData });
      throw new Error('Failed to register package');
    }
  }

  async deliverPackage(packageId: number): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>(`/packages/${packageId}/deliver`);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to deliver package', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'deliverPackage', packageId });
      throw new Error('Failed to deliver package');
    }
  }

  // Banned Individuals Operations
  async getBannedIndividuals(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/banned-individuals');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch banned individuals', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getBannedIndividuals' });
      return [];
    }
  }

  async banIndividual(individualData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/banned-individuals/ban', individualData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to ban individual', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'banIndividual', individualData });
      throw new Error('Failed to ban individual');
    }
  }

  async unbanIndividual(individualId: number): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>(`/banned-individuals/${individualId}/unban`);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to unban individual', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'unbanIndividual', individualId });
      throw new Error('Failed to unban individual');
    }
  }

  // Digital Handover Operations
  async getHandoverReports(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/digital-handover/reports');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch handover reports', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getHandoverReports' });
      return [];
    }
  }

  async createHandoverReport(reportData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/digital-handover/reports', reportData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to create handover report', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'createHandoverReport', reportData });
      throw new Error('Failed to create handover report');
    }
  }

  async acknowledgeHandover(reportId: number): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>(`/digital-handover/reports/${reportId}/acknowledge`);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to acknowledge handover', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'acknowledgeHandover', reportId });
      throw new Error('Failed to acknowledge handover');
    }
  }

  // Team Chat Operations
  async getChatMessages(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/team-chat/messages');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch chat messages', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getChatMessages' });
      return [];
    }
  }

  async sendMessage(messageData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/team-chat/messages', messageData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to send message', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'sendMessage', messageData });
      throw new Error('Failed to send message');
    }
  }

  // Sound Monitoring Operations
  async getSoundAlerts(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/sound-monitoring/alerts');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch sound alerts', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getSoundAlerts' });
      return [];
    }
  }

  async acknowledgeSoundAlert(alertId: number): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>(`/sound-monitoring/alerts/${alertId}/acknowledge`);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to acknowledge sound alert', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'acknowledgeSoundAlert', alertId });
      throw new Error('Failed to acknowledge sound alert');
    }
  }

  // Event Log Operations
  async getEventLogs(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/event-logs');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch event logs', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getEventLogs' });
      return [];
    }
  }

  async exportEventLogs(format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const response = await this.apiService.get<Blob>(`/event-logs/export?format=${format}`, {
        responseType: 'blob'
      });
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to export event logs', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'exportEventLogs', format });
      throw new Error('Failed to export event logs');
    }
  }

  // Guards on Duty Operations
  async getGuardsOnDuty(): Promise<Record<string, unknown>[]> {
    try {
      const response = await this.apiService.get<Record<string, unknown>[]>('/guards-on-duty');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch guards on duty', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'getGuardsOnDuty' });
      return [];
    }
  }

  async assignGuard(assignmentData: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>('/guards-on-duty/assign', assignmentData);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to assign guard', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'assignGuard', assignmentData });
      throw new Error('Failed to assign guard');
    }
  }

  async relieveGuard(guardId: number): Promise<Record<string, unknown>> {
    try {
      const response = await this.apiService.post<Record<string, unknown>>(`/guards-on-duty/${guardId}/relieve`);
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to relieve guard', error instanceof Error ? error : new Error(String(error)), { module: 'ModuleService', action: 'relieveGuard', guardId });
      throw new Error('Failed to relieve guard');
    }
  }

} 