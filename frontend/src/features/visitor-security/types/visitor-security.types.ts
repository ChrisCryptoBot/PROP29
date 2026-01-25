/**
 * Visitor Security Types
 * Type definitions for the Visitor Security module
 * Mirrors backend schemas from visitor_endpoints.py for type safety
 */

// VisitorStatus enum (matches backend VisitorStatus)
export enum VisitorStatus {
  REGISTERED = 'registered',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

// SecurityClearance enum (matches backend SecurityClearance)
export enum SecurityClearance {
  APPROVED = 'approved',
  PENDING = 'pending',
  DENIED = 'denied'
}

// RiskLevel enum (matches backend RiskLevel)
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// VisitType enum (matches backend VisitType)
export enum VisitType {
  DAY_VISITOR = 'day_visitor',
  GUEST_VISITOR = 'guest_visitor',
  SERVICE_PERSONNEL = 'service_personnel',
  EMERGENCY_CONTACT = 'emergency_contact',
  EVENT_ATTENDEE = 'event_attendee'
}

// SecurityRequestType enum (matches backend SecurityRequestType)
export enum SecurityRequestType {
  ACCESS_REQUEST = 'access_request',
  SECURITY_ASSISTANCE = 'security_assistance',
  EMERGENCY_ALERT = 'emergency_alert',
  INCIDENT_REPORT = 'incident_report',
  ESCORT_REQUEST = 'escort_request',
  LOST_BADGE = 'lost_badge',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

// EventBadgeType enum (matches backend EventBadgeType)
export enum EventBadgeType {
  TICKET = 'ticket',
  VIP = 'vip',
  STAFF = 'staff',
  VENDOR = 'vendor'
}

// SecurityRequest entity (matches backend SecurityRequestResponse)
export interface SecurityRequest {
  id: string;
  type: SecurityRequestType | string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string; // ISO datetime string
  location?: string;
  assigned_to?: string;
  response?: string;
}

// EmergencyContact entity (frontend-only, stored in visitor object)
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

// Visitor entity (matches backend VisitorResponse)
export interface Visitor {
  id: string;
  property_id: string; // Added for property-level isolation
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  company?: string;
  purpose: string;
  host_name: string;
  host_phone?: string;
  host_email?: string;
  host_room?: string;
  check_in_time?: string; // ISO datetime string
  check_out_time?: string; // ISO datetime string
  expected_duration: number;
  status: VisitorStatus | string;
  location: string;
  badge_id?: string;
  qr_code?: string;
  photo_url?: string;
  vehicle_number?: string;
  notes?: string;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  security_clearance: SecurityClearance | string;
  risk_level: RiskLevel | string;
  visit_type: VisitType | string;
  wifi_registered: boolean;
  // Event badge system
  event_id?: string;
  event_name?: string;
  event_badge_type?: EventBadgeType | string;
  access_points?: string[]; // Access point IDs this visitor can access
  badge_expires_at?: string; // ISO datetime string
  // Frontend-only fields (stored in visitor object, not in backend response)
  security_requests?: SecurityRequest[];
  emergency_contacts?: EmergencyContact[];
  
