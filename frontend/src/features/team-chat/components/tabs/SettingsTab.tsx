import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Toggle } from '../../../../components/UI/Toggle';
import { Select } from '../../../../components/UI/Select';
import { showSuccess, showError } from '../../../../utils/toast';

interface ChatSettings {
    // Notifications
    desktopNotifications: boolean;
    audioFeedback: boolean;
    priorityOverrideSound: boolean;
    mentionAlerts: boolean;

    // Privacy & Security
    endToEndEncryption: boolean;
    broadcastOnlineStatus: boolean;
    transmitGeospatialData: boolean;
    readReceipts: boolean;

    // Data Management
    dataPurgeInterval: string;
    typingIndicators: boolean;
    messagePreview: boolean;
    autoDeleteMessages: boolean;

    // Integrations
    mobileAppSync: boolean;
    pushNotifications: boolean;
    webhookSupport: boolean;
}

export const SettingsTab: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<ChatSettings>({
        desktopNotifications: true,
        audioFeedback: true,
        priorityOverrideSound: true,
        mentionAlerts: true,
        endToEndEncryption: true,
        broadcastOnlineStatus: true,
        transmitGeospatialData: false,
        readReceipts: true,
        dataPurgeInterval: 'never',
        typingIndicators: true,
        messagePreview: true,
        autoDeleteMessages: false,
        mobileAppSync: true,
        pushNotifications: true,
        webhookSupport: false,
    });

    const updateSetting = (key: keyof ChatSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            showSuccess('Settings saved successfully');
        } catch (error) {
            showError('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6" role="main" aria-label="Chat Settings">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="page-title">Settings</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Communication preferences and configuration
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-10 text-[10px] font-black uppercase tracking-widest px-6 shadow-none"
                >
                    {isSaving ? (
                        <>
                            <i className="fas fa-spinner fa-spin mr-2" aria-hidden="true" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-save mr-2" aria-hidden />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {/* Notification Settings */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="card-title-icon-box" aria-hidden="true">
                            <i className="fas fa-bell text-white" />
                        </div>
                        <span className="card-title-text">Alert Protocols</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={settings.desktopNotifications}
                                onChange={(checked) => updateSetting('desktopNotifications', checked)}
                                label="Desktop Notifications"
                                description="Show browser notifications for new messages"
                            />
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={settings.audioFeedback}
                                onChange={(checked) => updateSetting('audioFeedback', checked)}
                                label="Audio Feedback"
                                description="Play sounds for incoming messages"
                            />
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={settings.priorityOverrideSound}
                                onChange={(checked) => updateSetting('priorityOverrideSound', checked)}
                                label="Priority Override Sound"
                                description="Distinct alert for priority messages"
                            />
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={settings.mentionAlerts}
                                onChange={(checked) => updateSetting('mentionAlerts', checked)}
                                label="Mention Alerts"
                                description="Get notified when mentioned in messages"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Security & Privacy */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="card-title-icon-box" aria-hidden="true">
                            <i className="fas fa-shield-alt text-white" />
                        </div>
                        <span className="card-title-text">Security & Privacy</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 opacity-70">
                            <Toggle
                                checked={settings.endToEndEncryption}
                                onChange={() => {}}
                                label="End-to-End Encryption"
                                description="Enterprise Managed - AES-256"
                                disabled
                            />
                            <p className="text-[9px] text-blue-400 mt-2 font-bold uppercase tracking-widest">
                                <i className="fas fa-lock mr-1" />
                                Enforced by organization policy
                            </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={settings.broadcastOnlineStatus}
                                onChange={(checked) => updateSetting('broadcastOnlineStatus', checked)}
                                label="Broadcast Online Status"
                                description="Show your availability to team members"
                            />
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={settings.transmitGeospatialData}
                                onChange={(checked) => updateSetting('transmitGeospatialData', checked)}
                                label="Location Sharing"
                                description="Share location data with messages"
                            />
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={settings.readReceipts}
                                onChange={(checked) => updateSetting('readReceipts', checked)}
                                label="Read Receipts"
                                description="Let others know when you've read messages"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Management */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="card-title-icon-box" aria-hidden="true">
                            <i className="fas fa-database text-white" />
                        </div>
                        <span className="card-title-text">Data Management</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <Select
                                label="Data Retention Period"
                                value={settings.dataPurgeInterval}
                                onChange={(e) => updateSetting('dataPurgeInterval', e.target.value)}
                            >
                                <option value="never">Permanent (No Auto-Delete)</option>
                                <option value="24h">24 Hour Cycle</option>
                                <option value="7d">7 Day Retention</option>
                                <option value="30d">30 Day Archive</option>
                                <option value="90d">90 Day Archive</option>
                            </Select>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={settings.typingIndicators}
                                onChange={(checked) => updateSetting('typingIndicators', checked)}
                                label="Typing Indicators"
                                description="Show when others are typing"
                            />
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={settings.messagePreview}
                                onChange={(checked) => updateSetting('messagePreview', checked)}
                                label="Message Previews"
                                description="Show message content in notifications"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile & Integrations */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="card-title-icon-box" aria-hidden="true">
                            <i className="fas fa-mobile-alt text-white" />
                        </div>
                        <span className="card-title-text">Mobile & Integrations</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={settings.mobileAppSync}
                                onChange={(checked) => updateSetting('mobileAppSync', checked)}
                                label="Mobile App Sync"
                                description="Sync messages across mobile devices"
                            />
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={settings.pushNotifications}
                                onChange={(checked) => updateSetting('pushNotifications', checked)}
                                label="Push Notifications"
                                description="Receive notifications on mobile"
                            />
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={settings.webhookSupport}
                                onChange={(checked) => updateSetting('webhookSupport', checked)}
                                label="Webhook Support"
                                description="Enable third-party integrations"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Channel Management */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="card-title-icon-box" aria-hidden="true">
                            <i className="fas fa-hashtag text-white" />
                        </div>
                        <span className="card-title-text">Channel Management</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <button
                        onClick={() => showSuccess('Channel creation coming soon...')}
                        className="w-full p-4 border border-dashed border-white/10 rounded-md text-white/30 hover:border-blue-500/50 hover:text-blue-500 transition-colors text-[10px] font-black uppercase tracking-widest bg-white/[0.02]"
                    >
                        <i className="fas fa-plus mr-2" />
                        Create New Channel
                    </button>
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-xs text-blue-300">
                            <i className="fas fa-info-circle mr-2" />
                            Channels allow you to organize team communications by topic, location, or priority level.
                            Admins can create encrypted channels for sensitive communications.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-slate-900/50 border border-red-500/20">
                <CardHeader className="border-b border-red-500/20 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center">
                        <div className="w-10 h-10 bg-red-600 rounded-md flex items-center justify-center mr-3 border border-red-500/30" aria-hidden="true">
                            <i className="fas fa-exclamation-triangle text-white" />
                        </div>
                        <span className="card-title-text text-red-400">Danger Zone</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <div>
                            <h4 className="text-sm font-black text-white">Clear All Message History</h4>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                                This will permanently delete all your messages. This action cannot be undone.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => showError('This action requires admin approval')}
                            className="text-[10px] font-black uppercase tracking-widest px-4 shrink-0"
                        >
                            <i className="fas fa-trash mr-2" />
                            Clear History
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
