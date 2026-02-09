import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Card, CardContent } from '../../../../components/UI/Card';
import { Modal } from '../../../../components/UI/Modal';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import { cn } from '../../../../utils/cn';
import * as systemAdminApi from '../../services/systemAdminApi';

export const SystemTab: React.FC = () => {
    const {
        settings,
        setSettings,
        handleSaveSettings,
        handleResetSettings,
        loading,
        showSuccess,
        refreshData,
        setConfirmModal
    } = useSystemAdminContext();

    const [diagnosticsResult, setDiagnosticsResult] = useState<{ status: string; checks?: { name: string; status: string; latency_ms?: number }[] } | null>(null);
    const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);

    const handleInputChange = (field: keyof typeof settings, value: any) => {
        setSettings({ ...settings, [field]: value });
    };

    const handleRestartServices = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Restart system services',
            message: 'This may cause brief downtime. Are you sure you want to restart system services?',
            variant: 'warning',
            onConfirm: () => {
                systemAdminApi.restartServices().then((r) => {
                    showSuccess(r.message ?? 'Restart requested');
                    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                }).catch(() => {
                    showSuccess('Restart request failed. Try again or contact support.');
                    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                });
            }
        });
    };

    const handleRunDiagnostics = () => {
        setDiagnosticsLoading(true);
        systemAdminApi.runDiagnostics()
            .then((r) => {
                setDiagnosticsResult(r);
                setDiagnosticsLoading(false);
            })
            .catch(() => {
                setDiagnosticsResult({ status: 'error', checks: [] });
                setDiagnosticsLoading(false);
            });
    };

    const handleGlobalSync = () => {
        refreshData().then(() => showSuccess('Settings synced')).catch(() => {});
    };

    return (
        <div className="space-y-8">
            {/* System Settings Header */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                    <h2 className="page-title">System Configuration</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">Global system settings and performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="border-white/5 hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest px-6"
                        onClick={handleResetSettings}
                    >
                        <i className="fas fa-undo mr-2 opacity-70" aria-hidden />
                        Reset defaults
                    </Button>
                    <Button
                        onClick={handleSaveSettings}
                        disabled={loading}
                        variant="primary"
                        className="px-8 py-3"
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
                <div className="bg-slate-900/50 border border-white/5 rounded-md p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                            <i className="fas fa-desktop text-white"></i>
                        </div>
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider">System Identity</h4>
                    </div>
                    <div className="space-y-6">
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">System Name</label>
                            <div className="relative">
                                <i className="fas fa-tag absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs" aria-hidden />
                                <input
                                    type="text"
                                    value={settings.systemName}
                                    onChange={(e) => handleInputChange('systemName', e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-white/5 bg-white/5 text-white font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 hover:bg-white/10 transition-all placeholder:text-slate-700"
                                    placeholder="Enter system designation..."
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="group">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Timezone</label>
                                <div className="relative">
                                    <i className="fas fa-globe-americas absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs" aria-hidden />
                                    <select
                                        value={settings.timezone}
                                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                                        className="w-full pl-11 pr-10 py-3 border border-white/5 bg-white/5 text-white font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer hover:bg-white/10 transition-all uppercase text-xs"
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
                                    <i className="fas fa-language absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs" aria-hidden />
                                    <select
                                        value={settings.language}
                                        onChange={(e) => handleInputChange('language', e.target.value)}
                                        className="w-full pl-11 pr-10 py-3 border border-white/5 bg-white/5 text-white font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer hover:bg-white/10 transition-all uppercase text-xs"
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
                                <i className="fas fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs" aria-hidden />
                                <select
                                    value={settings.dateFormat}
                                    onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                                    className="w-full pl-11 pr-10 py-3 border border-white/5 bg-white/5 text-white font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer hover:bg-white/10 transition-all"
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
                <div className="bg-slate-900/50 border border-white/5 rounded-md p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                            <i className="fas fa-sliders-h text-white" aria-hidden />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Automated Protocols</h3>
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
                    <div className="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-md flex items-start space-x-3">
                        <i className="fas fa-shield-virus text-emerald-400 mt-1" aria-hidden />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                            Settings ensure platform resilience. Disabling automatic backups may result in data loss.
                        </p>
                    </div>
                </div>

                {/* Performance Tuning */}
                <div className="bg-slate-900/50 border border-white/5 rounded-md p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                            <i className="fas fa-bolt text-white" aria-hidden />
                        </div>
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider">Core Optimization</h4>
                    </div>
                    <div className="space-y-6">
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Cache Persistence (SEC)</label>
                            <div className="relative">
                                <i className="fas fa-hdd absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs" aria-hidden />
                                <input
                                    type="number"
                                    value={settings.cacheTtl}
                                    onChange={(e) => handleInputChange('cacheTtl', parseInt(e.target.value))}
                                    className="w-full pl-11 pr-4 py-3 border border-white/5 bg-white/5 text-white font-mono font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:bg-white/10 transition-all "
                                    placeholder="3600"
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Concurrency Threshold</label>
                            <div className="relative">
                                <i className="fas fa-network-wired absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs" aria-hidden />
                                <input
                                    type="number"
                                    value={settings.maxConnections}
                                    onChange={(e) => handleInputChange('maxConnections', parseInt(e.target.value))}
                                    className="w-full pl-11 pr-4 py-3 border border-white/5 bg-white/5 text-white font-mono font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:bg-white/10 transition-all "
                                    placeholder="100"
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 px-1">Session TTL (MIN)</label>
                            <div className="relative">
                                <i className="fas fa-hourglass-half absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs" aria-hidden />
                                <input
                                    type="number"
                                    value={settings.sessionTimeout}
                                    onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                                    className="w-full pl-11 pr-4 py-3 border border-white/5 bg-white/5 text-white font-mono font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:bg-white/10 transition-all "
                                    placeholder="30"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Operations */}
                <div className="bg-slate-900/50 border border-white/5 rounded-md p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5">
                            <i className="fas fa-tools text-white" aria-hidden />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">System Operations</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center p-8 h-auto border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 group transition-all"
                            onClick={handleRestartServices}
                        >
                            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5 mb-4">
                                <i className="fas fa-sync-alt text-2xl text-white animate-[spin_3s_linear_infinite]" aria-hidden />
                            </div>
                            <span className="font-black uppercase text-[10px] tracking-widest text-slate-300">Restart Services</span>
                        </Button>
                        <Button
                            variant="outline"
                            disabled={diagnosticsLoading}
                            className="flex flex-col items-center justify-center p-8 h-auto border-white/5 hover:border-green-500/30 hover:bg-green-500/5 group transition-all"
                            onClick={handleRunDiagnostics}
                        >
                            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5 mb-4">
                                {diagnosticsLoading ? (
                                    <i className="fas fa-spinner fa-spin text-2xl text-white" aria-hidden />
                                ) : (
                                    <i className="fas fa-microchip text-2xl text-white" aria-hidden />
                                )}
                            </div>
                            <span className="font-black uppercase text-[10px] tracking-widest text-slate-300">{diagnosticsLoading ? 'Running…' : 'Diagnostics'}</span>
                        </Button>
                    </div>
                    {diagnosticsResult && (
                        <Modal
                            isOpen={!!diagnosticsResult}
                            onClose={() => setDiagnosticsResult(null)}
                            title="System diagnostics"
                            size="sm"
                        >
                            <div className="space-y-3">
                                <p className="text-sm text-slate-300">Status: <strong className={diagnosticsResult.status === 'ok' ? 'text-green-400' : 'text-red-400'}>{diagnosticsResult.status}</strong></p>
                                {diagnosticsResult.checks?.length ? (
                                    <ul className="text-xs text-slate-400 space-y-1">
                                        {diagnosticsResult.checks.map((c, i) => (
                                            <li key={i}>{c.name}: {c.status}{c.latency_ms != null ? ` (${c.latency_ms}ms)` : ''}</li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        </Modal>
                    )}
                    <div className="mt-8 flex items-center justify-between p-5 bg-blue-500/10 border border-blue-500/20 rounded-md cursor-pointer hover:bg-blue-500/15 transition-colors" onClick={handleGlobalSync}>
                        <div className="flex items-center">
                            <div className="w-10 h-10 border-white/5 rounded-md flex items-center justify-center mr-4 border border-blue-500/30">
                                <i className="fas fa-cloud-download-alt text-blue-400"></i>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Global sync</div>
                                <div className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">Last sync: 10:45 AM</div>
                            </div>
                        </div>
                        <i className="fas fa-chevron-right text-blue-400/50" aria-hidden />
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
                enabled ? "bg-blue-600" : "bg-white/10"
            )}
        >
            <span
                className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300",
                    enabled ? "translate-x-6" : "translate-x-1"
                )}
            />
        </button>
    </div>
);


