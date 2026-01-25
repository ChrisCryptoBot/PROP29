import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { cn } from '../../../../utils/cn';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { AgentTrustLevel } from '../../types/incident-log.types';
import AgentPerformanceModal from '../modals/AgentPerformanceModal';
import HardwareDeviceModal from '../modals/HardwareDeviceModal';

export const DashboardTab: React.FC = () => {
    const {
        incidents,
        loading,
        refreshIncidents,
        setSelectedIncident,
        setSelectedIncident: openDetailsModal, // Using as alias for now
        setShowCreateModal,
        lastSynced,
        modals,
        // Enhanced production readiness data
        agentPerformanceMetrics,
        hardwareDevices,
        getAgentTrustLevel,
        refreshAgentPerformance,
        refreshHardwareDevices,
        // New modal controls
        setShowAgentPerformanceModal,
        getHardwareDeviceStatus
    } = useIncidentLogContext();

    const [showHardwareModal, setShowHardwareModal] = useState(false);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<any>(null);

    const metrics = {
        total: incidents.length,
        active: incidents.filter(i => i.status === 'open' || i.status === 'investigating').length,
        investigating: incidents.filter(i => i.status === 'investigating').length,
        resolved: incidents.filter(i => i.status === 'resolved').length,
        pendingReview: incidents.filter(i => i.status === 'pending_review').length
    };

    // Enhanced metrics for production readiness
    const agentMetrics = useMemo(() => {
        const agentIncidents = incidents.filter(i => i.source === 'agent' || i.source_agent_id);
        const deviceIncidents = incidents.filter(i => i.source === 'device' || i.source_device_id);
        const managerIncidents = incidents.filter(i => i.source === 'manager' || (!i.source_agent_id && !i.source_device_id));
        
        const trustLevelCounts = agentPerformanceMetrics.reduce((acc, agent) => {
            const level = getAgentTrustLevel(agent.agent_id);
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {} as Record<AgentTrustLevel, number>);

        const avgTrustScore = agentPerformanceMetrics.length > 0 
            ? Math.round(agentPerformanceMetrics.reduce((sum, agent) => sum + agent.trust_score, 0) / agentPerformanceMetrics.length)
            : 0;

        return {
            totalAgents: agentPerformanceMetrics.length,
            activeAgents: agentPerformanceMetrics.filter(a => a.submissions_count > 0).length,
            agentSubmissions: agentIncidents.length,
            deviceSubmissions: deviceIncidents.length,
            managerSubmissions: managerIncidents.length,
            avgTrustScore,
            highTrustAgents: trustLevelCounts[AgentTrustLevel.HIGH] || 0,
            mediumTrustAgents: trustLevelCounts[AgentTrustLevel.MEDIUM] || 0,
            lowTrustAgents: trustLevelCounts[AgentTrustLevel.LOW] || 0,
            topPerformers: [...agentPerformanceMetrics]
                .sort((a, b) => b.trust_score - a.trust_score)
                .slice(0, 3),
            flaggedAgents: agentPerformanceMetrics.filter(a => getAgentTrustLevel(a.agent_id) === AgentTrustLevel.LOW).length
        };
    }, [incidents, agentPerformanceMetrics, getAgentTrustLevel]);

    const hardwareMetrics = useMemo(() => {
        const deviceIncidents = incidents.filter(i => i.source === 'device' || i.source_device_id);
        const onlineDevices = hardwareDevices.filter(d => d.status === 'online');
        const offlineDevices = hardwareDevices.filter(d => d.status === 'offline' || d.status === 'degraded');
        
        const deviceTypeBreakdown = deviceIncidents.reduce((acc, incident) => {
            let deviceType = 'unknown';
            if (incident.source_metadata && typeof incident.source_metadata === 'object' && 'device_type' in incident.source_metadata) {
                deviceType = String(incident.source_metadata.device_type);
            }
            acc[deviceType] = (acc[deviceType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalDevices: hardwareDevices.length,
            onlineDevices: onlineDevices.length,
            offlineDevices: offlineDevices.length,
            deviceIncidents: deviceIncidents.length,
            deviceTypeBreakdown,
            criticalDevices: hardwareDevices.filter(d => 
                d.issues.some(issue => issue.severity === 'critical' || issue.severity === 'error')
            ).length,
            healthyDevices: hardwareDevices.filter(d => d.health_score >= 80).length
        };
    }, [incidents, hardwareDevices]);

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
                        Live incident metrics, mobile agent performance, and hardware integration status.
                        {lastSynced && (
                            <span className="ml-2 text-[9px] text-slate-500">
                                Last synced: {lastSynced.toLocaleTimeString()}
                            </span>
                        )}
                    </p>
                </div>
                {/* PRODUCTION READINESS: Enhanced Status Indicators */}
                <div className="flex items-center space-x-3">
                    {agentMetrics.totalAgents > 0 && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded">
                            <i className="fas fa-user-shield text-blue-400 text-xs" />
                            <span className="text-[9px] text-blue-300">{agentMetrics.activeAgents} Agents</span>
                        </div>
                    )}
                    {hardwareMetrics.totalDevices > 0 && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded">
                            <i className="fas fa-microchip text-orange-400 text-xs" />
                            <span className="text-[9px] text-orange-300">{hardwareMetrics.onlineDevices}/{hardwareMetrics.totalDevices} Online</span>
                        </div>
                    )}
                    {agentMetrics.avgTrustScore > 0 && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded">
                            <i className="fas fa-shield-check text-green-400 text-xs" />
                            <span className="text-[9px] text-green-300">{agentMetrics.avgTrustScore}% Trust</span>
                        </div>
                    )}
                </div>
            </div>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

            {/* Agent Performance Overview - PRODUCTION READINESS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="glass-card border border-white/5 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center text-white">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-2 shadow-2xl border border-white/5">
                                <i className="fas fa-user-shield text-white" />
                            </div>
                            <span className="uppercase tracking-tight">Agent Performance</span>
                        </CardTitle>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => refreshAgentPerformance()} 
                            disabled={loading.agentPerformance}
                            className="border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                        >
                            <i className={cn("fas fa-sync-alt mr-1", loading.agentPerformance && "animate-spin")} />
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {agentPerformanceMetrics.length === 0 ? (
                            <EmptyState
                                icon="fas fa-user-shield"
                                title="No Agent Data Available"
                                description="Mobile agent performance metrics will appear here once agents start submitting incidents."
                                className="bg-black/20 border-dashed border-2 border-white/5"
                            />
                        ) : (
                            <div className="space-y-4">
                                {/* Agent Metrics Summary */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Agents</p>
                                                <p className="text-2xl font-black text-white">{agentMetrics.totalAgents}</p>
                                                <p className="text-[8px] text-green-400">{agentMetrics.activeAgents} active</p>
                                            </div>
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center">
                                                <i className="fas fa-users text-white text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Avg Trust Score</p>
                                                <p className="text-2xl font-black text-white">{agentMetrics.avgTrustScore}%</p>
                                                <p className={cn(
                                                    "text-[8px]",
                                                    agentMetrics.avgTrustScore >= 80 ? "text-green-400" : 
                                                    agentMetrics.avgTrustScore >= 50 ? "text-yellow-400" : "text-red-400"
                                                )}>
                                                    {agentMetrics.flaggedAgents} flagged
                                                </p>
                                            </div>
                                            <div className="w-8 h-8 bg-gradient-to-br from-green-600/80 to-slate-900 rounded-lg flex items-center justify-center">
                                                <i className="fas fa-shield-check text-white text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Trust Level Distribution */}
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Trust Level Distribution</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-green-300">{agentMetrics.highTrustAgents}</p>
                                                <p className="text-[8px] text-green-400">High Trust</p>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-yellow-300">{agentMetrics.mediumTrustAgents}</p>
                                                <p className="text-[8px] text-yellow-400">Medium Trust</p>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-red-300">{agentMetrics.lowTrustAgents}</p>
                                                <p className="text-[8px] text-red-400">Low Trust</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Performers */}
                                {agentMetrics.topPerformers.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Top Performers</p>
                                        <div className="space-y-1">
                                            {agentMetrics.topPerformers.map((agent, index) => (
                                                <div 
                                                    key={agent.agent_id} 
                                                    className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                                                    onClick={() => setShowAgentPerformanceModal(true, agent.agent_id)}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold",
                                                            index === 0 ? "bg-yellow-500/20 text-yellow-300" :
                                                            index === 1 ? "bg-slate-500/20 text-slate-300" :
                                                            "bg-orange-500/20 text-orange-300"
                                                        )}>
                                                            #{index + 1}
                                                        </div>
                                                        <span className="text-[10px] text-white font-mono">
                                                            {agent.agent_name || `Agent ${agent.agent_id.slice(0, 6)}`}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-[9px] text-green-400">{agent.trust_score}%</span>
                                                        <span className="text-[8px] text-slate-400">
                                                            {agent.approval_rate.toFixed(1)}% approval
                                                        </span>
                                                        <i className="fas fa-external-link-alt text-[8px] text-slate-400" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Hardware Sources Overview - PRODUCTION READINESS */}
                <Card className="glass-card border border-white/5 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center text-white">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-2 shadow-2xl border border-white/5">
                                <i className="fas fa-microchip text-white" />
                            </div>
                            <span className="uppercase tracking-tight">Hardware Sources</span>
                        </CardTitle>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => refreshHardwareDevices()} 
                            disabled={loading.hardwareDevices}
                            className="border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                        >
                            <i className={cn("fas fa-sync-alt mr-1", loading.hardwareDevices && "animate-spin")} />
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {hardwareDevices.length === 0 ? (
                            <EmptyState
                                icon="fas fa-microchip"
                                title="No Hardware Data Available"
                                description="Hardware device status and metrics will appear here once devices are connected."
                                className="bg-black/20 border-dashed border-2 border-white/5"
                            />
                        ) : (
                            <div className="space-y-4">
                                {/* Device Status Summary */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Connected Devices</p>
                                                <p className="text-2xl font-black text-white">{hardwareMetrics.totalDevices}</p>
                                                <p className="text-[8px] text-green-400">{hardwareMetrics.onlineDevices} online</p>
                                            </div>
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center">
                                                <i className="fas fa-server text-white text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Device Incidents</p>
                                                <p className="text-2xl font-black text-white">{hardwareMetrics.deviceIncidents}</p>
                                                <p className="text-[8px] text-blue-400">24h period</p>
                                            </div>
                                            <div className="w-8 h-8 bg-gradient-to-br from-orange-600/80 to-slate-900 rounded-lg flex items-center justify-center">
                                                <i className="fas fa-exclamation-triangle text-white text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Device Health Status */}
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Device Health Status</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-green-300">{hardwareMetrics.healthyDevices}</p>
                                                <p className="text-[8px] text-green-400">Healthy</p>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-red-300">{hardwareMetrics.offlineDevices}</p>
                                                <p className="text-[8px] text-red-400">Offline</p>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-orange-500/10 rounded border border-orange-500/20">
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-orange-300">{hardwareMetrics.criticalDevices}</p>
                                                <p className="text-[8px] text-orange-400">Critical</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Device Type Breakdown */}
                                {Object.keys(hardwareMetrics.deviceTypeBreakdown).length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Incident Sources by Device Type</p>
                                        <div className="space-y-1">
                                            {Object.entries(hardwareMetrics.deviceTypeBreakdown).map(([type, count]) => (
                                                <div 
                                                    key={type} 
                                                    className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                                                    onClick={() => {
                                                        // Find a device of this type to show
                                                        const device = hardwareDevices.find(d => d.device_type === type);
                                                        if (device) {
                                                            setSelectedDevice(device);
                                                            setSelectedDeviceId(device.device_id);
                                                            setShowHardwareModal(true);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <i className={cn(
                                                            "fas text-sm",
                                                            type === 'camera' ? "fa-video text-blue-400" :
                                                            type === 'sensor' ? "fa-thermometer-half text-green-400" :
                                                            type === 'access_control' ? "fa-key text-yellow-400" :
                                                            type === 'alarm' ? "fa-bell text-red-400" :
                                                            "fa-microchip text-slate-400"
                                                        )} />
                                                        <span className="text-[10px] text-white capitalize">
                                                            {type.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-[9px] text-slate-300 font-bold">{count}</span>
                                                        <i className="fas fa-external-link-alt text-[8px] text-slate-400" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

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
                            incidents.slice(0, 5).map((incident) => {
                                // Enhanced source detection for production readiness
                                const isAgentSubmitted = incident.source === 'agent' || incident.source_agent_id;
                                const isDeviceSubmitted = incident.source === 'device' || incident.source_device_id;
                                const isManagerSubmitted = !isAgentSubmitted && !isDeviceSubmitted;
                                
                                // Get agent trust information if agent-submitted
                                const agentTrustLevel = isAgentSubmitted && incident.source_agent_id 
                                    ? getAgentTrustLevel(incident.source_agent_id)
                                    : null;
                                
                                // Get source icon and styling
                                const getSourceIcon = () => {
                                    if (isAgentSubmitted) return { icon: 'fa-user-shield', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
                                    if (isDeviceSubmitted) return { icon: 'fa-microchip', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
                                    return { icon: 'fa-user-tie', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' };
                                };

                                const sourceStyle = getSourceIcon();
                                
                                return (
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
                                                    {/* PRODUCTION READINESS: Source Indicator */}
                                                    <span className={cn(
                                                        "px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded border",
                                                        sourceStyle.color, sourceStyle.bg, sourceStyle.border
                                                    )}>
                                                        <i className={cn("fas", sourceStyle.icon, "mr-1")} />
                                                        {isAgentSubmitted ? 'Agent' : isDeviceSubmitted ? 'Device' : 'Manager'}
                                                    </span>
                                                    {/* PRODUCTION READINESS: Agent Trust Badge */}
                                                    {agentTrustLevel && (
                                                        <span className={cn(
                                                            "px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded border",
                                                            agentTrustLevel === AgentTrustLevel.HIGH ? "text-green-300 bg-green-500/10 border-green-500/20" :
                                                            agentTrustLevel === AgentTrustLevel.MEDIUM ? "text-yellow-300 bg-yellow-500/10 border-yellow-500/20" :
                                                            agentTrustLevel === AgentTrustLevel.LOW ? "text-red-300 bg-red-500/10 border-red-500/20" :
                                                            "text-slate-300 bg-slate-500/10 border-slate-500/20"
                                                        )}>
                                                            <i className={cn(
                                                                "fas mr-1",
                                                                agentTrustLevel === AgentTrustLevel.HIGH ? "fa-shield-check" :
                                                                agentTrustLevel === AgentTrustLevel.MEDIUM ? "fa-shield-exclamation" :
                                                                agentTrustLevel === AgentTrustLevel.LOW ? "fa-shield-x" :
                                                                "fa-shield-question"
                                                            )} />
                                                            {agentTrustLevel} Trust
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-400 text-sm mb-2">{incident.description}</p>
                                                <div className="flex items-center space-x-4 text-xs text-slate-500 font-medium">
                                                    <span><i className="fas fa-map-marker-alt mr-1" />{typeof incident.location === 'string' ? incident.location : incident.location?.area || 'Unknown'}</span>
                                                    <span><i className="fas fa-clock mr-1" />{incident.created_at}</span>
                                                    {/* PRODUCTION READINESS: Show source ID if available */}
                                                    {isAgentSubmitted && incident.source_agent_id && (
                                                        <span><i className="fas fa-user-badge mr-1" />Agent: {incident.source_agent_id.slice(0, 8)}</span>
                                                    )}
                                                    {isDeviceSubmitted && incident.source_device_id && (
                                                        <span><i className="fas fa-microchip mr-1" />Device: {incident.source_device_id.slice(0, 8)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end space-y-2">
                                                {/* PRODUCTION READINESS: Manager review indicator for agent submissions */}
                                                {incident.status === 'pending_review' && isAgentSubmitted && (
                                                    <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded">
                                                        <i className="fas fa-user-shield text-amber-400 text-xs" />
                                                        <span className="text-[8px] text-amber-300 ml-1">Needs Review</span>
                                                    </div>
                                                )}
                                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/10">
                                                    <i className="fas fa-chevron-right" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Agent Performance Modal */}
            <AgentPerformanceModal
                isOpen={modals.showAgentPerformanceModal}
                onClose={() => setShowAgentPerformanceModal(false)}
                agentId={modals.selectedAgentId || undefined}
                selectedAgent={modals.selectedAgentId ? agentPerformanceMetrics.find(a => a.agent_id === modals.selectedAgentId) : undefined}
            />

            {/* Hardware Device Modal */}
            <HardwareDeviceModal
                isOpen={showHardwareModal}
                onClose={() => {
                    setShowHardwareModal(false);
                    setSelectedDevice(null);
                    setSelectedDeviceId(null);
                }}
                deviceId={selectedDeviceId || undefined}
                selectedDevice={selectedDevice}
            />
        </div>
    );
};

export default DashboardTab;


