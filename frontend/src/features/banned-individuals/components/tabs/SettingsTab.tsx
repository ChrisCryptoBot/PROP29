import React from 'react';
import { cn } from '../../../../utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { showSuccess } from '../../../../utils/toast';
import { useAuth } from '../../../../hooks/useAuth';

export const SettingsTab: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.roles.some(role => role.toUpperCase() === 'ADMIN');

    return (
        <div className="space-y-6">
            <Card className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)]">
                <CardHeader>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg mr-3 group-hover:scale-110 transition-transform">
                        <i className="fas fa-cog text-white text-lg" />
                    </div>
                    <span className="text-xl font-black uppercase tracking-tighter text-[color:var(--text-main)]">Settings</span>
                </CardHeader>
                <CardContent>
                    {!isAdmin && (
                        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center text-amber-100 text-sm font-medium">
                            <i className="fas fa-lock mr-3 text-amber-400" />
                            You have read-only access to system settings. Modifications require Administrative privileges.
                        </div>
                    )}

                    <div className="space-y-8">
                        {/* General Settings */}
                        <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-main)] mb-4 pb-2 border-b border-white/10">General Policies</h4>
                            <div className="space-y-4">
                                <SettingToggle label="Auto-share Permanent Bans with Network" description="Shred shared bans automatically across property cluster" enabled={true} disabled={!isAdmin} />
                                <SettingToggle label="Facial Recognition Alerts" description="Enable real-time push notifications for security staff" enabled={true} disabled={!isAdmin} />
                                <SettingToggle label="Strict ID Verification" description="Require government ID scan for all new ban records" enabled={false} disabled={!isAdmin} />
                            </div>
                        </section>

                        {/* Retention Settings */}
                        <section>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-[color:var(--text-main)] mb-4 pb-2 border-b border-white/10">Data Retention & Governance</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                                    <label className="block text-sm font-bold text-[color:var(--text-sub)] mb-2">Audit Logs Retention</label>
                                    <select className="w-full px-3 py-2 border border-white/10 bg-white/5 text-[color:var(--text-main)] rounded-lg disabled:opacity-50" disabled={!isAdmin}>
                                        <option>90 Days</option>
                                        <option selected>180 Days</option>
                                        <option>1 Year</option>
                                        <option>Indefinite</option>
                                    </select>
                                </div>
                                <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                                    <label className="block text-sm font-bold text-[color:var(--text-sub)] mb-2">Biometric Data Purge</label>
                                    <select className="w-full px-3 py-2 border border-white/10 bg-white/5 text-[color:var(--text-main)] rounded-lg disabled:opacity-50" disabled={!isAdmin}>
                                        <option>Upon Expiry</option>
                                        <option selected>30 Days Post-Expiry</option>
                                        <option>90 Days Post-Expiry</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <div className="pt-6 border-t border-white/5 flex justify-end">
                            <Button
                                variant="primary"
                                className="font-black uppercase tracking-widest px-8 shadow-lg shadow-blue-500/20"
                                onClick={() => showSuccess('Settings saved successfully')}
                                disabled={!isAdmin}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const SettingToggle: React.FC<{ label: string; description: string; enabled: boolean; disabled?: boolean }> = ({ label, description, enabled, disabled }) => {
    const [active, setActive] = React.useState(enabled);
    return (
        <div className={cn("flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 transition-opacity", disabled && "opacity-60")}>
            <div>
                <h5 className="font-bold text-[color:var(--text-main)]">{label}</h5>
                <p className="text-sm text-[color:var(--text-sub)]">{description}</p>
            </div>
            <button
                onClick={() => !disabled && setActive(!active)}
                disabled={disabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${active ? 'bg-blue-600' : 'bg-white/10'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
};