  // MSO Production Enhancement: Source metadata for mobile agent/hardware integration
  source_metadata?: {
    mobile_agent_id?: string;
    card_reader_id?: string;
    camera_id?: string;
    created_by_source?: 'mobile_agent' | 'hardware_device' | 'desktop_manager';
    submission_id?: string;
    hardware_metadata?: Record<string, unknown>;
  };
}

// VisitorCreate request (matches backend VisitorCreate)
export interface VisitorCreate {
  property_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  company?: string;
  purpose: string;
  host_name: string;
  host_phone?: string;
  host_email?: string;
  host_room?: string;
  expected_duration?: number; // Default: 60
  location: string;
  visit_type?: VisitType | string; // Default: DAY_VISITOR
  notes?: string;
  vehicle_number?: string;
  event_id?: string;
  access_points?: string[];
}

// VisitorUpdate request (for future update functionality)
export interface VisitorUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  purpose?: string;
  host_name?: string;
  host_phone?: string;
  host_email?: string;
  host_room?: string;
  expected_duration?: number;
  location?: string;
  visit_type?: VisitType | string;
  notes?: string;
  vehicle_number?: string;
  status?: VisitorStatus | string;
  security_clearance?: SecurityClearance | string;
  risk_level?: RiskLevel | string;
  access_points?: string[];
}

// Visitor filters (for GET requests)
export interface VisitorFilters {
  property_id?: string;
  status?: VisitorStatus | string;
  event_id?: string;
  security_clearance?: SecurityClearance | string;
}

// EventBadge entity (matches backend EventBadge structure)
export interface EventBadge {
  id: string;
  name: string;
  type: 'ticket' | 'vip' | 'staff' | 'vendor' | string;
  color: string;
  access_level: string[];
}

// Event entity (matches backend EventResponse)
export interface Event {
  id: string;
  property_id: string; // Added for property-level isolation
  name: string;
  type: 'wedding' | 'conference' | 'corporate' | 'social' | 'other';
  start_date: string; // ISO datetime string
  end_date: string; // ISO datetime string
  location: string;
  expected_attendees: number;
  badge_types: EventBadge[];
  qr_code_enabled: boolean;
  access_points: string[];
}

// EventCreate request (matches backend EventCreate)
export interface EventCreate {
  property_id: string;
  name: string;
  type: 'wedding' | 'conference' | 'corporate' | 'social' | 'other';
  start_date: string; // ISO datetime string
  end_date: string; // ISO datetime string
  location: string;
  expected_attendees: number;
  qr_code_enabled?: boolean; // Default: true
  access_points: string[];
}

// EventUpdate request (for future update functionality)
export interface EventUpdate {
  name?: string;
  type?: 'wedding' | 'conference' | 'corporate' | 'social' | 'other';
  start_date?: string;
  end_date?: string;
  location?: string;
  expected_attendees?: number;
  qr_code_enabled?: boolean;
  access_points?: string[];
}

// Event filters (for GET requests)
export interface EventFilters {
  property_id?: string;
}

// SecurityRequestCreate request (matches backend SecurityRequestCreate)
export interface SecurityRequestCreate {
  visitor_id: string;
  type: SecurityRequestType | string;
  description: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent'; // Default: 'normal'
  location?: string;
}

// SecurityRequest filters (for GET requests)
export interface SecurityRequestFilters {
  property_id?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// QRCodeResponse (matches backend QRCodeResponse)
export interface QRCodeResponse {
  visitor_id: string;
  qr_code: string;
  badge_id: string;
  event_name?: string;
  expires_at?: string; // ISO datetime string
}

// Visitor metrics (for analytics/dashboard)
export interface VisitorMetrics {
  total: number;
  checked_in: number;
  pending: number;
  active_events: number;
  security_requests: number;
  overdue: number;
}

// =======================================================
// MOBILE AGENT & HARDWARE INTEGRATION - MSO PRODUCTION READINESS
// =======================================================

/**
 * Mobile Agent Performance & Integration Types
 */
export interface MobileAgentDevice {
  agent_id: string;
  device_id: string;
  agent_name?: string;
  device_model?: string;
  app_version: string;
  last_sync: string; // ISO datetime
  status: 'online' | 'offline' | 'syncing' | 'error';
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  battery_level?: number; // 0-100
  network_strength?: number; // 0-100
  assigned_properties: string[];
}

export interface MobileAgentSubmission {
  submission_id: string;
  agent_id: string;
  submission_type: 'visitor_checkin' | 'visitor_checkout' | 'security_alert' | 'incident_report';
  visitor_id?: string;
  data: Record<string, unknown>;
  timestamp: string; // ISO datetime
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  photos?: string[]; // Photo URLs
  status: 'pending' | 'processed' | 'rejected' | 'error';
  sync_status: 'synced' | 'pending_sync' | 'failed_sync';
}

/**
 * Hardware Device Integration Types
 */
export enum HardwareDeviceType {
  CARD_READER = 'card_reader',
  CAMERA = 'camera',
  PRINTER = 'printer',
  ACCESS_CONTROL = 'access_control',
  SENSOR = 'sensor'
}

export interface HardwareDevice {
  device_id: string;
  device_name: string;
  device_type: HardwareDeviceType;
  status: 'online' | 'offline' | 'error' | 'maintenance';
  location: string;
  last_heartbeat: string; // ISO datetime
  firmware_version?: string;
  ip_address?: string;
  mac_address?: string;
  capabilities: string[];
  error_message?: string;
  maintenance_due?: string; // ISO datetime
}

export interface CardReaderEvent {
  event_id: string;
  device_id: string;
  visitor_id?: string;
  badge_id?: string;
  event_type: 'badge_scan' | 'badge_error' | 'access_granted' | 'access_denied';
  timestamp: string; // ISO datetime
  location: string;
  raw_data?: Record<string, unknown>;
}

export interface CameraEvent {
  event_id: string;
  device_id: string;
  visitor_id?: string;
  event_type: 'photo_capture' | 'motion_detect' | 'face_recognition';
  timestamp: string; // ISO datetime
  photo_url?: string;
  confidence_score?: number; // 0-100 for face recognition
  metadata?: Record<string, unknown>;
}

/**
 * MSO Desktop Configuration Types
 */
export interface MSOSettings {
  offline_mode_enabled: boolean;
  cache_size_limit_mb: number;
  sync_interval_seconds: number;
  auto_backup_enabled: boolean;
  backup_retention_days: number;
  hardware_timeout_seconds: number;
  mobile_agent_timeout_seconds: number;
  network_retry_attempts: number;
  local_storage_path?: string;
}

export interface SystemConnectivity {
  network_status: 'online' | 'offline' | 'limited';
  backend_status: 'connected' | 'disconnected' | 'error';
  mobile_agents_connected: number;
  hardware_devices_connected: number;
  last_sync: string; // ISO datetime
  pending_sync_items: number;
  connectivity_errors: string[];
}

/**
 * Enhanced Settings with Mobile Agent & Hardware Support
 */
export interface EnhancedVisitorSettings {
  // Existing basic settings
  visitor_retention_days: number;
  auto_checkout_hours: number;
  require_photo: boolean;
  require_host_approval: boolean;
  
