import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { cn } from '../../../../utils/cn';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const DashboardTab: React.FC = () => {
    const {
        incidents,
        loading,
        refreshIncidents,
        setSelectedIncident,
        setSelectedIncident: openDetailsModal, // Using as alias for now
        setShowCreateModal,
        lastSynced
    } = useIncidentLogContext();

    const metrics = {
        total: incidents.length,
        active: incidents.filter(i => i.status === 'open' || i.status === 'investigating').length,
        investigating: incidents.filter(i => i.status === 'investigating').length,
        resolved: incidents.filter(i => i.status === 'resolved').length,
        pendingReview: incidents.filter(i => i.status === 'pending_review').length
    };

    const getSeverityBadgeClass = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'text-red-300 bg-red-500/20 border border-red-500/30';
            case 'high': return 'text-orange-300 bg-orange-500/20 border border-orange-500/30';
            case 'medium': return 'text-yellow-300 bg-yellow-500/20 border border-yellow-500/30';
            case 'low': return 'text-blue-300 bg-blue-500/20 border border-blue-500/30';
            default: return 'text-slate-300 bg-slate-500/20 border border-slate-500/30';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending_review': return 'text-amber-300 bg-amber-500/20 border border-amber-500/30';
            case 'open':
            case 'active': return 'text-red-300 bg-red-500/20 border border-red-500/30';
            case 'investigating': return 'text-blue-300 bg-blue-500/20 border border-blue-500/30';
            case 'resolved': return 'text-green-300 bg-green-500/20 border border-green-500/30';
            case 'closed':
            case 'escalated': return 'text-orange-300 bg-orange-500/20 border border-orange-500/30';
            default: return 'text-slate-300 bg-slate-500/20 border border-slate-500/30';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'theft':
            case 'security breach': return 'fas fa-shield-alt';
            case 'fire':
            case 'fire safety': return 'fas fa-fire';
            case 'medical':
            case 'guest safety': return 'fas fa-user-shield';
            case 'flood':
            case 'facility maintenance': return 'fas fa-tools';
            case 'guest_complaint':
            case 'guest relations': return 'fas fa-comments';
            default: return 'fas fa-exclamation-triangle';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Incident Log</p>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Dashboard Overview</h2>
                    <p className="text-[11px] text-[color:var(--text-sub)]">
                        Live incident metrics and recent activity.
                        {lastSynced && (
                            <span className="ml-2 text-[9px] text-slate-500">
                                Last synced: {lastSynced.toLocaleTimeString()}
                            </span>
                        )}
                    </p>
                </div>
            </div>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <Card className="glass-card border border-white/5 shadow-2xl group">
                    <CardContent className="pt-6 px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mt-2 group-hover:scale-110 transition-transform">
                                <i className="fas fa-list-alt text-white text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Incidents</p>
                            <h3 className="text-3xl font-black text-white">{metrics.total}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">All logged incidents</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border border-white/5 shadow-2xl group">
                    <CardContent className="pt-6 px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mt-2 group-hover:scale-110 transition-transform">
                                <i className="fas fa-exclamation-triangle text-white text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active Incidents</p>
                            <h3 className="text-3xl font-black text-white">{metrics.active}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Open or investigating</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border border-white/5 shadow-2xl group">
                    <CardContent className="pt-6 px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mt-2 group-hover:scale-110 transition-transform">
                                <i className="fas fa-search text-white text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Under Investigation</p>
                            <h3 className="text-3xl font-black text-white">{metrics.investigating}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Cases in progress</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border border-white/5 shadow-2xl group">
                    <CardContent className="pt-6 px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mt-2 group-hover:scale-110 transition-transform">
                                <i className="fas fa-check-circle text-white text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Resolved Incidents</p>
                            <h3 className="text-3xl font-black text-white">{metrics.resolved}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Marked resolved</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border border-white/5 shadow-2xl group">
                    <CardContent className="pt-6 px-6 pb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500/80 to-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/5 mt-2 group-hover:scale-110 transition-transform">
                                <i className="fas fa-inbox text-white text-xl" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pending Review</p>
                            <h3 className="text-3xl font-black text-white">{metrics.pendingReview}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-400">Awaiting approval</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* System Integrations */}
            <Card className="glass-card border border-white/5 shadow-2xl mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-2 shadow-2xl border border-white/5">
                            <i className="fas fa-plug text-white" />
                        </div>
                        <span className="uppercase tracking-tight">System Integrations</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        icon="fas fa-plug"
                        title="Integration Status Unavailable"
                        description="Connect integrations to display live system status."
                        className="bg-black/20 border-dashed border-2 border-white/5"
                    />
                </CardContent>
            </Card>

            {/* Recent Incidents List */}
            <Card className="glass-card border border-white/5 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-2 shadow-2xl border border-white/5">
                            <i className="fas fa-list-alt text-white" />
                        </div>
                        <span className="uppercase tracking-tight">Recent Incidents</span>
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => refreshIncidents()} disabled={loading.incidents} className="border-white/5 text-slate-300 hover:bg-white/5 hover:text-white">
                        <i className={cn("fas fa-sync-alt mr-2", loading.incidents && "animate-spin")} />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {incidents.length === 0 ? (
                            <EmptyState
                                icon="fas fa-shield-alt"
                                title="No Recent Incidents"
                                description="There are no recent incidents to display."
                                className="bg-black/20 border-dashed border-2 border-white/5"
                            />
                        ) : (
                            incidents.slice(0, 5).map((incident) => (
                                <div
                                    key={incident.incident_id}
                                    className="p-4 border border-white/5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors bg-white/5"
                                    onClick={() => setSelectedIncident(incident)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <i className={cn(getTypeIcon(incident.incident_type), "text-slate-400")} />
                                                <h4 className="font-bold text-white uppercase tracking-wide text-sm">{incident.title}</h4>
                                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${getSeverityBadgeClass(incident.severity)}`}>
                                                    {incident.severity}
                                                </span>
                                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${getStatusBadgeClass(incident.status)}`}>
                                                    {incident.status}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-sm mb-2">{incident.description}</p>
                                            <div className="flex items-center space-x-4 text-xs text-slate-500 font-medium">
                                                <span><i className="fas fa-map-marker-alt mr-1" />{typeof incident.location === 'string' ? incident.location : incident.location?.area || 'Unknown'}</span>
                                                <span><i className="fas fa-clock mr-1" />{incident.created_at}</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/10">
                                            <i className="fas fa-chevron-right" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardTab;


