import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Toggle } from '../../../../components/UI/Toggle';
import { usePatrolContext } from '../../context/PatrolContext';
import { showSuccess, showError } from '../../../../utils/toast';
import { PatrolEndpoint } from '../../../../services/PatrolEndpoint';
import { env } from '../../../../config/env';

export const SettingsTab: React.FC = () => {
    const { settings, setSettings } = usePatrolContext();
    const [isSaving, setIsSaving] = useState(false);

    // Helper to update settings locally
    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // Save to backend
    const handleSave = async () => {
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

            await PatrolEndpoint.updateSettings(backendPayload);
            showSuccess('Settings saved successfully');
        } catch (error) {
            console.error(error);
            showError('Failed to save settings');
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
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-lg">
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
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[color:var(--text-sub)] uppercase tracking-wider mb-2">Default Patrol Duration</label>
                                <select
                                    className="w-full p-2.5 border border-white/10 rounded-lg bg-[color:var(--input-bg)] text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                                    value={settings.defaultPatrolDurationMinutes}
                                    onChange={(event) => updateSetting('defaultPatrolDurationMinutes', Number(event.target.value))}
                                >
                                    <option value={30} className="bg-slate-900">30 minutes</option>
                                    <option value={45} className="bg-slate-900">45 minutes</option>
                                    <option value={60} className="bg-slate-900">60 minutes</option>
                                    <option value={90} className="bg-slate-900">90 minutes</option>
                                    <option value={120} className="bg-slate-900">2 hours</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[color:var(--text-sub)] uppercase tracking-wider mb-2">Patrol Frequency</label>
                                <select
                                    className="w-full p-2.5 border border-white/10 rounded-lg bg-[color:var(--input-bg)] text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                                    value={settings.patrolFrequency}
                                    onChange={(event) => updateSetting('patrolFrequency', event.target.value)}
                                >
                                    <option value="30min" className="bg-slate-900">Every 30 minutes</option>
                                    <option value="hourly" className="bg-slate-900">Every hour</option>
                                    <option value="2hours" className="bg-slate-900">Every 2 hours</option>
                                    <option value="4hours" className="bg-slate-900">Every 4 hours</option>
                                    <option value="daily" className="bg-slate-900">Daily</option>
                                    <option value="weekly" className="bg-slate-900">Weekly</option>
                                    <option value="custom" className="bg-slate-900">Custom Schedule</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[color:var(--text-sub)] uppercase tracking-wider mb-2">Shift Handover Time</label>
                                <input
                                    type="time"
                                    className="w-full p-2.5 border border-white/10 rounded-lg bg-[color:var(--input-bg)] text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                                    value={settings.shiftHandoverTime}
                                    onChange={(event) => updateSetting('shiftHandoverTime', event.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[color:var(--text-sub)] uppercase tracking-wider mb-2">Emergency Response Time</label>
                                <select
                                    className="w-full p-2.5 border border-white/10 rounded-lg bg-[color:var(--input-bg)] text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                                    value={settings.emergencyResponseMinutes}
                                    onChange={(event) => updateSetting('emergencyResponseMinutes', Number(event.target.value))}
                                >
                                    <option value={1} className="bg-slate-900">1 minute</option>
                                    <option value={2} className="bg-slate-900">2 minutes</option>
                                    <option value={5} className="bg-slate-900">5 minutes</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[color:var(--text-sub)] uppercase tracking-wider mb-2">Patrol Buffer Time</label>
                                <select
                                    className="w-full p-2.5 border border-white/10 rounded-lg bg-[color:var(--input-bg)] text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                                    value={settings.patrolBufferMinutes}
                                    onChange={(event) => updateSetting('patrolBufferMinutes', Number(event.target.value))}
                                >
                                    <option value={0} className="bg-slate-900">No buffer</option>
                                    <option value={5} className="bg-slate-900">5 minutes</option>
                                    <option value={10} className="bg-slate-900">10 minutes</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[color:var(--text-sub)] uppercase tracking-wider mb-2">Max Concurrent Patrols</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    className="w-full p-2.5 border border-white/10 rounded-lg bg-[color:var(--input-bg)] text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                                    value={settings.maxConcurrentPatrols}
                                    onChange={(event) => updateSetting('maxConcurrentPatrols', Number(event.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[color:var(--text-sub)] uppercase tracking-wider mb-2">Heartbeat offline threshold (min)</label>
                                <select
                                    className="w-full p-2.5 border border-white/10 rounded-lg bg-[color:var(--input-bg)] text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                                    value={settings.heartbeatOfflineThresholdMinutes ?? 15}
                                    onChange={(e) => updateSetting('heartbeatOfflineThresholdMinutes', Number(e.target.value))}
                                >
                                    <option value={5} className="bg-slate-900">5</option>
                                    <option value={10} className="bg-slate-900">10</option>
                                    <option value={15} className="bg-slate-900">15</option>
                                    <option value={20} className="bg-slate-900">20</option>
                                    <option value={30} className="bg-slate-900">30</option>
                                </select>
                                <p className="text-[10px] text-slate-500 mt-1">Mark officer device offline after no heartbeat (minutes)</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile App Integration */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-lg">
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
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
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
                            <code className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-xs font-mono text-white break-all">
                                {typeof window !== 'undefined' ? `${window.location.origin}${env.API_BASE_URL}` : env.API_BASE_URL}
                            </code>
                            <Button
                                size="sm"
                                variant="glass"
                                className="shrink-0 border-white/10 text-slate-400 hover:text-white"
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
                            <code className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-xs font-mono text-white break-all">
                                POST {env.API_BASE_URL}/patrols/&#123;patrol_id&#125;/checkpoints/&#123;checkpoint_id&#125;/check-in
                            </code>
                            <Button
                                size="sm"
                                variant="glass"
                                className="shrink-0 border-white/10 text-slate-400 hover:text-white"
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
        </div>
    );
};
