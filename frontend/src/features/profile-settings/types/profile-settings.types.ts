/**
 * Profile Settings — shared types and role helpers.
 * Role display/color aligned for use by profile-settings and account-settings.
 */

export type ProfileRole =
  | 'admin'
  | 'security_manager'
  | 'security_officer'
  | 'manager'
  | 'viewer'
  | 'guard'
  | 'front_desk'
  | 'director'
  | 'patrol_agent'
  | 'valet';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface ProfilePreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'pending';
}

export interface WorkSchedule {
  shift: 'morning' | 'afternoon' | 'night' | 'rotating';
  daysOff: string[];
  overtimeEligible: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  employeeId: string;
  hireDate: string;
  /** Company/work email (optional; personal email is `email`). */
  companyEmail?: string;
  avatar?: string;
  emergencyContact: EmergencyContact;
  preferences: ProfilePreferences;
  certifications: Certification[];
  workSchedule: WorkSchedule;
}

export type UpdateProfileRequest = Partial<
  Pick<
    UserProfile,
    | 'name'
    | 'email'
    | 'phone'
    | 'companyEmail'
    | 'department'
    | 'employeeId'
    | 'hireDate'
    | 'emergencyContact'
    | 'preferences'
    | 'certifications'
    | 'workSchedule'
  >
>;

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface AddCertificationRequest {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
}

export type UpdateCertificationRequest = Partial<AddCertificationRequest>;

export interface TwoFAStatus {
  enabled: boolean;
}

export interface SessionInfo {
  id: string;
  device: string;
  location: string;
  current?: boolean;
  lastActive: number;
}

/** Role display name for UI (shared). */
export function getRoleDisplayName(role: string): string {
  const map: Record<string, string> = {
    director: 'Security Director',
    admin: 'Administrator',
    security_manager: 'Security Manager',
    manager: 'Security Manager',
    patrol_agent: 'Patrol Agent',
    valet: 'Valet Staff',
    front_desk: 'Front Desk Staff',
    guard: 'Guard',
    security_officer: 'Security Officer',
    viewer: 'Viewer',
  };
  return map[role] || role;
}

/** Role badge variant (shared). */
export function getRoleColor(role: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info' {
  const map: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info'> = {
    director: 'destructive',
    admin: 'destructive',
    security_manager: 'warning',
    manager: 'warning',
    patrol_agent: 'success',
    valet: 'default',
    front_desk: 'secondary',
    guard: 'info',
    security_officer: 'info',
    viewer: 'outline',
  };
  return map[role] || 'default';
}

export type ProfileTabId = 'personal' | 'work' | 'certifications' | 'preferences' | 'security';
