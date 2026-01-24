export interface PatrolOfficer {
    id: string;
    name: string;
    status: 'on-duty' | 'off-duty' | 'break' | 'unavailable';
    location: string;
    specializations: string[];
    shift: 'Day' | 'Night' | 'Evening';
    experience: string;
    avatar: string;
    lastSeen: string;
    currentPatrol?: string;
    activePatrols?: number;
    /** Hardware/device health (for mobile agent integration) */
    last_heartbeat?: string;
    connection_status?: 'online' | 'offline' | 'unknown';
    device_id?: string;
}

export interface PatrolProperty {
    id: string;
    name: string;
    timezone?: string;
}

export interface UpcomingPatrol {
    id: string;
    name: string;
    assignedOfficer: string;
    startTime: string;
    duration: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    location: string;
    description: string;
    routeId?: string;
    templateId?: string;
    checkpoints?: Checkpoint[];
    /** Optimistic locking: increment on each update; backend returns 409 if stale */
    version?: number;
}

export type CheckpointSyncStatus = 'pending' | 'synced' | 'failed';

export interface Checkpoint {
    id: string;
    name: string;
    location: string;
    coordinates: { lat: number; lng: number };
    type: 'security' | 'maintenance' | 'safety' | 'custom';
    requiredActions: string[];
    estimatedTime: number;
    isCritical: boolean;
    status?: 'pending' | 'completed' | 'skipped';
    completedAt?: string;
    completedBy?: string;
    notes?: string;
    /** UI sync state: pending (queued/local), synced (server confirmed), failed (retry available) */
    syncStatus?: CheckpointSyncStatus;
}

export interface PatrolRoute {
    id: string;
    name: string;
    description: string;
    checkpoints: Checkpoint[];
    estimatedDuration: string;
    difficulty: 'easy' | 'medium' | 'hard';
    frequency: 'hourly' | 'daily' | 'weekly' | 'custom';
    isActive: boolean;
    lastUsed: string;
    performanceScore: number;
}

export interface PatrolSchedule {
    id: string;
    title: string;
    date: string;
    time: string;
    duration: string;
    route: string;
    assignedOfficer: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    type: 'routine' | 'emergency' | 'special' | 'training';
}

export interface EmergencyStatus {
    level: 'normal' | 'elevated' | 'high' | 'critical';
    message: string;
    lastUpdated: string;
    activeAlerts: number;
}

export interface WeatherInfo {
    temperature: number;
    condition: string;
    windSpeed: number;
    visibility: string;
    patrolRecommendation: string;
}

export interface Alert {
    id: string;
    type: 'checkpoint_missed' | 'emergency' | 'system' | 'weather';
    message: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    isRead: boolean;
}

export interface PatrolTemplate {
    id: string;
    name: string;
    description: string;
    routeId: string;
    assignedOfficers: string[];
    schedule: {
        startTime: string;
        endTime: string;
        days: string[];
    };
    priority: 'low' | 'medium' | 'high' | 'critical';
    isRecurring: boolean;
}

export interface PatrolMetrics {
    activePatrols: number;
    totalOfficers: number;
    onDutyOfficers: number;
    completedPatrols: number;
    averageResponseTime: string;
    systemUptime: string;
    emergencyAlerts: number;
    lastIncident: string;
    totalRoutes: number;
    activeRoutes: number;
    checkpointCompletionRate: number;
    averagePatrolDuration: string;
    totalPatrols: number;
    averageEfficiencyScore: number;
    averagePatrolDurationMinutes: number;
    incidentsFound: number;
}

export interface PatrolSettings {
    defaultPatrolDurationMinutes: number;
    patrolFrequency: string;
    shiftHandoverTime: string;
    emergencyResponseMinutes: number;
    patrolBufferMinutes: number;
    maxConcurrentPatrols: number;
    realTimeSync: boolean;
    offlineMode: boolean;
    autoScheduleUpdates: boolean;
    pushNotifications: boolean;
    locationTracking: boolean;
    emergencyAlerts: boolean;
    checkpointMissedAlert: boolean;
    emergencyAlert: boolean;
    patrolCompletionNotification: boolean;
    shiftChangeAlerts: boolean;
    routeDeviationAlert: boolean;
    systemStatusAlerts: boolean;
    gpsTracking: boolean;
    biometricVerification: boolean;
    autoReportGeneration: boolean;
    auditLogging: boolean;
    twoFactorAuth: boolean;
    sessionTimeout: boolean;
    ipWhitelist: boolean;
    mobileAppSync: boolean;
    apiIntegration: boolean;
    databaseSync: boolean;
    webhookSupport: boolean;
    cloudBackup: boolean;
    roleBasedAccess: boolean;
    dataEncryption: boolean;
    heartbeatOfflineThresholdMinutes?: number;
}
