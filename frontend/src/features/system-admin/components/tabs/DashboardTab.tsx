import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import { cn } from '../../../../utils/cn';

export const DashboardTab: React.FC = () => {
    const {
        systemMetrics,
        systemAlerts,
        recentActivity,
        showSuccess
    } = useSystemAdminContext();

    const getSeverityBadgeClass = (severity: string) => {
        switch (severity) {
            case 'high': return 'text-red-300 bg-red-500/20 border-red-500/30';
            case 'medium': return 'text-amber-300 bg-amber-500/20 border-amber-500/30';
            case 'low': return 'text-green-300 bg-green-500/20 border-green-500/30';
            default: return 'text-slate-300 bg-slate-500/20 border-slate-500/30';
        }
    };

    return (
        <div className="space-y-8">
            {/* System Alerts Banner */}
            {systemAlerts.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-md shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full -mr-32 -mt-32 group-hover:bg-amber-500/20 transition-all duration-500"></div>
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30 shadow-inner">
                                <i className="fas fa-exclamation-triangle text-amber-500 animate-pulse text-xl"></i>
                            </div>
                            <div>
                                <h4 className="text-amber-100 font-black tracking-tight uppercase text-sm">Active System Anomalies</h4>
                                <p className="text-amber-200/60 text-xs font-bold uppercase tracking-widest mt-0.5">{systemAlerts.length} Critical vectors require attention</p>
                            </div>
                        </div>
                        <Button
                            variant="glass"
                            size="sm"
                            className="text-amber-500 border-amber-500/30 hover:bg-amber-500/20 font-black uppercase text-[10px] tracking-widest px-6"
                            onClick={() => showSuccess('Entering diagnostic engine...')}
                        >
                            Execute Diagnostics
                        </Button>
                    </div>
                </div>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    icon="fa-users"
                    label="Total Users"
                    value={systemMetrics.totalUsers}
                    trend="+12% Increment"
                    detail="Active accounts in directory"
                    subDetail="Directory Sync Online"
                    color="blue"
                />
                <MetricCard
                    icon="fa-plug"
                    label="Active Integrations"
                    value={systemMetrics.activeIntegrations}
                    trend="+2 Networked"
                    detail="Operational backend nodes"
                    subDetail="API Gateways Online"
                    color="blue"
                />
                <MetricCard
                    icon="fa-heartbeat"
                    label="System Health"
                    value={`${systemMetrics.systemHealth}%`}
                    trend="Operating Nominal"
                    detail="Unified system performance"
                    subDetail="Core Engine Excellent"
                    color="green"
                />
                <MetricCard
                    icon="fa-shield-alt"
                    label="Security Score"
                    value={systemMetrics.securityScore}
                    trend="Grade A+"
                    detail="Threat mitigation status"
                    subDetail="Firewall Compliant"
                    color="green"
                />
            </div>

            {/* Resource Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ResourceCard
                    icon="fa-database"
                    label="Response Time"
                    value={systemMetrics.responseTime}
                    status="Operational"
                    detail="Database query latency"
                    subDetail="All queries optimized"
                />
                <ResourceCard
                    icon="fa-code"
                    label="Network Latency"
                    value={systemMetrics.networkLatency}
                    status="Excellent"
                    detail="Internal node transmission"
                    subDetail="All endpoints responding"
                />
                <ResourceCard
                    icon="fa-cloud-upload-alt"
                    label="Last Backup"
                    value={systemMetrics.lastBackup}
                    status="Secured"
                    detail="Automated snapshot cycle"
                    subDetail="Backup verified"
                />
                <ResourceCard
                    icon="fa-tachometer-alt"
                    label="CPU Usage"
                    value={`${systemMetrics.cpuUsage}%`}
                    status="Optimal"
                    detail="Total processor utilization"
                    subDetail="Threads balanced"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity Feed */}
                <div className="glass-card overflow-hidden border-white/5 shadow-2xl">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <h4 className="text-white font-black uppercase text-xs tracking-widest flex items-center">
                            <i className="fas fa-fingerprint mr-2 text-blue-400"></i>
                            Administrative Event Log
                        </h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                            onClick={() => showSuccess('Viewing all activity')}
                        >
                            View Audit
                        </Button>
                    </div>
                    <div className="p-6 space-y-4">
                        {recentActivity.length === 0 ? (
                            <EmptyState
                                icon="fas fa-history"
                                title="No Recent Activity"
                                description="Audit streams are currently silent. Administrative trace logs will populate here upon system interaction."
                            />
                        ) : (
                            recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-3 h-3 rounded-full shadow-sm ${activity.type === 'user_management' ? 'bg-blue-500' :
                                            activity.type === 'system' ? 'bg-green-500' :
                                                activity.type === 'security' ? 'bg-red-500' : 'bg-slate-500'
                                            }`}></div>
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold group-hover:text-blue-400 transition-colors">{activity.user}</span>
                                            <span className="text-slate-400 text-sm">{activity.action}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs font-mono text-slate-500 bg-black/20 px-2 py-1 rounded-md">{activity.timestamp}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Alerts Feed */}
                <div className="glass-card overflow-hidden border-white/5 shadow-2xl">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <h4 className="text-white font-black uppercase text-xs tracking-widest flex items-center">
                            <i className="fas fa-bell mr-2 text-amber-400"></i>
                            Security Notifications
                        </h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                            onClick={() => showSuccess('Clearing notification buffer')}
                        >
                            Clear Buffer
                        </Button>
                    </div>
                    <div className="p-6 space-y-4">
                        {systemAlerts.length === 0 ? (
                            <EmptyState
                                icon="fas fa-shield-alt"
                                title="All Systems Nominal"
                                description="Security perimeter intact. No anomaly vectors detected within the current diagnostic window."
                            />
                        ) : (
                            systemAlerts.map((alert) => (
                                <div key={alert.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                                    <div className="flex items-center space-x-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110",
                                            getSeverityBadgeClass(alert.severity)
                                        )}>
                                            <i className={cn(
                                                "fas",
                                                alert.type === 'warning' ? 'fa-exclamation-triangle' :
                                                    alert.type === 'info' ? 'fa-info-circle' : 'fa-check-circle'
                                            )}></i>
                                        </div>
                                        <div>
                                            <div className="text-white font-bold group-hover:text-amber-400 transition-colors">{alert.title}</div>
                                            <div className="text-slate-400 text-xs">{alert.message}</div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{alert.timestamp}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard: React.FC<{
    icon: string;
    label: string;
    value: string | number;
    trend: string;
    detail: string;
    subDetail: string;
    color: 'blue' | 'green';
}> = ({ icon, label, value, trend, detail, subDetail, color }) => (
    <div className="glass-card p-6 flex flex-col h-full hover:border-[#2563eb]/30 transition-all duration-300 group">
        <div className="flex items-start justify-between mb-6">
            <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300",
                color === 'blue' ? "bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-500/20" : "bg-gradient-to-br from-emerald-500 to-green-700 shadow-emerald-500/20"
            )}>
                <i className={`fas ${icon} text-white text-xl`}></i>
            </div>
            <span className={cn(
                "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm",
                trend.includes('+') || trend.includes('Online') || trend.includes('Excellent') || trend.includes('Compliant')
                    ? "text-green-400 bg-green-500/10 border-green-500/20"
                    : "text-slate-400 bg-white/5 border-white/10"
            )}>{trend}</span>
        </div>
        <div>
            <div className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</div>
            <div className="text-slate-400 text-sm font-bold uppercase tracking-wider">{label}</div>
            <div className="text-slate-500 text-xs mt-2 font-medium">{detail}</div>
        </div>
        <div className={cn(
            "mt-auto pt-4 flex items-center text-[10px] font-bold uppercase tracking-widest",
            color === 'blue' ? "text-blue-400" : "text-emerald-400"
        )}>
            <i className={cn("fas mr-2", color === 'blue' ? "fa-arrow-up" : "fa-check-circle")}></i>
            <span>{subDetail}</span>
        </div>
    </div>
);

const ResourceCard: React.FC<{
    icon: string;
    label: string;
    value: string;
    status: string;
    detail: string;
    subDetail: string;
}> = ({ icon, label, value, status, detail, subDetail }) => (
    <div className="glass-card p-6 flex flex-col h-full hover:border-emerald-500/30 transition-all duration-300 group">
        <div className="flex items-start justify-between mb-6">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <i className={`fas ${icon} text-slate-300 text-xl`}></i>
            </div>
            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-sm">{status}</span>
        </div>
        <div>
            <div className="text-2xl font-bold text-white mb-1 tracking-tight">{value}</div>
            <div className="text-slate-400 text-sm font-bold uppercase tracking-wider">{label}</div>
            <div className="text-slate-500 text-xs mt-2 font-medium">{detail}</div>
        </div>
        <div className="mt-auto pt-4 flex items-center text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            <i className="fas fa-microchip mr-2 opacity-50"></i>
            <span>{subDetail}</span>
        </div>
    </div>
);
