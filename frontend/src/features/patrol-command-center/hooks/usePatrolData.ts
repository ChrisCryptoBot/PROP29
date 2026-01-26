/**
 * Patrol Data Fetching Hook
 * Handles all data fetching operations for patrol command center
 * Extracted from usePatrolState for better modularity
 */

import { useState, useCallback, useEffect } from 'react';
import { retryWithBackoff } from '../../../utils/retryWithBackoff';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { PatrolEndpoint } from '../../../services/PatrolEndpoint';
import apiService from '../../../services/ApiService';
import {
    validatePatrolOfficersArray,
    validateUpcomingPatrolsArray,
    validatePatrolRoutesArray,
    validatePatrolTemplatesArray,
    validateAlertsArray,
    validatePatrolMetrics
} from '../utils/validatePatrolData';
import type {
    PatrolOfficer,
    UpcomingPatrol,
    PatrolRoute,
    PatrolTemplate,
    PatrolSchedule,
    Alert,
    PatrolMetrics,
    PatrolSettings,
    EmergencyStatus,
    WeatherInfo,
    PatrolProperty
} from '../types';
import { ConfigService } from '../../../services/ConfigService';

export interface UsePatrolDataReturn {
    // Data
    officers: PatrolOfficer[];
    upcomingPatrols: UpcomingPatrol[];
    routes: PatrolRoute[];
    templates: PatrolTemplate[];
    schedule: PatrolSchedule[];
    alerts: Alert[];
    metrics: PatrolMetrics;
    settings: PatrolSettings;
    emergencyStatus: EmergencyStatus;
    weather: WeatherInfo;
    properties: PatrolProperty[];
    
    // Setters
    setOfficers: React.Dispatch<React.SetStateAction<PatrolOfficer[]>>;
    setUpcomingPatrols: React.Dispatch<React.SetStateAction<UpcomingPatrol[]>>;
    setRoutes: React.Dispatch<React.SetStateAction<PatrolRoute[]>>;
    setTemplates: React.Dispatch<React.SetStateAction<PatrolTemplate[]>>;
    setSchedule: React.Dispatch<React.SetStateAction<PatrolSchedule[]>>;
    setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
    setMetrics: React.Dispatch<React.SetStateAction<PatrolMetrics>>;
    setSettings: React.Dispatch<React.SetStateAction<PatrolSettings>>;
    setEmergencyStatus: React.Dispatch<React.SetStateAction<EmergencyStatus>>;
    setWeather: React.Dispatch<React.SetStateAction<WeatherInfo>>;
    setProperties: React.Dispatch<React.SetStateAction<PatrolProperty[]>>;
    
    // Actions
    fetchData: () => Promise<void>;
    isLoading: boolean;
    lastSyncTimestamp: Date | null;
    setLastSyncTimestamp: React.Dispatch<React.SetStateAction<Date | null>>;
}

