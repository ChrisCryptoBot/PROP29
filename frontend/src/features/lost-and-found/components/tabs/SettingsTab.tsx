/**
 * Settings Tab
 * System settings, category management, storage locations, notifications, and compliance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useLostFoundContext } from '../../context/LostFoundContext';
import { cn } from '../../../../utils/cn';
import { showSuccess } from '../../../../utils/toast';

export const SettingsTab: React.FC = React.memo(() => {
    const {
        settings,
        loading,
        refreshSettings,
        updateSettings
    } = useLostFoundContext();

    const [localSettings, setLocalSettings] = useState({
        defaultRetentionPeriod: 90,
        expirationWarningDays: 7,
        qrCodePrefix: 'LF',
        autoArchiveAfterDays: 30,
        autoNotificationEnabled: true,
        aiMatchingEnabled: true,
        requirePhotoDocumentation: true,
        chainOfCustodyTracking: true,
        highValueThreshold: 500,
        defaultDisposalMethod: 'Donation',
        emailSubject: 'Your Lost Item Has Been Found - {item_name}',
        emailBody: 'Dear {guest_name},\n\nWe\'ve found your {item_name}. Please visit our Lost & Found desk to claim it.\n\nLocation: {storage_location}\nItem ID: {item_id}',
        smsTemplate: 'Hi {guest_name}, we found your {item_name}. Visit Lost & Found desk. ID: {item_id}'
    });

    useEffect(() => {
        refreshSettings();
    }, [refreshSettings]);

    useEffect(() => {
        if (settings) {
            setLocalSettings(prev => ({
                ...prev,
                defaultRetentionPeriod: settings.defaultRetentionPeriod,
                expirationWarningDays: settings.expirationWarningDays,
                qrCodePrefix: settings.qrCodePrefix,
                autoArchiveAfterDays: settings.autoArchiveAfterDays,
                autoNotificationEnabled: settings.autoNotificationEnabled,
                aiMatchingEnabled: settings.aiMatchingEnabled,
                requirePhotoDocumentation: settings.requirePhotoDocumentation,
                chainOfCustodyTracking: settings.chainOfCustodyTracking,
                highValueThreshold: settings.highValueThreshold,
                defaultDisposalMethod: settings.defaultDisposalMethod,
                emailSubject: settings.notificationTemplates?.emailSubject || prev.emailSubject,
                emailBody: settings.notificationTemplates?.emailBody || prev.emailBody,
                smsTemplate: settings.notificationTemplates?.smsTemplate || prev.smsTemplate
            }));
        }
    }, [settings]);

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'electronics': return 'fas fa-mobile-alt';
            case 'jewelry': return 'fas fa-gem';
            case 'personal items': return 'fas fa-wallet';
            case 'accessories': return 'fas fa-sunglasses';
            case 'clothing': return 'fas fa-tshirt';
            case 'documents': return 'fas fa-file-alt';
            case 'keys': return 'fas fa-key';
            case 'sports equipment': return 'fas fa-basketball-ball';
            case 'weapons': return 'fas fa-exclamation-triangle';
            default: return 'fas fa-box';
        }
    };

    const categories = ['Electronics', 'Clothing', 'Jewelry', 'Documents', 'Keys', 'Accessories', 'Sports Equipment', 'Weapons'];
    const storageLocations = ['Storage A', 'Storage B', 'Storage C', 'Storage D'];

    const handleSaveSystemSettings = async () => {
        await updateSettings({
            defaultRetentionPeriod: localSettings.defaultRetentionPeriod,
            expirationWarningDays: localSettings.expirationWarningDays,
            qrCodePrefix: localSettings.qrCodePrefix,
            autoArchiveAfterDays: localSettings.autoArchiveAfterDays,
            autoNotificationEnabled: localSettings.autoNotificationEnabled,
            aiMatchingEnabled: localSettings.aiMatchingEnabled,
            requirePhotoDocumentation: localSettings.requirePhotoDocumentation,
            chainOfCustodyTracking: localSettings.chainOfCustodyTracking,
            highValueThreshold: localSettings.highValueThreshold,
            defaultDisposalMethod: localSettings.defaultDisposalMethod,
            notificationTemplates: {
                emailSubject: localSettings.emailSubject,
                emailBody: localSettings.emailBody,
                smsTemplate: localSettings.smsTemplate
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Gold Standard Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Settings</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Lost & Found system configuration and policies
                    </p>
                </div>
            </div>
            {/* System Settings */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="text-xl text-white font-black uppercase tracking-tighter">System Settings</CardTitle>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Configure general system preferences
                    </p>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Default Retention Period (days)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                value={localSettings.defaultRetentionPeriod}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultRetentionPeriod: parseInt(e.target.value) || 90 }))}
                            />
                            <p className="text-xs text-slate-500">Items will be marked as expired after this period</p>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Expiration Warning (days before)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                value={localSettings.expirationWarningDays}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, expirationWarningDays: parseInt(e.target.value) || 7 }))}
                            />
                            <p className="text-xs text-slate-500">Send notifications this many days before expiration</p>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                QR Code Prefix
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                value={localSettings.qrCodePrefix}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, qrCodePrefix: e.target.value }))}
                                placeholder="LF"
                            />
                            <p className="text-xs text-slate-500">Prefix for QR code generation (e.g., LF-001)</p>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Auto-Archive After (days)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                value={localSettings.autoArchiveAfterDays}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, autoArchiveAfterDays: parseInt(e.target.value) || 30 }))}
                            />
                            <p className="text-xs text-slate-500">Automatically archive expired items after this period</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg">
                        <div>
                            <p className="text-sm font-bold text-white">Auto-Notification Enabled</p>
                            <p className="text-xs text-slate-400">Automatically notify guests when their items are found</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={localSettings.autoNotificationEnabled}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, autoNotificationEnabled: e.target.checked }))}
                            className="w-5 h-5 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg">
                        <div>
                            <p className="text-sm font-bold text-white">AI Matching Enabled</p>
                            <p className="text-xs text-slate-400">Use AI to match found items with guest descriptions</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={localSettings.aiMatchingEnabled}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, aiMatchingEnabled: e.target.checked }))}
                            className="w-5 h-5 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                        />
                    </div>
                    <Button
                        variant="primary"
                        className="bg-blue-600 hover:bg-blue-500 text-white uppercase tracking-wider font-bold"
                        onClick={handleSaveSystemSettings}
                        disabled={loading.settings}
                    >
                        <i className="fas fa-save mr-2" />
                        Save System Settings
                    </Button>
                </CardContent>
            </Card>

            {/* Category Management */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="text-xl text-white font-black uppercase tracking-tighter">Category Management</CardTitle>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Manage item categories and their properties
                    </p>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-3 mb-4">
                        {categories.map((category) => (
                            <div key={category} className={cn(
                                "flex items-center justify-between p-3 border rounded-lg hover:bg-white/5 transition-colors",
                                category === 'Weapons' ? 'border-red-500/20 bg-red-500/5' : 'border-white/5 bg-white/5'
                            )}>
                                <div className="flex items-center space-x-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center border border-white/5",
                                        category === 'Weapons' ? 'bg-red-500/20' : 'bg-slate-800'
                                    )}>
                                        <i className={cn("text-sm", category === 'Weapons' ? 'text-red-400' : 'text-slate-400', getCategoryIcon(category))} />
                                    </div>
                                    <div>
                                        <span className={cn("text-sm font-medium", category === 'Weapons' ? 'text-red-400' : 'text-white')}>{category}</span>
                                        {category === 'Weapons' && (
                                            <p className="text-xs text-red-500/80 mt-0.5">⚠️ Requires Manager Approval</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => showSuccess(`Editing ${category}`)}
                                        className="border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                                    >
                                        <i className="fas fa-edit" />
                                    </Button>
                                    {category !== 'Weapons' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => showSuccess(`Deleted ${category}`)}
                                            className="border-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                        >
                                            <i className="fas fa-trash" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        className="w-full border-dashed border-white/20 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/40"
                        onClick={() => showSuccess('Add new category')}
                    >
                        <i className="fas fa-plus mr-2" />
                        Add New Category
                    </Button>
                </CardContent>
            </Card>

            {/* Storage Location Management */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="text-xl text-white font-black uppercase tracking-tighter">Storage Location Management</CardTitle>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Configure storage locations and capacity
                    </p>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-3 mb-4">
                        {storageLocations.map((location) => (
                            <div key={location} className="flex items-center justify-between p-3 border border-white/5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-lg">
                                        <i className="fas fa-warehouse text-white text-sm" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{location}</p>
                                        <p className="text-xs text-slate-500">Capacity: 20 items</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => showSuccess(`Editing ${location}`)}
                                        className="border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                                    >
                                        <i className="fas fa-edit" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => showSuccess(`Deleted ${location}`)}
                                        className="border-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                    >
                                        <i className="fas fa-trash" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        className="w-full border-dashed border-white/20 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/40"
                        onClick={() => showSuccess('Add new storage location')}
                    >
                        <i className="fas fa-plus mr-2" />
                        Add New Location
                    </Button>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="text-xl text-white font-black uppercase tracking-tighter">Notification Settings</CardTitle>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Configure notification templates and preferences
                    </p>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Email Subject Template
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                value={localSettings.emailSubject}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, emailSubject: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Email Body Template
                            </label>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                rows={4}
                                value={localSettings.emailBody}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, emailBody: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                SMS Template
                            </label>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                rows={2}
                                value={localSettings.smsTemplate}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, smsTemplate: e.target.value }))}
                            />
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full text-[10px] font-black uppercase tracking-widest h-12 bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:text-white hover:border-white/20"
                        onClick={handleSaveSystemSettings}
                        disabled={loading.settings}
                    >
                        <i className={`fas fa-save mr-2 ${loading.settings ? 'animate-spin' : ''}`} />
                        Save Templates
                    </Button>
                </CardContent>
            </Card>

            {/* Legal & Compliance */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4">
                    <CardTitle className="text-xl text-white font-black uppercase tracking-tighter">Legal & Compliance Settings</CardTitle>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Configure disposal and legal compliance settings
                    </p>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Default Disposal Method
                            </label>
                            <select
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                                value={localSettings.defaultDisposalMethod}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultDisposalMethod: e.target.value }))}
                            >
                                <option>Donation</option>
                                <option>Auction</option>
                                <option>Disposal</option>
                                <option>Return to Owner</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                High-Value Threshold
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                value={localSettings.highValueThreshold}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, highValueThreshold: parseInt(e.target.value) || 500 }))}
                                placeholder="500"
                            />
                            <p className="text-xs text-slate-500">Items above this value require manager approval</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg">
                        <div>
                            <p className="text-sm font-bold text-white">Require Photo Documentation</p>
                            <p className="text-xs text-slate-400">Require photos for all registered items</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={localSettings.requirePhotoDocumentation}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, requirePhotoDocumentation: e.target.checked }))}
                            className="w-5 h-5 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg">
                        <div>
                            <p className="text-sm font-bold text-white">Chain of Custody Tracking</p>
                            <p className="text-xs text-slate-400">Track who handled each item</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={localSettings.chainOfCustodyTracking}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, chainOfCustodyTracking: e.target.checked }))}
                            className="w-5 h-5 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                        />
                    </div>
                    <Button
                        variant="outline"
                        className="w-full text-[10px] font-black uppercase tracking-widest h-12 bg-white/5 border border-white/5 text-slate-500 hover:bg-white/10 hover:text-white hover:border-white/20"
                        onClick={handleSaveSystemSettings}
                        disabled={loading.settings}
                    >
                        <i className={`fas fa-save mr-2 ${loading.settings ? 'animate-spin' : ''}`} />
                        Save Legal Settings
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
});

SettingsTab.displayName = 'SettingsTab';




