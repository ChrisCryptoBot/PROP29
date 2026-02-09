import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { logger } from './logger';
import { env } from '../config/env';
import type { AccessEvent } from '../shared/types/access-control.types';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
  /** HTTP status code when success is false (e.g. 403, 404). Used by offline queue to avoid retrying 4xx. */
  statusCode?: number;
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
  status: 'reported' | 'investigating' | 'responding' | 'resolved';
  reported_by: string;
  reported_at: string;
  resolved_at?: string;
  resolved_by?: string;
  guest_involved?: string;
  room_number?: string;
  contact_info?: string;
  assigned_team?: string;
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
  metadata?: Record<string, unknown>;
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
  parameters: Record<string, unknown>;
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
  recent_activity: LostFoundItem[];
  trends: Array<{ date: string; count: number }>;
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
  recent_activity: Package[];
  trends: Array<{ date: string; count: number }>;
  expired_packages: number;
  packages_by_type: Record<string, number>;
  daily_packages: { date: string; count: number }[];
  average_delivery_time: number;
  delivery_success_rate: number;
  most_active_senders: { name: string; count: number }[];
}

export interface ParkingSpace {
  space_id: string;
  property_id: string;
  label: string;
  zone?: string;
  type: string;
  status: string;
  current_guest_id?: string;
  last_seen: string;
  iot_sensor_data?: any;
}

export interface GuestParking {
  registration_id: string;
  property_id: string;
  guest_id?: string;
  guest_name: string;
  plate: string;
  vehicle_info: any;
  space_id?: string;
  checkin_at: string;
  checkout_at?: string;
  status: string;
  valet_status: string;
  notes?: string;
}

export interface ParkingHealth {
  status: string;
  components: {
    database: string;
    sensors: string;
  };
  metrics: {
    total_spaces: number;
    occupancy_rate: string;
    offline_sensors: number;
  };
  timestamp: string;
}

export interface ParkingSettings {
  settings_id: string;
  property_id: string;
  guest_hourly_rate: number;
  guest_daily_rate: number;
  valet_fee: number;
  ev_charging_fee: number;
  max_stay_hours: number;
  grace_period_minutes: number;
  late_fee_rate: number;
  auto_checkout_enabled: boolean;
  low_occupancy_alert: boolean;
  maintenance_reminders: boolean;
  billing_sync_enabled: boolean;
  updated_at: string;
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
  recent_threats: SecurityThreat[];
  trends: Array<{ date: string; count: number }>;
  hourly_threats: { hour: string; count: number }[];
  security_score: number;
  blocked_attempts: number;
}

export interface EnvironmentalData {
  id: string;
  sensor_id: string;
  camera_id?: string;
  camera_name?: string;
  temperature?: number;
  humidity?: number;
  air_quality?: number;
  timestamp: string;
  location: string;
  sensor_type: string;
  value?: number;
  unit?: string;
  status: 'normal' | 'warning' | 'critical';
  threshold_min?: number;
  threshold_max?: number;
  light_level?: number;
  noise_level?: number;
}

export interface EnvironmentalAlert {
  id: string;
  camera_id?: string;
  camera_name?: string;
  alert_type: 'temperature' | 'humidity' | 'air_quality' | 'fire' | 'flood';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  location: string;
  status: 'active' | 'acknowledged' | 'resolved';
  sensor_id: string;
  resolved: boolean;
  resolved_at?: string;
  light_level?: number;
  noise_level?: number;
}

export interface EnvironmentalSettings {
  temperatureUnit: 'celsius' | 'fahrenheit';
  refreshInterval: string;
  enableNotifications: boolean;
  criticalAlertsOnly: boolean;
  autoAcknowledge: boolean;
  dataRetention: string;
  alertSoundEnabled: boolean;
  emailNotifications: boolean;
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
  incidents?: Record<string, unknown>[];
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
    this.baseURL = env.API_BASE_URL;

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

