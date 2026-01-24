import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Toggle } from '../../../../components/UI/Toggle';
import { useSmartParkingContext } from '../../context/SmartParkingContext';
import { cn } from '../../../../utils/cn';

const SettingsTabContent: React.FC = () => {
    const { settings, handleSettingsChange, handleSaveSettings, loading } = useSmartParkingContext();

    return (
        <div className="space-y-6">
            {/* Header / Summary Section */}
            <div className="flex justify-between items-end mb-8">
                <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-4 shadow-2xl border border-white/5">
                        <i className="fas fa-sliders-h text-white text-lg" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-white">System Settings</h2>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400 mt-1">Configure Pricing, Policies, and Integrations</p>
                    </div>
                </div>
                <Button
                    variant="glass"
                    onClick={handleSaveSettings}
                    disabled={loading}
                    className="relative group overflow-hidden px-12 h-10 active:scale-[0.98] border-white/5 hover:border-emerald-500/30"
                >
                    <div className="relative flex items-center">
                        <i className="fas fa-save mr-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                        <span className="font-black uppercase tracking-widest text-[10px] group-hover:text-white transition-colors">
                            {loading ? 'Processing...' : 'Save Configuration'}
                        </span>
                    </div>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pricing Configuration */}
                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl h-full">
                    <CardHeader className="px-6 pt-6 pb-4 border-b border-white/5">
                        <CardTitle className="flex items-center text-sm text-white font-black uppercase tracking-widest">
                            <i className="fas fa-dollar-sign text-emerald-500 mr-3" />
                            Fee Schedules
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Hourly (Guest)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.pricing.guestHourly}
                                        onChange={(e) => handleSettingsChange('pricing', { ...settings.pricing, guestHourly: parseFloat(e.target.value) })}
                                        className="w-full pl-7 pr-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Daily (Max)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.pricing.guestDaily}
                                        onChange={(e) => handleSettingsChange('pricing', { ...settings.pricing, guestDaily: parseFloat(e.target.value) })}
                                        className="w-full pl-7 pr-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Valet Service</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.pricing.valetFee}
                                        onChange={(e) => handleSettingsChange('pricing', { ...settings.pricing, valetFee: parseFloat(e.target.value) })}
                                        className="w-full pl-7 pr-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">EV Station</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.pricing.evChargingFee}
                                        onChange={(e) => handleSettingsChange('pricing', { ...settings.pricing, evChargingFee: parseFloat(e.target.value) })}
                                        className="w-full pl-7 pr-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Policy Settings */}
                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl h-full">
                    <CardHeader className="px-6 pt-6 pb-4 border-b border-white/5">
                        <CardTitle className="flex items-center text-sm text-white font-black uppercase tracking-widest">
                            <i className="fas fa-shield-alt text-blue-500 mr-3" />
                            System Rules
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Max Stay (Hrs)</label>
                                <input
                                    type="number"
                                    value={settings.policies.maxStayHours}
                                    onChange={(e) => handleSettingsChange('policies', { ...settings.policies, maxStayHours: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Grace Period (Min)</label>
                                <input
                                    type="number"
                                    value={settings.policies.gracePeriodMinutes}
                                    onChange={(e) => handleSettingsChange('policies', { ...settings.policies, gracePeriodMinutes: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                                />
                            </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <Toggle
                                checked={settings.policies.autoCheckoutEnabled}
                                onChange={(checked) => handleSettingsChange('policies', { ...settings.policies, autoCheckoutEnabled: checked })}
                                label="Auto-Checkout"
                                description="Automatically end parking sessions after maximum duration"
                                size="sm"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl h-full">
                    <CardHeader className="px-6 pt-6 pb-4 border-b border-white/5">
                        <CardTitle className="flex items-center text-sm text-white font-black uppercase tracking-widest">
                            <i className="fas fa-bell text-orange-500 mr-3" />
                            System Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-4">
                            {[
                                { id: 'lowOccupancyAlert', label: 'Occupancy Warnings', description: 'Alert when parking capacity limits are reached', key: 'lowOccupancyAlert' },
                                { id: 'maintenanceReminders', label: 'Maintenance Alerts', description: 'Notify when spaces are offline or degraded', key: 'maintenanceReminders' }
                            ].map((setting) => (
                                <div key={setting.id} className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <Toggle
                                        checked={(settings.notifications as any)[setting.key]}
                                        onChange={(checked) => handleSettingsChange('notifications', { ...settings.notifications, [setting.key]: checked })}
                                        label={setting.label}
                                        description={setting.description}
                                        size="sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Integration Settings */}
                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl h-full">
                    <CardHeader className="px-6 pt-6 pb-4 border-b border-white/5">
                        <CardTitle className="flex items-center text-sm text-white font-black uppercase tracking-widest">
                            <i className="fas fa-network-wired text-purple-500 mr-3" />
                            External Integrations
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-4">
                            {[
                                { id: 'billingSystemEnabled', label: 'Billing Sync', description: 'Post charges to the property ledger', key: 'billingSystemEnabled' }
                            ].map((setting) => (
                                <div key={setting.id} className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                    <Toggle
                                        checked={(settings.integration as any)[setting.key]}
                                        onChange={(checked) => handleSettingsChange('integration', { ...settings.integration, [setting.key]: checked })}
                                        label={setting.label}
                                        description={setting.description}
                                        size="sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export const SettingsTab: React.FC = () => (
    <SettingsTabContent />
);


