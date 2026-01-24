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
export type TabId = 'incidents' | 'mass-notification' | 'response-teams' | 'analytics' | 'settings';

/**
 * Incident priority levels
 */
export type IncidentPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Incident types
 */
export type IncidentType = 'medical' | 'security' | 'maintenance' | 'service' | 'noise' | 'other';

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
  searchQuery?: string;
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
