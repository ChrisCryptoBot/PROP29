import React, { useMemo, useState } from 'react';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { Incident } from '../../types/incident-log.types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { Button } from '../../../../components/UI/Button';
import { cn } from '../../../../utils/cn';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

export const TrendsTab: React.FC = () => {
    const { 
        incidents, 
        agentPerformanceMetrics, 
        hardwareDevices,
        getAgentTrustLevel 
    } = useIncidentLogContext();
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all' | 'custom'>('30d');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [viewMode, setViewMode] = useState<'incidents' | 'sources' | 'performance'>('incidents');

    const getIncidentDate = (incident: Incident) => {
        const value = incident.created_at;
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    // Filter incidents by date range
    const filteredIncidents = useMemo(() => {
        if (dateRange === 'all') return incidents;
        
        const now = new Date();
        let startDate: Date;
        
        if (dateRange === 'custom') {
            if (!customStartDate || !customEndDate) return incidents;
            startDate = new Date(customStartDate);
            const endDate = new Date(customEndDate);
            return incidents.filter(incident => {
                const incidentDate = getIncidentDate(incident);
                if (!incidentDate) return false;
                return incidentDate >= startDate && incidentDate <= endDate;
            });
        } else {
            const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
            startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            return incidents.filter(incident => {
                const incidentDate = getIncidentDate(incident);
                if (!incidentDate) return false;
                return incidentDate >= startDate;
            });
        }
    }, [incidents, dateRange, customStartDate, customEndDate]);

    const trendData = useMemo(() => {
        const monthMap = new Map<string, { month: string; incidents: number; critical: number; high: number; medium: number; low: number; sortKey: number }>();
        incidents.forEach((incident) => {
            const date = getIncidentDate(incident);
            if (!date) return;
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const monthLabel = date.toLocaleString('default', { month: 'short' });
            const existing = monthMap.get(key) || {
                month: monthLabel,
                incidents: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                sortKey: date.getFullYear() * 12 + date.getMonth()
            };
            existing.incidents += 1;
            const severity = (incident.severity || '').toLowerCase();
            if (severity === 'critical') existing.critical += 1;
            else if (severity === 'high') existing.high += 1;
            else if (severity === 'medium') existing.medium += 1;
            else if (severity === 'low') existing.low += 1;
            monthMap.set(key, existing);
        });
        return Array.from(monthMap.values()).sort((a, b) => a.sortKey - b.sortKey);
    }, [incidents]);

    const typeDistribution = useMemo(() => {
        const typeCounts = incidents.reduce((acc: Record<string, number>, incident: Incident) => {
            const type = incident.incident_type || 'other';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(typeCounts).map(([type, count]) => ({
            type: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
            count,
            percentage: incidents.length > 0 ? Math.round((count as number / incidents.length) * 100) : 0
        })).sort((a, b) => (b.count as number) - (a.count as number));
    }, [incidents]);

    const locationHotspots = useMemo(() => {
        const locationCounts = incidents.reduce((acc: Record<string, number>, incident: Incident) => {
            const location = typeof incident.location === 'string'
                ? incident.location
                : incident.location?.area;
            if (!location) return acc;
            acc[location] = (acc[location] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(locationCounts)
            .map(([location, count]) => ({ location, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [incidents]);

    const timePatterns = useMemo(() => {
        const hourCounts = filteredIncidents.reduce((acc: Record<number, number>, incident: Incident) => {
            const date = getIncidentDate(incident);
            if (!date) return acc;
            const hour = date.getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        return Object.entries(hourCounts)
            .map(([hour, count]) => ({
                time: `${hour.toString().padStart(2, '0')}:00`,
                incidents: count
            }))
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [incidents]);

    // Source analytics for enhanced trends
    const sourceAnalytics = useMemo(() => {
        const sourceData = incidents.reduce((acc, incident) => {
            const date = getIncidentDate(incident);
            if (!date) return acc;
            
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            const monthLabel = date.toLocaleString('default', { month: 'short' });
            
            if (!acc[monthKey]) {
                acc[monthKey] = {
                    month: monthLabel,
                    manager: 0,
                    agent: 0,
                    device: 0,
                    sensor: 0,
                    sortKey: date.getFullYear() * 12 + date.getMonth()
                };
            }
            
            const source = incident.source || 'manager';
            if (source === 'agent' || incident.source_agent_id) {
                acc[monthKey].agent += 1;
            } else if (source === 'device' || incident.source_device_id) {
                acc[monthKey].device += 1;
            } else if (source === 'sensor') {
                acc[monthKey].sensor += 1;
            } else {
                acc[monthKey].manager += 1;
            }
            
            return acc;
        }, {} as Record<string, any>);

        return Object.values(sourceData).sort((a: any, b: any) => a.sortKey - b.sortKey);
    }, [incidents]);

    // Agent performance trends
    const agentTrends = useMemo(() => {
        if (!agentPerformanceMetrics.length) return [];
        
        return agentPerformanceMetrics.map(agent => ({
            agent_name: agent.agent_name || `Agent ${agent.agent_id.slice(0, 6)}`,
            trust_score: agent.trust_score,
            approval_rate: agent.approval_rate,
            submissions: agent.submissions_count,
            trust_level: getAgentTrustLevel(agent.agent_id)
        })).sort((a, b) => b.trust_score - a.trust_score);
    }, [agentPerformanceMetrics, getAgentTrustLevel]);

    // Hardware health trends
    const hardwareTrends = useMemo(() => {
        if (!hardwareDevices.length) return [];
        
        return hardwareDevices.map(device => ({
            device_name: device.device_name,
            device_type: device.device_type,
            health_score: device.health_score,
            status: device.status,
            incident_count: device.incident_count_24h,
            issues_count: device.issues.length
        })).sort((a, b) => b.health_score - a.health_score);
    }, [hardwareDevices]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Incident Log</p>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Trends & Analytics</h2>
                    <p className="text-[11px] text-[color:var(--text-sub)]">Visualize incident patterns over time.</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* View Mode Selection */}
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewMode('incidents')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                viewMode === 'incidents' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            Incidents
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewMode('sources')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                viewMode === 'sources' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            Sources
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewMode('performance')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                viewMode === 'performance' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            Performance
                        </Button>
                    </div>

                    {/* Date Range Selection */}
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDateRange('7d')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                dateRange === '7d' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            7 Days
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDateRange('30d')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                dateRange === '30d' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            30 Days
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDateRange('90d')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                dateRange === '90d' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            90 Days
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDateRange('all')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                dateRange === 'all' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            All Time
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDateRange('custom')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                dateRange === 'custom' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            Custom
                        </Button>
                    </div>
                </div>
            </div>
            {dateRange === 'custom' && (
                <Card className="glass-card border border-white/5 shadow-2xl">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
            {/* Conditional Analytics Views */}
            {viewMode === 'incidents' && (
                <Card className="glass-card border border-white/5 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl text-white">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                                <i className="fas fa-chart-line text-white" />
                            </div>
                            <span className="uppercase tracking-tight">Incident Trends Over Time</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {trendData.length === 0 ? (
                            <EmptyState
                                icon="fas fa-chart-line"
                                title="No Trend Data"
                                description="Incident trends will appear once activity is recorded."
                                className="bg-black/20 border-dashed border-2 border-white/5"
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="month" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc' }}
                                        itemStyle={{ color: '#f8fafc' }}
                                    />
                                    <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                                    <Area type="monotone" dataKey="incidents" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            )}

            {viewMode === 'sources' && (
                <Card className="glass-card border border-white/5 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl text-white">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                                <i className="fas fa-source-alt text-white" />
                            </div>
                            <span className="uppercase tracking-tight">Incident Sources Over Time</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sourceAnalytics.length === 0 ? (
                            <EmptyState
                                icon="fas fa-source-alt"
                                title="No Source Data"
                                description="Source analytics will appear once incidents have source information."
                                className="bg-black/20 border-dashed border-2 border-white/5"
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={sourceAnalytics}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="month" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc' }}
                                        itemStyle={{ color: '#f8fafc' }}
                                    />
                                    <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                                    <Area type="monotone" dataKey="manager" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.8} />
                                    <Area type="monotone" dataKey="agent" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.8} />
                                    <Area type="monotone" dataKey="device" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.8} />
                                    <Area type="monotone" dataKey="sensor" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.8} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            )}

            {viewMode === 'performance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Agent Performance Trends */}
                    <Card className="glass-card border border-white/5 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl text-white">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                                    <i className="fas fa-user-shield text-white" />
                                </div>
                                <span className="uppercase tracking-tight">Agent Performance</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {agentTrends.length === 0 ? (
                                <EmptyState
                                    icon="fas fa-user-shield"
                                    title="No Agent Data"
                                    description="Agent performance metrics will appear once agents start submitting incidents."
                                    className="bg-black/20 border-dashed border-2 border-white/5"
                                />
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={agentTrends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="agent_name" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc' }}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                        <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                                        <Bar dataKey="trust_score" fill="#22c55e" name="Trust Score" />
                                        <Bar dataKey="approval_rate" fill="#3b82f6" name="Approval Rate %" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Hardware Health Trends */}
                    <Card className="glass-card border border-white/5 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl text-white">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                                    <i className="fas fa-microchip text-white" />
                                </div>
                                <span className="uppercase tracking-tight">Hardware Health</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {hardwareTrends.length === 0 ? (
                                <EmptyState
                                    icon="fas fa-microchip"
                                    title="No Hardware Data"
                                    description="Hardware device metrics will appear once devices are connected."
                                    className="bg-black/20 border-dashed border-2 border-white/5"
                                />
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={hardwareTrends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="device_name" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc' }}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                        <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                                        <Bar dataKey="health_score" fill="#f59e0b" name="Health Score" />
                                        <Bar dataKey="incident_count" fill="#ef4444" name="Incidents (24h)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Incident Type Distribution */}
            <Card className="glass-card border border-white/5 shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                            <i className="fas fa-chart-pie text-white" />
                        </div>
                        <span className="uppercase tracking-tight">Incident Type Distribution</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {typeDistribution.length === 0 ? (
                        <EmptyState
                            icon="fas fa-chart-pie"
                            title="No Distribution Data"
                            description="Type distribution will appear once incidents are logged."
                            className="bg-black/20 border-dashed border-2 border-white/5"
                        />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={typeDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.type}: ${entry.percentage}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="count"
                                        stroke="rgba(0,0,0,0)"
                                    >
                                        {typeDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="space-y-3">
                                {typeDistribution.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-sm font-medium text-slate-300">{item.type}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-white">{item.count}</span>
                                            <span className="text-xs text-slate-400 ml-1">({item.percentage}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Location Hotspots */}
            <Card className="glass-card border border-white/5 shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                            <i className="fas fa-map-marker-alt text-white" />
                        </div>
                        <span className="uppercase tracking-tight">Location Hotspots</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {locationHotspots.length === 0 ? (
                        <EmptyState
                            icon="fas fa-map-marker-alt"
                            title="No Location Hotspots"
                            description="Location insights will appear once incidents include location data."
                            className="bg-black/20 border-dashed border-2 border-white/5"
                        />
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={locationHotspots}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="location" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                                <Bar dataKey="count" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Time Pattern Analysis */}
            <Card className="glass-card border border-white/5 shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                            <i className="fas fa-clock text-white" />
                        </div>
                        <span className="uppercase tracking-tight">Time Pattern Analysis</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {timePatterns.length === 0 ? (
                        <EmptyState
                            icon="fas fa-clock"
                            title="No Time Patterns"
                            description="Time-based patterns will appear once incidents have timestamps."
                            className="bg-black/20 border-dashed border-2 border-white/5"
                        />
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={timePatterns}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="time" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc' }}
                                />
                                <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                                <Line type="monotone" dataKey="incidents" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6, fill: '#60a5fa' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TrendsTab;