export function usePatrolData(selectedPropertyId: string | null, selectedPropertyTimezone?: string): UsePatrolDataReturn {
    // Data State
    const [officers, setOfficers] = useState<PatrolOfficer[]>([]);
    const [upcomingPatrols, setUpcomingPatrols] = useState<UpcomingPatrol[]>([]);
    const [routes, setRoutes] = useState<PatrolRoute[]>([]);
    const [templates, setTemplates] = useState<PatrolTemplate[]>([]);
    const [schedule, setSchedule] = useState<PatrolSchedule[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [properties, setProperties] = useState<PatrolProperty[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastSyncTimestamp, setLastSyncTimestamp] = useState<Date | null>(null);

    const [metrics, setMetrics] = useState<PatrolMetrics>({
        activePatrols: 0,
        totalOfficers: 0,
        onDutyOfficers: 0,
        completedPatrols: 0,
        averageResponseTime: '0 min',
        systemUptime: '0%',
        emergencyAlerts: 0,
        lastIncident: 'N/A',
        totalRoutes: 0,
        activeRoutes: 0,
        checkpointCompletionRate: 0,
        averagePatrolDuration: '0 min',
        totalPatrols: 0,
        averageEfficiencyScore: 0,
        averagePatrolDurationMinutes: 0,
        incidentsFound: 0
    });

    const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus>({
        level: 'normal',
        message: 'All systems operational',
        lastUpdated: 'Just now',
        activeAlerts: 0
    });

    const [weather, setWeather] = useState<WeatherInfo>({
        temperature: 0,
        condition: 'Unknown',
        windSpeed: 0,
        visibility: 'Unknown',
        patrolRecommendation: 'No data available'
    });

    const [settings, setSettings] = useState<PatrolSettings>({
        defaultPatrolDurationMinutes: 45,
        patrolFrequency: 'hourly',
        shiftHandoverTime: '06:00',
        emergencyResponseMinutes: 2,
        patrolBufferMinutes: 5,
        maxConcurrentPatrols: 5,
        realTimeSync: true,
        offlineMode: true,
        autoScheduleUpdates: true,
        pushNotifications: true,
        locationTracking: true,
        emergencyAlerts: true,
        checkpointMissedAlert: true,
        emergencyAlert: true,
        patrolCompletionNotification: true,
        shiftChangeAlerts: true,
        routeDeviationAlert: true,
        systemStatusAlerts: true,
        gpsTracking: true,
        biometricVerification: true,
        autoReportGeneration: true,
        auditLogging: true,
        twoFactorAuth: true,
        sessionTimeout: true,
        ipWhitelist: true,
        mobileAppSync: true,
        apiIntegration: true,
        databaseSync: true,
        webhookSupport: true,
        cloudBackup: true,
        roleBasedAccess: true,
        dataEncryption: true,
        heartbeatOfflineThresholdMinutes: 15
    });

    const formatDateInTimezone = (timestamp: string, timeZone?: string) => {
        const date = new Date(timestamp);
        if (!timeZone) {
            return date.toISOString().split('T')[0];
        }
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(date);
        const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
        return `${get('year')}-${get('month')}-${get('day')}`;
    };

    const formatTimeInTimezone = (timestamp: string, timeZone?: string) => {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('en-GB', {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    };

    // Load properties
    useEffect(() => {
        let isMounted = true;
        const loadProperties = async () => {
            try {
                const response = await retryWithBackoff(
                    () => apiService.getUserProperties(),
                    {
                        maxRetries: 3,
                        baseDelay: 1000,
                        maxDelay: 5000
                    }
                );
                const props = (response.data || []).map((item) => ({
                    id: item.property_id,
                    name: item.property_name,
                    timezone: item.timezone
                }));
                if (isMounted) {
                    setProperties(props);
                }
            } catch (error) {
                if (isMounted) {
                    ErrorHandlerService.handle(error, 'loadProperties');
                }
            }
        };
        loadProperties();
        return () => {
            isMounted = false;
        };
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const mapPatrolStatus = (status?: string): UpcomingPatrol['status'] => {
                switch (status) {
                    case 'planned':
                        return 'scheduled';
                    case 'active':
                        return 'in-progress';
                    case 'completed':
                        return 'completed';
                    case 'interrupted':
                        return 'cancelled';
                    default:
                        return 'scheduled';
                }
            };

            // Fetch all patrol data with retry
            const [patrolsData, officersData, routesData, templatesData, settingsData, metricsData, healthData, weatherData, alertsData, emergencyData] = await Promise.all([
                retryWithBackoff(
                    () => PatrolEndpoint.getPatrols(undefined, selectedPropertyId || undefined),
                    { maxRetries: 3, baseDelay: 1000, maxDelay: 5000 }
                ),
                retryWithBackoff(
                    () => PatrolEndpoint.getOfficers(),
                    { maxRetries: 3, baseDelay: 1000, maxDelay: 5000 }
                ),
                retryWithBackoff(
                    () => PatrolEndpoint.getRoutes(selectedPropertyId || undefined),
                    { maxRetries: 3, baseDelay: 1000, maxDelay: 5000 }
                ),
                retryWithBackoff(
                    () => PatrolEndpoint.getTemplates(selectedPropertyId || undefined),
                    { maxRetries: 3, baseDelay: 1000, maxDelay: 5000 }
                ),
                retryWithBackoff(
                    () => PatrolEndpoint.getSettings(selectedPropertyId || undefined),
                    { maxRetries: 3, baseDelay: 1000, maxDelay: 5000 }
                ),
                retryWithBackoff(
                    () => PatrolEndpoint.getMetrics(selectedPropertyId || undefined),
                    { maxRetries: 3, baseDelay: 1000, maxDelay: 5000 }
                ),
                PatrolEndpoint.getOfficersHealth(selectedPropertyId || undefined).catch(() => ({})),
                PatrolEndpoint.getWeather().catch(() => null),
                PatrolEndpoint.getAlerts().catch(() => []),
                PatrolEndpoint.getEmergencyStatus().catch(() => null)
            ]);

            const health = (healthData || {}) as Record<string, { last_heartbeat?: string; connection_status?: 'online' | 'offline' | 'unknown' }>;

            // Validate and set weather
            if (weatherData && typeof weatherData === 'object') {
                const w = weatherData as any;
                setWeather({
                    temperature: typeof w.temperature === 'number' ? w.temperature : 0,
                    condition: typeof w.condition === 'string' ? w.condition : 'Unknown',
                    windSpeed: typeof w.windSpeed === 'number' ? w.windSpeed : 0,
                    visibility: typeof w.visibility === 'string' ? w.visibility : 'Unknown',
                    patrolRecommendation: typeof w.patrolRecommendation === 'string' ? w.patrolRecommendation : 'No data available'
                });
            }

            // Validate and set alerts
            if (alertsData && Array.isArray(alertsData)) {
                const mappedAlerts = alertsData.map((alert: any) => ({
                    id: alert.id,
                    type: alert.type,
                    message: alert.message,
                    timestamp: alert.timestamp,
                    severity: alert.severity,
                    isRead: alert.isRead,
                    patrol_id: alert.patrol_id,
                    officer_id: alert.officer_id,
                    officer: alert.officer,
                    incident_id: alert.incident_id,
                    location: alert.location
                }));
                const validatedAlerts = validateAlertsArray(mappedAlerts);
                setAlerts(validatedAlerts);
            }

            // Validate and set emergency status
            if (emergencyData && typeof emergencyData === 'object') {
                const e = emergencyData as any;
                setEmergencyStatus({
                    level: ['normal', 'elevated', 'high', 'critical'].includes(e.level) ? e.level : 'normal',
                    message: typeof e.message === 'string' ? e.message : 'All systems operational',
                    lastUpdated: 'Just now',
                    activeAlerts: typeof e.activeAlerts === 'number' ? e.activeAlerts : 0
                });
            }

            // Map and validate patrols
            const mappedPatrols: UpcomingPatrol[] = (patrolsData || []).map((patrol: any) => {
                const route = patrol?.route || {};
                const routeName = route?.name || route?.label || 'Unassigned Route';
                const estimatedDuration = route?.estimated_duration || route?.estimatedDuration || ConfigService.DEFAULT_PATROL_DURATION;
                const priority = route?.priority || ConfigService.DEFAULT_PRIORITY;
                const startedAt = patrol?.started_at || patrol?.created_at;
                const checkpoints = patrol?.checkpoints || route?.checkpoints || [];

                return {
                    id: patrol.patrol_id,
                    name: routeName || `Patrol ${patrol.patrol_id}`,
                    assignedOfficer: patrol.guard_name || 'Unassigned',
                    startTime: startedAt || new Date().toISOString(),
                    duration: estimatedDuration,
                    priority,
                    status: mapPatrolStatus(patrol.status),
                    location: route?.location || routeName || 'Unknown',
                    description: route?.description || '',
                    routeId: route?.route_id || route?.id,
                    templateId: patrol?.template_id,
                    checkpoints,
                    version: typeof patrol?.version === 'number' ? patrol.version : undefined
                };
            });

            const validatedPatrols = validateUpcomingPatrolsArray(mappedPatrols);
            setUpcomingPatrols(validatedPatrols);

            // Map schedule
            const mappedSchedule: PatrolSchedule[] = validatedPatrols.map((patrol) => ({
                id: patrol.id,
                title: patrol.name,
                date: formatDateInTimezone(patrol.startTime || new Date().toISOString(), selectedPropertyTimezone),
                time: formatTimeInTimezone(patrol.startTime || new Date().toISOString(), selectedPropertyTimezone),
                duration: patrol.duration,
                route: patrol.location,
                assignedOfficer: patrol.assignedOfficer,
                priority: patrol.priority,
                status: patrol.status,
                type: 'routine'
            }));
            setSchedule(mappedSchedule);

            // Map and validate officers
            const mappedOfficersRaw = (officersData || []).map((u: any) => {
                const officerName = `${u.first_name} ${u.last_name}`.trim();
                const activePatrol = validatedPatrols.find(p => p.assignedOfficer === officerName && p.status === 'in-progress');
                const oid = String(u.user_id ?? '');
                const h = health[oid];
                return {
                    id: u.user_id,
                    name: officerName || 'Unnamed Officer',
                    status: activePatrol ? 'on-duty' : 'off-duty',
                    location: 'HQ',
                    specializations: Array.isArray(u.roles?.[0]?.permissions?.specializations) ? u.roles[0].permissions.specializations : ['General Security'],
                    shift: 'Day',
                    experience: '1 year',
                    activePatrols: activePatrol ? 1 : 0,
                    avatar: typeof u.profile_image_url === 'string' ? u.profile_image_url : '/avatars/default.jpg',
                    lastSeen: typeof u.updated_at === 'string' ? u.updated_at : new Date().toISOString(),
                    currentPatrol: activePatrol?.id,
                    ...(h && {
                        last_heartbeat: typeof h.last_heartbeat === 'string' ? h.last_heartbeat : undefined,
                        connection_status: ['online', 'offline', 'unknown'].includes(h.connection_status || '') ? h.connection_status : 'unknown'
                    })
                };
            });
            const validatedOfficers = validatePatrolOfficersArray(mappedOfficersRaw);
            setOfficers(validatedOfficers);

            // Map and validate routes
            const mappedRoutesRaw = (routesData || []).map((r: any) => ({
                id: r.route_id,
                name: typeof r.name === 'string' ? r.name : 'Unnamed Route',
                description: typeof r.description === 'string' ? r.description : '',
                checkpoints: Array.isArray(r.checkpoints) ? r.checkpoints : [],
                estimatedDuration: typeof r.estimated_duration === 'string' ? r.estimated_duration : '45 min',
                difficulty: ['easy', 'medium', 'hard'].includes(r.difficulty) ? r.difficulty : 'medium',
                frequency: ['hourly', 'daily', 'weekly', 'custom'].includes(r.frequency) ? r.frequency : 'hourly',
                isActive: typeof r.is_active === 'boolean' ? r.is_active : true,
                lastUsed: typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
                performanceScore: typeof r.performance_score === 'number' ? r.performance_score : 90
            }));
            const validatedRoutes = validatePatrolRoutesArray(mappedRoutesRaw);
            setRoutes(validatedRoutes);

            // Map and validate templates
            const mappedTemplatesRaw = (templatesData || []).map((t: any) => ({
                id: t.template_id,
                name: typeof t.name === 'string' ? t.name : 'Unnamed Template',
                description: typeof t.description === 'string' ? t.description : '',
                routeId: typeof t.route_id === 'string' ? t.route_id : '',
                assignedOfficers: Array.isArray(t.assigned_officers) ? t.assigned_officers : [],
                schedule: typeof t.schedule === 'object' && t.schedule ? t.schedule : {},
                priority: ['low', 'medium', 'high', 'critical'].includes(t.priority) ? t.priority : 'medium',
                isRecurring: typeof t.is_recurring === 'boolean' ? t.is_recurring : false
            }));
            const validatedTemplates = validatePatrolTemplatesArray(mappedTemplatesRaw);
            setTemplates(validatedTemplates);

            // Map and validate settings
            if (settingsData && typeof settingsData === 'object') {
                const s = settingsData as any;
                const transformedSettings: PatrolSettings = {
                    defaultPatrolDurationMinutes: typeof s.default_patrol_duration_minutes === 'number' ? s.default_patrol_duration_minutes : 45,
                    patrolFrequency: typeof s.patrol_frequency === 'string' ? s.patrol_frequency : 'hourly',
                    shiftHandoverTime: typeof s.shift_handover_time === 'string' ? s.shift_handover_time : '06:00',
                    emergencyResponseMinutes: typeof s.emergency_response_minutes === 'number' ? s.emergency_response_minutes : 2,
                    patrolBufferMinutes: typeof s.patrol_buffer_minutes === 'number' ? s.patrol_buffer_minutes : 5,
                    maxConcurrentPatrols: typeof s.max_concurrent_patrols === 'number' ? s.max_concurrent_patrols : 5,
                    realTimeSync: typeof s.real_time_sync === 'boolean' ? s.real_time_sync : true,
                    offlineMode: typeof s.offline_mode === 'boolean' ? s.offline_mode : true,
                    autoScheduleUpdates: typeof s.auto_schedule_updates === 'boolean' ? s.auto_schedule_updates : true,
                    pushNotifications: typeof s.push_notifications === 'boolean' ? s.push_notifications : true,
                    locationTracking: typeof s.location_tracking === 'boolean' ? s.location_tracking : true,
                    emergencyAlerts: typeof s.emergency_alerts === 'boolean' ? s.emergency_alerts : true,
                    checkpointMissedAlert: typeof s.checkpoint_missed_alert === 'boolean' ? s.checkpoint_missed_alert : true,
                    emergencyAlert: typeof s.emergency_alerts === 'boolean' ? s.emergency_alerts : true,
                    patrolCompletionNotification: typeof s.patrol_completion_notification === 'boolean' ? s.patrol_completion_notification : true,
                    shiftChangeAlerts: typeof s.shift_change_alerts === 'boolean' ? s.shift_change_alerts : true,
                    routeDeviationAlert: typeof s.route_deviation_alert === 'boolean' ? s.route_deviation_alert : true,
                    systemStatusAlerts: typeof s.system_status_alerts === 'boolean' ? s.system_status_alerts : true,
                    gpsTracking: typeof s.gps_tracking === 'boolean' ? s.gps_tracking : true,
                    biometricVerification: typeof s.biometric_verification === 'boolean' ? s.biometric_verification : true,
                    autoReportGeneration: typeof s.auto_report_generation === 'boolean' ? s.auto_report_generation : true,
                    auditLogging: typeof s.audit_logging === 'boolean' ? s.audit_logging : true,
                    twoFactorAuth: typeof s.two_factor_auth === 'boolean' ? s.two_factor_auth : true,
                    sessionTimeout: typeof s.session_timeout === 'boolean' ? s.session_timeout : true,
                    ipWhitelist: typeof s.ip_whitelist === 'boolean' ? s.ip_whitelist : true,
                    mobileAppSync: typeof s.mobile_app_sync === 'boolean' ? s.mobile_app_sync : true,
                    apiIntegration: typeof s.api_integration === 'boolean' ? s.api_integration : true,
                    databaseSync: typeof s.database_sync === 'boolean' ? s.database_sync : true,
                    webhookSupport: typeof s.webhook_support === 'boolean' ? s.webhook_support : true,
                    cloudBackup: typeof s.cloud_backup === 'boolean' ? s.cloud_backup : true,
                    roleBasedAccess: typeof s.role_based_access === 'boolean' ? s.role_based_access : true,
                    dataEncryption: typeof s.data_encryption === 'boolean' ? s.data_encryption : true,
                    heartbeatOfflineThresholdMinutes: typeof s.heartbeat_offline_threshold_minutes === 'number' ? s.heartbeat_offline_threshold_minutes : 15
                };
                setSettings(transformedSettings);
            }

            // Validate and set metrics
            if (metricsData && typeof metricsData === 'object') {
                const validatedMetrics = validatePatrolMetrics(metricsData);
                setMetrics(prev => ({
                    ...prev,
                    totalPatrols: validatedMetrics.totalPatrols ?? prev.totalPatrols,
                    completedPatrols: validatedMetrics.completedPatrols ?? prev.completedPatrols,
                    averageEfficiencyScore: validatedMetrics.averageEfficiencyScore ?? prev.averageEfficiencyScore,
                    averagePatrolDurationMinutes: validatedMetrics.averagePatrolDurationMinutes ?? prev.averagePatrolDurationMinutes,
                    averagePatrolDuration: validatedMetrics.averagePatrolDurationMinutes ? `${Math.round(validatedMetrics.averagePatrolDurationMinutes)} min` : prev.averagePatrolDuration,
                    incidentsFound: validatedMetrics.incidentsFound ?? prev.incidentsFound
                }));
            }

            // Update last sync timestamp
            setLastSyncTimestamp(new Date());
        } catch (error) {
            ErrorHandlerService.handle(error, 'fetchPatrolData');
        } finally {
            setIsLoading(false);
        }
    }, [selectedPropertyId, selectedPropertyTimezone]);

    return {
        officers,
        upcomingPatrols,
        routes,
        templates,
        schedule,
        alerts,
        metrics,
        settings,
        emergencyStatus,
        weather,
        properties,
        setOfficers,
        setUpcomingPatrols,
        setRoutes,
        setTemplates,
        setSchedule,
        setAlerts,
        setMetrics,
        setSettings,
        setEmergencyStatus,
        setWeather,
        setProperties,
        fetchData,
        isLoading,
        lastSyncTimestamp,
        setLastSyncTimestamp
    };
}
