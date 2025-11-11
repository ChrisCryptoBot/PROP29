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
      return this.getMockPatrols();
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
      return this.getMockAccessPoints();
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
      return this.getMockAccessPoints();
    }
  }

  async getCredentials(): Promise<Credential[]> {
    try {
      const response = await this.apiService.get('/credentials');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
      return this.getMockCredentials();
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
      return this.getMockAccessEvents();
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
      return this.getMockAccessEvents();
    }
  }

  // Predictive Event Intel Operations
  async getPredictionEvents(): Promise<PredictionEvent[]> {
    try {
      const response = await this.apiService.get('/prediction-events');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch prediction events:', error);
      return this.getMockPredictionEvents();
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
      return this.getMockPredictionEvents();
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

  // Advanced Reports Operations
  async createReport(reportData: any): Promise<any> {
    try {
      const response = await this.apiService.post('/reports', reportData);
      return response.data;
    } catch (error) {
      console.error('Failed to create report:', error);
      throw new Error('Failed to create report');
    }
  }

  async getReports(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/reports');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      return this.getMockReports();
    }
  }

  async exportReport(reportId: string, format: 'pdf' | 'csv' = 'pdf'): Promise<Blob> {
    try {
      const response = await this.apiService.get(`/reports/${reportId}/export?format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export report:', error);
      throw new Error('Failed to export report');
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
      return this.getMockUsers();
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
      return this.getMockSystemConfigs();
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
      return this.getMockIntegrations();
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

  // Cybersecurity Operations
  async getThreats(): Promise<any[]> {
    try {
      const response = await this.apiService.get('/cybersecurity/threats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch threats:', error);
      return this.getMockThreats();
    }
  }

  async updateThreatStatus(threatId: number, status: string): Promise<any> {
    try {
      const response = await this.apiService.put(`/cybersecurity/threats/${threatId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Failed to update threat status:', error);
      throw new Error('Failed to update threat status');
    }
  }

  async runSecurityScan(): Promise<any> {
    try {
      const response = await this.apiService.post('/cybersecurity/scan');
      return response.data;
    } catch (error) {
      console.error('Failed to run security scan:', error);
      throw new Error('Failed to run security scan');
    }
  }

  async blockThreat(threatId: number): Promise<any> {
    try {
      const response = await this.apiService.post(`/cybersecurity/threats/${threatId}/block`);
      return response.data;
    } catch (error) {
      console.error('Failed to block threat:', error);
      throw new Error('Failed to block threat');
    }
  }

  async investigateThreat(threatId: number): Promise<any> {
    try {
      const response = await this.apiService.post(`/cybersecurity/threats/${threatId}/investigate`);
      return response.data;
    } catch (error) {
      console.error('Failed to investigate threat:', error);
      throw new Error('Failed to investigate threat');
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
      return this.getMockSafetyIncidents();
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
      return this.getMockVisitors();
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
      return this.getMockLostItems();
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
      return this.getMockEmergencyAlerts();
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
      return this.getMockSoundAlerts();
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
      return this.getMockEventLogs();
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
      return this.getMockGuardsOnDuty();
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

  // Mock Data Methods
  private getMockPatrols(): ServicePatrol[] {
    return [
      {
        id: '1',
        route_name: 'Perimeter Check',
        assigned_officer: 'Officer Smith',
        route_description: 'Complete perimeter security check',
        start_time: '2024-01-15T08:00:00Z',
        status: 'in_progress',
        notes: 'All checkpoints clear',
        location: 'Main Building',
        duration: '2 hours',
        checkpoints: ['Gate A', 'Gate B', 'Gate C'],
        completedCheckpoints: 2
      },
      {
        id: '2',
        route_name: 'Interior Patrol',
        assigned_officer: 'Officer Johnson',
        route_description: 'Internal building security check',
        start_time: '2024-01-15T09:00:00Z',
        status: 'scheduled',
        notes: 'Scheduled for morning shift',
        location: 'Office Complex',
        duration: '1.5 hours',
        checkpoints: ['Lobby', 'Floor 1', 'Floor 2', 'Parking'],
        completedCheckpoints: 0
      }
    ];
  }

  private getMockAccessPoints(): AccessPoint[] {
    return [
      {
        id: 1,
        name: 'Main Entrance',
        type: 'door',
        location: 'Building A - Ground Floor',
        status: 'active',
        hardwareVendor: 'HID Global',
        ipAddress: '192.168.1.100',
        lastAccess: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: 'Parking Gate',
        type: 'gate',
        location: 'Parking Lot A',
        status: 'active',
        hardwareVendor: 'Bosch',
        ipAddress: '192.168.1.101',
        lastAccess: '2024-01-15T09:45:00Z'
      }
    ];
  }

  private getMockCredentials(): Credential[] {
    return [
      {
        id: 1,
        type: 'keycard',
        assignedTo: 'John Doe',
        cardNumber: 'CARD001',
        expiresAt: '2024-12-31T23:59:59Z',
        maxUses: 1000,
        currentUses: 45,
        status: 'active'
      },
      {
        id: 2,
        type: 'biometric',
        assignedTo: 'Jane Smith',
        expiresAt: '2024-12-31T23:59:59Z',
        maxUses: 500,
        currentUses: 23,
        status: 'active'
      }
    ];
  }

  private getMockAccessEvents(): AccessEvent[] {
    return [
      {
        id: 1,
        accessPoint: 'Main Entrance',
        credential: 'CARD001',
        user: 'John Doe',
        timestamp: '2024-01-15T10:30:00Z',
        result: 'granted'
      },
      {
        id: 2,
        accessPoint: 'Parking Gate',
        credential: 'BIOMETRIC002',
        user: 'Jane Smith',
        timestamp: '2024-01-15T09:45:00Z',
        result: 'granted'
      }
    ];
  }

  private getMockPredictionEvents(): PredictionEvent[] {
    return [
      {
        id: 1,
        type: 'Security Breach',
        probability: 0.85,
        location: 'Building A - Floor 3',
        timestamp: '2024-01-15T11:00:00Z',
        severity: 'high',
        description: 'Unusual access pattern detected',
        status: 'investigating'
      },
      {
        id: 2,
        type: 'Equipment Failure',
        probability: 0.72,
        location: 'Parking Lot B',
        timestamp: '2024-01-15T10:30:00Z',
        severity: 'medium',
        description: 'Camera system showing signs of failure',
        status: 'pending'
      }
    ];
  }

  private getMockReports(): any[] {
    return [
      {
        id: '1',
        title: 'Monthly Security Report',
        type: 'security',
        createdBy: 'Admin User',
        createdAt: '2024-01-15T00:00:00Z',
        status: 'completed'
      },
      {
        id: '2',
        title: 'Access Control Audit',
        type: 'audit',
        createdBy: 'Security Manager',
        createdAt: '2024-01-14T00:00:00Z',
        status: 'in_progress'
      }
    ];
  }

  private getMockUsers(): any[] {
    return [
      {
        id: 1,
        username: 'admin',
        email: 'admin@company.com',
        role: 'admin',
        status: 'active',
        lastLogin: '2024-01-15T08:00:00Z'
      },
      {
        id: 2,
        username: 'security_manager',
        email: 'security@company.com',
        role: 'manager',
        status: 'active',
        lastLogin: '2024-01-15T07:30:00Z'
      }
    ];
  }

  private getMockSystemConfigs(): any[] {
    return [
      {
        id: 'security_level',
        name: 'Security Level',
        value: 'high',
        description: 'Current security level setting'
      },
      {
        id: 'alert_threshold',
        name: 'Alert Threshold',
        value: '75',
        description: 'Percentage threshold for alerts'
      }
    ];
  }

  private getMockIntegrations(): any[] {
    return [
      {
        id: '1',
        name: 'CCTV System',
        type: 'camera',
        status: 'connected',
        lastSync: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        name: 'Access Control',
        type: 'access',
        status: 'connected',
        lastSync: '2024-01-15T09:45:00Z'
      }
    ];
  }

  private getMockThreats(): any[] {
    return [
      {
        id: 1,
        type: 'Unauthorized Access',
        severity: 'high',
        location: 'Building A',
        timestamp: '2024-01-15T10:30:00Z',
        status: 'active'
      },
      {
        id: 2,
        type: 'Suspicious Activity',
        severity: 'medium',
        location: 'Parking Lot',
        timestamp: '2024-01-15T09:15:00Z',
        status: 'investigating'
      }
    ];
  }

  private getMockSafetyIncidents(): any[] {
    return [
      {
        id: 1,
        type: 'Medical Emergency',
        location: 'Building B - Floor 2',
        timestamp: '2024-01-15T11:00:00Z',
        status: 'resolved',
        description: 'Employee reported feeling unwell'
      },
      {
        id: 2,
        type: 'Fire Alarm',
        location: 'Building A',
        timestamp: '2024-01-15T10:45:00Z',
        status: 'investigating',
        description: 'Fire alarm triggered, investigation ongoing'
      }
    ];
  }

  private getMockVisitors(): any[] {
    return [
      {
        id: 1,
        name: 'John Smith',
        company: 'ABC Corp',
        purpose: 'Meeting',
        checkIn: '2024-01-15T09:00:00Z',
        status: 'checked_in'
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        company: 'XYZ Inc',
        purpose: 'Delivery',
        checkIn: '2024-01-15T08:30:00Z',
        status: 'checked_out'
      }
    ];
  }

  private getMockLostItems(): any[] {
    return [
      {
        id: 1,
        item: 'iPhone 13',
        location: 'Cafeteria',
        reportedBy: 'Jane Doe',
        reportedAt: '2024-01-15T10:00:00Z',
        status: 'found'
      },
      {
        id: 2,
        item: 'Laptop Bag',
        location: 'Conference Room A',
        reportedBy: 'Mike Wilson',
        reportedAt: '2024-01-15T09:30:00Z',
        status: 'claimed'
      }
    ];
  }

  private getMockEmergencyAlerts(): any[] {
    return [
      {
        id: 1,
        type: 'Fire Alarm',
        location: 'Building A',
        timestamp: '2024-01-15T11:00:00Z',
        severity: 'high',
        status: 'active'
      },
      {
        id: 2,
        type: 'Medical Emergency',
        location: 'Building B',
        timestamp: '2024-01-15T10:30:00Z',
        severity: 'medium',
        status: 'resolved'
      }
    ];
  }

  private getMockSoundAlerts(): any[] {
    return [
      {
        id: 1,
        type: 'Glass Break',
        location: 'Building A - Floor 1',
        timestamp: '2024-01-15T11:15:00Z',
        decibelLevel: 85,
        status: 'investigating'
      },
      {
        id: 2,
        type: 'Gunshot Detection',
        location: 'Parking Lot',
        timestamp: '2024-01-15T10:45:00Z',
        decibelLevel: 120,
        status: 'false_positive'
      }
    ];
  }

  private getMockEventLogs(): any[] {
    return [
      {
        id: 1,
        event: 'User Login',
        user: 'admin',
        timestamp: '2024-01-15T08:00:00Z',
        details: 'Successful login from 192.168.1.100'
      },
      {
        id: 2,
        event: 'Access Granted',
        user: 'john.doe',
        timestamp: '2024-01-15T07:45:00Z',
        details: 'Access to Building A granted via keycard'
      }
    ];
  }

  private getMockGuardsOnDuty(): any[] {
    return [
      {
        id: 1,
        name: 'Officer Smith',
        badge: 'G001',
        location: 'Building A',
        shift: 'Morning',
        status: 'on_duty',
        startTime: '2024-01-15T06:00:00Z'
      },
      {
        id: 2,
        name: 'Officer Johnson',
        badge: 'G002',
        location: 'Building B',
        shift: 'Morning',
        status: 'on_duty',
        startTime: '2024-01-15T06:00:00Z'
      }
    ];
  }
} 