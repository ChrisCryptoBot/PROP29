import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { usePatrolContext } from '../../context/PatrolContext';
import { useGlobalRefresh } from '../../../../contexts/GlobalRefreshContext';
import { showLoading, showSuccess, showError, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../../utils/toast';
import { retryWithBackoff } from '../../../../utils/retryWithBackoff';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';
import { useDataStaleness } from '../../hooks/useDataStaleness';

interface OverviewTabProps {
    setActiveTab: (tab: string) => void;
}

function formatRefreshedAgo(d: Date | null): string {
    if (!d) return '';
    const now = Date.now();
    const sec = Math.floor((now - d.getTime()) / 1000);
    if (sec < 60) return 'Just now';
    if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ setActiveTab }) => {
    const {
        metrics,
        emergencyStatus,
        weather,
        alerts,
        schedule,
        routes,
        officers,
        setAlerts,
        selectedPropertyTimezone,
        lastSyncTimestamp,
        settings
    } = usePatrolContext();
    const { lastRefreshedAt } = useGlobalRefresh();
    const weatherEnabled = weather && weather.condition && weather.condition !== 'Unknown';
    
    // Data staleness detection
    const stalenessInfo = useDataStaleness(lastSyncTimestamp, settings);

    const formatDateKey = (date: Date, timeZone?: string) => {
        if (!timeZone) {
            return date.toISOString().split('T')[0];
        }
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(date);
        const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
        return `${get('year')}-${get('month')}-${get('day')}`;
    };

    return (
        <div className="space-y-6" role="main" aria-label="Patrol Command Center Overview">
            {/* Data Staleness Warning Banner */}
            {stalenessInfo.shouldWarn && (
                <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <i className="fas fa-exclamation-triangle text-amber-400 text-lg" />
                            <div>
                                <p className="text-sm font-black text-amber-400 uppercase tracking-widest">
                                    Stale Data Warning
                                </p>
                                <p className="text-xs text-amber-300 mt-1">
                                    Data last synced {stalenessInfo.stalenessMessage}. Some information may be outdated.
                                    {stalenessInfo.stalenessMinutes > 15 && ' This may indicate a connectivity issue.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="page-title">Overview</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Live patrol operations overview
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {lastRefreshedAt && (
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest" aria-live="polite">
                            Data as of {lastRefreshedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Refreshed {formatRefreshedAgo(lastRefreshedAt)}
                        </p>
                    )}
                    {lastSyncTimestamp && (
                        <div className="flex items-center gap-2">
                            <p className={`text-[10px] font-mono uppercase tracking-widest ${stalenessInfo.isStale ? 'text-amber-400' : 'text-slate-500'}`} aria-live="polite">
                                Last sync: {lastSyncTimestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                {stalenessInfo.isStale && ` (${stalenessInfo.stalenessMessage})`}
                            </p>
                            {stalenessInfo.shouldWarn && (
                                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                                    STALE DATA
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Metrics bar (gold standard — no KPI card grid) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Patrol metrics">
                <span>Active Patrols <strong className="font-black text-white">{metrics.activePatrols}</strong></span>
                <span className="text-white/30" aria-hidden>|</span>
                <span>On Duty <strong className="font-black text-white">{metrics.onDutyOfficers}</strong><span className="text-white/50">/ {metrics.totalOfficers || 0}</span></span>
                <span className="text-white/30" aria-hidden>|</span>
                <span>Active Routes <strong className="font-black text-white">{metrics.activeRoutes}</strong></span>
                <span className="text-white/30" aria-hidden>|</span>
                <span>Completion <strong className="font-black text-white">{metrics.checkpointCompletionRate ?? 0}%</strong></span>
                <span className="text-white/30" aria-hidden>|</span>
                <span>Total Patrols <strong className="font-black text-white">{metrics.totalPatrols}</strong></span>
                <span className="text-white/30" aria-hidden>|</span>
                <span>Completed <strong className="font-black text-white">{metrics.completedPatrols}</strong></span>
                <span className="text-white/30" aria-hidden>|</span>
                <span>Avg Efficiency <strong className="font-black text-white">{Math.round(metrics.averageEfficiencyScore)}%</strong></span>
                <span className="text-white/30" aria-hidden>|</span>
                <span>Avg Duration <strong className="font-black text-white">{Math.round(metrics.averagePatrolDurationMinutes)} min</strong></span>
            </div>

            {/* KPI Summary */}
            <Card className="bg-slate-900/50 border border-white/5 ">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center text-white">
                        <div className="w-10 h-10 bg-indigo-900/80 rounded-md flex items-center justify-center mr-3 border border-white/5">
                            <i className="fas fa-chart-line text-white" aria-hidden></i>
                        </div>
                        <span className="card-title-text">Operational KPIs</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-md bg-slate-900/30 border border-white/5">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Patrols</div>
                            <div className="text-2xl font-black text-white mt-2">{metrics.totalPatrols}</div>
                        </div>
                        <div className="p-4 rounded-md bg-slate-900/30 border border-white/5">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Completed Patrols</div>
                            <div className="text-2xl font-black text-white mt-2">{metrics.completedPatrols}</div>
                        </div>
                        <div className="p-4 rounded-md bg-slate-900/30 border border-white/5">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Avg Efficiency</div>
                            <div className="text-2xl font-black text-emerald-400 mt-2">{Math.round(metrics.averageEfficiencyScore)}%</div>
                        </div>
                        <div className="p-4 rounded-md bg-slate-900/30 border border-white/5">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Avg Duration</div>
                            <div className="text-2xl font-black text-white mt-2">{Math.round(metrics.averagePatrolDurationMinutes)} min</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Enhanced Dashboard Components */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Emergency Status & Weather */}
                <div className="space-y-4">
                    {/* Alert Center - Merged Emergency Status & Alerts */}
                    <Card className="bg-slate-900/50 border border-white/5 ">
                        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center text-white">
                                    <div className="w-10 h-10 bg-slate-800 rounded-md flex items-center justify-center mr-3 border border-white/5">
                                        <i className="fas fa-bell text-white" aria-hidden></i>
                                    </div>
                                    <span className="card-title-text">Alert Center</span>
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-black tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full uppercase">
                                    {(alerts || []).filter(alert => alert && !alert.isRead).length} unread
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {/* Emergency Status Level */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                                <div>
                                    <div className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${emergencyStatus.level === 'normal' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ' :
                                        emergencyStatus.level === 'elevated' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 ' :
                                            emergencyStatus.level === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 ' :
                                                'bg-red-500/10 text-red-400 border border-red-500/20 '
                                        }`}>
                                        {emergencyStatus.level.toUpperCase()}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1 font-mono">{emergencyStatus.lastUpdated}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-white font-bold">{emergencyStatus.message}</p>
                                    {emergencyStatus.activeAlerts > 0 && (
                                        <div className="flex items-center justify-end text-red-400 text-[10px] mt-1 font-black uppercase tracking-widest">
                                            <i className="fas fa-exclamation-triangle mr-1"></i>
                                            {emergencyStatus.activeAlerts} active
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Low completion rate alert */}
                            {metrics.activePatrols > 0 && (metrics.checkpointCompletionRate ?? 0) < 50 && (
                                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                        Low checkpoint completion — {metrics.checkpointCompletionRate ?? 0}% complete with {metrics.activePatrols} active patrol(s). Consider following up.
                                    </p>
                                </div>
                            )}

                            {/* System Status Indicators */}
                            <div className="mb-4 pb-4 border-b border-white/5">
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">System Health</h4>
                                <div className="space-y-2 text-[10px]">
                                    {(officers?.length ?? 0) > 0 && (() => {
                                        const withStatus = (officers || []).filter(o => o.connection_status);
                                        const online = withStatus.filter(o => o.connection_status === 'online').length;
                                        const offline = withStatus.filter(o => o.connection_status === 'offline').length;
                                        const unknown = withStatus.filter(o => o.connection_status === 'unknown').length;
                                        return withStatus.length > 0 ? (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-400">Officer devices:</span>
                                                    <span className="text-white font-mono">
                                                        <span className="text-emerald-400">📡 {online} online</span>
                                                        {offline > 0 && <span className="text-amber-400 ml-2">⚠ {offline} offline</span>}
                                                        {unknown > 0 && <span className="text-slate-500 ml-2">? {unknown} unknown</span>}
                                                    </span>
                                                </div>
                                                {offline > 0 && (
                                                    <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                                                            {offline} device{offline !== 1 ? 's' : ''} offline — check hardware connections
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Officer devices:</span>
                                                <span className="text-slate-500">— No device data</span>
                                            </div>
                                        );
                                    })()}
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">GPS Satellite Tracking:</span>
                                        <div className="flex items-center">
                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2" />
                                            <span className="text-emerald-400 font-bold uppercase tracking-widest">Operational</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Radio Mesh Network:</span>
                                        <div className="flex items-center">
                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2" />
                                            <span className="text-emerald-400 font-bold uppercase tracking-widest">Active</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Emergency Backup Power:</span>
                                        <div className="flex items-center">
                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2" />
                                            <span className="text-emerald-400 font-bold uppercase tracking-widest">Ready</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Alerts List */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Security Alerts</h4>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                    {alerts && alerts.length > 0 ? (
                                        (alerts || []).slice(0, 3).map((alert) => {
                                            if (!alert) return null;
                                            let alertDate: Date;
                                            try {
                                                alertDate = new Date(alert.timestamp);
                                                if (isNaN(alertDate.getTime())) {
                                                    alertDate = new Date();
                                                }
                                            } catch {
                                                alertDate = new Date();
                                            }
                                            return (
                                                <div key={alert.id} className="flex items-start justify-between p-2 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs ${alert.isRead ? 'text-slate-500' : 'text-white font-bold'}`}>
                                                            {alert.message || 'No message'}
                                                        </p>
                                                        <p className="text-[10px] text-[color:var(--text-sub)] mt-1 font-mono">
                                                            {alertDate.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center space-x-2 ml-2">
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${alert.severity === 'critical'
                                                            ? 'text-red-300 bg-red-900/40 border-red-500/30'
                                                            : alert.severity === 'high'
                                                                ? 'text-orange-300 bg-orange-900/40 border-orange-500/30'
                                                                : alert.severity === 'medium'
                                                                    ? 'text-yellow-300 bg-yellow-900/40 border-yellow-500/30'
                                                                    : 'text-blue-300 bg-blue-900/40 border-blue-500/30'
                                                            }`}>
                                                            {alert.severity || 'low'}
                                                        </span>
                                                        {!alert.isRead && (
                                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-[color:var(--text-sub)] text-center py-2 italic opacity-60">No alerts at this time</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Weather Widget — hidden when disabled or no data */}
                    {weatherEnabled && (
                    <Card className="bg-slate-900/50 border border-white/5 ">
                        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                            <CardTitle className="flex items-center text-white">
                                <div className="w-10 h-10 bg-slate-800 rounded-md flex items-center justify-center mr-3 border border-white/5">
                                    <i className="fas fa-cloud-sun text-white" aria-hidden></i>
                                </div>
                                <span className="card-title-text">Weather Overview</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-3xl font-black text-white">{weather.temperature}°F</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{weather.condition}</div>
                            </div>
                            <div className="space-y-2 text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                <div className="flex justify-between">
                                    <span>Wind Speed</span>
                                    <span className="text-white font-mono">{weather.windSpeed} mph</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Visibility</span>
                                    <span className="text-white font-mono">{weather.visibility}</span>
                                </div>
                            </div>
                            <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                                <p className="text-xs text-blue-300 font-medium">
                                    <i className="fas fa-info-circle mr-1"></i>
                                    {weather.patrolRecommendation}
                                </p>
                            </div>

                            {/* Patrol Management Recommendations */}
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Patrol Recommendations</h4>
                                <div className="space-y-3 text-[10px] font-black uppercase tracking-widest">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Outdoor Patrol</span>
                                        <span className={`${weather.temperature > 60 && weather.temperature < 85 ? 'text-emerald-400' : 'text-amber-400'
                                            }`}>
                                            {weather.temperature > 60 && weather.temperature < 85 ? 'Optimal' : 'Caution'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Visibility</span>
                                        <span className={`${weather.visibility === 'Good' ? 'text-emerald-400' : 'text-amber-400'
                                            }`}>
                                            {weather.visibility}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Wind Conditions</span>
                                        <span className={`${weather.windSpeed < 15 ? 'text-emerald-400' : 'text-amber-400'
                                            }`}>
                                            {weather.windSpeed < 15 ? 'Nominal' : 'Moderate'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    )}
                </div>

                {/* Calendar & Schedule */}
                <div className="lg:col-span-2">
                    <Card className="bg-slate-900/50 border border-white/5 ">
                        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center text-white">
                                    <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                                        <i className="fas fa-calendar-alt text-white"></i>
                                    </div>
                                    <span className="card-title-text">Patrol Schedule</span>
                                </span>
                                <div className="flex items-center space-x-2">
                                    <span className="px-2 py-0.5 text-[10px] font-black tracking-widest text-slate-400 bg-white/5 border border-white/5 rounded uppercase">
                                        {(schedule || []).filter(item => {
                                            if (!item || !item.date) return false;
                                            const today = formatDateKey(new Date(), selectedPropertyTimezone);
                                            return item.date === today;
                                        }).length} today
                                    </span>
                                    <span className="px-2 py-0.5 text-[10px] font-black tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded uppercase">
                                        {(schedule || []).filter(item => item && item.status === 'in-progress').length} active
                                    </span>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                {schedule && schedule.length > 0 ? (
                                    (() => {
                                        const today = formatDateKey(new Date(), selectedPropertyTimezone);
                                        const todaySchedule = (schedule || []).filter(item => item && item.date === today);
                                        return todaySchedule.length > 0 ? (
                                            todaySchedule.map((item) => (
                                                <div className="flex items-center justify-between p-3 border border-white/5 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors group/item">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' :
                                                            item.status === 'in-progress' ? 'bg-indigo-500 animate-pulse' :
                                                                item.status === 'scheduled' ? 'bg-amber-500' :
                                                                    'bg-slate-500'
                                                            }`}></div>
                                                        <div>
                                                            <h4 className="font-bold text-white text-[10px] uppercase tracking-widest">{item.title || 'Untitled Patrol'}</h4>
                                                            <p className="text-[10px] text-[color:var(--text-sub)] mt-0.5 font-bold uppercase tracking-widest italic">
                                                                {item.route || 'No route'} <span className="mx-1 text-slate-700">•</span> <span className="text-indigo-400">{item.assignedOfficer || 'Unassigned'}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${item.priority === 'critical' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                                                                item.priority === 'high' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                                                                    item.priority === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                                                        'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                                                            }`}>
                                                            {item.priority || 'medium'}
                                                        </div>
                                                        <div className="text-right text-[10px] font-mono text-slate-500">
                                                            <div className="text-white font-black">{item.time || 'N/A'}</div>
                                                            <div className="opacity-50 text-[9px] font-bold">{item.duration || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <EmptyState
                                                icon="fas fa-calendar-times"
                                                title="No patrols scheduled for today"
                                                description="Schedule patrols to see them here"
                                            />
                                        );
                                    })()
                                ) : (
                                    <EmptyState
                                        icon="fas fa-calendar-times"
                                        title="No schedule data available"
                                        description="Schedule data will appear here once available"
                                    />
                                )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 rounded-md bg-slate-900/30 border border-white/5">
                                        <div className="text-2xl font-black text-white">
                                            {(schedule || []).filter(item => {
                                                if (!item || !item.date) return false;
                                                const tomorrow = new Date();
                                                tomorrow.setDate(tomorrow.getDate() + 1);
                                                const tomorrowStr = formatDateKey(tomorrow, selectedPropertyTimezone);
                                                return item.date === tomorrowStr;
                                            }).length}
                                        </div>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Tomorrow's Load</div>
                                    </div>
                                    <div className="text-center p-4 rounded-md bg-slate-900/30 border border-white/5">
                                        <div className="text-2xl font-black text-white">
                                            {(schedule || []).filter(item => {
                                                if (!item) return false;
                                                const today = formatDateKey(new Date(), selectedPropertyTimezone);
                                                return item.status === 'completed' && item.date === today;
                                            }).length}
                                        </div>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Completed (24H)</div>
                                    </div>
                                </div>
                            </div>

                            {/* Average Route Performance Metric */}
                            {routes && routes.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-sub)]">Average Route Performance:</span>
                                        <span className="text-lg font-black text-green-400">
                                            {routes.length > 0
                                                ? Math.round(
                                                    routes.reduce((sum, r) => sum + (r.performanceScore ?? 0), 0) / routes.length
                                                )
                                                : 0}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>


            {/* Quick Link to Officer Deployment */}
            <Card className="bg-slate-900/50 border border-white/5 ">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center text-white">
                            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                                <i className="fas fa-users text-white"></i>
                            </div>
                            <span className="card-title-text">Patrol Force Management</span>
                        </span>
                        <Button
                            variant="glass"
                            size="sm"
                            className="border-white/5 hover:border-blue-500/30 h-8"
                            onClick={() => setActiveTab('deployment')}
                        >
                            View All Officers →
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="text-center px-6 py-3 bg-slate-900/30 border border-white/5 rounded-md">
                                <div className="text-2xl font-black text-white">{(officers || []).filter(o => o && o.status === 'on-duty').length}</div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active Duty</div>
                            </div>
                            <div className="text-center px-6 py-3 bg-slate-900/30 border border-white/5 rounded-md">
                                <div className="text-2xl font-black text-white">{(officers || []).length}</div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Force Total</div>
                            </div>
                        </div>
                        <Button
                            variant="glass"
                            className="w-full md:w-auto border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 h-10 px-8"
                            onClick={() => setActiveTab('deployment')}
                        >
                            <i className="fas fa-user-shield mr-2"></i>
                            Open Officer Roster
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
