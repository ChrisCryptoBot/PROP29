import ApiService from './ApiService';

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

export interface AccessPoint {
  id: number;
  name: string;
  type: 'door' | 'gate' | 'elevator' | 'turnstile' | 'barrier';
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  hardwareVendor?: string;
  ipAddress?: string;
  lastAccess?: string;
}

export interface Credential {
  id: number;
  type: 'keycard' | 'biometric' | 'mobile' | 'pin' | 'qr_code';
  assignedTo: string;
  cardNumber?: string;
  pin?: string;
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
  status: 'active' | 'expired' | 'revoked';
}

export interface AccessEvent {
  id: number;
  accessPoint: string;
  credential: string;
  user: string;
  timestamp: string;
  result: 'granted' | 'denied' | 'timeout';
  reason?: string;
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

// Service class for all module operations
export class ModuleService {
  private static instance: ModuleService;
  private apiService: any;

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
      const response = await this.apiService.get('/patrols');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch patrols:', error);
      return [];
    }
  }

  async createPatrol(patrolData: Partial<ServicePatrol>): Promise<ServicePatrol> {
    try {
      const response = await this.apiService.post('/patrols', patrolData);
      return response.data;
    } catch (error) {
      console.error('Failed to create patrol:', error);
      throw new Error('Failed to create patrol');
    }
  }

  async updatePatrol(id: string, updates: Partial<ServicePatrol>): Promise<ServicePatrol> {
    try {
      const response = await this.apiService.put(`/patrols/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update patrol:', error);
      throw new Error('Failed to update patrol');
    }
  }

  async startPatrol(id: string): Promise<ServicePatrol> {
    try {
      const response = await this.apiService.post(`/patrols/${id}/start`);
      return response.data;
    } catch (error) {
      console.error('Failed to start patrol:', error);
      throw new Error('Failed to start patrol');
    }
  }

  async completePatrol(id: string): Promise<ServicePatrol> {
    try {
      const response = await this.apiService.post(`/patrols/${id}/complete`);
      return response.data;
    } catch (error) {
      console.error('Failed to complete patrol:', error);
      throw new Error('Failed to complete patrol');
    }
  }

  // Access Control Operations
  async getAccessPoints(): Promise<AccessPoint[]> {
    try {
      const response = await this.apiService.get('/access-points');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch access points:', error);
      return [];
    }
  }

  async createAccessPoint(accessPointData: Partial<AccessPoint>): Promise<AccessPoint> {
    try {
      const response = await this.apiService.post('/access-points', accessPointData);
      return response.data;
    } catch (error) {
      console.error('Failed to create access point:', error);
      throw new Error('Failed to create access point');
    }
  }

  async updateAccessPoint(id: number, updates: Partial<AccessPoint>): Promise<AccessPoint> {
    try {
      const response = await this.apiService.put(`/access-points/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update access point:', error);
      throw new Error('Failed to update access point');
    }
  }

  async deleteAccessPoint(id: number): Promise<void> {
    try {
      await this.apiService.delete(`/access-points/${id}`);
    } catch (error) {
      console.error('Failed to delete access point:', error);
      throw new Error('Failed to delete access point');
    }
  }

  async refreshAccessPoints(): Promise<AccessPoint[]> {
    try {
      const response = await this.apiService.get('/access-points/refresh');
      return response.data;
    } catch (error) {
      console.error('Failed to refresh access points:', error);
      return [];
    }
  }

  async getCredentials(): Promise<Credential[]> {
    try {
      const response = await this.apiService.get('/credentials');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
      return [];
    }
  }

  async createCredential(credentialData: Partial<Credential>): Promise<Credential> {
    try {
      const response = await this.apiService.post('/credentials', credentialData);
      return response.data;
    } catch (error) {
      console.error('Failed to create credential:', error);
      throw new Error('Failed to create credential');
    }
  }

  async updateCredential(id: number, updates: Partial<Credential>): Promise<Credential> {
    try {
      const response = await this.apiService.put(`/credentials/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update credential:', error);
      throw new Error('Failed to update credential');
    }
  }

  async revokeCredential(id: number): Promise<Credential> {
    try {
      const response = await this.apiService.post(`/credentials/${id}/revoke`);
      return response.data;
    } catch (error) {
      console.error('Failed to revoke credential:', error);
      throw new Error('Failed to revoke credential');
    }
  }

  async getAccessEvents(): Promise<AccessEvent[]> {
    try {
      const response = await this.apiService.get('/access-events');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch access events:', error);
      return [];
    }
  }

  async exportAccessEvents(format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const response = await this.apiService.get(`/access-events/export?format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export access events:', error);
      throw new Error('Failed to export access events');
    }
  }

  async filterAccessEvents(filters: any): Promise<AccessEvent[]> {
    try {
      const response = await this.apiService.post('/access-events/filter', filters);
      return response.data;
    } catch (error) {
      console.error('Failed to filter access events:', error);
      return [];
    }
  }

  // Predictive Event Intel Operations
  async getPredictionEvents(): Promise<PredictionEvent[]> {
    try {
      const response = await this.apiService.get('/prediction-events');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch prediction events:', error);
      return [];
    }
  }

  async updatePredictionStatus(id: number, status: PredictionEvent['status']): Promise<PredictionEvent> {
    try {
      const response = await this.apiService.put(`/prediction-events/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error('Failed to update prediction status:', error);
      throw new Error('Failed to update prediction status');
    }
  }

  async generatePredictionReport(): Promise<Blob> {
    try {
      const response = await this.apiService.get('/prediction-events/report', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate prediction report:', error);
      throw new Error('Failed to generate prediction report');
    }
  }

  async filterPredictions(filters: any): Promise<PredictionEvent[]> {
    try {
      const response = await this.apiService.post('/prediction-events/filter', filters);
      return response.data;
    } catch (error) {
      console.error('Failed to filter predictions:', error);
      return [];
    }
  }

  async trainModels(): Promise<void> {
    try {
      await this.apiService.post('/prediction-events/train-models');
    } catch (error) {
      console.error('Failed to train models:', error);
      throw new Error('Failed to train models');
    }
  }

  async deployModel(modelId: string): Promise<void> {
    try {
      await this.apiService.post(`/prediction-events/deploy-model/${modelId}`);
    } catch (error) {
      console.error('Failed to deploy model:', error);
      throw new Error('Failed to deploy model');
    }
  }

  // Admin Operations
  async createUser(userData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error('Failed to create user');
    }
  }

  async getUsers(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  }

  async updateUser(userId: number, updates: any): Promise<any> {
    try {
      const response = await this.apiService.put(`/admin/users/${userId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      await this.apiService.delete(`/admin/users/${userId}`);
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async getSystemConfigs(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/admin/system-configs');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system configs:', error);
      return [];
    }
  }

  async updateSystemConfig(configId: string, value: any): Promise<any> {
    try {
      const response = await this.apiService.put(`/admin/system-configs/${configId}`, { value });
      return response.data;
    } catch (error) {
      console.error('Failed to update system config:', error);
      throw new Error('Failed to update system config');
    }
  }

  async createIntegration(integrationData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/admin/integrations', integrationData);
      return response.data;
    } catch (error) {
      console.error('Failed to create integration:', error);
      throw new Error('Failed to create integration');
    }
  }

  async getIntegrations(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/admin/integrations');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      return [];
    }
  }

  async testIntegration(integrationId: string): Promise<any> {
    try {
      const response = await this.apiService.post(`/admin/integrations/${integrationId}/test`);
      return response.data;
    } catch (error) {
      console.error('Failed to test integration:', error);
      throw new Error('Failed to test integration');
    }
  }


  // Guest Safety Operations
  async createSafetyIncident(incidentData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/guest-safety/incidents', incidentData);
      return response.data;
    } catch (error) {
      console.error('Failed to create safety incident:', error);
      throw new Error('Failed to create safety incident');
    }
  }

  async getSafetyIncidents(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/guest-safety/incidents');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch safety incidents:', error);
      return [];
    }
  }

  async updateSafetyIncident(incidentId: number, updates: any): Promise<any> {
    try {
      const response = await this.apiService.put(`/guest-safety/incidents/${incidentId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update safety incident:', error);
      throw new Error('Failed to update safety incident');
    }
  }

  // Visitors Operations
  async createVisitor(visitorData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/visitors', visitorData);
      return response.data;
    } catch (error) {
      console.error('Failed to create visitor:', error);
      throw new Error('Failed to create visitor');
    }
  }

  async getVisitors(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/visitors');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
      return [];
    }
  }

  async checkOutVisitor(visitorId: number): Promise<any> {
    try {
      const response = await this.apiService.post(`/visitors/${visitorId}/checkout`);
      return response.data;
    } catch (error) {
      console.error('Failed to check out visitor:', error);
      throw new Error('Failed to check out visitor');
    }
  }

  // Lost and Found Operations
  async createLostItem(itemData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/lost-found/items', itemData);
      return response.data;
    } catch (error) {
      console.error('Failed to create lost item:', error);
      throw new Error('Failed to create lost item');
    }
  }

  async getLostItems(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/lost-found/items');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch lost items:', error);
      return [];
    }
  }

  async claimItem(itemId: number, claimData: any): Promise<any> {
    try {
      const response = await this.apiService.post(`/lost-found/items/${itemId}/claim`, claimData);
      return response.data;
    } catch (error) {
      console.error('Failed to claim item:', error);
      throw new Error('Failed to claim item');
    }
  }

  // Emergency Operations
  async createEmergencyAlert(alertData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/emergency/alerts', alertData);
      return response.data;
    } catch (error) {
      console.error('Failed to create emergency alert:', error);
      throw new Error('Failed to create emergency alert');
    }
  }

  async getEmergencyAlerts(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/emergency/alerts');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch emergency alerts:', error);
      return [];
    }
  }

  async resolveAlert(alertId: number): Promise<any> {
    try {
      const response = await this.apiService.post(`/emergency/alerts/${alertId}/resolve`);
      return response.data;
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      throw new Error('Failed to resolve alert');
    }
  }

  // Incident Operations
  async getIncidents(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/incidents');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      return [];
    }
  }

  async createIncident(incidentData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/incidents', incidentData);
      return response.data;
    } catch (error) {
      console.error('Failed to create incident:', error);
      throw new Error('Failed to create incident');
    }
  }

  async updateIncident(incidentId: number, updates: any): Promise<any> {
    try {
      const response = await this.apiService.put(`/incidents/${incidentId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update incident:', error);
      throw new Error('Failed to update incident');
    }
  }

  async escalateIncident(incidentId: number): Promise<any> {
    try {
      const response = await this.apiService.post(`/incidents/${incidentId}/escalate`);
      return response.data;
    } catch (error) {
      console.error('Failed to escalate incident:', error);
      throw new Error('Failed to escalate incident');
    }
  }

  // Guest Safety Alert Operations
  async getGuestSafetyAlerts(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/guest-safety/alerts');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch guest safety alerts:', error);
      return [];
    }
  }

  async respondToAlert(alertId: number, response: any): Promise<any> {
    try {
      const apiResponse = await this.apiService.post(`/guest-safety/alerts/${alertId}/respond`, response);
      return apiResponse.data;
    } catch (error) {
      console.error('Failed to respond to alert:', error);
      throw new Error('Failed to respond to alert');
    }
  }

  // Emergency Operations
  async triggerEmergencyAlert(alertData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/emergency/trigger', alertData);
      return response.data;
    } catch (error) {
      console.error('Failed to trigger emergency alert:', error);
      throw new Error('Failed to trigger emergency alert');
    }
  }

  async initiateLockdown(lockdownData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/emergency/lockdown', lockdownData);
      return response.data;
    } catch (error) {
      console.error('Failed to initiate lockdown:', error);
      throw new Error('Failed to initiate lockdown');
    }
  }

  async initiateEvacuation(evacuationData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/emergency/evacuation', evacuationData);
      return response.data;
    } catch (error) {
      console.error('Failed to initiate evacuation:', error);
      throw new Error('Failed to initiate evacuation');
    }
  }

  // IoT Environmental Operations
  async getEnvironmentalData(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/iot/environmental');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch environmental data:', error);
      return [];
    }
  }

  async adjustEnvironmentalSettings(settings: any): Promise<any> {
    try {
      const response = await this.apiService.post('/iot/environmental/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Failed to adjust environmental settings:', error);
      throw new Error('Failed to adjust environmental settings');
    }
  }

  // Smart Lockers Operations
  async getLockerStatus(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/smart-lockers/status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch locker status:', error);
      return [];
    }
  }

  async assignLocker(assignmentData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/smart-lockers/assign', assignmentData);
      return response.data;
    } catch (error) {
      console.error('Failed to assign locker:', error);
      throw new Error('Failed to assign locker');
    }
  }

  // Smart Parking Operations
  async getParkingStatus(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/smart-parking/status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch parking status:', error);
      return [];
    }
  }

  async reserveParking(reservationData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/smart-parking/reserve', reservationData);
      return response.data;
    } catch (error) {
      console.error('Failed to reserve parking:', error);
      throw new Error('Failed to reserve parking');
    }
  }

  // Lost and Found Operations (Alternative)
  async getLostAndFoundItems(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/lost-found');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch lost and found items:', error);
      return [];
    }
  }

  async reportItem(itemData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/lost-found/report', itemData);
      return response.data;
    } catch (error) {
      console.error('Failed to report item:', error);
      throw new Error('Failed to report item');
    }
  }

  // Packages Operations
  async getPackages(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/packages');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      return [];
    }
  }

  async registerPackage(packageData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/packages/register', packageData);
      return response.data;
    } catch (error) {
      console.error('Failed to register package:', error);
      throw new Error('Failed to register package');
    }
  }

  async deliverPackage(packageId: number): Promise<any> {
    try {
      const response = await this.apiService.post(`/packages/${packageId}/deliver`);
      return response.data;
    } catch (error) {
      console.error('Failed to deliver package:', error);
      throw new Error('Failed to deliver package');
    }
  }

  // Banned Individuals Operations
  async getBannedIndividuals(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/banned-individuals');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch banned individuals:', error);
      return [];
    }
  }

  async banIndividual(individualData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/banned-individuals/ban', individualData);
      return response.data;
    } catch (error) {
      console.error('Failed to ban individual:', error);
      throw new Error('Failed to ban individual');
    }
  }

  async unbanIndividual(individualId: number): Promise<any> {
    try {
      const response = await this.apiService.post(`/banned-individuals/${individualId}/unban`);
      return response.data;
    } catch (error) {
      console.error('Failed to unban individual:', error);
      throw new Error('Failed to unban individual');
    }
  }

  // Digital Handover Operations
  async getHandoverReports(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/digital-handover/reports');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch handover reports:', error);
      return [];
    }
  }

  async createHandoverReport(reportData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/digital-handover/reports', reportData);
      return response.data;
    } catch (error) {
      console.error('Failed to create handover report:', error);
      throw new Error('Failed to create handover report');
    }
  }

  async acknowledgeHandover(reportId: number): Promise<any> {
    try {
      const response = await this.apiService.post(`/digital-handover/reports/${reportId}/acknowledge`);
      return response.data;
    } catch (error) {
      console.error('Failed to acknowledge handover:', error);
      throw new Error('Failed to acknowledge handover');
    }
  }

  // Team Chat Operations
  async getChatMessages(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/team-chat/messages');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
      return [];
    }
  }

  async sendMessage(messageData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/team-chat/messages', messageData);
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('Failed to send message');
    }
  }

  // Sound Monitoring Operations
  async getSoundAlerts(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/sound-monitoring/alerts');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch sound alerts:', error);
      return [];
    }
  }

  async acknowledgeSoundAlert(alertId: number): Promise<any> {
    try {
      const response = await this.apiService.post(`/sound-monitoring/alerts/${alertId}/acknowledge`);
      return response.data;
    } catch (error) {
      console.error('Failed to acknowledge sound alert:', error);
      throw new Error('Failed to acknowledge sound alert');
    }
  }

  // Event Log Operations
  async getEventLogs(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/event-logs');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch event logs:', error);
      return [];
    }
  }

  async exportEventLogs(format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const response = await this.apiService.get(`/event-logs/export?format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export event logs:', error);
      throw new Error('Failed to export event logs');
    }
  }

  // Guards on Duty Operations
  async getGuardsOnDuty(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/guards-on-duty');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch guards on duty:', error);
      return [];
    }
  }

  async assignGuard(assignmentData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/guards-on-duty/assign', assignmentData);
      return response.data;
    } catch (error) {
      console.error('Failed to assign guard:', error);
      throw new Error('Failed to assign guard');
    }
  }

  async relieveGuard(guardId: number): Promise<any> {
    try {
      const response = await this.apiService.post(`/guards-on-duty/${guardId}/relieve`);
      return response.data;
    } catch (error) {
      console.error('Failed to relieve guard:', error);
      throw new Error('Failed to relieve guard');
    }
  }

} 