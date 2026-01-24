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
