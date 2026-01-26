import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Card, CardContent } from '../../../../components/UI/Card';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import { cn } from '../../../../utils/cn';

export const SystemTab: React.FC = () => {
    const { settings, setSettings, handleSaveSettings, loading, showSuccess } = useSystemAdminContext();

    const handleInputChange = (field: keyof typeof settings, value: any) => {
        setSettings({ ...settings, [field]: value });
    };

    return (
        <div className="space-y-8">
            {/* System Settings Header */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                    <h3 className="text-3xl font-black text-white tracking-tight uppercase">System Configuration</h3>
                    <p className="text-slate-400 mt-1 font-medium tracking-wide">Global system settings and performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="glass"
                        className="border-white/5 hover:bg-white/10 shadow-xl font-bold uppercase text-[10px] tracking-widest px-6"
                        onClick={() => showSuccess('Resetting settings to defaults')}
                    >
                        <i className="fas fa-undo mr-2 opacity-70"></i>
                        Reset Defaults
                    </Button>
                    <Button
                        onClick={handleSaveSettings}
                        disabled={loading}
                        variant="primary"
                        className="shadow-lg shadow-blue-500/20 px-8 py-3 hover:scale-105 transition-transform"
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Applying...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save mr-2"></i>
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* General Settings */}
                <div className="glass-card p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                            <i className="fas fa-desktop text-blue-400"></i>
                        </div>
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider">System Identity</h4>
                    </div>
                    <div className="space-y-6">
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">System Name</label>
                            <div className="relative">
                                <i className="fas fa-tag absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                                <input
                                    type="text"
                                    value={settings.systemName}
                                    onChange={(e) => handleInputChange('systemName', e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-white/5 bg-white/5 text-white font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 hover:bg-white/10 transition-all placeholder:text-slate-700"
                                    placeholder="Enter system designation..."
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Timezone</label>
                                <div className="relative">
                                    <i className="fas fa-globe-americas absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                                    <select
                                        value={settings.timezone}
                                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                                        className="w-full pl-11 pr-10 py-3 border border-white/5 bg-white/5 text-white font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer hover:bg-white/10 transition-all uppercase text-xs"
                                    >
                                        <option value="UTC" className="bg-slate-900">UTC Standard</option>
                                        <option value="EST" className="bg-slate-900">Eastern Time</option>
                                        <option value="PST" className="bg-slate-900">Pacific Time</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                        <i className="fas fa-chevron-down text-[10px]"></i>
                                    </div>
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">System Language</label>
                                <div className="relative">
                                    <i className="fas fa-language absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                                    <select
                                        value={settings.language}
                                        onChange={(e) => handleInputChange('language', e.target.value)}
                                        className="w-full pl-11 pr-10 py-3 border border-white/5 bg-white/5 text-white font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer hover:bg-white/10 transition-all uppercase text-xs"
                                    >
                                        <option value="en" className="bg-slate-900">English (Global)</option>
                                        <option value="es" className="bg-slate-900">Español</option>
                                        <option value="fr" className="bg-slate-900">Français</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                        <i className="fas fa-chevron-down text-[10px]"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Date Format</label>
                            <div className="relative">
                                <i className="fas fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                                <select
                                    value={settings.dateFormat}
                                    onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                                    className="w-full pl-11 pr-10 py-3 border border-white/5 bg-white/5 text-white font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer hover:bg-white/10 transition-all"
                                >
                                    <option value="MM/DD/YYYY" className="bg-slate-900">MM / DD / YYYY (US)</option>
                                    <option value="DD/MM/YYYY" className="bg-slate-900">DD / MM / YYYY (EU)</option>
                                    <option value="YYYY-MM-DD" className="bg-slate-900">YYYY - MM - DD (ISO)</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                    <i className="fas fa-chevron-down text-[10px]"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Behavior */}
                <div className="glass-card p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                            <i className="fas fa-sliders-h text-emerald-400"></i>
                        </div>
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider">Automated Protocols</h4>
                    </div>
                    <div className="space-y-2">
                        <ToggleRow
                            label="Automatic Backups"
                            enabled={settings.autoBackup}
                            onChange={(val) => handleInputChange('autoBackup', val)}
                        />
                        <ToggleRow
                            label="Maintenance Mode"
                            enabled={settings.maintenanceMode}
                            onChange={(val) => handleInputChange('maintenanceMode', val)}
                        />
                        <ToggleRow
                            label="Debug Mode (Verbose Logs)"
                            enabled={settings.debugMode}
                            onChange={(val) => handleInputChange('debugMode', val)}
                        />
                        <ToggleRow
                            label="Automatic Updates"
                            enabled={settings.autoUpdates}
                            onChange={(val) => handleInputChange('autoUpdates', val)}
                        />
                    </div>
                    <div className="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start space-x-3">
                        <i className="fas fa-shield-virus text-emerald-500/50 mt-1"></i>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                            Settings ensure platform resilience. Disabling automatic backups may result in data loss.
                        </p>
                    </div>
                </div>

                {/* Performance Tuning */}
                <div className="glass-card p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20 shadow-inner">
                            <i className="fas fa-bolt text-orange-400"></i>
                        </div>
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider">Core Optimization</h4>
                    </div>
                    <div className="space-y-6">
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Cache Persistence (SEC)</label>
                            <div className="relative">
                                <i className="fas fa-hdd absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                                <input
                                    type="number"
                                    value={settings.cacheTtl}
                                    onChange={(e) => handleInputChange('cacheTtl', parseInt(e.target.value))}
                                    className="w-full pl-11 pr-4 py-3 border border-white/5 bg-white/5 text-white font-mono font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 hover:bg-white/10 transition-all shadow-inner"
                                    placeholder="3600"
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Concurrency Threshold</label>
                            <div className="relative">
                                <i className="fas fa-network-wired absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                                <input
                                    type="number"
                                    value={settings.maxConnections}
                                    onChange={(e) => handleInputChange('maxConnections', parseInt(e.target.value))}
                                    className="w-full pl-11 pr-4 py-3 border border-white/5 bg-white/5 text-white font-mono font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 hover:bg-white/10 transition-all shadow-inner"
                                    placeholder="100"
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Session TTL (MIN)</label>
                            <div className="relative">
                                <i className="fas fa-hourglass-half absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs"></i>
                                <input
                                    type="number"
                                    value={settings.sessionTimeout}
                                    onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                                    className="w-full pl-11 pr-4 py-3 border border-white/5 bg-white/5 text-white font-mono font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 hover:bg-white/10 transition-all shadow-inner"
                                    placeholder="30"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Operations */}
                <div className="glass-card p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 shadow-inner">
                            <i className="fas fa-tools text-red-400"></i>
                        </div>
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider">System Operations</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <Button
                            variant="glass"
                            className="flex flex-col items-center justify-center p-8 h-auto border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 group shadow-2xl transition-all"
                            onClick={() => showSuccess('Restarting system services')}
                        >
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-sync-alt text-2xl text-blue-500 animate-[spin_3s_linear_infinite]"></i>
                            </div>
                            <span className="font-black uppercase text-[10px] tracking-widest text-slate-300">Restart Services</span>
                        </Button>
                        <Button
                            variant="glass"
                            className="flex flex-col items-center justify-center p-8 h-auto border-white/5 hover:border-green-500/30 hover:bg-green-500/5 group shadow-2xl transition-all"
                            onClick={() => showSuccess('Running system diagnostics')}
                        >
                            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-microchip text-2xl text-green-500"></i>
                            </div>
                            <span className="font-black uppercase text-[10px] tracking-widest text-slate-300">Diagnostics</span>
                        </Button>
                    </div>
                    <div className="mt-8 flex items-center justify-between p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl shadow-inner overflow-hidden relative group cursor-pointer" onClick={() => showSuccess('Syncing settings')}>
                        <div className="absolute inset-0 bg-blue-500/5 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                        <div className="flex items-center relative z-10">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mr-4 border border-blue-500/30">
                                <i className="fas fa-cloud-download-alt text-blue-400"></i>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Global Sync</div>
                                <div className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">Last Sync: 10:45 AM</div>
                            </div>
                        </div>
                        <i className="fas fa-chevron-right text-blue-400/50 relative z-10 group-hover:translate-x-1 transition-transform"></i>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToggleRow: React.FC<{ label: string; enabled: boolean; onChange: (val: boolean) => void }> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between py-5 border-b border-white/5 last:border-0 group">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
        <button
            onClick={() => onChange(!enabled)}
            className={cn(
                "relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-0",
                enabled ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-white/10"
            )}
        >
            <span
                className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300",
                    enabled ? "translate-x-6" : "translate-x-1"
                )}
            />
        </button>
    </div>
);