  // Mobile Agent Integration Settings
  mobile_agent_settings: {
    enabled: boolean;
    require_location: boolean;
    auto_sync_enabled: boolean;
    offline_mode_duration_hours: number;
    photo_quality: 'low' | 'medium' | 'high';
    allow_bulk_operations: boolean;
    require_supervisor_approval: boolean;
  };
  
  // Hardware Device Settings
  hardware_settings: {
    card_reader_enabled: boolean;
    camera_integration_enabled: boolean;
    printer_integration_enabled: boolean;
    auto_badge_printing: boolean;
    device_health_monitoring: boolean;
    alert_on_device_offline: boolean;
    maintenance_reminder_days: number;
  };
  
  // MSO Desktop Settings
  mso_settings: MSOSettings;
  
  // API Configuration
  api_settings: {
    mobile_agent_endpoint: string;
    hardware_device_endpoint: string;
    websocket_endpoint: string;
    api_key_mobile: string;
    api_key_hardware: string;
    encryption_enabled: boolean;
  };
}

/**
 * Real-time Event Types for WebSocket/Live Updates
 */
export interface VisitorRealtimeEvent {
  event_type: 'visitor_checkin' | 'visitor_checkout' | 'visitor_update' | 'security_alert';
  visitor_id: string;
  source: 'mobile_agent' | 'hardware_device' | 'desktop_manager';
  source_id: string; // agent_id or device_id
  timestamp: string; // ISO datetime
  data: Partial<Visitor>;
  location?: string;
  photos?: string[];
}

/**
 * Bulk Operations for Mobile Agent Data Processing
 */
export interface BulkVisitorOperation {
  operation_id: string;
  operation_type: 'bulk_checkin' | 'bulk_checkout' | 'bulk_update' | 'bulk_sync';
  visitor_ids: string[];
  source_agent_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  results: {
    successful: number;
    failed: number;
    errors: Array<{ visitor_id: string; error: string }>;
  };
  created_at: string; // ISO datetime
  completed_at?: string; // ISO datetime
}
