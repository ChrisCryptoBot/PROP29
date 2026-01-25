import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { showLoading, dismissLoadingAndShowError, dismissLoadingAndShowSuccess } from '../../../../utils/toast';
import { incidentService } from '../../services/IncidentService';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import type { 
    IncidentSettings,
    EnhancedIncidentSettings,
    AgentSettings,
    HardwareSettings,
    EmergencyAlertSettings
} from '../../types/incident-log.types';
import { IncidentSeverity } from '../../types/incident-log.types';
import AutoApprovalSettingsModal from '../modals/AutoApprovalSettingsModal';

export const SettingsTab: React.FC = () => {
    const propertyId = useMemo(() => localStorage.getItem('propertyId') || '', []);
    const { 
        enhancedSettings, 
        loading, 
        refreshEnhancedSettings, 
        updateEnhancedSettings, 
        modals,
        setShowAutoApprovalSettingsModal 
    } = useIncidentLogContext();
    
    const [settings, setSettings] = useState({
        // Core Settings
        autoAssign: false,
        autoEscalate: false,
        emailNotifications: true,
        retentionPeriod: '2 years',
        archiveFrequency: 'Quarterly',
        emailNewIncidents: true,
        emailStatusChanges: true,
        emailEscalations: true,
        smsCritical: true,
        smsEmergency: true,
        apiEndpoint: '',
        apiKey: '',
        slackIntegration: false,
        teamsIntegration: false,
        webhookNotifications: false,
        requireAuth: true,
        sessionTimeout: 30,
        encryptData: true,
        auditLogAccess: true,

        // Mobile Agent Settings
        agentAutoApprovalEnabled: false,
        agentAutoApprovalThreshold: 80,
        bulkApprovalEnabled: true,
        agentPerformanceAlerts: true,
        lowTrustScoreThreshold: 50,
        requireManagerReviewBelowThreshold: true,
        performanceMetricsRetentionDays: 90,
        autoFlagDecliningAgents: true,
        emailLowTrustAlerts: true,
        emailBulkOperationResults: false,
        emailAgentPerformanceReports: true,

        // Hardware Device Settings
        autoCreateIncidentsFromEvents: false,
        deviceOfflineAlertEnabled: true,
        deviceOfflineThresholdMinutes: 15,
        supportedDeviceTypes: ['camera', 'sensor', 'access_control'] as Array<'camera' | 'sensor' | 'access_control' | 'alarm' | 'environmental'>,
        autoAssignHardwareIncidents: false,
        hardwareIncidentDefaultSeverity: IncidentSeverity.MEDIUM,
        deviceMaintenanceAlerts: true,
        lowBatteryAlertThreshold: 20,

        // Emergency Alert Settings
        emergencyAutoConvertToIncident: true,
        emergencyDefaultSeverity: IncidentSeverity.HIGH,
        emergencyRequireManagerApproval: false,
        emergencyPreserveOriginalAlert: true,
        emergencyNotificationWorkflow: 'immediate' as 'immediate' | 'delayed' | 'manual',
        emergencyAutoAssignConverted: true
    });

    useEffect(() => {
        const loadSettings = async () => {
            if (!propertyId) return;
            try {
                // Load enhanced settings if available
                await refreshEnhancedSettings();
                
                // Also load legacy settings for compatibility
                const response = await incidentService.getSettings(propertyId);
                const data = response.data?.settings;

                setSettings((prev) => {
                    let updated = { ...prev };

                    // Load legacy settings
                    if (data) {
                        updated = {
                            ...updated,
                            autoAssign: data.auto_assign_enabled ?? prev.autoAssign,
                            autoEscalate: data.auto_escalation_enabled ?? prev.autoEscalate,
                            sessionTimeout: data.session_timeout ?? prev.sessionTimeout,
                            encryptData: data.encrypt_data ?? prev.encryptData,
                            auditLogAccess: data.audit_log_access ?? prev.auditLogAccess,
                            retentionPeriod: typeof data.data_retention_days === 'number'
                                ? (data.data_retention_days >= 365 * 5 ? '5 years'
                                    : data.data_retention_days >= 365 * 2 ? '2 years'
                                        : data.data_retention_days >= 365 ? '1 year'
                                            : prev.retentionPeriod)
                                : prev.retentionPeriod,
                            slackIntegration: data.reporting?.slack_integration ?? prev.slackIntegration,
                            teamsIntegration: data.reporting?.teams_integration ?? prev.teamsIntegration,
                            webhookNotifications: data.reporting?.webhook_notifications ?? prev.webhookNotifications,
                            apiEndpoint: data.reporting?.api_endpoint ?? prev.apiEndpoint,
                            apiKey: data.reporting?.api_key ?? prev.apiKey
                        };
                    }

                    // Load enhanced settings if available
                    if (enhancedSettings) {
                        // Agent settings
                        if (enhancedSettings.agent_settings) {
                            const agent = enhancedSettings.agent_settings;
                            updated = {
                                ...updated,
                                agentAutoApprovalEnabled: agent.auto_approval_enabled,
                                agentAutoApprovalThreshold: agent.auto_approval_threshold,
                                bulkApprovalEnabled: agent.bulk_approval_enabled,
                                agentPerformanceAlerts: agent.agent_performance_alerts,
                                lowTrustScoreThreshold: agent.low_trust_score_threshold,
                                requireManagerReviewBelowThreshold: agent.require_manager_review_below_threshold,
                                performanceMetricsRetentionDays: agent.performance_metrics_retention_days,
                                autoFlagDecliningAgents: agent.auto_flag_declining_agents,
                                emailLowTrustAlerts: agent.notification_preferences.email_low_trust_alerts,
                                emailBulkOperationResults: agent.notification_preferences.email_bulk_operation_results,
                                emailAgentPerformanceReports: agent.notification_preferences.email_agent_performance_reports
                            };
                        }

                        // Hardware settings
                        if (enhancedSettings.hardware_settings) {
                            const hardware = enhancedSettings.hardware_settings;
                            updated = {
                                ...updated,
                                autoCreateIncidentsFromEvents: hardware.auto_create_incidents_from_events,
                                deviceOfflineAlertEnabled: hardware.device_offline_alert_enabled,
                                deviceOfflineThresholdMinutes: hardware.device_offline_threshold_minutes,
                                supportedDeviceTypes: hardware.supported_device_types,
                                autoAssignHardwareIncidents: hardware.auto_assign_hardware_incidents,
                                hardwareIncidentDefaultSeverity: hardware.hardware_incident_default_severity,
                                deviceMaintenanceAlerts: hardware.device_maintenance_alerts,
                                lowBatteryAlertThreshold: hardware.low_battery_alert_threshold
                            };
                        }

                        // Emergency alert settings
                        if (enhancedSettings.emergency_alert_settings) {
                            const emergency = enhancedSettings.emergency_alert_settings;
                            updated = {
                                ...updated,
                                emergencyAutoConvertToIncident: emergency.auto_convert_to_incident,
                                emergencyDefaultSeverity: emergency.default_converted_severity,
                                emergencyRequireManagerApproval: emergency.require_manager_approval,
                                emergencyPreserveOriginalAlert: emergency.preserve_original_alert,
                                emergencyNotificationWorkflow: emergency.notification_workflow,
                                emergencyAutoAssignConverted: emergency.auto_assign_converted_incidents
                            };
                        }
                    }

                    return updated;
                });
            } catch (error) {
                console.error('Failed to load incident settings:', error);
            }
        };

        loadSettings();
    }, [propertyId, enhancedSettings, refreshEnhancedSettings]);

    const retentionDays = (value: string) => {
        switch (value) {
            case '1 year':
                return 365;
            case '2 years':
                return 730;
            case '5 years':
                return 1825;
            case 'Permanent':
                return 0;
            default:
                return 730;
        }
    };

    const handleSaveSettings = async () => {
        const toastId = showLoading('Saving settings...');
        if (!propertyId) {
            dismissLoadingAndShowError(toastId, 'Property selection is required to save settings.');
            return;
        }
        try {
            // Build enhanced settings payload
            const enhancedPayload: EnhancedIncidentSettings = {
                // Core legacy settings
                auto_assign_enabled: settings.autoAssign,
                auto_escalation_enabled: settings.autoEscalate,
                data_retention_days: retentionDays(settings.retentionPeriod),
                session_timeout: settings.sessionTimeout,
                encrypt_data: settings.encryptData,
                audit_log_access: settings.auditLogAccess,
                notification_preferences: {
                    email_notifications: settings.emailNotifications,
                    email_new_incidents: settings.emailNewIncidents,
                    email_status_changes: settings.emailStatusChanges,
                    email_escalations: settings.emailEscalations,
                    sms_critical: settings.smsCritical,
                    sms_emergency: settings.smsEmergency
                },
                reporting: {
                    slack_integration: settings.slackIntegration,
                    teams_integration: settings.teamsIntegration,
                    webhook_notifications: settings.webhookNotifications,
                    api_endpoint: settings.apiEndpoint || undefined,
                    api_key: settings.apiKey || undefined
                },

                // PRODUCTION READINESS ENHANCEMENTS
                // Mobile Agent Settings
                agent_settings: {
                    auto_approval_enabled: settings.agentAutoApprovalEnabled,
                    auto_approval_threshold: settings.agentAutoApprovalThreshold,
                    bulk_approval_enabled: settings.bulkApprovalEnabled,
                    agent_performance_alerts: settings.agentPerformanceAlerts,
                    low_trust_score_threshold: settings.lowTrustScoreThreshold,
                    require_manager_review_below_threshold: settings.requireManagerReviewBelowThreshold,
                    performance_metrics_retention_days: settings.performanceMetricsRetentionDays,
                    auto_flag_declining_agents: settings.autoFlagDecliningAgents,
                    notification_preferences: {
                        email_low_trust_alerts: settings.emailLowTrustAlerts,
                        email_bulk_operation_results: settings.emailBulkOperationResults,
                        email_agent_performance_reports: settings.emailAgentPerformanceReports
                    }
                },

                // Hardware Device Settings
                hardware_settings: {
                    auto_create_incidents_from_events: settings.autoCreateIncidentsFromEvents,
                    device_offline_alert_enabled: settings.deviceOfflineAlertEnabled,
                    device_offline_threshold_minutes: settings.deviceOfflineThresholdMinutes,
                    supported_device_types: settings.supportedDeviceTypes,
                    auto_assign_hardware_incidents: settings.autoAssignHardwareIncidents,
                    hardware_incident_default_severity: settings.hardwareIncidentDefaultSeverity,
                    device_maintenance_alerts: settings.deviceMaintenanceAlerts,
                    low_battery_alert_threshold: settings.lowBatteryAlertThreshold
                },

                // Emergency Alert Settings
                emergency_alert_settings: {
                    auto_convert_to_incident: settings.emergencyAutoConvertToIncident,
                    default_converted_severity: settings.emergencyDefaultSeverity,
                    require_manager_approval: settings.emergencyRequireManagerApproval,
                    preserve_original_alert: settings.emergencyPreserveOriginalAlert,
                    notification_workflow: settings.emergencyNotificationWorkflow,
                    auto_assign_converted_incidents: settings.emergencyAutoAssignConverted
                },

                // Bulk Operations Settings
                bulk_operations: {
                    max_bulk_size: 100,
                    require_confirmation_above: 25,
                    timeout_seconds: 300,
                    parallel_processing: true
                }
            };

            // Save enhanced settings using context
            const success = await updateEnhancedSettings(enhancedPayload);
            if (success) {
                dismissLoadingAndShowSuccess(toastId, 'All settings saved successfully including mobile agent and hardware integration!');
            } else {
                throw new Error('Enhanced settings update failed');
            }
        } catch (error) {
            console.error('Settings save error:', error);
            dismissLoadingAndShowError(toastId, 'Failed to save settings. Please try again.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Incident Log</p>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Incident Settings</h2>
                    <p className="text-[11px] text-[color:var(--text-sub)]">Configure retention, notifications, and integrations.</p>
                </div>
            </div>
            {/* System Settings */}
            <Card className="glass-card border border-white/5 shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                            <i className="fas fa-cogs text-white" />
                        </div>
                        <span className="uppercase tracking-tight">System Settings</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">Incident Configuration</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Auto-assign incidents</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.autoAssign}
                                        onChange={(e) => setSettings({ ...settings, autoAssign: e.target.checked })}
                                        className="h-5 w-5 text-blue-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Auto-escalate after 24h</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.autoEscalate}
                                        onChange={(e) => setSettings({ ...settings, autoEscalate: e.target.checked })}
                                        className="h-5 w-5 text-blue-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Email notifications</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.emailNotifications}
                                        onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                        className="h-5 w-5 text-blue-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">Data Retention</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Incident retention period</label>
                                    <select
                                        value={settings.retentionPeriod}
                                        onChange={(e) => setSettings({ ...settings, retentionPeriod: e.target.value })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                    >
                                        <option className="bg-slate-900">1 year</option>
                                        <option className="bg-slate-900">2 years</option>
                                        <option className="bg-slate-900">5 years</option>
                                        <option className="bg-slate-900">Permanent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Archive frequency</label>
                                    <select
                                        value={settings.archiveFrequency}
                                        onChange={(e) => setSettings({ ...settings, archiveFrequency: e.target.value })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                    >
                                        <option className="bg-slate-900">Monthly</option>
                                        <option className="bg-slate-900">Quarterly</option>
                                        <option className="bg-slate-900">Annually</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="glass-card border border-white/5 shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                            <i className="fas fa-bell text-white" />
                        </div>
                        <span className="uppercase tracking-tight">Notification Settings</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">Email Notifications</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">New incidents</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.emailNewIncidents}
                                        onChange={(e) => setSettings({ ...settings, emailNewIncidents: e.target.checked })}
                                        className="h-5 w-5 text-blue-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Status changes</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.emailStatusChanges}
                                        onChange={(e) => setSettings({ ...settings, emailStatusChanges: e.target.checked })}
                                        className="h-5 w-5 text-blue-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Escalations</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.emailEscalations}
                                        onChange={(e) => setSettings({ ...settings, emailEscalations: e.target.checked })}
                                        className="h-5 w-5 text-blue-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">SMS Notifications</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Critical incidents</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.smsCritical}
                                        onChange={(e) => setSettings({ ...settings, smsCritical: e.target.checked })}
                                        className="h-5 w-5 text-blue-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Emergency alerts</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.smsEmergency}
                                        onChange={(e) => setSettings({ ...settings, smsEmergency: e.target.checked })}
                                        className="h-5 w-5 text-blue-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Integration Settings */}
            <Card className="glass-card border border-white/5 shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                            <i className="fas fa-plug text-white" />
                        </div>
                        <span className="uppercase tracking-tight">Integration Settings</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">API Configuration</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">API Endpoint</label>
                                    <input
                                        type="text"
                                        value={settings.apiEndpoint}
                                        onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
                                        placeholder="https://api.example.com/incidents"
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-slate-500 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">API Key</label>
                                    <input
                                        type="password"
                                        value={settings.apiKey}
                                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                                        placeholder="Enter API key"
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-slate-500 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">Third-party Integrations</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Slack integration</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.slackIntegration}
                                        onChange={(e) => setSettings({ ...settings, slackIntegration: e.target.checked })}
                                        className="h-5 w-5 text-blue-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Microsoft Teams</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.teamsIntegration}
                                        onChange={(e) => setSettings({ ...settings, teamsIntegration: e.target.checked })}
                                        className="h-5 w-5 text-blue-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Webhook notifications</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.webhookNotifications}
                                        onChange={(e) => setSettings({ ...settings, webhookNotifications: e.target.checked })}
                                        className="h-5 w-5 text-blue-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Agent Integration Settings - PRODUCTION READINESS */}
            <Card className="glass-card border border-white/5 shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-xl text-white">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                                <i className="fas fa-mobile-alt text-white" />
                            </div>
                            <div>
                                <span className="uppercase tracking-tight">Mobile Agent Integration</span>
                                <p className="text-[9px] text-[color:var(--text-sub)] mt-1">Configure auto-approval rules and agent performance settings</p>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowAutoApprovalSettingsModal(true)}
                            className="border-green-500/30 text-green-300 hover:bg-green-500/10 text-[9px] font-black uppercase tracking-widest"
                        >
                            <i className="fas fa-cogs mr-2" />
                            Advanced Rules
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">Auto-Approval Settings</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Enable auto-approval</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.agentAutoApprovalEnabled}
                                        onChange={(e) => setSettings({ ...settings, agentAutoApprovalEnabled: e.target.checked })}
                                        className="h-5 w-5 text-green-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-green-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Trust Score Threshold ({settings.agentAutoApprovalThreshold}%)</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={settings.agentAutoApprovalThreshold}
                                        onChange={(e) => setSettings({ ...settings, agentAutoApprovalThreshold: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-green"
                                    />
                                    <div className="flex justify-between text-[8px] text-[color:var(--text-sub)] mt-1">
                                        <span>Low (0)</span>
                                        <span>High (100)</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Enable bulk approval</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.bulkApprovalEnabled}
                                        onChange={(e) => setSettings({ ...settings, bulkApprovalEnabled: e.target.checked })}
                                        className="h-5 w-5 text-green-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-green-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">Agent Performance Monitoring</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Performance alerts</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.agentPerformanceAlerts}
                                        onChange={(e) => setSettings({ ...settings, agentPerformanceAlerts: e.target.checked })}
                                        className="h-5 w-5 text-green-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-green-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Low Trust Threshold ({settings.lowTrustScoreThreshold}%)</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={settings.lowTrustScoreThreshold}
                                        onChange={(e) => setSettings({ ...settings, lowTrustScoreThreshold: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-orange"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Metrics retention period</label>
                                    <select
                                        value={settings.performanceMetricsRetentionDays}
                                        onChange={(e) => setSettings({ ...settings, performanceMetricsRetentionDays: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-green-500/20 focus:bg-white/10"
                                    >
                                        <option value={30} className="bg-slate-900">30 days</option>
                                        <option value={60} className="bg-slate-900">60 days</option>
                                        <option value={90} className="bg-slate-900">90 days</option>
                                        <option value={180} className="bg-slate-900">180 days</option>
                                        <option value={365} className="bg-slate-900">1 year</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Hardware Device Integration Settings - PRODUCTION READINESS */}
            <Card className="glass-card border border-white/5 shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                            <i className="fas fa-microchip text-white" />
                        </div>
                        <span className="uppercase tracking-tight">Hardware Device Integration</span>
                    </CardTitle>
                    <p className="text-[9px] text-[color:var(--text-sub)] ml-13">Configure hardware device monitoring and incident creation</p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">Incident Generation</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Auto-create from device events</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.autoCreateIncidentsFromEvents}
                                        onChange={(e) => setSettings({ ...settings, autoCreateIncidentsFromEvents: e.target.checked })}
                                        className="h-5 w-5 text-orange-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-orange-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Default severity for hardware incidents</label>
                                    <select
                                        value={settings.hardwareIncidentDefaultSeverity}
                                        onChange={(e) => setSettings({ ...settings, hardwareIncidentDefaultSeverity: e.target.value as IncidentSeverity })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-orange-500/20 focus:bg-white/10"
                                    >
                                        <option value="low" className="bg-slate-900">Low</option>
                                        <option value="medium" className="bg-slate-900">Medium</option>
                                        <option value="high" className="bg-slate-900">High</option>
                                        <option value="critical" className="bg-slate-900">Critical</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Auto-assign hardware incidents</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.autoAssignHardwareIncidents}
                                        onChange={(e) => setSettings({ ...settings, autoAssignHardwareIncidents: e.target.checked })}
                                        className="h-5 w-5 text-orange-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-orange-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">Device Monitoring</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Device offline alerts</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.deviceOfflineAlertEnabled}
                                        onChange={(e) => setSettings({ ...settings, deviceOfflineAlertEnabled: e.target.checked })}
                                        className="h-5 w-5 text-orange-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-orange-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Offline alert threshold (minutes)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="120"
                                        value={settings.deviceOfflineThresholdMinutes}
                                        onChange={(e) => setSettings({ ...settings, deviceOfflineThresholdMinutes: parseInt(e.target.value) || 15 })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-orange-500/20 focus:bg-white/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Low Battery Alert ({settings.lowBatteryAlertThreshold}%)</label>
                                    <input
                                        type="range"
                                        min="5"
                                        max="50"
                                        value={settings.lowBatteryAlertThreshold}
                                        onChange={(e) => setSettings({ ...settings, lowBatteryAlertThreshold: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-orange"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Emergency Alert Conversion Settings - PRODUCTION READINESS */}
            <Card className="glass-card border border-white/5 shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                            <i className="fas fa-exclamation-triangle text-white" />
                        </div>
                        <span className="uppercase tracking-tight">Emergency Alert Conversion</span>
                    </CardTitle>
                    <p className="text-[9px] text-[color:var(--text-sub)] ml-13">Configure automatic conversion of emergency alerts to incidents</p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">Conversion Settings</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Auto-convert to incident</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.emergencyAutoConvertToIncident}
                                        onChange={(e) => setSettings({ ...settings, emergencyAutoConvertToIncident: e.target.checked })}
                                        className="h-5 w-5 text-red-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-red-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Default converted severity</label>
                                    <select
                                        value={settings.emergencyDefaultSeverity}
                                        onChange={(e) => setSettings({ ...settings, emergencyDefaultSeverity: e.target.value as IncidentSeverity })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-red-500/20 focus:bg-white/10"
                                    >
                                        <option value="medium" className="bg-slate-900">Medium</option>
                                        <option value="high" className="bg-slate-900">High</option>
                                        <option value="critical" className="bg-slate-900">Critical</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Preserve original alert</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.emergencyPreserveOriginalAlert}
                                        onChange={(e) => setSettings({ ...settings, emergencyPreserveOriginalAlert: e.target.checked })}
                                        className="h-5 w-5 text-red-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-red-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">Workflow Settings</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Require manager approval</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.emergencyRequireManagerApproval}
                                        onChange={(e) => setSettings({ ...settings, emergencyRequireManagerApproval: e.target.checked })}
                                        className="h-5 w-5 text-red-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-red-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Notification workflow</label>
                                    <select
                                        value={settings.emergencyNotificationWorkflow}
                                        onChange={(e) => setSettings({ ...settings, emergencyNotificationWorkflow: e.target.value as 'immediate' | 'delayed' | 'manual' })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-sm font-mono focus:ring-2 focus:ring-red-500/20 focus:bg-white/10"
                                    >
                                        <option value="immediate" className="bg-slate-900">Immediate</option>
                                        <option value="delayed" className="bg-slate-900">Delayed (5 min)</option>
                                        <option value="manual" className="bg-slate-900">Manual</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Auto-assign converted incidents</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.emergencyAutoAssignConverted}
                                        onChange={(e) => setSettings({ ...settings, emergencyAutoAssignConverted: e.target.checked })}
                                        className="h-5 w-5 text-red-400 bg-[color:var(--console-dark)] border-white/10 rounded focus:ring-red-500/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Settings Button */}
            <div className="flex justify-end">
            <Button
                onClick={handleSaveSettings}
                variant="glass"
                disabled={loading.settings || loading.bulkOperation}
                className="px-8 py-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            >
                    {loading.settings ? (
                        <i className="fas fa-spinner fa-spin mr-2" />
                    ) : (
                        <i className="fas fa-save mr-2" />
                    )}
                    {loading.settings ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>

            {/* Add custom CSS for sliders */}
            <style>{`
                .slider-green {
                    background: linear-gradient(to right, #1f2937 0%, #16a34a 50%, #16a34a 100%);
                }
                .slider-green::-webkit-slider-thumb {
                    appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #22c55e;
                    cursor: pointer;
                    border: 2px solid #16a34a;
                    box-shadow: 0 4px 8px rgba(34, 197, 94, 0.3);
                }
                .slider-orange {
                    background: linear-gradient(to right, #1f2937 0%, #ea580c 50%, #ea580c 100%);
                }
                .slider-orange::-webkit-slider-thumb {
                    appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #f97316;
                    cursor: pointer;
                    border: 2px solid #ea580c;
                    box-shadow: 0 4px 8px rgba(249, 115, 22, 0.3);
                }
            `}</style>

            {/* Auto-Approval Settings Modal */}
            <AutoApprovalSettingsModal
                isOpen={modals.showAutoApprovalSettingsModal}
                onClose={() => setShowAutoApprovalSettingsModal(false)}
            />
        </div>
    );
};

export default SettingsTab;


