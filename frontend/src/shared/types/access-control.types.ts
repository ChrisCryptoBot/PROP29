/**
 * Centralized Access Control Type Definitions
 * Single source of truth for all access control related types
 * Replaces duplicate definitions in:
 * - components/AccessControl/types.ts
 * - pages/modules/AccessControlModule.tsx
 * - services/ModuleService.ts
 * - services/AccessControlAIService.ts
 */

// ============================================================================
// Core Entities
// ============================================================================

export interface AccessPoint {
    id: string;
    name: string;
    location: string;
    type: 'door' | 'gate' | 'elevator' | 'turnstile' | 'barrier';
    status: 'active' | 'maintenance' | 'disabled' | 'inactive';
    accessMethod: 'card' | 'biometric' | 'pin' | 'mobile' | 'keycard';
    lastAccess?: string;
    accessCount: number;
    permissions: string[];
    securityLevel: 'low' | 'medium' | 'high' | 'critical';
    isOnline?: boolean;
    sensorStatus?: 'closed' | 'open' | 'forced' | 'held-open';
    powerSource?: 'mains' | 'battery';
    batteryLevel?: number;
    lastStatusChange?: string;
    groupId?: string;
    zoneId?: string;
    cachedEvents?: CachedEvent[];
    permanentAccess?: boolean;
    hardwareVendor?: string;
    ipAddress?: string;
}

export interface AccessControlUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department: string;
    status: UserStatus;
    accessLevel: AccessLevel;
    lastAccess?: string;
    accessCount: number;
    avatar: string;
    permissions: string[];
    phone?: string;
    employeeId?: string;
    accessSchedule?: AccessSchedule;
    temporaryAccesses?: TemporaryAccess[];
    autoRevokeAtCheckout?: boolean;
}

export interface AccessEvent {
    id: string;
    userId: string;
    userName: string;
    accessPointId: string;
    accessPointName: string;
    action: AccessAction;
    timestamp: string;
    reason?: string;
    location: string;
    accessMethod: string;
    result?: AccessResult;
    /** 'pending' = agent-submitted, needs manager review; 'approved' | 'rejected' */
    review_status?: 'pending' | 'approved' | 'rejected';
    /** Source of the event: 'web_admin' | 'mobile_agent' | 'hardware_device' | 'system' */
    source?: 'web_admin' | 'mobile_agent' | 'hardware_device' | 'system';
    /** Agent ID if submitted by mobile agent */
    source_agent_id?: string;
    /** Device ID if submitted by hardware device */
    source_device_id?: string;
    /** Additional metadata from source */
    source_metadata?: Record<string, unknown>;
    /** Reviewed by user ID */
    reviewed_by?: string;
    /** Review timestamp */
    reviewed_at?: string;
    /** Rejection reason if rejected */
    rejection_reason?: string;
}

export type AuditSource = 'web_admin' | 'mobile_agent' | 'system';

export interface AccessControlAuditEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    status: 'success' | 'failure' | 'info';
    target?: string;
    reason?: string;
    source?: AuditSource;
}

export interface Credential {
    id: number | string;
    type: CredentialType;
    assignedTo: string;
    cardNumber?: string;
    pin?: string;
    expiresAt?: string;
    maxUses?: number;
    currentUses: number;
    status: CredentialStatus;
}

// ============================================================================
// Supporting Types
// ============================================================================

export type UserRole = 'admin' | 'manager' | 'employee' | 'guest' | 'security' | 'executive' | 'it' | 'contractor';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type AccessLevel = 'standard' | 'elevated' | 'restricted';
export type AccessAction = 'granted' | 'denied' | 'timeout';
export type AccessResult = 'granted' | 'denied' | 'timeout';
export type CredentialType = 'keycard' | 'biometric' | 'mobile' | 'pin' | 'qr_code';
export type CredentialStatus = 'active' | 'expired' | 'revoked';

export interface AccessSchedule {
    days: string[];
    startTime: string;
    endTime: string;
    timezone?: string;
}

export interface TemporaryAccess {
    id: string;
    userId: string;
    accessPointIds: string[];
    startTime: string;
    endTime: string;
    reason: string;
    grantedBy: string;
    createdAt: string;
}

export interface CachedEvent {
    id: string;
    accessPointId: string;
    userId: string;
    action: AccessAction;
    timestamp: string;
    synced: boolean;
}

// ============================================================================
// Metrics & Analytics
// ============================================================================

export interface AccessMetrics {
    // Mobile & Hardware Integration Metrics
    mobileAgentEvents?: number;
    hardwareDeviceEvents?: number;
    pendingAgentEvents?: number;
    offlineDevices?: number;
    registeredDevices?: number;
    totalAccessPoints: number;
    activeAccessPoints: number;
    totalUsers: number;
    activeUsers: number;
    todayAccessEvents: number;
    deniedAccessEvents: number;
    averageResponseTime: string;
    systemUptime: string;
    topAccessPoints: { name: string; count: number }[];
    recentAlerts: number;
    securityScore: number;
    lastSecurityScan: string;
}

// ============================================================================
// Advanced Features
// ============================================================================

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
    role: UserRole;
    zoneName: string;
    accessPointIds: string[];
    createdAt: string;
}

