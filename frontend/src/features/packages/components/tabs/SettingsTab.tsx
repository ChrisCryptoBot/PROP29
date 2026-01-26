/**
 * Settings Tab
 * Package management configuration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { usePackageContext } from '../../context/PackageContext';
import { showSuccess, showError } from '../../../../utils/toast';

export const SettingsTab: React.FC = React.memo(() => {
    const { loading, settings, refreshSettings, updateSettings } = usePackageContext();
    const [localSettings, setLocalSettings] = useState({
        defaultStorageLocation: 'Mail Room A',
        autoNotificationTiming: 'immediate',
        defaultRetentionPeriod: 30,
        expirationWarningDays: 3,
        requireSignature: true,
        autoArchiveAfterDays: 60,
        highValueThreshold: 100,
        notificationChannels: {
            email: true,
            sms: true,
            inApp: true
        }
    });

    useEffect(() => {
        refreshSettings();
    }, [refreshSettings]);

    useEffect(() => {
        if (settings) {
            setLocalSettings(prev => ({
                ...prev,
                defaultStorageLocation: settings.defaultStorageLocation || prev.defaultStorageLocation,
                autoNotificationTiming: settings.autoNotificationTiming || prev.autoNotificationTiming,
                defaultRetentionPeriod: settings.packageRetentionPeriod || prev.defaultRetentionPeriod,
                requireSignature: settings.signatureRequiredByDefault ?? prev.requireSignature,
                highValueThreshold: prev.highValueThreshold,
                notificationChannels: {
                    email: settings.smsNotifications ?? prev.notificationChannels.email,
                    sms: settings.smsNotifications ?? prev.notificationChannels.sms,
                    inApp: prev.notificationChannels.inApp
                }
            }));
        }
    }, [settings]);

    const handleSaveSettings = async () => {
        const success = await updateSettings({
            defaultStorageLocation: localSettings.defaultStorageLocation,
            autoNotificationTiming: localSettings.autoNotificationTiming,
            packageRetentionPeriod: localSettings.defaultRetentionPeriod,
            signatureRequiredByDefault: localSettings.requireSignature,
            smsNotifications: localSettings.notificationChannels.sms || localSettings.notificationChannels.email
        });
        if (success) {
            await refreshSettings();
        }
    };

    return (
        <div className="space-y-6">
            {/* Gold Standard Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Settings</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Package management system configuration and policies
                    </p>
                </div>
            </div>

            {/* System Settings */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="text-xl text-white font-black uppercase tracking-tighter">System Settings</CardTitle>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">Configure general package management preferences</p>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Default Storage Location
                            </label>
                            <select
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                value={localSettings.defaultStorageLocation}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultStorageLocation: e.target.value }))}
                            >
                                <option value="Mail Room A" className="bg-slate-900 text-white">Mail Room A</option>
                                <option value="Mail Room B" className="bg-slate-900 text-white">Mail Room B</option>
                                <option value="Front Desk" className="bg-slate-900 text-white">Front Desk</option>
                            </select>
                            <p className="text-xs text-slate-500">Default location for new packages</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Auto-Notification Timing
                            </label>
                            <select
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                value={localSettings.autoNotificationTiming}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, autoNotificationTiming: e.target.value }))}
                            >
                                <option value="immediate" className="bg-slate-900 text-white">Immediate</option>
                                <option value="15min" className="bg-slate-900 text-white">15 minutes</option>
                                <option value="30min" className="bg-slate-900 text-white">30 minutes</option>
                                <option value="1hour" className="bg-slate-900 text-white">1 hour</option>
                            </select>
                            <p className="text-xs text-slate-500">When to notify guests about package arrival</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Default Retention Period (days)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                value={localSettings.defaultRetentionPeriod}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultRetentionPeriod: parseInt(e.target.value) || 30 }))}
                            />
                            <p className="text-xs text-slate-500">Packages will be marked as expired after this period</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Expiration Warning (days before)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                value={localSettings.expirationWarningDays}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, expirationWarningDays: parseInt(e.target.value) || 3 }))}
                            />
                            <p className="text-xs text-slate-500">Send notifications this many days before expiration</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                High Value Threshold ($)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                value={localSettings.highValueThreshold}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, highValueThreshold: parseInt(e.target.value) || 100 }))}
                            />
                            <p className="text-xs text-slate-500">Packages above this value require special handling</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Auto-Archive After (days)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                value={localSettings.autoArchiveAfterDays}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, autoArchiveAfterDays: parseInt(e.target.value) || 60 }))}
                            />
                            <p className="text-xs text-slate-500">Automatically archive packages after this period</p>
                        </div>
                    </div>

                    {/* Notification Channels */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            Notification Channels
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(localSettings.notificationChannels).map(([channel, enabled]) => (
                                <div key={channel} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <i className={`fas ${channel === 'email' ? 'fa-envelope' : channel === 'sms' ? 'fa-sms' : 'fa-bell'} text-slate-400`} />
                                        <span className="text-sm font-medium text-white capitalize">{channel}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={enabled}
                                        onChange={(e) => setLocalSettings(prev => ({
                                            ...prev,
                                            notificationChannels: {
                                                ...prev.notificationChannels,
                                                [channel]: e.target.checked
                                            }
                                        }))}
                                        className="w-4 h-4 rounded border-white/5 bg-slate-900/50 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Require Signature */}
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <i className="fas fa-signature text-slate-400" />
                            <div>
                                <span className="text-sm font-medium text-white">Require Signature on Delivery</span>
                                <p className="text-xs text-slate-500">Require guest signature when delivering packages</p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={localSettings.requireSignature}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, requireSignature: e.target.checked }))}
                            className="w-4 h-4 rounded border-white/5 bg-slate-900/50 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>

                    <Button
                        onClick={handleSaveSettings}
                        disabled={loading.settings}
                        variant="outline"
                        className="w-full text-[10px] font-black uppercase tracking-widest h-12 bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:text-white hover:border-white/20"
                    >
                        <i className={`fas fa-save mr-2 ${loading.settings ? 'animate-spin' : ''}`} />
                        Save Package Settings
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
});

SettingsTab.displayName = 'SettingsTab';

