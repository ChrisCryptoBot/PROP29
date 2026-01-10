/**
 * Access Control Utilities Service
 * Handles critical edge cases and workflows for production-scale access control
 */

export interface CachedEvent {
  id: string;
  accessPointId: string;
  accessPointName: string;
  userId?: string;
  userName?: string;
  action: 'granted' | 'denied';
  timestamp: string;
  cachedAt: string;
  synced: boolean;
}

export interface AccessPointGroup {
  id: string;
  name: string;
  description: string;
  accessPointIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleZoneMapping {
  id: string;
  role: string;
  zoneName: string;
  accessPointIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VisitorRegistration {
  id: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  photoUrl?: string;
  idDocumentUrl?: string;
  badgeId?: string;
  checkInTime: string;
  expectedCheckOutTime: string;
  accessPointIds: string[];
  registeredBy: string;
}

export interface HeldOpenAlert {
  id: string;
  accessPointId: string;
  accessPointName: string;
  location: string;
  openedAt: string;
  duration: number; // in seconds
  severity: 'warning' | 'critical';
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export class AccessControlUtilities {
  /**
   * Check if access point has been held open too long
   * Returns alert if held open > 5 minutes (300 seconds)
   */
  static checkHeldOpenAlarm(
    accessPointId: string,
    accessPointName: string,
    location: string,
    sensorStatus: string | undefined,
    lastStatusChange: string | undefined
  ): HeldOpenAlert | null {
    if (sensorStatus !== 'held-open' || !lastStatusChange) {
      return null;
    }

    const now = new Date();
    const openedAt = new Date(lastStatusChange);
    const duration = Math.floor((now.getTime() - openedAt.getTime()) / 1000); // seconds

    // Critical alert if held open > 5 minutes (300 seconds)
    if (duration > 300) {
      return {
        id: `alert-${accessPointId}-${Date.now()}`,
        accessPointId,
        accessPointName,
        location,
        openedAt: lastStatusChange,
        duration,
        severity: 'critical',
        acknowledged: false
      };
    }

    // Warning if held open > 2 minutes (120 seconds)
    if (duration > 120) {
      return {
        id: `alert-${accessPointId}-${Date.now()}`,
        accessPointId,
        accessPointName,
        location,
        openedAt: lastStatusChange,
        duration,
        severity: 'warning',
        acknowledged: false
      };
    }

    return null;
  }

  /**
   * Determine access priority based on multiple access types
   * Priority: Permanent (scheduled) > Temporary > Emergency Override
   */
  static getAccessPriority(
    hasPermanentAccess: boolean,
    hasTemporaryAccess: boolean,
    hasEmergencyOverride: boolean
  ): 'permanent' | 'temporary' | 'emergency' | 'denied' {
    if (hasPermanentAccess) return 'permanent';
    if (hasTemporaryAccess) return 'temporary';
    if (hasEmergencyOverride) return 'emergency';
    return 'denied';
  }

  /**
   * Generate visitor badge ID
   */
  static generateBadgeId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VIS-${timestamp}-${random}`;
  }

  /**
   * Format duration for emergency timeout display
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}
