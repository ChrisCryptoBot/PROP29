import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { Card, CardContent } from '../../../../components/UI/Card';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import { cn } from '../../../../utils/cn';

export const SecurityTab: React.FC = () => {
    const { showSuccess } = useSystemAdminContext();

    return (
        <div className="space-y-8">
            {/* Security Overview Header */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                    <h3 className="text-3xl font-black text-white tracking-tight uppercase">Security Operations</h3>
                    <p className="text-slate-400 mt-1 font-medium tracking-wide">System protection and access control</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="glass"
                        className="border-white/5 hover:bg-white/10 shadow-xl"
                        onClick={() => showSuccess('Running security scan')}
                    >
                        <i className="fas fa-shield-alt mr-2 text-blue-400 opacity-70"></i>
                        Vulnerability Audit
                    </Button>
                    <Button
                        variant="glass"
                        className="border-white/5 hover:bg-white/10 shadow-xl"
                        onClick={() => showSuccess('Generating security report')}
                    >
                        <i className="fas fa-file-contract mr-2 text-emerald-400 opacity-70"></i>
                        Compliance Report
                    </Button>
                </div>
            </div>

            {/* Security Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SecurityMetricCard
                    icon="fa-lock"
                    label="Encryption Standard"
                    value="AES-256"
                    status="Operational"
                    color="green"
                />
                <SecurityMetricCard
                    icon="fa-user-shield"
                    label="Biometric Compliance"
                    value="98.5% Adherence"
                    status="Attention"
                    color="yellow"
                />
                <SecurityMetricCard
                    icon="fa-network-wired"
                    label="Global Threat Level"
                    value="Minimal"
                    status="Optimal"
                    color="blue"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Authentication Policy */}
                <div className="glass-card p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                            <i className="fas fa-key text-blue-400"></i>
                        </div>
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider">Authentication Policy</h4>
                    </div>
                    <div className="space-y-2">
                        <PolicyToggle label="Mandatory Multi-Factor (MFA)" enabled={true} />
                        <PolicyToggle label="Cryptographic Password Complexity" enabled={true} />
                        <PolicyToggle label="Automatic Session Timeout" enabled={true} />
                        <PolicyToggle label="Trusted Hardware Verification" enabled={true} />
                        <div className="pt-6 mt-4 border-t border-white/5 flex justify-between items-center group">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Credential Expiration (Days)</span>
                            <div className="relative">
                                <select className="pl-4 pr-10 py-2 border border-white/5 bg-white/5 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 hover:bg-white/10 transition-all appearance-none cursor-pointer">
                                    <option className="bg-slate-900">30 Cycle</option>
                                    <option className="bg-slate-900">60 Cycle</option>
                                    <option className="bg-slate-900" selected>90 Cycle</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                    <i className="fas fa-chevron-down text-[8px]"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <Button
                            size="sm"
                            variant="primary"
                            className="shadow-lg shadow-blue-500/20 px-6 font-black uppercase text-[10px] tracking-widest"
                            onClick={() => showSuccess('Saving authentication policies')}
                        >
                            Update Policies
                        </Button>
                    </div>
                </div>

                {/* Access Control */}
                <div className="glass-card p-6">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                            <i className="fas fa-network-wired text-emerald-400"></i>
                        </div>
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider">Access Control</h4>
                    </div>
                    <div className="space-y-2">
                        <PolicyToggle label="IP Whitelisting" enabled={false} />
                        <PolicyToggle label="Encrypted Tunnel (VPN) Required" enabled={true} />
                        <PolicyToggle label="Dormant Account Suspension" enabled={true} />
                        <PolicyToggle label="Enterprise Single Sign-On" enabled={false} />
                        <div className="pt-6 mt-4 border-t border-white/5 flex justify-between items-center group">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Intrusion Lockout Threshold</span>
                            <div className="relative">
                                <select className="pl-4 pr-10 py-2 border border-white/5 bg-white/5 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 hover:bg-white/10 transition-all appearance-none cursor-pointer">
                                    <option className="bg-slate-900">3 ATTEMPTS</option>
                                    <option className="bg-slate-900" selected>5 ATTEMPTS</option>
                                    <option className="bg-slate-900">10 ATTEMPTS</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                    <i className="fas fa-chevron-down text-[8px]"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <Button
                            size="sm"
                            variant="primary"
                            className="shadow-lg shadow-emerald-500/20 px-6 font-black uppercase text-[10px] tracking-widest"
                            onClick={() => showSuccess('Saving access control policies')}
                        >
                            Update Controls
                        </Button>
                    </div>
                </div>

                {/* Security Logs Summary */}
                <div className="glass-card p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 shadow-inner">
                                <i className="fas fa-fingerprint text-red-400"></i>
                            </div>
                            <h4 className="text-lg font-bold text-white uppercase tracking-wider">Security Activity Feed</h4>
                        </div>
                        <Button
                            size="sm"
                            variant="glass"
                            className="border-white/5 uppercase text-[10px] font-black tracking-widest px-4 shadow-xl"
                            onClick={() => showSuccess('Viewing security logs')}
                        >
                            View All Logs
                        </Button>
                    </div>
                    <div className="space-y-4">
                        <SecurityEvent
                            type="warning"
                            title="Unidentified Access Attempt"
                            message="Localized intrusion detection from IP: 203.0.113.42 - Account Lockout Engaged"
                            time="10 MINS AGO"
                        />
                        <SecurityEvent
                            type="info"
                            title="Global Policy Propagation"
                            message="Admin level modification of cryptographic requirements for perimeter nodes"
                            time="1 HOUR AGO"
                        />
                        <SecurityEvent
                            type="success"
                            title="Firewall Integrity Verified"
                            message="All dynamic rulesets audited and confirmed compliant with Tier 1 Security"
                            time="3 HOURS AGO"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const SecurityMetricCard: React.FC<{ icon: string; label: string; value: string; status: string; color: 'green' | 'yellow' | 'blue' }> = ({ icon, label, value, status, color }) => (
    <div className="glass-card p-6 transition-all duration-300 hover:border-white/20 group">
        <div className="flex items-start justify-between mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/20 to-blue-900/40 rounded-2xl flex items-center justify-center shadow-inner border border-blue-500/30 group-hover:scale-110 transition-transform">
                <i className={`fas ${icon} text-blue-400 text-xl`}></i>
            </div>
            <Badge className={cn(
                "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm",
                color === 'green' ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                    color === 'yellow' ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                        "text-blue-400 bg-blue-500/10 border-blue-500/20"
            )}>{status}</Badge>
        </div>
        <div className="text-2xl font-black text-white mb-1 tracking-tight uppercase">{value}</div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</div>
    </div>
);

const PolicyToggle: React.FC<{ label: string; enabled: boolean }> = ({ label, enabled }) => {
    const [active, setActive] = React.useState(enabled);
    return (
        <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 group">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
            <button
                onClick={() => setActive(!active)}
                className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40",
                    active ? "bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-white/10"
                )}
            >
                <span
                    className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300",
                        active ? "translate-x-6" : "translate-x-1"
                    )}
                />
            </button>
        </div>
    );
};

const SecurityEvent: React.FC<{ type: 'warning' | 'info' | 'success'; title: string; message: string; time: string }> = ({ type, title, message, time }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group cursor-pointer">
        <div className="flex items-center space-x-4">
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform shadow-inner",
                type === 'warning' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    type === 'info' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            )}>
                <i className={cn("fas text-sm", type === 'warning' ? "fa-exclamation-triangle" : type === 'info' ? "fa-info-circle transition-all" : "fa-shield-alt")}></i>
            </div>
            <div>
                <div className="text-xs font-black text-white uppercase tracking-wider group-hover:text-blue-400 transition-colors">{title}</div>
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-tight line-clamp-1">{message}</div>
            </div>
        </div>
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-tighter bg-black/20 px-2 py-1 rounded shadow-inner">{time}</div>
    </div>
);



