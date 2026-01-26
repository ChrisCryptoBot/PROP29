import { useState, useCallback, useEffect } from 'react';
import {
    PatrolOfficer,
    UpcomingPatrol,
    PatrolRoute,
    PatrolTemplate,
    PatrolSchedule,
    EmergencyStatus,
    WeatherInfo,
    Alert,
    PatrolMetrics,
    PatrolSettings,
    Checkpoint,
    PatrolProperty
} from '../types';
import { PatrolContextValue } from '../context/PatrolContext';
import { showLoading, showSuccess, showError, dismissLoadingAndShowSuccess, dismissLoadingAndShowError, showToastWithUndo, dismissToast, showWarning } from '../../../utils/toast';
import { StateUpdateService } from '../../../services/StateUpdateService';
import { ConfigService } from '../../../services/ConfigService';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { PatrolEndpoint } from '../../../services/PatrolEndpoint';
import { retryWithBackoff } from '../../../utils/retryWithBackoff';
import apiService from '../../../services/ApiService';
import { useCheckInQueue } from './useCheckInQueue';
import { usePatrolActions } from './usePatrolActions';
import { useRequestDeduplication } from './useRequestDeduplication';
import { useEdgeCaseHandling } from './useEdgeCaseHandling';
import { usePatrolTelemetry } from './usePatrolTelemetry';
import {
    validatePatrolOfficersArray,
    validateUpcomingPatrolsArray,
    validatePatrolRoutesArray,
    validatePatrolTemplatesArray,
    validateAlertsArray,
    validatePatrolMetrics
} from '../utils/validatePatrolData';