        const fullUrl = `${config.baseURL}${config.url}`;
        logger.debug(`ApiService Request: ${config.method?.toUpperCase()} ${fullUrl}`, {
          baseUrl: config.baseURL,
          url: config.url,
          fullUrl
        });
        logger.apiCall(config.url || '', config.method?.toUpperCase() || 'UNKNOWN', { endpoint: config.url, method: config.method });
        return config;
      },
      (error) => {
        logger.error('Request error', error instanceof Error ? error : new Error(String(error)), { module: 'ApiService', action: 'request-interceptor' });
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.config.url} - ${response.status}`, { endpoint: response.config.url, status: response.status });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('api:network-ok'));
        }
        return response;
      },
      (error: AxiosError) => {
        logger.apiError(error.config?.url || 'unknown', error instanceof Error ? error : new Error(String(error)), {
          module: 'ApiService',
          action: 'response-interceptor',
          status: error.response?.status,
          endpoint: error.config?.url
        });
        if (typeof window !== 'undefined' && !error.response) {
          window.dispatchEvent(new CustomEvent('api:network-error'));
        }
        return Promise.reject(error);
      }
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      const method = axiosError.config?.method?.toLowerCase();
      const canRetry = !axiosError.response && method === 'get';
      if (canRetry) {
        await this.delay(600);
        try {
          const retryResponse = await request();
          return {
            data: retryResponse.data,
            success: true,
            message: 'Request successful'
          };
        } catch (retryError) {
          // fall through to error handling
        }
      }
      logger.error('API request failed', error instanceof Error ? error : new Error(String(error)), {
        module: 'ApiService',
        action: 'handleRequest',
        message: axiosError.response?.data || axiosError.message
      });
      return {
        error: (axiosError.response?.data as { message?: string })?.message || axiosError.message || 'Request failed',
        success: false,
        data: undefined,
        statusCode: axiosError.response?.status
      };
    }
  }

  // Lost & Found Methods
  async getLostFoundItems(params?: Record<string, unknown>): Promise<ApiResponse<LostFoundItem[]>> {
    return this.handleRequest(() => this.api.get<LostFoundItem[]>('/lost-found', { params }));
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

  async claimLostFoundItem(id: string, claimData: Record<string, unknown>): Promise<ApiResponse<LostFoundItem>> {
    return this.handleRequest(() => this.api.post<LostFoundItem>(`/lost-found/${id}/claim`, claimData));
  }

  async findLostFoundMatches(id: string): Promise<ApiResponse<LostFoundItem[]>> {
    return this.handleRequest(() => this.api.get(`/lost-found/${id}/matches`));
  }

  async getLostFoundAnalytics(): Promise<ApiResponse<LostFoundAnalytics>> {
    return this.handleRequest(() => this.api.get('/lost-found/analytics'));
  }

  // Package Methods
  async getPackages(params?: Record<string, unknown>): Promise<ApiResponse<Package[]>> {
    return this.handleRequest(() => this.api.get<Package[]>('/packages', { params }));
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


  async getSecurityAlerts(params?: Record<string, unknown>): Promise<ApiResponse<SecurityThreat[]>> {
    return this.handleRequest(() => this.api.get<SecurityThreat[]>('/security/alerts', { params }));
  }

  async createSecurityAlert(alert: Omit<SecurityThreat, 'id'>): Promise<ApiResponse<SecurityThreat>> {
    return this.handleRequest(() => this.api.post<SecurityThreat>('/security/alerts', alert));
  }

  // Environmental/IoT Methods
  async getEnvironmentalData(params?: Record<string, unknown>): Promise<ApiResponse<EnvironmentalData[]>> {
    return this.handleRequest(() => this.api.get<EnvironmentalData[]>('/iot/environmental', { params }));
  }

  async getEnvironmentalAlerts(params?: Record<string, unknown>): Promise<ApiResponse<EnvironmentalAlert[]>> {
    return this.handleRequest(() => this.api.get<EnvironmentalAlert[]>('/iot/environmental/alerts', { params }));
  }

  async getEnvironmentalAnalytics(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.get<Record<string, unknown>>('/iot/environmental/analytics'));
  }

  async createEnvironmentalSensor(payload: Partial<EnvironmentalData>): Promise<ApiResponse<EnvironmentalData>> {
    return this.handleRequest(() => this.api.post<EnvironmentalData>('/iot/environmental/sensors', payload));
  }

  async updateEnvironmentalSensor(sensorId: string, payload: Partial<EnvironmentalData>): Promise<ApiResponse<EnvironmentalData>> {
    return this.handleRequest(() => this.api.put<EnvironmentalData>(`/iot/environmental/sensors/${sensorId}`, payload));
  }

  async deleteEnvironmentalSensor(sensorId: string): Promise<ApiResponse<void>> {
    return this.handleRequest(() => this.api.delete(`/iot/environmental/sensors/${sensorId}`));
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

  async getEnvironmentalSettings(): Promise<ApiResponse<EnvironmentalSettings>> {
    return this.handleRequest(() => this.api.get<EnvironmentalSettings>('/iot/environmental/settings'));
  }

  async updateEnvironmentalSettings(payload: Partial<EnvironmentalSettings>): Promise<ApiResponse<EnvironmentalSettings>> {
    return this.handleRequest(() => this.api.put<EnvironmentalSettings>('/iot/environmental/settings', payload));
  }

  // Visitor Methods
  async getVisitors(params?: Record<string, unknown>): Promise<ApiResponse<Visitor[]>> {
    return this.handleRequest(() => this.api.get<Visitor[]>('/visitors', { params }));
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

  async getVisitorAnalytics(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.get<Record<string, unknown>>('/visitors/analytics'));
  }

  // Patrol Methods
  async getPatrols(params?: Record<string, unknown>): Promise<ApiResponse<Patrol[]>> {
    return this.handleRequest(() => this.api.get<Patrol[]>('/patrols', { params }));
  }

  async getPatrolRoutes(params?: Record<string, unknown>): Promise<ApiResponse<Patrol[]>> {
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

  async reportPatrolIncident(id: string, incidentData: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.post<Record<string, unknown>>(`/patrols/${id}/incidents`, incidentData));
  }

  async getPatrolAnalytics(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.get<Record<string, unknown>>('/patrols/analytics'));
  }

  // Smart Locker Methods
  async getSmartLockers(params?: Record<string, unknown>): Promise<ApiResponse<Locker[]>> {
    return this.handleRequest(() => this.api.get<Locker[]>('/smart-lockers', { params }));
  }

  async getLockers(params?: Record<string, unknown>): Promise<ApiResponse<Locker[]>> {
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

  async getLockerAnalytics(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.get<Record<string, unknown>>('/smart-lockers/analytics'));
  }


  // ============= PARKING =============
  async getParkingSettings(propertyId: string): Promise<ApiResponse<ParkingSettings>> {
    return this.handleRequest<ParkingSettings>(() =>
      this.api.get<ParkingSettings>('/parking/settings', { params: { property_id: propertyId } })
    );
  }

  async updateParkingSettings(propertyId: string, data: Partial<ParkingSettings>): Promise<ApiResponse<ParkingSettings>> {
    return this.handleRequest<ParkingSettings>(() =>
      this.api.put('/parking/settings', data, { params: { property_id: propertyId } })
    );
  }

  async getParkingSpaces(propertyId: string): Promise<ApiResponse<ParkingSpace[]>> {
    return this.handleRequest<ParkingSpace[]>(() =>
      this.api.get<ParkingSpace[]>('/parking/spaces', { params: { property_id: propertyId } })
    );
  }

  async getParkingRegistrations(propertyId: string, status: string = 'all'): Promise<ApiResponse<GuestParking[]>> {
    return this.handleRequest<GuestParking[]>(() =>
      this.api.get<GuestParking[]>('/parking/registrations', { params: { property_id: propertyId, status } })
    );
  }

  async createParkingSpace(data: Partial<ParkingSpace>): Promise<ApiResponse<ParkingSpace>> {
    return this.handleRequest<ParkingSpace>(() =>
      this.api.post('/parking/spaces', data)
    );
  }

  async updateParkingSpace(spaceId: string, data: Partial<ParkingSpace>): Promise<ApiResponse<ParkingSpace>> {
    return this.handleRequest<ParkingSpace>(() =>
      this.api.put(`/parking/spaces/${spaceId}`, data)
    );
  }

  async registerGuestParking(data: GuestParking): Promise<ApiResponse<GuestParking>> {
    return this.handleRequest<GuestParking>(() =>
      this.api.post('/parking/guest', data)
    );
  }

  async checkoutGuestParking(registrationId: string): Promise<ApiResponse<GuestParking>> {
    return this.handleRequest<GuestParking>(() =>
      this.api.post(`/parking/guest/${registrationId}/checkout`)
    );
  }

  async updateValetStatus(registrationId: string, status: string): Promise<ApiResponse<GuestParking>> {
    return this.handleRequest<GuestParking>(() =>
      this.api.post(`/parking/guest/${registrationId}/valet`, null, { params: { status } })
    );
  }

  async getParkingHealth(propertyId: string): Promise<ApiResponse<ParkingHealth>> {
    return this.handleRequest<ParkingHealth>(() =>
      this.api.get<ParkingHealth>('/parking/health', { params: { property_id: propertyId } })
    );
  }

  // Access Control Methods
  async getAccessLogs(params?: Record<string, unknown>): Promise<ApiResponse<AccessEvent[]>> {
    return this.handleRequest(() => this.api.get<AccessEvent[]>('/access/logs', { params }));
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
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<{ access_token: string; refresh_token?: string; user: Record<string, unknown> }>> {
    return this.handleRequest(() => this.api.post<{ access_token: string; refresh_token?: string; user: Record<string, unknown> }>('/auth/login', credentials));
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.handleRequest(() => this.api.post('/auth/logout'));
  }

  async getUserProperties(): Promise<ApiResponse<{ property_id: string; property_name: string; timezone?: string }[]>> {
    return this.handleRequest(() => this.api.get('/users/properties'));
  }

  // Generic Methods
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.api.get<T>(endpoint, config));
  }

  async post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.api.post<T>(endpoint, data, config));
  }

  async put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.api.put<T>(endpoint, data, config));
  }

  async patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.api.patch<T>(endpoint, data, config));
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.api.delete<T>(endpoint, config));
  }

  // Utility Methods
  getBaseURL(): string {
    return this.baseURL;
  }

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.handleRequest(() => this.api.get<{ status: string; timestamp: string }>('/health'));
  }

  // ============= BANNED INDIVIDUALS =============
  async getBannedIndividuals(params?: Record<string, unknown>): Promise<ApiResponse<BannedIndividual[]>> {
    return this.handleRequest<BannedIndividual[]>(() =>
      this.api.get<BannedIndividual[]>('/banned-individuals', { params })
    );
  }

  async createBannedIndividual(data: Omit<BannedIndividual, 'id'>): Promise<ApiResponse<BannedIndividual>> {
    return this.handleRequest<BannedIndividual>(() =>
      this.api.post('/banned-individuals', data)
    );
  }

  async updateBannedIndividual(id: string, data: Partial<BannedIndividual>): Promise<ApiResponse<BannedIndividual>> {
    return this.handleRequest<BannedIndividual>(() =>
      this.api.put(`/banned-individuals/${id}`, data)
    );
  }

  async deleteBannedIndividual(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest<void>(() =>
      this.api.delete(`/banned-individuals/${id}`)
    );
  }

  // ============= GUEST SAFETY =============
  async getGuestSafetyIncidents(params?: Record<string, unknown>): Promise<ApiResponse<GuestSafetyIncident[]>> {
    return this.handleRequest<GuestSafetyIncident[]>(() =>
      this.api.get<GuestSafetyIncident[]>('/guest-safety/incidents', { params })
    );
  }

  async getGuestSafetyAlerts(params?: Record<string, unknown>): Promise<ApiResponse<GuestSafetyAlert[]>> {
    return this.handleRequest<GuestSafetyAlert[]>(() =>
      this.api.get<GuestSafetyAlert[]>('/guest-safety/alerts', { params })
    );
  }

  async createGuestSafetyIncident(data: Omit<GuestSafetyIncident, 'id'>): Promise<ApiResponse<GuestSafetyIncident>> {
    return this.handleRequest<GuestSafetyIncident>(() =>
      this.api.post('/guest-safety/incidents', data)
    );
  }

  async updateGuestSafetyIncident(id: string, data: Partial<GuestSafetyIncident>): Promise<ApiResponse<GuestSafetyIncident>> {
    return this.handleRequest<GuestSafetyIncident>(() =>
      this.api.put(`/guest-safety/incidents/${id}`, data)
    );
  }

  async deleteGuestSafetyIncident(id: string): Promise<ApiResponse<void>> {
    return this.handleRequest<void>(() =>
      this.api.delete(`/guest-safety/incidents/${id}`)
    );
  }

  async resolveGuestSafetyIncident(id: string): Promise<ApiResponse<GuestSafetyIncident>> {
    return this.handleRequest<GuestSafetyIncident>(() =>
      this.api.put(`/guest-safety/incidents/${id}/resolve`)
    );
  }

  async createGuestSafetyAlert(data: Omit<GuestSafetyAlert, 'id'>): Promise<ApiResponse<GuestSafetyAlert>> {
    return this.handleRequest<GuestSafetyAlert>(() =>
      this.api.post('/guest-safety/alerts', data)
    );
  }

  // ============= DIGITAL HANDOVER =============
  async getHandovers(params?: Record<string, unknown>): Promise<ApiResponse<Handover[]>> {
    return this.handleRequest<Handover[]>(() =>
      this.api.get<Handover[]>('/handovers', { params })
    );
  }

  async createHandover(data: Omit<Handover, 'id'>): Promise<ApiResponse<Handover>> {
    return this.handleRequest<Handover>(() =>
      this.api.post('/handovers', data)
    );
  }


  // ============= EVENT LOG =============
  async getEvents(params?: Record<string, unknown>): Promise<ApiResponse<Event[]>> {
    return this.handleRequest<Event[]>(() =>
      this.api.get<Event[]>('/events', { params })
    );
  }

  // Fix method name - should be getSecurityAlerts, not getSecurityMetrics
  async getSecurityMetrics(): Promise<ApiResponse<SecurityThreat[]>> {
    return this.getSecurityAlerts();
  }

  // ============= SYSTEM ADMINISTRATION =============
  async getSystemAdminUsers(): Promise<ApiResponse<unknown[]>> {
    return this.handleRequest(() => this.api.get<unknown[]>('/system-admin/users'));
  }

  async getSystemAdminRoles(): Promise<ApiResponse<unknown[]>> {
    return this.handleRequest(() => this.api.get<unknown[]>('/system-admin/roles'));
  }

  async getSystemAdminProperties(): Promise<ApiResponse<unknown[]>> {
    return this.handleRequest(() => this.api.get<unknown[]>('/system-admin/properties'));
  }

  async getSystemAdminIntegrations(): Promise<ApiResponse<unknown[]>> {
    return this.handleRequest(() => this.api.get<unknown[]>('/system-admin/integrations'));
  }

  async getSystemAdminSettings(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.get<Record<string, unknown>>('/system-admin/settings'));
  }

  async getSystemAdminSecurityPolicies(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.get<Record<string, unknown>>('/system-admin/security-policies'));
  }

  async getSystemAdminAudit(params?: { date_range?: string; category?: string; search?: string }): Promise<ApiResponse<unknown[]>> {
    return this.handleRequest(() => this.api.get<unknown[]>('/system-admin/audit', { params }));
  }

  async getIntegrationHealth(integrationId: string): Promise<ApiResponse<{ id: string; status: string; message?: string }>> {
    return this.handleRequest(() => this.api.get(`/system-admin/integrations/${integrationId}/health`));
  }

  async syncIntegration(integrationId: string): Promise<ApiResponse<{ id: string; synced: boolean; message?: string }>> {
    return this.handleRequest(() => this.api.post(`/system-admin/integrations/${integrationId}/sync`));
  }

  async createSystemAdminUser(user: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.post<Record<string, unknown>>('/system-admin/users', user));
  }

  async updateSystemAdminUser(userId: string, user: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.put<Record<string, unknown>>(`/system-admin/users/${userId}`, user));
  }

  async deleteSystemAdminUser(userId: string): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    return this.handleRequest(() => this.api.delete<{ deleted: boolean; id: string }>(`/system-admin/users/${userId}`));
  }

  async createSystemAdminRole(role: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.post<Record<string, unknown>>('/system-admin/roles', role));
  }

  async updateSystemAdminRole(roleId: string, role: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.put<Record<string, unknown>>(`/system-admin/roles/${roleId}`, role));
  }

  async deleteSystemAdminRole(roleId: string): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    return this.handleRequest(() => this.api.delete<{ deleted: boolean; id: string }>(`/system-admin/roles/${roleId}`));
  }

  async createSystemAdminProperty(property: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.post<Record<string, unknown>>('/system-admin/properties', property));
  }

  async updateSystemAdminProperty(propertyId: string, property: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.put<Record<string, unknown>>(`/system-admin/properties/${propertyId}`, property));
  }

  async deleteSystemAdminProperty(propertyId: string): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    return this.handleRequest(() => this.api.delete<{ deleted: boolean; id: string }>(`/system-admin/properties/${propertyId}`));
  }

  async updateSystemAdminSettings(settings: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.put<Record<string, unknown>>('/system-admin/settings', settings));
  }

  async updateSystemAdminSecurityPolicies(policies: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.handleRequest(() => this.api.put<Record<string, unknown>>('/system-admin/security-policies', policies));
  }

  async postSystemAdminRestartServices(): Promise<ApiResponse<{ ok: boolean; message?: string }>> {
    return this.handleRequest(() => this.api.post<{ ok: boolean; message?: string }>('/system-admin/restart-services'));
  }

  async getSystemAdminDiagnostics(): Promise<ApiResponse<{ status: string; checks?: unknown[]; timestamp?: string }>> {
    return this.handleRequest(() => this.api.get<{ status: string; checks?: unknown[]; timestamp?: string }>('/system-admin/diagnostics'));
  }

  async postSystemAdminSecurityScan(): Promise<ApiResponse<{ passed: boolean; issues?: unknown[]; summary?: string; timestamp?: string }>> {
    return this.handleRequest(() => this.api.post<{ passed: boolean; issues?: unknown[]; summary?: string; timestamp?: string }>('/system-admin/security/scan'));
  }
}

const apiService = new ApiService();
export default apiService; 