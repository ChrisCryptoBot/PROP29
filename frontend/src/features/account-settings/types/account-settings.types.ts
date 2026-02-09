/**
 * Account Settings feature — shared types.
 * Used by context, service, and tab components.
 */

export type TeamMemberRole = 'director' | 'manager' | 'patrol_agent' | 'valet' | 'front_desk';
export type TeamMemberStatus = 'active' | 'inactive' | 'pending';
export type IntegrationType = 'camera' | 'access_control' | 'alarm' | 'mobile' | 'reporting';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  department: string;
  status: TeamMemberStatus;
  lastActive: string;
  avatar?: string;
  permissions: string[];
  shift: string;
  phone: string;
}

export interface TeamSettings {
  teamName: string;
  hotelName: string;
  timezone: string;
  workingHours: { start: string; end: string };
  breakPolicy: { duration: number; frequency: number };
  overtimePolicy: {
    enabled: boolean;
    maxHours: number;
    approvalRequired: boolean;
  };
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    emergencyAlerts: boolean;
  };
}

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  status: IntegrationStatus;
  lastSync: string;
  endpoint: string;
}

export interface RolePermissionMap {
  [role: string]: string[];
}

export type TeamSettingsUpdate = Partial<TeamSettings>;

/** Request/response for API */
export interface AddTeamMemberRequest {
  name: string;
  email: string;
  role: TeamMemberRole;
  department: string;
  phone: string;
  shift: string;
  permissions?: string[];
}

export interface UpdateTeamMemberRequest extends Partial<AddTeamMemberRequest> {
  status?: TeamMemberStatus;
}

export interface AddIntegrationRequest {
  name: string;
  type: IntegrationType;
  endpoint: string;
}

export const ROLE_OPTIONS: { value: TeamMemberRole; label: string }[] = [
  { value: 'director', label: 'Security Director' },
  { value: 'manager', label: 'Security Manager' },
  { value: 'patrol_agent', label: 'Patrol Agent' },
  { value: 'valet', label: 'Valet Staff' },
  { value: 'front_desk', label: 'Front Desk Staff' },
];

export const PERMISSION_LIST = [
  'view_dashboard', 'manage_incidents', 'view_reports', 'assign_tasks',
  'manage_users', 'system_settings', 'emergency_alerts', 'mobile_access',
  'guest_services', 'parking_management', 'visitor_management', 'audit_logs',
] as const;

export function getRoleDisplayName(role: string): string {
  const map: Record<string, string> = {
    director: 'Security Director',
    manager: 'Security Manager',
    patrol_agent: 'Patrol Agent',
    valet: 'Valet Staff',
    front_desk: 'Front Desk Staff',
  };
  return map[role] ?? role;
}

export function getRoleColor(role: string): 'destructive' | 'warning' | 'success' | 'default' | 'secondary' {
  const map: Record<string, 'destructive' | 'warning' | 'success' | 'default' | 'secondary'> = {
    director: 'destructive',
    manager: 'warning',
    patrol_agent: 'success',
    valet: 'default',
    front_desk: 'secondary',
  };
  return map[role] ?? 'default';
}

export function getStatusColor(status: string): 'success' | 'destructive' | 'warning' | 'default' {
  const map: Record<string, 'success' | 'destructive' | 'warning' | 'default'> = {
    active: 'success',
    inactive: 'destructive',
    pending: 'warning',
  };
  return map[status] ?? 'default';
}

export function getIntegrationStatusColor(status: string): 'success' | 'destructive' | 'warning' | 'default' {
  const map: Record<string, 'success' | 'destructive' | 'warning' | 'default'> = {
    connected: 'success',
    disconnected: 'destructive',
    error: 'warning',
  };
  return map[status] ?? 'default';
}
