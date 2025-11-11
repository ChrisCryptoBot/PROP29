import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface BannedIndividual {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  reason: string;
  ban_type: string;
  ban_start_date: string;
  ban_end_date: string;
  identification_number: string;
  identification_type: string;
  photo_url?: string;
  notes: string;
  name: string;
  status: 'active' | 'expired' | 'removed';
  banned_date: string;
  banned_by: string;
  expiry_date?: string;
  id_proof_type?: string;
  id_proof_number?: string;
  risk_level?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GuestSafetyIncident {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'resolved';
  reported_by: string;
  reported_at: string;
  resolved_at?: string;
  resolved_by?: string;
  guest_involved?: string;
  room_number?: string;
  contact_info?: string;
}

export interface GuestSafetyAlert {
  id: string;
  title: string;
  message: string;
  alert_type: 'emergency' | 'warning' | 'info';
  location: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
}

export interface Handover {
  id: string;
  shift_type: 'morning' | 'afternoon' | 'night';
  handover_from: string;
  handover_to: string;
  handover_date: string;
  status: 'pending' | 'completed' | 'overdue';
  incidents_summary: string;
  pending_tasks: string[];
  special_instructions: string;
  weather_conditions?: string;
  security_alerts?: string[];
  equipment_status: string;
  created_at: string;
  completed_at?: string;
  shift_date?: string;
  shift_time?: string;
  handover_notes?: string;
  equipment_issues?: string;
  security_concerns?: string;
  weather_report?: string;
  next_shift_instructions?: string;
}

export interface Event {
  id: string;
  event_type: 'security' | 'access' | 'maintenance' | 'alert' | 'system';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  timestamp: string;
  user_id?: string;
  user_name?: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  metadata?: Record<string, any>;
  message?: string;
  source?: string;
}

export interface Report {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  file_url?: string;
  parameters: any;
}

export interface LostFoundItem {
  id: string;
  item_name: string;
  description: string;
  location_found: string;
  date_found: string;
  status: 'found' | 'claimed' | 'disposed';
  finder_name?: string;
  contact_info?: string;
  category: 'electronics' | 'clothing' | 'jewelry' | 'documents' | 'other';
  location_lost?: string;
  value_estimate?: string | number;
  color?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  notes?: string;
  expiry_date?: string;
  photo_url?: string;
  found_date?: string;
  ai_match_confidence?: number;
  found_by?: string;
  claimed_by?: string;
  claim_date?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at?: string;
}

export interface LostFoundAnalytics {
  total_items: number;
  found_items: number;
  claimed_items: number;
  returned_items: number;
  items_by_location: Record<string, number>;
  items_by_status: Record<string, number>;
  recent_activity: any[];
  trends: any[];
  monthly_items: { month: string; found: number; claimed: number }[];
  items_by_category: Record<string, number>;
}

export interface Package {
  id: string;
  recipient_name: string;
  sender: string;
  tracking_number?: string;
  date_received: string;
  status: 'pending' | 'delivered' | 'returned';
  location: string;
  notes?: string;
  recipient_phone?: string;
  recipient_email?: string;
  recipient_room?: string;
  sender_name?: string;
  sender_company?: string;
  sender_phone?: string;
  sender_email?: string;
  package_type?: string;
  weight?: string;
  dimensions?: string;
  insurance_value?: string;
  special_instructions?: string;
  expiry_date?: string;
  package_size?: string;
  description?: string;
  received_date?: string;
  signature_required?: boolean;
}

export interface PackageAnalytics {
  total_packages: number;
  received_today: number;
  delivered_today: number;
  pending_delivery: number;
  packages_by_status: Record<string, number>;
  packages_by_location: Record<string, number>;
  recent_activity: any[];
  trends: any[];
  expired_packages: number;
  packages_by_type: Record<string, number>;
  daily_packages: { date: string; count: number }[];
  average_delivery_time: number;
  delivery_success_rate: number;
  most_active_senders: { name: string; count: number }[];
}

export interface SecurityThreat {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  status: 'active' | 'resolved' | 'investigating';
  affected_systems?: string[];
  threat_type?: 'malware' | 'phishing' | 'ddos' | 'brute_force' | 'data_breach' | 'unauthorized_access';
  source_ip?: string;
  target_system?: string;
  mitigation_action?: string;
  resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export interface SecurityAnalytics {
  total_threats: number;
  active_threats: number;
  critical_threats: number;
  threats_by_type: Record<string, number>;
  threats_by_severity: Record<string, number>;
  recent_threats: any[];
  trends: any[];
  hourly_threats: { hour: string; count: number }[];
  security_score: number;
  blocked_attempts: number;
}

export interface EnvironmentalData {
  id: string;
  sensor_id: string;
  temperature: number;
  humidity: number;
  air_quality: number;
  timestamp: string;
  location: string;
  sensor_type: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical' | 'offline';
  noise_level?: number;
  light_level?: number;
}

export interface EnvironmentalAlert {
  id: string;
  alert_type: 'temperature' | 'humidity' | 'air_quality' | 'fire' | 'flood';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  location: string;
  status: 'active' | 'acknowledged' | 'resolved';
  sensor_id: string;
  resolved: boolean;
  acknowledged: boolean;
}

export interface Patrol {
  id: string;
  route_name: string;
  route_description: string;
  assigned_officer: string;
  officer_phone: string;
  officer_email: string;
  start_time: string;
  priority: string;
  weather_conditions: string;
  notes: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  guard_name: string;
  checkpoints: string[];
  end_time?: string;
  incidents?: any[];
}

export interface Locker {
  id: string;
  locker_number: string;
  location: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  assigned_user?: string;
  assigned_at?: string;
  size: string;
  features: string[];
}

export interface ParkingSpace {
  id: string;
  space_number: string;
  location: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  assigned_user?: string;
  assigned_at?: string;
  vehicle_info?: string;
  space_type: 'standard' | 'handicap' | 'electric' | 'vip';
}

export interface Visitor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  purpose: string;
  host_name: string;
  host_phone: string;
  host_email: string;
  expected_duration: number;
  location: string;
  id_proof_type: string;
  id_proof_number: string;
  vehicle_number: string;
  notes: string;
  status: 'scheduled' | 'checked_in' | 'checked_out' | 'cancelled';
  name: string;
  host_room?: string;
  check_in_time?: string;
  check_out_time?: string;
  badge_id?: string;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        // Add authentication token to requests
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.config.url} - ${response.status}`);
        return response;
      },
      (error: AxiosError) => {
        console.error(`API Error: ${error.config?.url} - ${error.response?.status}`);
        return Promise.reject(error);
      }
    );
  }

  private async handleRequest<T>(
    request: () => Promise<AxiosResponse<T>>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await request();
      return {
        data: response.data,
        success: true,
        message: 'Request successful'
      };
    } catch (error: any) {
      console.error('API request failed:', error);
      return {
        error: error.response?.data?.message || error.message || 'Request failed',
        success: false,
        data: undefined
      };
    }
  }

  // Lost & Found Methods
  async getLostFoundItems(params?: any): Promise<ApiResponse<LostFoundItem[]>> {
    return this.handleRequest(() => this.api.get('/lost-found', { params }));
  }

  async createLostFoundItem(item: Omit<LostFoundItem, 'id'>): Promise<ApiResponse<LostFoundItem>> {
    return this.handleRequest(() => this.api.post('/lost-found', item));
  }

  async updateLostFoundItem(id: string, item: Partial<LostFoundItem>): Promise<ApiResponse<LostFoundItem>> {
    return this.handleRequest(() => this.api.put(`/lost-found/${id}`, item));
  }

  async deleteLostFoundItem(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() => this.api.delete(`/lost-found/${id}`));
  }

  async claimLostFoundItem(id: string, claimData: any): Promise<ApiResponse<LostFoundItem>> {
    return this.handleRequest(() => this.api.post(`/lost-found/${id}/claim`, claimData));
  }

  async findLostFoundMatches(id: string): Promise<ApiResponse<LostFoundItem[]>> {
    return this.handleRequest(() => this.api.get(`/lost-found/${id}/matches`));
  }

  async getLostFoundAnalytics(): Promise<ApiResponse<LostFoundAnalytics>> {
    return this.handleRequest(() => this.api.get('/lost-found/analytics'));
  }

  // Package Methods
  async getPackages(params?: any): Promise<ApiResponse<Package[]>> {
    return this.handleRequest(() => this.api.get('/packages', { params }));
  }

  async createPackage(pkg: Omit<Package, 'id'>): Promise<ApiResponse<Package>> {
    return this.handleRequest(() => this.api.post('/packages', pkg));
  }

  async updatePackage(id: string, pkg: Partial<Package>): Promise<ApiResponse<Package>> {
    return this.handleRequest(() => this.api.put(`/packages/${id}`, pkg));
  }

  async deletePackage(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() => this.api.delete(`/packages/${id}`));
  }

  async deliverPackage(id: string): Promise<ApiResponse<Package>> {
    return this.handleRequest(() => this.api.post(`/packages/${id}/deliver`));
  }

  async notifyPackageRecipient(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() => this.api.post(`/packages/${id}/notify`));
  }

  async getPackageAnalytics(): Promise<ApiResponse<PackageAnalytics>> {
    return this.handleRequest(() => this.api.get('/packages/analytics'));
  }

  // Security Methods
  async getSecurityThreats(params?: any): Promise<ApiResponse<SecurityThreat[]>> {
    return this.handleRequest(() => this.api.get('/cybersecurity/threats', { params }));
  }

  async createSecurityThreat(threat: Omit<SecurityThreat, 'id'>): Promise<ApiResponse<SecurityThreat>> {
    return this.handleRequest(() => this.api.post('/cybersecurity/threats', threat));
  }

  async updateSecurityThreat(id: string, threat: Partial<SecurityThreat>): Promise<ApiResponse<SecurityThreat>> {
    return this.handleRequest(() => this.api.put(`/cybersecurity/threats/${id}`, threat));
  }

  async deleteSecurityThreat(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() => this.api.delete(`/cybersecurity/threats/${id}`));
  }

  async getSecurityAnalytics(): Promise<ApiResponse<SecurityAnalytics>> {
    return this.handleRequest(() => this.api.get('/cybersecurity/analytics'));
  }

  async getSecurityAlerts(params?: any): Promise<ApiResponse<SecurityThreat[]>> {
    return this.getSecurityThreats(params);
  }

  async createSecurityAlert(alert: Omit<SecurityThreat, 'id'>): Promise<ApiResponse<SecurityThreat>> {
    return this.createSecurityThreat(alert);
  }

  // Environmental/IoT Methods
  async getEnvironmentalData(params?: any): Promise<ApiResponse<EnvironmentalData[]>> {
    return this.handleRequest(() => this.api.get('/iot/environmental', { params }));
  }

  async getEnvironmentalAlerts(params?: any): Promise<ApiResponse<EnvironmentalAlert[]>> {
    return this.handleRequest(() => this.api.get('/iot/environmental/alerts', { params }));
  }

  async getEnvironmentalAnalytics(): Promise<ApiResponse<any>> {
    return this.handleRequest(() => this.api.get('/iot/environmental/analytics'));
  }

  async createEnvironmentalAlert(alert: Omit<EnvironmentalAlert, 'id'>): Promise<ApiResponse<EnvironmentalAlert>> {
    return this.handleRequest(() => this.api.post('/iot/environmental/alerts', alert));
  }

  async updateEnvironmentalAlert(id: string, alert: Partial<EnvironmentalAlert>): Promise<ApiResponse<EnvironmentalAlert>> {
    return this.handleRequest(() => this.api.put(`/iot/environmental/alerts/${id}`, alert));
  }

  async deleteEnvironmentalAlert(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() => this.api.delete(`/iot/environmental/alerts/${id}`));
  }

  // Visitor Methods
  async getVisitors(params?: any): Promise<ApiResponse<Visitor[]>> {
    return this.handleRequest(() => this.api.get('/visitors', { params }));
  }

  async createVisitor(visitor: Omit<Visitor, 'id'>): Promise<ApiResponse<Visitor>> {
    return this.handleRequest(() => this.api.post('/visitors', visitor));
  }

  async updateVisitor(id: string, visitor: Partial<Visitor>): Promise<ApiResponse<Visitor>> {
    return this.handleRequest(() => this.api.put(`/visitors/${id}`, visitor));
  }

  async deleteVisitor(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() => this.api.delete(`/visitors/${id}`));
  }

  async checkInVisitor(id: string): Promise<ApiResponse<Visitor>> {
    return this.handleRequest(() => this.api.post(`/visitors/${id}/check-in`));
  }

  async checkOutVisitor(id: string): Promise<ApiResponse<Visitor>> {
    return this.handleRequest(() => this.api.post(`/visitors/${id}/check-out`));
  }

  async getVisitorAnalytics(): Promise<ApiResponse<any>> {
    return this.handleRequest(() => this.api.get('/visitors/analytics'));
  }

  // Patrol Methods
  async getPatrols(params?: any): Promise<ApiResponse<Patrol[]>> {
    return this.handleRequest(() => this.api.get('/patrols', { params }));
  }

  async getPatrolRoutes(params?: any): Promise<ApiResponse<Patrol[]>> {
    return this.getPatrols(params);
  }

  async createPatrol(patrol: Omit<Patrol, 'id'>): Promise<ApiResponse<Patrol>> {
    return this.handleRequest(() => this.api.post('/patrols', patrol));
  }

  async createPatrolRoute(route: Omit<Patrol, 'id'>): Promise<ApiResponse<Patrol>> {
    return this.createPatrol(route);
  }

  async updatePatrol(id: string, patrol: Partial<Patrol>): Promise<ApiResponse<Patrol>> {
    return this.handleRequest(() => this.api.put(`/patrols/${id}`, patrol));
  }

  async updatePatrolRoute(id: string, route: Partial<Patrol>): Promise<ApiResponse<Patrol>> {
    return this.updatePatrol(id, route);
  }

  async deletePatrol(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() => this.api.delete(`/patrols/${id}`));
  }

  async deletePatrolRoute(id: string): Promise<ApiResponse<void>> {
    return this.deletePatrol(id);
  }

  async startPatrol(id: string): Promise<ApiResponse<Patrol>> {
    return this.handleRequest(() => this.api.post(`/patrols/${id}/start`));
  }

  async completePatrol(id: string): Promise<ApiResponse<Patrol>> {
    return this.handleRequest(() => this.api.post(`/patrols/${id}/complete`));
  }

  async reportPatrolIncident(id: string, incidentData: any): Promise<ApiResponse<any>> {
    return this.handleRequest(() => this.api.post(`/patrols/${id}/incidents`, incidentData));
  }

  async getPatrolAnalytics(): Promise<ApiResponse<any>> {
    return this.handleRequest(() => this.api.get('/patrols/analytics'));
  }

  // Smart Locker Methods
  async getSmartLockers(params?: any): Promise<ApiResponse<Locker[]>> {
    return this.handleRequest(() => this.api.get('/smart-lockers', { params }));
  }

  async getLockers(params?: any): Promise<ApiResponse<Locker[]>> {
    return this.getSmartLockers(params);
  }

  async createSmartLocker(locker: Omit<Locker, 'id'>): Promise<ApiResponse<Locker>> {
    return this.handleRequest(() => this.api.post('/smart-lockers', locker));
  }

  async updateSmartLocker(id: string, locker: Partial<Locker>): Promise<ApiResponse<Locker>> {
    return this.handleRequest(() => this.api.put(`/smart-lockers/${id}`, locker));
  }

  async updateLocker(id: string, locker: Partial<Locker>): Promise<ApiResponse<Locker>> {
    return this.updateSmartLocker(id, locker);
  }

  async deleteSmartLocker(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() => this.api.delete(`/smart-lockers/${id}`));
  }

  async assignLocker(id: string, userId: string): Promise<ApiResponse<Locker>> {
    return this.handleRequest(() => this.api.post(`/smart-lockers/${id}/assign`, { user_id: userId }));
  }

  async releaseLocker(id: string): Promise<ApiResponse<Locker>> {
    return this.handleRequest(() => this.api.post(`/smart-lockers/${id}/release`));
  }

  async getLockerAnalytics(): Promise<ApiResponse<any>> {
    return this.handleRequest(() => this.api.get('/smart-lockers/analytics'));
  }

  // Smart Parking Methods
  async getParkingSpaces(params?: any): Promise<ApiResponse<ParkingSpace[]>> {
    return this.handleRequest(() => this.api.get('/smart-parking', { params }));
  }

  async getSmartParking(params?: any): Promise<ApiResponse<ParkingSpace[]>> {
    return this.getParkingSpaces(params);
  }

  async createParkingSpace(space: Omit<ParkingSpace, 'id'>): Promise<ApiResponse<ParkingSpace>> {
    return this.handleRequest(() => this.api.post('/smart-parking', space));
  }

  async createSmartParking(space: Omit<ParkingSpace, 'id'>): Promise<ApiResponse<ParkingSpace>> {
    return this.createParkingSpace(space);
  }

  async updateParkingSpace(id: string, space: Partial<ParkingSpace>): Promise<ApiResponse<ParkingSpace>> {
    return this.handleRequest(() => this.api.put(`/smart-parking/${id}`, space));
  }

  async updateSmartParking(id: string, space: Partial<ParkingSpace>): Promise<ApiResponse<ParkingSpace>> {
    return this.updateParkingSpace(id, space);
  }

  async deleteParkingSpace(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() => this.api.delete(`/smart-parking/${id}`));
  }

  async deleteSmartParking(id: string): Promise<ApiResponse<void>> {
    return this.deleteParkingSpace(id);
  }

  async reserveParkingSpace(id: string, userId: string, vehicleInfo?: string): Promise<ApiResponse<ParkingSpace>> {
    return this.handleRequest(() => 
      this.api.post(`/smart-parking/${id}/reserve`, { 
        user_id: userId, 
        vehicle_info: vehicleInfo 
      })
    );
  }

  async releaseParkingSpace(id: string): Promise<ApiResponse<ParkingSpace>> {
    return this.handleRequest(() => this.api.post(`/smart-parking/${id}/release`));
  }

  async getParkingAnalytics(): Promise<ApiResponse<any>> {
    return this.handleRequest(() => this.api.get('/smart-parking/analytics'));
  }

  // Access Control Methods
  async getAccessLogs(params?: any): Promise<ApiResponse<any[]>> {
    return this.handleRequest(() => this.api.get('/access/logs', { params }));
  }

  async grantAccess(userId: string, location: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() => 
      this.api.post('/access/grant', { user_id: userId, location })
    );
  }

  async revokeAccess(userId: string, location: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() => 
      this.api.post('/access/revoke', { user_id: userId, location })
    );
  }

  // Authentication Methods
  async login(credentials: any): Promise<ApiResponse<any>> {
    return this.handleRequest(() => this.api.post('/auth/login', credentials));
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.handleRequest(() => this.api.post('/auth/logout'));
  }

  // Generic Methods
  async get<T>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.api.get(endpoint, { params }));
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.api.post(endpoint, data));
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.api.put(endpoint, data));
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.api.delete(endpoint));
  }

  // Utility Methods
  getBaseURL(): string {
    return this.baseURL;
  }

  async healthCheck(): Promise<ApiResponse<any>> {
    return this.handleRequest(() => this.api.get('/health'));
  }

  // ============= ADVANCED REPORTS =============
  async getReports(params?: any): Promise<ApiResponse<Report[]>> {
    return this.handleRequest<Report[]>(() => 
      this.api.get('/api/reports', { params })
    );
  }

  async generateReport(reportData: any): Promise<ApiResponse<Report>> {
    return this.handleRequest<Report>(() => 
      this.api.post('/api/reports/generate', reportData)
    );
  }

  async downloadReport(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest<void>(() => 
      this.api.get(`/api/reports/${id}/download`, { responseType: 'blob' })
    );
  }

  // ============= BANNED INDIVIDUALS =============
  async getBannedIndividuals(params?: any): Promise<ApiResponse<BannedIndividual[]>> {
    return this.handleRequest<BannedIndividual[]>(() => 
      this.api.get('/api/banned-individuals', { params })
    );
  }

  async createBannedIndividual(data: Omit<BannedIndividual, 'id'>): Promise<ApiResponse<BannedIndividual>> {
    return this.handleRequest<BannedIndividual>(() => 
      this.api.post('/api/banned-individuals', data)
    );
  }

  async updateBannedIndividual(id: string, data: Partial<BannedIndividual>): Promise<ApiResponse<BannedIndividual>> {
    return this.handleRequest<BannedIndividual>(() => 
      this.api.put(`/api/banned-individuals/${id}`, data)
    );
  }

  async deleteBannedIndividual(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest<void>(() => 
      this.api.delete(`/api/banned-individuals/${id}`)
    );
  }

  // ============= GUEST SAFETY =============
  async getGuestSafetyIncidents(params?: any): Promise<ApiResponse<GuestSafetyIncident[]>> {
    return this.handleRequest<GuestSafetyIncident[]>(() => 
      this.api.get('/api/guest-safety/incidents', { params })
    );
  }

  async getGuestSafetyAlerts(params?: any): Promise<ApiResponse<GuestSafetyAlert[]>> {
    return this.handleRequest<GuestSafetyAlert[]>(() => 
      this.api.get('/api/guest-safety/alerts', { params })
    );
  }

  async createGuestSafetyIncident(data: Omit<GuestSafetyIncident, 'id'>): Promise<ApiResponse<GuestSafetyIncident>> {
    return this.handleRequest<GuestSafetyIncident>(() => 
      this.api.post('/api/guest-safety/incidents', data)
    );
  }

  async updateGuestSafetyIncident(id: string, data: Partial<GuestSafetyIncident>): Promise<ApiResponse<GuestSafetyIncident>> {
    return this.handleRequest<GuestSafetyIncident>(() => 
      this.api.put(`/api/guest-safety/incidents/${id}`, data)
    );
  }

  async deleteGuestSafetyIncident(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest<void>(() => 
      this.api.delete(`/api/guest-safety/incidents/${id}`)
    );
  }

  async resolveGuestSafetyIncident(id: string): Promise<ApiResponse<GuestSafetyIncident>> {
    return this.handleRequest<GuestSafetyIncident>(() => 
      this.api.put(`/api/guest-safety/incidents/${id}/resolve`)
    );
  }

  async createGuestSafetyAlert(data: Omit<GuestSafetyAlert, 'id'>): Promise<ApiResponse<GuestSafetyAlert>> {
    return this.handleRequest<GuestSafetyAlert>(() => 
      this.api.post('/api/guest-safety/alerts', data)
    );
  }

  // ============= DIGITAL HANDOVER =============
  async getHandovers(params?: any): Promise<ApiResponse<Handover[]>> {
    return this.handleRequest<Handover[]>(() => 
      this.api.get('/api/handovers', { params })
    );
  }

  async createHandover(data: Omit<Handover, 'id'>): Promise<ApiResponse<Handover>> {
    return this.handleRequest<Handover>(() => 
      this.api.post('/api/handovers', data)
    );
  }

  // ============= EVENT LOG =============
  async getEvents(params?: any): Promise<ApiResponse<Event[]>> {
    return this.handleRequest<Event[]>(() => 
      this.api.get('/api/events', { params })
    );
  }

  // Fix method name - should be getSecurityAlerts, not getSecurityMetrics
  async getSecurityMetrics(): Promise<ApiResponse<any>> {
    return this.getSecurityAlerts();
  }
}

const apiService = new ApiService();
export default apiService; 