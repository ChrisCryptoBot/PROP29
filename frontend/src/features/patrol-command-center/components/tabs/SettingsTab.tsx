import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Toggle } from '../../../../components/UI/Toggle';
import { Select } from '../../../../components/UI/Select';
import { OfflineQueueManager } from '../OfflineQueueManager';
import { usePatrolContext } from '../../context/PatrolContext';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../../utils/toast';
import { retryWithBackoff } from '../../../../utils/retryWithBackoff';
import { PatrolEndpoint } from '../../../../services/PatrolEndpoint';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';
import { env } from '../../../../config/env';

export const SettingsTab: React.FC = () => {
    const { settings, setSettings } = usePatrolContext();
    const [isSaving, setIsSaving] = useState(false);

    // Helper to update settings locally
    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // Validate settings before save
    const validateSettings = (): string | null => {
        if (settings.maxConcurrentPatrols < 1 || settings.maxConcurrentPatrols > 20) {
            return 'Max concurrent patrols must be between 1 and 20';
        }
        if (settings.emergencyResponseMinutes < 1 || settings.emergencyResponseMinutes > 10) {
            return 'Emergency response time must be between 1 and 10 minutes';
        }
        if (settings.heartbeatOfflineThresholdMinutes && (settings.heartbeatOfflineThresholdMinutes < 1 || settings.heartbeatOfflineThresholdMinutes > 60)) {
            return 'Heartbeat threshold must be between 1 and 60 minutes';
        }
        return null;
    };

    // Save to backend
    const handleSave = async () => {
        const validationError = validateSettings();
        if (validationError) {
            showError(validationError);
            return;
        }
        
        setIsSaving(true);
        try {
            // Transform back to snake_case for backend
            const backendPayload = {
                default_patrol_duration_minutes: settings.defaultPatrolDurationMinutes,
                patrol_frequency: settings.patrolFrequency,
                shift_handover_time: settings.shiftHandoverTime,
                emergency_response_minutes: settings.emergencyResponseMinutes,
                patrol_buffer_minutes: settings.patrolBufferMinutes,
                max_concurrent_patrols: settings.maxConcurrentPatrols,
                real_time_sync: settings.realTimeSync,
                offline_mode: settings.offlineMode,
                auto_schedule_updates: settings.autoScheduleUpdates,
                push_notifications: settings.pushNotifications,
                location_tracking: settings.locationTracking,
                emergency_alerts: settings.emergencyAlerts,
                checkpoint_missed_alert: settings.checkpointMissedAlert,
                patrol_completion_notification: settings.patrolCompletionNotification,
                shift_change_alerts: settings.shiftChangeAlerts,
                route_deviation_alert: settings.routeDeviationAlert,
                system_status_alerts: settings.systemStatusAlerts,
                gps_tracking: settings.gpsTracking,
                biometric_verification: settings.biometricVerification,
                auto_report_generation: settings.autoReportGeneration,
                audit_logging: settings.auditLogging,
                two_factor_auth: settings.twoFactorAuth,
                session_timeout: settings.sessionTimeout,
                ip_whitelist: settings.ipWhitelist,
                mobile_app_sync: settings.mobileAppSync,
                api_integration: settings.apiIntegration,
                database_sync: settings.databaseSync,
                webhook_support: settings.webhookSupport,
                cloud_backup: settings.cloudBackup,
                role_based_access: settings.roleBasedAccess,
                data_encryption: settings.dataEncryption,
                heartbeat_offline_threshold_minutes: settings.heartbeatOfflineThresholdMinutes ?? 15
            };

            await retryWithBackoff(
                () => PatrolEndpoint.updateSettings(backendPayload),
                {
                    maxRetries: 3,
                    baseDelay: 1000,
                    maxDelay: 5000
                }
            );
            showSuccess('Settings saved successfully');
        } catch (error) {
            ErrorHandlerService.handle(error, 'saveSettings');
            showError('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6" role="main" aria-label="Patrol Settings">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Settings</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        System policies and patrol automation
                    </p>
                </div>
            </div>
            {/* System Configuration */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5">
                            <i className="fas fa-cog text-white"></i>
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-white">System Configuration</span>
                    </CardTitle>
                    <div className="ml-auto">
                        <Button
                            variant="glass"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="border-white/5 hover:border-blue-500/30 text-white"
                        >
                            {isSaving ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2" aria-hidden="true" />
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <div>
                                <Select
                                    label="Default Patrol Duration"
                                    value={String(settings.defaultPatrolDurationMinutes)}
                                    onChange={(e) => updateSetting('defaultPatrolDurationMinutes', Number(e.target.value))}
                                >
                                    <option value="30">30 minutes</option>
                                    <option value="45">45 minutes</option>
                                    <option value="60">60 minutes</option>
                                    <option value="90">90 minutes</option>
                                    <option value="120">2 hours</option>
                                </Select>
                            </div>
                            <div>
                                <Select
                                    label="Patrol Frequency"
                                    value={settings.patrolFrequency}
                                    onChange={(e) => updateSetting('patrolFrequency', e.target.value)}
                                >
                                    <option value="30min">Every 30 minutes</option>
                                    <option value="hourly">Every hour</option>
                                    <option value="2hours">Every 2 hours</option>
                                    <option value="4hours">Every 4 hours</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="custom">Custom Schedule</option>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Shift Handover Time</label>
                                <input
                                    type="time"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                                    value={settings.shiftHandoverTime}
                                    onChange={(event) => updateSetting('shiftHandoverTime', event.target.value)}
                                />
                            </div>
                            <div>
                                <Select
                                    label="Emergency Response Time"
                                    value={String(settings.emergencyResponseMinutes)}
                                    onChange={(e) => updateSetting('emergencyResponseMinutes', Number(e.target.value))}
                                >
                                    <option value="1">1 minute</option>
                                    <option value="2">2 minutes</option>
                                    <option value="5">5 minutes</option>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Select
                                    label="Patrol Buffer Time"
                                    value={String(settings.patrolBufferMinutes)}
                                    onChange={(e) => updateSetting('patrolBufferMinutes', Number(e.target.value))}
                                >
                                    <option value="0">No buffer</option>
                                    <option value="5">5 minutes</option>
                                    <option value="10">10 minutes</option>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Max Concurrent Patrols</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
                                    value={settings.maxConcurrentPatrols}
                                    onChange={(event) => updateSetting('maxConcurrentPatrols', Number(event.target.value))}
                                />
                            </div>
                            <div>
                                <Select
                                    label="Heartbeat offline threshold (min)"
                                    value={String(settings.heartbeatOfflineThresholdMinutes ?? 15)}
                                    onChange={(e) => updateSetting('heartbeatOfflineThresholdMinutes', Number(e.target.value))}
                                    helperText="Mark officer device offline after no heartbeat (minutes)"
                                >
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                    <option value="15">15</option>
                                    <option value="20">20</option>
                                    <option value="30">30</option>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile App Integration */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5">
                            <i className="fas fa-mobile-alt text-white"></i>
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-white">Mobile App Integration</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                <Toggle
                                    checked={settings.realTimeSync}
                                    onChange={(checked: boolean) => updateSetting('realTimeSync', checked)}
                                    label="Real-time Sync"
                                    description="Sync patrol data with mobile apps in real-time"
                                />
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                <Toggle
                                    checked={settings.offlineMode}
                                    onChange={(checked: boolean) => updateSetting('offlineMode', checked)}
                                    label="Offline Mode"
                                    description="Allow patrol agents to work offline"
                                />
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                <Toggle
                                    checked={settings.autoScheduleUpdates}
                                    onChange={(checked: boolean) => updateSetting('autoScheduleUpdates', checked)}
                                    label="Auto-Schedule Updates"
                                    description="Automatically update agent schedules"
                                />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                <Toggle
                                    checked={settings.pushNotifications}
                                    onChange={(checked: boolean) => updateSetting('pushNotifications', checked)}
                                    label="Push Notifications"
                                    description="Send notifications to mobile devices"
                                />
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                <Toggle
                                    checked={settings.locationTracking}
                                    onChange={(checked: boolean) => updateSetting('locationTracking', checked)}
                                    label="Location Tracking"
                                    description="Track agent locations during patrols"
                                />
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                <Toggle
                                    checked={settings.emergencyAlerts}
                                    onChange={(checked: boolean) => updateSetting('emergencyAlerts', checked)}
                                    label="Emergency Alerts"
                                    description="Send emergency alerts to all agents"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile App Configuration */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-lg">
                            <i className="fas fa-code text-white"></i>
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-white">Mobile App Configuration</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6 space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">
                        Use these endpoints for patrol agent mobile apps. Authenticate with the hardware ingest API key for check-ins.
                    </p>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">API base</label>
                        <div className="flex gap-2 items-center">
                            <code className="flex-1 px-3 py-2 bg-white/5 border border-white/5 rounded-md text-xs font-mono text-white break-all">
                                {typeof window !== 'undefined' ? `${window.location.origin}${env.API_BASE_URL}` : env.API_BASE_URL}
                            </code>
                            <Button
                                size="sm"
                                variant="glass"
                                className="shrink-0 border-white/5 text-slate-400 hover:text-white"
                                onClick={async () => {
                                    const base = typeof window !== 'undefined' ? `${window.location.origin}${env.API_BASE_URL}` : env.API_BASE_URL;
                                    await navigator.clipboard.writeText(base);
                                    showSuccess('API base URL copied to clipboard');
                                }}
                            >
                                <i className="fas fa-copy mr-1" aria-hidden /> Copy
                            </Button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Checkpoint check-in</label>
                        <div className="flex gap-2 items-center">
                            <code className="flex-1 px-3 py-2 bg-white/5 border border-white/5 rounded-md text-xs font-mono text-white break-all">
                                POST {env.API_BASE_URL}/patrols/&#123;patrol_id&#125;/checkpoints/&#123;checkpoint_id&#125;/check-in
                            </code>
                            <Button
                                size="sm"
                                variant="glass"
                                className="shrink-0 border-white/5 text-slate-400 hover:text-white"
                                onClick={async () => {
                                    const base = typeof window !== 'undefined' ? `${window.location.origin}${env.API_BASE_URL}` : env.API_BASE_URL;
                                    const url = `${base}/patrols/{patrol_id}/checkpoints/{checkpoint_id}/check-in`;
                                    await navigator.clipboard.writeText(url);
                                    showSuccess('Check-in URL copied to clipboard');
                                }}
                            >
                                <i className="fas fa-copy mr-1" aria-hidden /> Copy
                            </Button>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500">Body: &#123; method, request_id, notes?, device_id? &#125;. Use X-API-Key header for hardware ingest.</p>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Sync frequency</label>
                        <p className="text-sm text-white">Every 30–60 seconds or on significant location change. Queued check-ins use exponential backoff (1s → 30s max).</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-blue-300">
                            Mobile app download links (iOS / Android) will appear here once the apps are published.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Offline Queue Management */}
            <OfflineQueueManager />
        </div>
    );
};
