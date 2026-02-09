import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import { cn } from '../../../../utils/cn';
import * as systemAdminApi from '../../services/systemAdminApi';

export const SecurityTab: React.FC = () => {
    const {
        securityPolicies,
        setSecurityPolicies,
        handleUpdateSecurityPolicies,
        showSuccess,
        setActiveTab
    } = useSystemAdminContext();

    const [scanResult, setScanResult] = useState<{ passed: boolean; summary?: string; issues?: unknown[] } | null>(null);
    const [scanLoading, setScanLoading] = useState(false);
    const [complianceReportOpen, setComplianceReportOpen] = useState(false);

    const handleViewAllLogs = () => setActiveTab('audit');

    const handleRunSecurityCheck = () => {
        setScanLoading(true);
        systemAdminApi.runSecurityScan()
            .then((r) => {
                setScanResult(r);
                setScanLoading(false);
            })
            .catch(() => {
                setScanResult({ passed: false, summary: 'Scan failed.' });
                setScanLoading(false);
            });
    };

    const handleViewComplianceReport = () => {
        setComplianceReportOpen(true);
    };

    return (
        <div className="space-y-6" role="main" aria-label="Security Operations">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
                <div>
                    <h2 className="page-title">Security Operations</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        System protection and access control
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={scanLoading}
                        className="border-white/5 hover:bg-white/10 font-black uppercase text-[10px] tracking-widest px-6 shadow-none"
                        onClick={handleRunSecurityCheck}
                    >
                        {scanLoading ? (
                            <i className="fas fa-spinner fa-spin mr-2 text-blue-400" aria-hidden="true" />
                        ) : (
                            <i className="fas fa-shield-alt mr-2 text-blue-400 opacity-70" aria-hidden="true" />
                        )}
                        {scanLoading ? 'Scanning…' : 'Run Security Check'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-white/5 hover:bg-white/10 font-black uppercase text-[10px] tracking-widest px-6 shadow-none"
                        onClick={handleViewComplianceReport}
                    >
                        <i className="fas fa-file-contract mr-2 text-emerald-400 opacity-70" aria-hidden="true" />
                        View Compliance Report
                    </Button>
                </div>
            </div>

            {/* Compact metrics bar (gold standard — no KPI cards) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Security metrics">
                <span>Encryption <strong className="font-black text-white">AES-256</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Biometric <strong className="font-black text-white">98.5%</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Threat Level <strong className="font-black text-white">Minimal</strong></span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Authentication Policy */}
                <section aria-labelledby="auth-policy-heading">
                    <h3 id="auth-policy-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5 mr-3">
                            <i className="fas fa-key text-white text-sm" aria-hidden="true" />
                        </div>
                        Authentication Policy
                    </h3>
                    <div className="rounded-md border border-white/5 p-6 bg-white/[0.02]">
                        <div className="space-y-2">
                            <PolicyToggle label="Mandatory Multi-Factor (MFA)" policyKey="mfaEnabled" value={securityPolicies.mfaEnabled} onChange={(v) => setSecurityPolicies(p => ({ ...p, mfaEnabled: v }))} />
                            <PolicyToggle label="Cryptographic Password Complexity" policyKey="passwordComplexity" value={securityPolicies.passwordComplexity} onChange={(v) => setSecurityPolicies(p => ({ ...p, passwordComplexity: v }))} />
                            <PolicyToggle label="Automatic Session Timeout" policyKey="sessionTimeoutEnabled" value={securityPolicies.sessionTimeoutEnabled} onChange={(v) => setSecurityPolicies(p => ({ ...p, sessionTimeoutEnabled: v }))} />
                            <PolicyToggle label="Trusted Hardware Verification" policyKey="hardwareVerification" value={securityPolicies.hardwareVerification} onChange={(v) => setSecurityPolicies(p => ({ ...p, hardwareVerification: v }))} />
                            <div className="pt-4 mt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credential expiration (days)</span>
                                <select
                                    value={securityPolicies.passwordExpiryDays}
                                    onChange={(e) => setSecurityPolicies(p => ({ ...p, passwordExpiryDays: Number(e.target.value) }))}
                                    className="pl-4 pr-10 py-2 border border-white/5 bg-white/5 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-md focus:outline focus:ring-2 focus:ring-blue-500 hover:bg-white/10 appearance-none cursor-pointer"
                                    aria-label="Credential expiration days"
                                >
                                    <option value={30} className="bg-slate-900">30</option>
                                    <option value={60} className="bg-slate-900">60</option>
                                    <option value={90} className="bg-slate-900">90</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button
                                size="sm"
                                variant="primary"
                                className="px-6 font-black uppercase text-[10px] tracking-widest shadow-none"
                                onClick={() => handleUpdateSecurityPolicies({})}
                            >
                                Update policies
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Access Control */}
                <section aria-labelledby="access-control-heading">
                    <h3 id="access-control-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5 mr-3">
                            <i className="fas fa-network-wired text-white text-sm" aria-hidden="true" />
                        </div>
                        Access Control
                    </h3>
                    <div className="rounded-md border border-white/5 p-6 bg-white/[0.02]">
                        <div className="space-y-2">
                            <PolicyToggle label="IP whitelisting" policyKey="ipWhitelisting" value={securityPolicies.ipWhitelisting} onChange={(v) => setSecurityPolicies(p => ({ ...p, ipWhitelisting: v }))} />
                            <PolicyToggle label="Encrypted tunnel (VPN) required" policyKey="vpnRequired" value={securityPolicies.vpnRequired} onChange={(v) => setSecurityPolicies(p => ({ ...p, vpnRequired: v }))} />
                            <PolicyToggle label="Dormant account suspension" policyKey="dormantAccountSuspension" value={securityPolicies.dormantAccountSuspension} onChange={(v) => setSecurityPolicies(p => ({ ...p, dormantAccountSuspension: v }))} />
                            <PolicyToggle label="Enterprise single sign-on" policyKey="ssoEnabled" value={securityPolicies.ssoEnabled} onChange={(v) => setSecurityPolicies(p => ({ ...p, ssoEnabled: v }))} />
                            <div className="pt-4 mt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intrusion lockout threshold</span>
                                <select
                                    value={securityPolicies.maxLoginAttempts}
                                    onChange={(e) => setSecurityPolicies(p => ({ ...p, maxLoginAttempts: Number(e.target.value) }))}
                                    className="pl-4 pr-10 py-2 border border-white/5 bg-white/5 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-md focus:outline focus:ring-2 focus:ring-blue-500 hover:bg-white/10 appearance-none cursor-pointer"
                                    aria-label="Max login attempts before lockout"
                                >
                                    <option value={3} className="bg-slate-900">3</option>
                                    <option value={5} className="bg-slate-900">5</option>
                                    <option value={10} className="bg-slate-900">10</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button
                                size="sm"
                                variant="primary"
                                className="px-6 font-black uppercase text-[10px] tracking-widest shadow-none"
                                onClick={() => handleUpdateSecurityPolicies({})}
                            >
                                Update controls
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Security Activity Feed */}
                <section className="lg:col-span-2" aria-labelledby="security-activity-heading">
                    <h3 id="security-activity-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center justify-between">
                        <span className="flex items-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5 mr-3">
                                <i className="fas fa-fingerprint text-white text-sm" aria-hidden="true" />
                            </div>
                            Security Activity Feed
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-white/5 uppercase text-[10px] font-black tracking-widest px-4 shadow-none"
                            onClick={handleViewAllLogs}
                        >
                            View All Logs
                        </Button>
                    </h3>
                    <div className="rounded-md border border-white/5 overflow-hidden">
                        <div className="p-4 space-y-3">
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
                </section>
            </div>

            {scanResult && (
                <Modal
                    isOpen={!!scanResult}
                    onClose={() => setScanResult(null)}
                    title="Security scan result"
                    size="sm"
                >
                    <div className="space-y-3">
                        <p className="text-sm text-slate-300">
                            {scanResult.passed ? (
                                <span className="text-green-400 font-bold">Passed</span>
                            ) : (
                                <span className="text-red-400 font-bold">Issues found</span>
                            )}
                        </p>
                        {scanResult.summary && <p className="text-xs text-slate-400">{scanResult.summary}</p>}
                        {scanResult.issues && (scanResult.issues as string[]).length > 0 && (
                            <ul className="text-xs text-slate-400 list-disc pl-4">
                                {(scanResult.issues as string[]).map((issue, i) => (
                                    <li key={i}>{issue}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Modal>
            )}

            {complianceReportOpen && (
                <Modal
                    isOpen={complianceReportOpen}
                    onClose={() => setComplianceReportOpen(false)}
                    title="Compliance report"
                    size="md"
                >
                    <div className="space-y-4 text-sm text-slate-300">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Generated from current security policies</p>
                        <ul className="space-y-2">
                            <li>MFA: {securityPolicies.mfaEnabled ? 'Enabled' : 'Disabled'}</li>
                            <li>Password complexity: {securityPolicies.passwordComplexity ? 'Required' : 'Optional'}</li>
                            <li>Session timeout: {securityPolicies.sessionTimeoutEnabled ? 'Enabled' : 'Disabled'} ({securityPolicies.sessionTimeoutMinutes} min)</li>
                            <li>Password expiry: {securityPolicies.passwordExpiryDays} days</li>
                            <li>Max login attempts: {securityPolicies.maxLoginAttempts}</li>
                            <li>IP whitelisting: {securityPolicies.ipWhitelisting ? 'Enabled' : 'Disabled'}</li>
                            <li>VPN required: {securityPolicies.vpnRequired ? 'Yes' : 'No'}</li>
                            <li>Dormant account suspension: {securityPolicies.dormantAccountSuspension ? 'Enabled' : 'Disabled'}</li>
                            <li>SSO: {securityPolicies.ssoEnabled ? 'Enabled' : 'Disabled'}</li>
                        </ul>
                    </div>
                </Modal>
            )}
        </div>
    );
};

const PolicyToggle: React.FC<{ label: string; policyKey?: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => {
    return (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!value)}
                className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline focus:ring-2 focus:ring-blue-500",
                    value ? "bg-emerald-600" : "bg-white/10"
                )}
                aria-pressed={value}
                aria-label={`${label}: ${value ? 'enabled' : 'disabled'}`}
            >
                <span
                    className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300",
                        value ? "translate-x-6" : "translate-x-1"
                    )}
                />
            </button>
        </div>
    );
};

const SecurityEvent: React.FC<{ type: 'warning' | 'info' | 'success'; title: string; message: string; time: string }> = ({ type, title, message, time }) => (
    <div className="flex items-center justify-between p-4 rounded-md border border-white/5 hover:bg-white/5 transition-colors group">
        <div className="flex items-center gap-3">
            <div className={cn(
                "w-10 h-10 rounded-md flex items-center justify-center border shrink-0",
                type === 'warning' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                type === 'info' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            )}>
                <i className={cn("fas text-sm", type === 'warning' ? "fa-exclamation-triangle" : type === 'info' ? "fa-info-circle" : "fa-shield-alt")} aria-hidden="true" />
            </div>
            <div>
                <div className="text-sm font-black text-white uppercase tracking-wider group-hover:text-blue-400 transition-colors">{title}</div>
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-tight line-clamp-1">{message}</div>
            </div>
        </div>
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{time}</span>
    </div>
);
