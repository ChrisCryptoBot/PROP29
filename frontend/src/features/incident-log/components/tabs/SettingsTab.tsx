import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { showLoading, dismissLoadingAndShowError, dismissLoadingAndShowSuccess } from '../../../../utils/toast';
import { incidentService } from '../../services/IncidentService';
import type { IncidentSettings } from '../../types/incident-log.types';

export const SettingsTab: React.FC = () => {
    const propertyId = useMemo(() => localStorage.getItem('propertyId') || '', []);
    const [settings, setSettings] = useState({
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
        auditLogAccess: true
    });

    useEffect(() => {
        const loadSettings = async () => {
            if (!propertyId) return;
            try {
                const response = await incidentService.getSettings(propertyId);
                const data = response.data?.settings;
                if (!data) return;

                setSettings((prev) => ({
                    ...prev,
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
                }));
            } catch (error) {
                // Keep local defaults if API is unavailable
            }
        };

        loadSettings();
    }, [propertyId]);

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
            const payload: IncidentSettings = {
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
                }
            };
            await incidentService.updateSettings(payload, propertyId);
            dismissLoadingAndShowSuccess(toastId, 'Settings saved successfully.');
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to save settings.');
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

            {/* Save Settings Button */}
            <div className="flex justify-end">
            <Button
                onClick={handleSaveSettings}
                variant="glass"
                className="px-8 py-3 text-[10px] font-black uppercase tracking-widest"
            >
                    <i className="fas fa-save mr-2" />
                    Save Settings
                </Button>
            </div>
        </div>
    );
};

export default SettingsTab;