export const usePatrolState = (): PatrolContextValue => {
    // Data State
    const [officers, setOfficers] = useState<PatrolOfficer[]>([]);
    const [upcomingPatrols, setUpcomingPatrols] = useState<UpcomingPatrol[]>([]);
    const [routes, setRoutes] = useState<PatrolRoute[]>([]);
    const [templates, setTemplates] = useState<PatrolTemplate[]>([]);
    const [schedule, setSchedule] = useState<PatrolSchedule[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [properties, setProperties] = useState<PatrolProperty[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const selectedPropertyTimezone = properties.find((prop) => prop.id === selectedPropertyId)?.timezone;

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

    const [isLoading, setIsLoading] = useState(false);
    const [isOffline, setIsOffline] = useState(() =>
        typeof navigator === 'undefined' ? false : !navigator.onLine
    );
    const [lastSyncTimestamp, setLastSyncTimestamp] = useState<Date | null>(null);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

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
                    // Only auto-select if no property is selected and we have properties
                    if (!selectedPropertyId && props.length > 0) {
                        setSelectedPropertyId(props[0].id);
                    }
                    // Handle case where selected property was deleted
                    if (selectedPropertyId && !props.find(p => p.id === selectedPropertyId)) {
                        if (props.length > 0) {
                            setSelectedPropertyId(props[0].id);
                        } else {
                            setSelectedPropertyId(null);
                        }
                    }
                }
            } catch (error) {
                if (isMounted) {
                    // Keep existing properties if load fails (graceful degradation)
                    ErrorHandlerService.handle(error, 'loadProperties');
                }
            }
        };
        loadProperties();
        return () => {
            isMounted = false;
        };
    }, [selectedPropertyId, selectedPropertyTimezone]);

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

            // Fetch all patrol data including alerts and emergency status with retry
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
            if (weatherData) {
                setWeather({
                    temperature: weatherData.temperature,
                    condition: weatherData.condition,
                    windSpeed: weatherData.windSpeed,
                    visibility: weatherData.visibility,
                    patrolRecommendation: weatherData.patrolRecommendation
                });
            }

            // Set alerts data with validation
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
                // Validate and sanitize alerts
                const validatedAlerts = validateAlertsArray(mappedAlerts);
                setAlerts(validatedAlerts);
            }

            // Set emergency status
            if (emergencyData) {
                setEmergencyStatus({
                    level: emergencyData.level || 'normal',
                    message: emergencyData.message || 'All systems operational',
                    lastUpdated: 'Just now',
                    activeAlerts: emergencyData.activeAlerts || 0
                });
            }

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
                    version: patrol?.version
                };
            });

            // Validate and sanitize patrols data
            const validatedPatrols = validateUpcomingPatrolsArray(mappedPatrols);
            setUpcomingPatrols(validatedPatrols);

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

            // Map officers (merge health: last_heartbeat, connection_status)
            const mappedOfficersRaw = (officersData || []).map((u: any) => {
                const officerName = `${u.first_name} ${u.last_name}`.trim();
                const activePatrol = mappedPatrols.find(p => p.assignedOfficer === officerName && p.status === 'in-progress');
                const oid = String(u.user_id ?? '');
                const h = health[oid];
                return {
                    id: u.user_id,
                    name: officerName || 'Unnamed Officer',
                    status: activePatrol ? 'on-duty' : 'off-duty',
                    location: 'HQ',
                    specializations: u.roles?.[0]?.permissions?.specializations || ['General Security'],
                    shift: 'Day',
                    experience: '1 year',
                    activePatrols: activePatrol ? 1 : 0,
                    avatar: u.profile_image_url || '/avatars/default.jpg',
                    lastSeen: u.updated_at,
                    currentPatrol: activePatrol?.id,
                    ...(h && {
                        last_heartbeat: h.last_heartbeat,
                        connection_status: h.connection_status
                    })
                };
            });
            // Validate and sanitize officers data
            const validatedOfficers = validatePatrolOfficersArray(mappedOfficersRaw);
            setOfficers(validatedOfficers);

            // Map Routes
            const mappedRoutesRaw = (routesData || []).map((r: any) => ({
                id: r.route_id,
                name: r.name,
                description: r.description,
                checkpoints: r.checkpoints || [],
                estimatedDuration: r.estimated_duration,
                difficulty: r.difficulty,
                frequency: r.frequency,
                isActive: r.is_active,
                lastUsed: r.updated_at,
                performanceScore: 90
            }));
            // Validate and sanitize routes data
            const validatedRoutes = validatePatrolRoutesArray(mappedRoutesRaw);
            setRoutes(validatedRoutes);

            // Map Templates
            const mappedTemplatesRaw = (templatesData || []).map((t: any) => ({
                id: t.template_id,
                name: t.name,
                description: t.description,
                routeId: t.route_id,
                assignedOfficers: t.assigned_officers || [],
                schedule: t.schedule || {},
                priority: t.priority,
                isRecurring: t.is_recurring
            }));
            // Validate and sanitize templates data
            const validatedTemplates = validatePatrolTemplatesArray(mappedTemplatesRaw);
            setTemplates(validatedTemplates);

            // Map Settings
            if (settingsData) {
                const transformedSettings: PatrolSettings = {
                    defaultPatrolDurationMinutes: settingsData.default_patrol_duration_minutes ?? 45,
                    patrolFrequency: settingsData.patrol_frequency ?? 'hourly',
                    shiftHandoverTime: settingsData.shift_handover_time ?? '06:00',
                    emergencyResponseMinutes: settingsData.emergency_response_minutes ?? 2,
                    patrolBufferMinutes: settingsData.patrol_buffer_minutes ?? 5,
                    maxConcurrentPatrols: settingsData.max_concurrent_patrols ?? 5,
                    realTimeSync: settingsData.real_time_sync,
                    offlineMode: settingsData.offline_mode,
                    autoScheduleUpdates: settingsData.auto_schedule_updates,
                    pushNotifications: settingsData.push_notifications,
                    locationTracking: settingsData.location_tracking,
                    emergencyAlerts: settingsData.emergency_alerts,
                    checkpointMissedAlert: settingsData.checkpoint_missed_alert,
                    emergencyAlert: settingsData.emergency_alerts,
                    patrolCompletionNotification: settingsData.patrol_completion_notification,
                    shiftChangeAlerts: settingsData.shift_change_alerts,
                    routeDeviationAlert: settingsData.route_deviation_alert,
                    systemStatusAlerts: settingsData.system_status_alerts,
                    gpsTracking: settingsData.gps_tracking,
                    biometricVerification: settingsData.biometric_verification,
                    autoReportGeneration: settingsData.auto_report_generation,
                    auditLogging: settingsData.audit_logging,
                    twoFactorAuth: settingsData.two_factor_auth,
                    sessionTimeout: settingsData.session_timeout,
                    ipWhitelist: settingsData.ip_whitelist,
                    mobileAppSync: settingsData.mobile_app_sync,
                    apiIntegration: settingsData.api_integration,
                    databaseSync: settingsData.database_sync,
                    webhookSupport: settingsData.webhook_support,
                    cloudBackup: settingsData.cloud_backup,
                    roleBasedAccess: settingsData.role_based_access,
                    dataEncryption: settingsData.data_encryption,
                    heartbeatOfflineThresholdMinutes: settingsData.heartbeat_offline_threshold_minutes ?? 15
                };
                setSettings(transformedSettings);
            }

            if (metricsData) {
                // Validate and sanitize metrics
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
            
            // Update last sync timestamp on successful fetch
            setLastSyncTimestamp(new Date());
        } catch (error) {
            ErrorHandlerService.handle(error, 'fetchPatrolData');
        } finally {
            setIsLoading(false);
        }
    }, [selectedPropertyId]);

    const checkInQueue = useCheckInQueue({
        onSynced: fetchData,
        flushIntervalMs: settings.realTimeSync ? 60000 : 120000
    });

    // Request deduplication for mobile agent integration
    const requestDedup = useRequestDeduplication();

    // Edge case handling
    const edgeCaseHandling = useEdgeCaseHandling({
        properties,
        selectedPropertyId,
        setSelectedPropertyId,
        officers,
        upcomingPatrols,
        setOfficers,
        setUpcomingPatrols
    });

    // Telemetry for observability (must be at top level, not in callbacks)
    const { trackAction, trackPerformance, trackError: trackTelemetryError } = usePatrolTelemetry();

    // Initialize Data from Backend
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Recalculate Metrics when data changes
    useEffect(() => {
        const allCheckpoints = routes.flatMap(r => (r?.checkpoints || []));
        const totalCheckpoints = allCheckpoints.length;
        const completedCheckpoints = allCheckpoints.filter(cp => cp?.status === 'completed').length;

        setMetrics(prev => ({
            ...prev,
            activePatrols: upcomingPatrols.filter(p => p && p.status === 'in-progress').length,
            totalOfficers: officers.length,
            onDutyOfficers: officers.filter(o => o && o.status === 'on-duty').length,
            completedPatrols: upcomingPatrols.filter(p => p && p.status === 'completed').length,
            emergencyAlerts: alerts.filter(a => a && a.type === 'emergency' && !a.isRead).length,
            totalRoutes: routes.length,
            activeRoutes: routes.filter(r => r && r.isActive).length,
            checkpointCompletionRate: totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0,
            totalPatrols: upcomingPatrols.length || prev.totalPatrols
        }));
    }, [upcomingPatrols, officers, routes, alerts]);

    // Automatic offline detection based on heartbeat threshold
    useEffect(() => {
        if (!settings.heartbeatOfflineThresholdMinutes) return;

        const checkOfflineStatus = () => {
            const thresholdMs = settings.heartbeatOfflineThresholdMinutes! * 60 * 1000;
            const now = Date.now();

            setOfficers(prev => prev.map(officer => {
                if (!officer.last_heartbeat) {
                    // No heartbeat data - keep current status or mark as unknown
                    return officer.connection_status === 'offline' ? officer : { ...officer, connection_status: 'unknown' as const };
                }

                try {
                    const lastHeartbeat = new Date(officer.last_heartbeat).getTime();
                    const elapsed = now - lastHeartbeat;
                    const shouldBeOffline = elapsed > thresholdMs;

                    if (shouldBeOffline && officer.connection_status !== 'offline') {
                        return { ...officer, connection_status: 'offline' as const };
                    }
                    if (!shouldBeOffline && officer.connection_status === 'offline') {
                        return { ...officer, connection_status: 'online' as const };
                    }
                } catch {
                    // Invalid date - mark as unknown
                    return { ...officer, connection_status: 'unknown' as const };
                }

                return officer;
            }));
        };

        // Check immediately
        checkOfflineStatus();

        // Check every minute
        const interval = setInterval(checkOfflineStatus, 60000);

        return () => clearInterval(interval);
    }, [settings.heartbeatOfflineThresholdMinutes, officers, setOfficers]);

    // State reconciliation: Fix officer/patrol status mismatches
    useEffect(() => {
        const reconcileState = () => {
            // Find officers marked on-duty but not assigned to any active patrol
            const onDutyOfficers = officers.filter(o => o.status === 'on-duty');
            const activePatrols = upcomingPatrols.filter(p => p.status === 'in-progress');
            
            onDutyOfficers.forEach(officer => {
                const hasActivePatrol = activePatrols.some(p => 
                    p.assignedOfficer === officer.name && p.id === officer.currentPatrol
                );
                
                if (!hasActivePatrol && officer.currentPatrol) {
                    // Officer marked on-duty but patrol is not active - reconcile
                    const patrol = upcomingPatrols.find(p => p.id === officer.currentPatrol);
                    if (patrol && patrol.status !== 'in-progress') {
                        // Patrol is not in-progress, mark officer as off-duty
                        setOfficers(prev => StateUpdateService.updateItem(prev, officer.id, {
                            status: 'off-duty',
                            currentPatrol: undefined
                        }));
                    }
                }
            });

            // Find active patrols without assigned officers or with officers marked off-duty
            activePatrols.forEach(patrol => {
                if (patrol.assignedOfficer) {
                    const assignedOfficer = officers.find(o => o.name === patrol.assignedOfficer);
                    if (assignedOfficer && assignedOfficer.status !== 'on-duty') {
                        // Patrol is active but officer is not on-duty - reconcile
                        setOfficers(prev => StateUpdateService.updateItem(prev, assignedOfficer.id, {
                            status: 'on-duty',
                            currentPatrol: patrol.id
                        }));
                    }
                }
            });
        };

        // Reconcile on data changes
        if (officers.length > 0 && upcomingPatrols.length > 0) {
            reconcileState();
        }
    }, [officers, upcomingPatrols, setOfficers]);

    const {
        handleDeployOfficer,
        handleCompletePatrol,
        handleReassignOfficer,
        handleCancelPatrol,
        handleEmergencyAlert
    } = usePatrolActions({
        emergencyStatus,
        officers,
        upcomingPatrols,
        setOfficers,
        setUpcomingPatrols,
        setEmergencyStatus,
        refresh: fetchData,
        selectedPropertyId
    });

    const handleCheckpointCheckIn = useCallback(async (patrolId: string, checkpointId: string, notes?: string, deviceId?: string) => {
        if (!patrolId || !checkpointId) {
            showError('Invalid patrol or checkpoint ID');
            return;
        }

        const patrol = upcomingPatrols.find(p => p && p.id === patrolId);
        if (!patrol) {
            showError('Patrol not found');
            return;
        }

        if (patrol.status !== 'in-progress') {
            showError('Can only check in to checkpoints for active patrols');
            return;
        }

        const route = routes.find(r => r && (r.id === patrol.routeId || r.name === patrol.location));
        const patrolCheckpoints = patrol.checkpoints?.length ? patrol.checkpoints : (route?.checkpoints || []);
        const checkpoint = patrolCheckpoints.find(cp => cp && cp.id === checkpointId);
        if (!checkpoint) {
            showError('Checkpoint not found');
            return;
        }

        if (checkpoint.status === 'completed') {
            showError('Checkpoint already completed');
            return;
        }

        if (!patrol.assignedOfficer) {
            showError('No officer assigned to this patrol');
            return;
        }

        const toastId = showLoading('Checking in to checkpoint...');
        const requestId = crypto.randomUUID();
        const startTime = Date.now();
        
        // Check for duplicate request (mobile agent integration)
        if (requestDedup.isDuplicate(requestId)) {
            dismissToast(toastId);
            showError('Duplicate check-in request detected. Please wait.');
            return;
        }
        
        // Record request for deduplication
        requestDedup.recordRequest(requestId, patrolId, checkpointId);
        
        // Track action start
        trackAction('checkpoint_checkin_start', 'checkpoint', { patrolId, checkpointId, requestId, ...(deviceId && { deviceId }) });
        
        try {
            const updatedCheckpoints = patrolCheckpoints.map(cp => {
                if (cp && cp.id === checkpointId) {
                    return {
                        ...cp,
                        status: 'completed' as const,
                        completedAt: new Date().toISOString(),
                        completedBy: patrol.assignedOfficer,
                        notes: notes || undefined
                    };
                }
                return cp;
            });

            const response = await retryWithBackoff(
                () => PatrolEndpoint.checkInCheckpoint(patrolId, checkpointId, {
                    notes,
                    method: deviceId ? 'mobile' : 'manual',
                    request_id: requestId,
                    device_id: deviceId,
                    version: patrol.version
                }),
                {
                    maxRetries: 3,
                    baseDelay: 1000,
                    maxDelay: 5000,
                    shouldRetry: (error) => {
                        const status = (error as { response?: { status?: number } })?.response?.status;
                        // Don't retry on 4xx errors
                        if (status && status >= 400 && status < 500) return false;
                        // Retry on 5xx or network errors
                        return true;
                    }
                }
            );

            const base = response?.checkpoints || updatedCheckpoints;
            const responseCheckpoints = (base as Checkpoint[]).map(c =>
                c.id === checkpointId ? { ...c, syncStatus: 'synced' as const } : c
            );
            setUpcomingPatrols(prev => StateUpdateService.updateItem(prev, patrolId, {
                checkpoints: responseCheckpoints
            }));

            // Update last sync timestamp on successful check-in
            setLastSyncTimestamp(new Date());
            // Clear request from deduplication cache
            requestDedup.clearRequest(requestId);
            
            // Track success
            const duration = Date.now() - startTime;
            trackPerformance('checkpoint_checkin', duration, { patrolId, checkpointId, requestId, ...(deviceId && { deviceId }) });
            trackAction('checkpoint_checkin_success', 'checkpoint', { patrolId, checkpointId, requestId, ...(deviceId && { deviceId }), duration });
            
            dismissLoadingAndShowSuccess(toastId, `Checked in to ${checkpoint.name} successfully!`);
        } catch (error) {
            // Track error (startTime is in scope from above)
            const duration = Date.now() - startTime;
            trackTelemetryError(error as Error, { action: 'checkpoint_checkin', patrolId, checkpointId, requestId, ...(deviceId && { deviceId }), duration });
            const isNetworkIssue = !navigator.onLine || !(error as { response?: unknown }).response;
            if (isNetworkIssue) {
                const queuedId = checkInQueue.enqueue({
                    request_id: requestId,
                    patrolId,
                    checkpointId,
                    payload: {
                        notes,
                        method: 'manual',
                        request_id: requestId,
                        completed_at: new Date().toISOString(),
                        completed_by: patrol.assignedOfficer || undefined
                    },
                    queuedAt: new Date().toISOString()
                });
                setUpcomingPatrols(prev => StateUpdateService.updateItem(prev, patrolId, {
                    checkpoints: patrolCheckpoints.map(cp => {
                        if (cp && cp.id === checkpointId) {
                            return {
                                ...cp,
                                status: 'completed' as const,
                                completedAt: new Date().toISOString(),
                                completedBy: patrol.assignedOfficer,
                                notes: notes || 'Queued for sync',
                                syncStatus: 'pending' as const
                            };
                        }
                        return cp;
                    })
                }));
                dismissToast(toastId);
                showToastWithUndo('Check-in queued for sync', () => {
                    checkInQueue.removeQueuedCheckIn(queuedId);
                    setUpcomingPatrols(prev => StateUpdateService.updateItem(prev, patrolId, {
                        checkpoints: patrolCheckpoints.map(cp => {
                            if (cp && cp.id === checkpointId) {
                                return { ...cp, status: 'pending' as const, completedAt: undefined, completedBy: undefined, notes: undefined, syncStatus: undefined };
                            }
                            return cp;
                        })
                    }));
                    showSuccess('Check-in undone');
                }, 5000);
            } else {
                ErrorHandlerService.handle(error, 'checkpointCheckIn');
                dismissLoadingAndShowError(toastId, 'Failed to check in to checkpoint');
            }
        }
    }, [upcomingPatrols, routes, officers, checkInQueue.enqueue, checkInQueue.removeQueuedCheckIn]);

    const handleDeleteTemplate = useCallback(async (templateId: string) => {
        if (!templateId) {
            showError('Invalid template ID');
            return;
        }

        const template = templates.find(t => t.id === templateId);
        if (!template) {
            showError('Template not found');
            return;
        }

        // Check if THIS specific template is being used by any active patrol
        // by checking if any patrol was created from this template
        const usingPatrols = upcomingPatrols.filter(p =>
            p && p.status !== 'completed' && p.status !== 'cancelled' &&
            p.templateId === templateId  // Only check if THIS template is used
        );

        if (usingPatrols.length > 0) {
            showError(`Cannot delete template: ${usingPatrols.length} active patrol(s) are using it`);
            return;
        }

        const toastId = showLoading('Deleting template...');
        const startTime = Date.now();
        trackAction('delete_template_start', 'template', { templateId });
        try {
            await retryWithBackoff(
                () => PatrolEndpoint.deleteTemplate(templateId),
                {
                    maxRetries: 3,
                    baseDelay: 1000,
                    maxDelay: 5000
                }
            );
            setTemplates(prev => StateUpdateService.removeItem(prev, templateId));
            dismissLoadingAndShowSuccess(toastId, 'Template deleted successfully');
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to delete template. Please try again.');
            ErrorHandlerService.handle(error, 'deleteTemplate');
        }
    }, [upcomingPatrols, templates]);


    const handleDeleteRoute = useCallback(async (routeId: string) => {
        if (!routeId) {
            showError('Invalid route ID');
            return;
        }

        const route = routes.find(r => r.id === routeId);
        if (!route) {
            showError('Route not found');
            return;
        }

        const usingPatrols = upcomingPatrols.filter(p =>
            p && p.status !== 'completed' && p.status !== 'cancelled' &&
            (p.routeId === routeId || p.location === route.name)
        );

        if (usingPatrols.length > 0) {
            showError(`Cannot delete route: ${usingPatrols.length} active patrol(s) are using it`);
            return;
        }

        const toastId = showLoading('Deleting route...');
        const startTime = Date.now();
        trackAction('delete_route_start', 'route', { routeId });
        try {
            await retryWithBackoff(
                () => PatrolEndpoint.deleteRoute(routeId),
                {
                    maxRetries: 3,
                    baseDelay: 1000,
                    maxDelay: 5000
                }
            );
            setRoutes(prev => StateUpdateService.removeItem(prev, routeId));
            dismissLoadingAndShowSuccess(toastId, 'Route deleted successfully');
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to delete route. Please try again.');
            ErrorHandlerService.handle(error, 'deleteRoute');
        }
    }, [routes, upcomingPatrols]);

    const handleDeleteCheckpoint = useCallback(async (checkpointId: string, routeId: string) => {
        if (!checkpointId || !routeId) {
            showError('Invalid checkpoint or route ID');
            return;
        }

        const route = routes.find(r => r.id === routeId);
        if (!route) {
            showError('Route not found');
            return;
        }

        const checkpoint = route.checkpoints.find(cp => cp.id === checkpointId);
        if (!checkpoint) {
            showError('Checkpoint not found');
            return;
        }

        // Use edge case handler for validation
        if (!edgeCaseHandling.validateCheckpointDeletion(routeId)) {
            return;
        }

        const toastId = showLoading('Deleting checkpoint...');
        const startTime = Date.now();
        trackAction('delete_checkpoint_start', 'checkpoint', { checkpointId, routeId });
        try {
            const updatedCheckpoints = route.checkpoints.filter(cp => cp.id !== checkpointId);
            const response = await retryWithBackoff(
                () => PatrolEndpoint.updateRoute(routeId, {
                    checkpoints: updatedCheckpoints
                }),
                {
                    maxRetries: 3,
                    baseDelay: 1000,
                    maxDelay: 5000
                }
            );
            setRoutes(prev => prev.map(r => r.id === routeId ? {
                ...r,
                checkpoints: response.checkpoints || updatedCheckpoints
            } : r));
            const duration = Date.now() - startTime;
            trackPerformance('delete_checkpoint', duration, { checkpointId, routeId });
            trackAction('delete_checkpoint_success', 'checkpoint', { checkpointId, routeId, duration });
            dismissLoadingAndShowSuccess(toastId, 'Checkpoint deleted successfully');
        } catch (error) {
            const duration = Date.now() - startTime;
            trackTelemetryError(error as Error, { action: 'delete_checkpoint', checkpointId, routeId, duration });
            dismissLoadingAndShowError(toastId, 'Failed to delete checkpoint. Please try again.');
            ErrorHandlerService.handle(error, 'deleteCheckpoint');
        }
    }, [routes, upcomingPatrols, edgeCaseHandling, trackAction, trackPerformance, trackTelemetryError]);

    // Helpers
    const updatePatrolStatus = (patrolId: string, status: UpcomingPatrol['status']) => {
        setUpcomingPatrols(prev => StateUpdateService.updateItem(prev, patrolId, { status }));
    };

    const updateOfficerStatus = (officerId: string, status: PatrolOfficer['status']) => {
        setOfficers(prev => StateUpdateService.updateItem(prev, officerId, { status }));
    };


    return {
        officers,
        upcomingPatrols,
        routes,
        templates,
        schedule,
        metrics,
        emergencyStatus,
        weather,
        alerts,
        settings,
        properties,
        selectedPropertyId,
        selectedPropertyTimezone,
        isLoading,
        setOfficers,
        setUpcomingPatrols,
        setRoutes,
        setTemplates,
        setSchedule,
        setMetrics,
        setEmergencyStatus,
        setWeather,
        setAlerts,
        setSettings,
        setProperties,
        setSelectedPropertyId,
        handleDeployOfficer,
        handleCompletePatrol,
        handleCheckpointCheckIn,
        handleReassignOfficer,
        handleCancelPatrol,
        handleDeleteTemplate,
        handleDeleteRoute,
        handleDeleteCheckpoint,
        handleEmergencyAlert,
        updatePatrolStatus,
        updateOfficerStatus,
        refreshPatrolData: fetchData,
        retryCheckInQueue: checkInQueue.retryFailed,
        checkInQueuePendingCount: checkInQueue.pendingCount,
        checkInQueueFailedCount: checkInQueue.failedCount,
        isOffline,
        activeTab,
        setActiveTab,
        lastSyncTimestamp
    };
};
