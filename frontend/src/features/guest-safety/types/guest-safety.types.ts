/**
 * Guest Safety Module - Type Definitions
 * Centralized type definitions for the Guest Safety feature
 */

import type { GuestSafetyIncident, GuestSafetyAlert } from '../../../services/ApiService';

/**
 * Re-export API types for convenience
 */
export type { GuestSafetyIncident, GuestSafetyAlert };

/**
 * Tab ID type
 */
export type TabId = 'incidents' | 'messages' | 'mass-notification' | 'response-teams' | 'evacuation' | 'analytics' | 'settings';

/**
 * Incident priority levels
 */
export type IncidentPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Incident types
 */
export type IncidentType = 'medical' | 'security' | 'maintenance' | 'service' | 'noise' | 'evacuation' | 'other';

/**
 * Incident status
 */
export type IncidentStatus = 'reported' | 'responding' | 'resolved';

/**
 * Team status
 */
export type TeamStatus = 'available' | 'responding' | 'offline';

/**
 * Guest type
 */
export type GuestType = 'VIP' | 'Family' | 'Business' | 'Regular';

/**
 * Incident source - tracks where the incident originated
 */
export type IncidentSource = 'MANAGER' | 'MOBILE_AGENT' | 'HARDWARE_DEVICE' | 'AUTO_CREATED' | 'GUEST_PANIC_BUTTON';

/**
 * Hardware device types
 */
export type HardwareDeviceType = 'panic_button' | 'sensor' | 'camera' | 'access_control' | 'alarm' | 'environmental' | 'other';

/**
 * Hardware device status type
 */
export type HardwareDeviceStatusType = 'online' | 'offline' | 'degraded' | 'maintenance' | 'error';

/**
 * Response Team entity
 */
export interface ResponseTeam {
  id: string;
  name: string;
  role: string;
  status: TeamStatus;
  avatar: string;
}

/**
 * Extended Guest Safety Incident (with UI-specific fields)
 * Overrides status to use 'responding' instead of 'investigating'
 */
export interface GuestIncident extends Omit<GuestSafetyIncident, 'status'> {
  status: 'reported' | 'responding' | 'resolved'; // UI uses 'responding' instead of 'investigating'
  priority: IncidentPriority;
  type: IncidentType;
  guestName: string;
  guestRoom: string;
  guestType: GuestType;
  assignedTeam?: string;
  responseTime?: number;
  guestAvatar: string;
  icon: string;
  iconColor: string;
  reportedTime: string; // Relative time string (e.g., "2 min ago")
  source?: IncidentSource;
  sourceMetadata?: {
    agentName?: string;
    agentTrustScore?: number;
    deviceName?: string;
    deviceId?: string;
    [key: string]: any;
  };
}

/**
 * Safety Metrics
 */
export interface SafetyMetrics {
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolvedToday: number;
  avgResponseTime: string;
  categories: { [key: string]: number };
  responseMetrics: {
    avgResponseTime: string;
    resolutionRate: string;
    guestSatisfaction: string;
  };
}

/**
 * Mass Notification Data
 */
export interface MassNotificationData {
  message: string;
  recipients: 'all' | 'vip' | 'floor' | 'room';
  priority: 'normal' | 'high' | 'urgent';
  channels: ('in_app' | 'sms' | 'email')[];
}

/**
 * Guest Safety Settings
 */
export interface GuestSafetySettings {
  alertThreshold: number; // minutes
  autoEscalation: boolean;
  notificationChannels: {
    inApp: boolean;
    sms: boolean;
    email: boolean;
  };
  responseTeamAssignment: 'automatic' | 'manual' | 'round_robin';
}

/**
 * Guest Safety Filters
 */
export interface GuestSafetyFilters {
  status?: IncidentStatus;
  priority?: IncidentPriority;
  type?: IncidentType;
  source?: IncidentSource;
  searchQuery?: string;
}

/**
 * Hardware Device Status
 * For monitoring hardware device health and connectivity
 */
export interface HardwareDeviceStatus {
  deviceId: string;
  deviceName: string;
  deviceType: HardwareDeviceType;
  status: HardwareDeviceStatusType;
  lastSeen: string; // ISO datetime
  signalStrength?: number; // 0-100
  batteryLevel?: number; // 0-100
  firmwareVersion?: string;
  lastMaintenance?: string; // ISO datetime
  location?: string;
  lastKnownGoodState?: Date; // For offline state display
}

/**
 * Mobile Agent Performance Metrics
 * For trust score calculation and auto-approval
 */
export interface AgentPerformanceMetrics {
  agentId: string;
  agentName?: string;
  submissionsCount: number;
  approvalCount: number;
  rejectionCount: number;
  approvalRate: number; // 0-100
  averageResponseTime: number; // minutes
  trustScore: number; // 0-100
  lastSubmission?: string; // ISO datetime
  flaggedSubmissions?: number;
}

/**
 * Create Incident Request (for API)
 */
export interface CreateIncidentRequest {
  title: string;
  description: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  guest_involved?: string;
  room_number?: string;
  contact_info?: string;
}

/**
 * Update Incident Request (for API)
 */
export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  location?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'reported' | 'investigating' | 'responding' | 'resolved';
  assignedTeam?: string;
  resolved_at?: string;
}

/**
 * Guest Message Types
 */
export type GuestMessageType = 'request' | 'update' | 'question' | 'emergency';
export type GuestMessageDirection = 'guest_to_staff' | 'staff_to_guest';
export type GuestMessageSource = 'GUEST_APP' | 'MANAGER' | 'MOBILE_AGENT' | 'SYSTEM';

/**
 * Guest Message entity
 */
export interface GuestMessage {
  id: string;
  incident_id?: string | null;
  guest_id?: string | null;
  guest_name?: string | null;
  room_number?: string | null;
  message_text: string;
  message_type: GuestMessageType;
  direction: GuestMessageDirection;
  is_read: boolean;
  read_at?: string | null;
  read_by?: string | null;
  created_at: string;
  source?: GuestMessageSource;
  source_metadata?: Record<string, any> | null;
}

/**
 * Guest Message Filters
 */
export interface GuestMessageFilters {
  incident_id?: string;
  unread_only?: boolean;
  message_type?: GuestMessageType;
  direction?: GuestMessageDirection;
  guest_id?: string;
  limit?: number;
}

/**
 * Evacuation Status
 */
export type EvacuationStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * Guest Evacuation Status
 */
export type GuestEvacuationStatus = 'unaccounted' | 'safe' | 'in_progress';

/**
 * Evacuation Headcount
 */
export interface EvacuationHeadcount {
  totalGuests: number;
  safe: number;
  unaccounted: number;
  inProgress: number;
  lastUpdated: string; // ISO datetime
}

/**
 * Evacuation Check-In (from guest app)
 */
export interface EvacuationCheckIn {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  status: GuestEvacuationStatus;
  checkedInAt: string; // ISO datetime
  location?: string;
  notes?: string;
}
