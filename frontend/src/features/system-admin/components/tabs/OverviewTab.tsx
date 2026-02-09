import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import { cn } from '../../../../utils/cn';

export const OverviewTab: React.FC = () => {
    const {
        systemMetrics,
        systemAlerts,
        recentActivity,
        showSuccess,
        refreshData,
        setActiveTab,
        clearAlerts
    } = useSystemAdminContext();

    const handleRunDiagnostics = () => {
        refreshData().then(() => showSuccess('System check complete')).catch(() => {});
    };

    const handleViewAudit = () => setActiveTab('audit');

    const handleClearBuffer = () => {
        clearAlerts();
        showSuccess('Notification buffer cleared');
    };

    const getSeverityBadgeClass = (severity: string) => {
        switch (severity) {
            case 'high': return 'text-red-300 bg-red-500/20 border-red-500/30';
            case 'medium': return 'text-amber-300 bg-amber-500/20 border-amber-500/30';
            case 'low': return 'text-green-300 bg-green-500/20 border-green-500/30';
            default: return 'text-slate-300 bg-slate-500/20 border-slate-500/30';
        }
    };

    return (
        <div className="space-y-6" role="main" aria-label="System Admin Overview">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="page-title">Overview</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        System metrics and activity
                    </p>
                </div>
            </div>

            {/* System Alerts Banner */}
            {systemAlerts.length > 0 && (
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-md p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-600 rounded-md flex items-center justify-center border border-white/5">
                                <i className="fas fa-exclamation-triangle text-white text-lg" aria-hidden="true" />
                            </div>
                            <div>
                                <h4 className="text-amber-100 font-black uppercase tracking-tight text-sm">Active System Anomalies</h4>
                                <p className="text-amber-200/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">{systemAlerts.length} items need attention</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-400 border-amber-500/30 hover:bg-amber-500/20 font-black uppercase text-[10px] tracking-widest px-6"
                            onClick={handleRunDiagnostics}
                        >
                            Run diagnostics
                        </Button>
                    </div>
                </div>
            )}

            {/* Compact metrics bar (gold standard — no KPI cards) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="System metrics">
                <span>Users <strong className="font-black text-white">{systemMetrics.totalUsers}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Integrations <strong className="font-black text-white">{systemMetrics.activeIntegrations}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Health <strong className="font-black text-white">{systemMetrics.systemHealth}%</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Security <strong className="font-black text-white">{systemMetrics.securityScore}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Response <strong className="font-black text-white">{systemMetrics.responseTime}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>CPU <strong className="font-black text-white">{systemMetrics.cpuUsage}%</strong></span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <section aria-labelledby="recent-activity-heading">
                    <h3 id="recent-activity-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5 mr-3" aria-hidden="true">
                            <i className="fas fa-fingerprint text-white" />
                        </div>
                        Recent Activity
                    </h3>
                    <div className="rounded-md border border-white/5 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Recent Activity</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                                onClick={handleViewAudit}
                            >
                                View Audit
                            </Button>
                        </div>
                        <div className="p-4 space-y-3">
                            {recentActivity.length === 0 ? (
                                <EmptyState
                                    icon="fas fa-history"
                                    title="No Recent Activity"
                                    description="No recent activity to display. Activity will appear here as users interact with the system."
                                />
                            ) : (
                                recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-4 rounded-md border border-white/5 hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full shrink-0 ${activity.type === 'user_management' ? 'bg-blue-500' :
                                                activity.type === 'system' ? 'bg-green-500' :
                                                activity.type === 'security' ? 'bg-red-500' : 'bg-slate-500'
                                            }`} aria-hidden="true" />
                                            <div>
                                                <span className="text-white font-black text-sm">{activity.user}</span>
                                                <span className="text-slate-400 text-xs block">{activity.action}</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-500">{activity.timestamp}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* Security Notifications */}
                <section aria-labelledby="security-notifications-heading">
                    <h3 id="security-notifications-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5 mr-3" aria-hidden="true">
                            <i className="fas fa-bell text-white" />
                        </div>
                        Security Notifications
                    </h3>
                    <div className="rounded-md border border-white/5 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Alerts</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                                onClick={handleClearBuffer}
                            >
                                Clear Buffer
                            </Button>
                        </div>
                        <div className="p-4 space-y-3">
                            {systemAlerts.length === 0 ? (
                                <EmptyState
                                    icon="fas fa-shield-alt"
                                    title="All Systems Nominal"
                                    description="Security perimeter intact. No anomaly vectors detected within the current diagnostic window."
                                />
                            ) : (
                                systemAlerts.map((alert) => (
                                    <div key={alert.id} className="flex items-center justify-between p-4 rounded-md border border-white/5 hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-md flex items-center justify-center border shrink-0",
                                                getSeverityBadgeClass(alert.severity)
                                            )}>
                                                <i className={cn(
                                                    "fas text-sm",
                                                    alert.type === 'warning' ? 'fa-exclamation-triangle' :
                                                    alert.type === 'info' ? 'fa-info-circle' : 'fa-check-circle'
                                                )} aria-hidden="true" />
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-sm group-hover:text-amber-400 transition-colors">{alert.title}</div>
                                                <div className="text-slate-400 text-xs">{alert.message}</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{alert.timestamp}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