export interface VisitorRegistration {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    photoUrl?: string;
    idDocumentUrl?: string;
    checkInTime: string;
    expectedCheckOutTime: string;
    actualCheckOutTime?: string;
    accessPointIds: string[];
    hostUserId: string;
    status: 'checked-in' | 'checked-out' | 'expired';
}

export interface HeldOpenAlert {
    id: string;
    accessPointId: string;
    accessPointName: string;
    startTime: string;
    duration: number;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: string;
}

export interface EmergencyOverride {
    id: string;
    mode: 'lockdown' | 'unlock';
    initiatedBy: string;
    timestamp: string;
    priority: number;
    timeoutDuration?: number;
    timeoutTimer?: NodeJS.Timeout;
    reason?: string;
    affectedAccessPoints: string[];
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface BiometricConfig {
    enabled: boolean;
    requireFingerprint: boolean;
    requireFaceId: boolean;
    requireIris: boolean;
    requireVoice: boolean;
    fallbackToCard: boolean;
    highSecurityOnly: boolean;
    enrollmentRequired: boolean;
    retentionPeriod: number;
}

export interface AccessTimeoutsConfig {
    enabled: boolean;
    defaultTimeout: number;
    temporaryAccessTimeout: number;
    emergencyTimeout: number;
    visitorTimeout: number;
    extendable: boolean;
    warningBeforeExpiry: boolean;
    warningDuration: number;
    autoRevoke: boolean;
    notificationOnExpiry: boolean;
}

export interface EmergencyOverrideConfig {
    enabled: boolean;
    requireAuthorization: boolean;
    authorizedRoles: string[];
    lockdownDuration: number;
    unlockDuration: number;
    autoRestore: boolean;
    requireAuditLog: boolean;
    requireConfirmation: boolean;
    notificationRecipients: string[];
    escalationLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AccessLoggingConfig {
    enabled: boolean;
    logLevel: 'minimal' | 'standard' | 'detailed' | 'verbose';
    retentionPeriod: number;
    logSuccessfulAccess: boolean;
    logDeniedAccess: boolean;
    logEmergencyActions: boolean;
    logBiometricAccess: boolean;
    includeLocation: boolean;
    includeTime: boolean;
    includeUserInfo: boolean;
    includeDeviceInfo: boolean;
    compressOldLogs: boolean;
    exportFormat: 'json' | 'csv' | 'xml';
    autoArchive: boolean;
    archiveAfterDays: number;
}

export interface NotificationSettingsConfig {
    enabled: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    notifyOnAccessDenied: boolean;
    notifyOnEmergencyAction: boolean;
    notifyOnHeldOpenAlarm: boolean;
    notifyOnTimeoutExpiry: boolean;
    notifyOnBannedAttempt: boolean;
    notifyOnOfflineDevice: boolean;
    notifyAdminsOnly: boolean;
    notificationEmail: string;
    notificationSms: string;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    criticalOnlyInQuietHours: boolean;
}

export interface BackupRecoveryConfig {
    enabled: boolean;
    backupFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
    customBackupSchedule: string;
    backupLocation: 'local' | 'cloud' | 'both';
    cloudProvider: 'aws' | 'azure' | 'gcp' | 'other';
    retentionDays: number;
    encryptBackups: boolean;
    compressionEnabled: boolean;
    includeAccessLogs: boolean;
    includeUserData: boolean;
    includeConfig: boolean;
    autoBackup: boolean;
    backupOnConfigChange: boolean;
    testRestoreEnabled: boolean;
    restorePointLimit: number;
}

// ============================================================================
// Form Types
// ============================================================================

export interface AccessPointFormData {
    name: string;
    location: string;
    type: AccessPoint['type'];
    accessMethod: AccessPoint['accessMethod'];
    status: AccessPoint['status'];
    description?: string;
}

export interface UserFormData {
    name: string;
    email: string;
    department: string;
    role: UserRole;
    accessLevel: AccessLevel;
    phone?: string;
    employeeId?: string;
    accessSchedule?: AccessSchedule;
    autoRevokeAtCheckout?: boolean;
}

export interface TemporaryAccessFormData {
    userId: string;
    accessPointIds: string[];
    startTime: string;
    endTime: string;
    reason: string;
}

export interface ReportFormData {
    startDate: string;
    endDate: string;
    eventTypes: string[];
    userIds: string[];
    accessPointIds: string[];
    format: 'pdf' | 'csv' | 'excel';
    type: 'activity' | 'emergency' | 'denied' | 'audit';
}

// ============================================================================
// Filter Types
// ============================================================================

export interface UserFilters {
    searchQuery?: string;
    role?: UserRole | 'all';
    status?: UserStatus | 'all';
    department?: string;
    accessLevel?: AccessLevel | 'all';
}

export interface AccessPointFilters {
    searchQuery?: string;
    type?: AccessPoint['type'] | 'all';
    status?: AccessPoint['status'] | 'all';
    securityLevel?: AccessPoint['securityLevel'] | 'all';
    location?: string;
}

export interface AccessEventFilters {
    searchQuery?: string;
    action?: AccessAction | 'all';
    startDate?: string;
    endDate?: string;
    userId?: string;
    accessPointId?: string;
}
