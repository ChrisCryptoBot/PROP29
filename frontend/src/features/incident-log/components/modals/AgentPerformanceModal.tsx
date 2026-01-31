import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { AgentPerformanceMetrics, AgentTrustLevel } from '../../types/incident-log.types';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface AgentPerformanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentId?: string;
    selectedAgent?: AgentPerformanceMetrics;
}

const TRUST_LEVEL_COLORS = {
    [AgentTrustLevel.HIGH]: '#22c55e',
    [AgentTrustLevel.MEDIUM]: '#eab308', 
    [AgentTrustLevel.LOW]: '#ef4444',
    [AgentTrustLevel.UNKNOWN]: '#6b7280'
};

const PERFORMANCE_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#84cc16', '#f59e0b'];

export const AgentPerformanceModal: React.FC<AgentPerformanceModalProps> = ({
    isOpen,
    onClose,
    agentId,
    selectedAgent
}) => {
    const { 
        agentPerformanceMetrics, 
        incidents, 
        loading,
        getAgentTrustLevel,
        calculateAgentTrustScore,
        refreshAgentPerformance 
    } = useIncidentLogContext();

    const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'submissions' | 'settings'>('overview');
    const [trustScoreHistory, setTrustScoreHistory] = useState<Array<{ date: string; score: number; level: string }>>([]);
    
    // Determine which agent to display
    const displayAgent = selectedAgent || (agentId ? agentPerformanceMetrics.find(a => a.agent_id === agentId) : null);
    
    // Get agent's incident submissions
    const agentSubmissions = useMemo(() => {
        if (!displayAgent) return [];
        return incidents.filter(incident => 
            incident.source_agent_id === displayAgent.agent_id ||
            (incident.source === 'agent' && incident.source_metadata?.agent_id === displayAgent.agent_id)
        );
    }, [incidents, displayAgent]);

    // Generate mock trust score history (in production, this would come from API)
    useEffect(() => {
        if (displayAgent && isOpen) {
            // Mock historical trust score data
            const history = [];
            const currentDate = new Date();
            for (let i = 30; i >= 0; i--) {
                const date = new Date(currentDate);
                date.setDate(date.getDate() - i);
                const baseScore = displayAgent.trust_score;
                const variance = Math.random() * 20 - 10; // ±10 variation
                const score = Math.max(0, Math.min(100, baseScore + variance));
                const level = score >= 80 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW';
                
                history.push({
                    date: date.toISOString().split('T')[0],
                    score: Math.round(score),
                    level
                });
            }
            setTrustScoreHistory(history);
        }
    }, [displayAgent, isOpen]);

    // Performance breakdown data
    const performanceData = useMemo(() => {
        if (!displayAgent) return [];
        
        return [
            { name: 'Approved', value: displayAgent.approval_count, color: '#22c55e' },
            { name: 'Rejected', value: displayAgent.rejection_count, color: '#ef4444' },
            { name: 'Flagged', value: displayAgent.flagged_submissions || 0, color: '#f59e0b' }
        ];
    }, [displayAgent]);

    // Submission trends by week
    const submissionTrends = useMemo(() => {
        if (!agentSubmissions.length) return [];
        
        const weekMap = new Map();
        agentSubmissions.forEach(submission => {
            const date = new Date(submission.created_at);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!weekMap.has(weekKey)) {
                weekMap.set(weekKey, {
                    week: weekKey,
                    submissions: 0,
                    approved: 0,
                    rejected: 0
                });
            }
            
            const week = weekMap.get(weekKey);
            week.submissions += 1;
            if (submission.status === 'resolved' || submission.status === 'open') {
                week.approved += 1;
            } else if (submission.status === 'closed') {
                week.rejected += 1;
            }
        });
        
        return Array.from(weekMap.values()).sort((a, b) => a.week.localeCompare(b.week)).slice(-8);
    }, [agentSubmissions]);

    const getTrustLevelBadge = (level: AgentTrustLevel) => {
        const styles = {
            [AgentTrustLevel.HIGH]: 'text-green-300 bg-green-500/20 border-green-500/30',
            [AgentTrustLevel.MEDIUM]: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30',
            [AgentTrustLevel.LOW]: 'text-red-300 bg-red-500/20 border-red-500/30',
            [AgentTrustLevel.UNKNOWN]: 'text-slate-300 bg-slate-500/20 border-slate-500/30'
        };
        
        const icons = {
            [AgentTrustLevel.HIGH]: 'fa-shield-check',
            [AgentTrustLevel.MEDIUM]: 'fa-shield-exclamation',
            [AgentTrustLevel.LOW]: 'fa-shield-x',
            [AgentTrustLevel.UNKNOWN]: 'fa-shield-question'
        };
        
        return (
            <span className={cn("px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border", styles[level])}>
                <i className={cn("fas mr-1", icons[level])} />
                {level} Trust
            </span>
        );
    };

    if (!isOpen) return null;

    if (!displayAgent) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Agent Performance" size="lg">
                <div className="p-8">
                    <EmptyState
                        icon="fas fa-user-shield"
                        title="No Agent Selected"
                        description="Please select an agent to view performance details."
                        className="bg-black/20 border-dashed border-2 border-white/5"
                    />
                </div>
            </Modal>
        );
    }

    const agentDisplayName = displayAgent.agent_name || `Agent ${displayAgent.agent_id.slice(0, 8)}`;
    const trustLevel = getAgentTrustLevel(displayAgent.agent_id);

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Agent Performance: ${agentDisplayName}`}
            size="xl"
            footer={(
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center space-x-4">
                        {getTrustLevelBadge(trustLevel)}
                        <span className="text-sm text-slate-400">
                            Trust Score: <span className="text-white font-bold">{displayAgent.trust_score}%</span>
                        </span>
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="subtle" onClick={onClose}>
                            Close
                        </Button>
                        <Button 
                            variant="glass" 
                            onClick={() => refreshAgentPerformance(displayAgent.agent_id)}
                            disabled={loading.agentPerformance}
                        >
                            <i className={cn("fas fa-sync-alt mr-2", loading.agentPerformance && "animate-spin")} />
                            Refresh Data
                        </Button>
                    </div>
                </div>
            )}
        >
            <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="flex space-x-1 p-1 bg-white/5 rounded-lg border border-white/5">
                    {[
                        { key: 'overview', label: 'Overview', icon: 'fa-chart-line' },
                        { key: 'trends', label: 'Trends', icon: 'fa-trending-up' },
                        { key: 'submissions', label: 'Submissions', icon: 'fa-clipboard-list' },
                        { key: 'settings', label: 'Settings', icon: 'fa-cogs' }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={cn(
                                "flex-1 flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all",
                                activeTab === tab.key
                                    ? "text-white bg-white/10 shadow-lg"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <i className={cn("fas mr-2", tab.icon)} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                                <CardContent className="pt-6 px-6 pb-6">
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <i className="fas fa-paper-plane text-white" />
                                        </div>
                                        <p className="text-2xl font-black text-white">{displayAgent.submissions_count}</p>
                                        <p className="text-xs text-slate-400">Total Submissions</p>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                                <CardContent className="pt-6 px-6 pb-6">
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-600/80 to-slate-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <i className="fas fa-check text-white" />
                                        </div>
                                        <p className="text-2xl font-black text-white">{displayAgent.approval_rate.toFixed(1)}%</p>
                                        <p className="text-xs text-slate-400">Approval Rate</p>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                                <CardContent className="pt-6 px-6 pb-6">
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600/80 to-slate-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <i className="fas fa-clock text-white" />
                                        </div>
                                        <p className="text-2xl font-black text-white">{displayAgent.average_response_time}</p>
                                        <p className="text-xs text-slate-400">Avg Response (min)</p>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                                <CardContent className="pt-6 px-6 pb-6">
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-gradient-to-br from-orange-600/80 to-slate-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <i className="fas fa-flag text-white" />
                                        </div>
                                        <p className="text-2xl font-black text-white">{displayAgent.flagged_submissions || 0}</p>
                                        <p className="text-xs text-slate-400">Flagged Items</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Performance Breakdown */}
                        <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-white">Performance Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={performanceData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => `${entry.name}: ${entry.value}`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                stroke="rgba(0,0,0,0)"
                                            >
                                                {performanceData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ 
                                                    backgroundColor: '#1e293b', 
                                                    borderColor: 'rgba(255,255,255,0.1)', 
                                                    color: '#f8fafc' 
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wide">Agent Details</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Agent ID:</span>
                                                <span className="text-white font-mono">{displayAgent.agent_id.slice(0, 12)}...</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">First Submission:</span>
                                                <span className="text-white">{new Date(displayAgent.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Last Activity:</span>
                                                <span className="text-white">
                                                    {displayAgent.last_submission 
                                                        ? new Date(displayAgent.last_submission).toLocaleDateString()
                                                        : 'Never'
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Status:</span>
                                                <span className={cn(
                                                    "px-2 py-1 text-xs rounded",
                                                    displayAgent.submissions_count > 0 
                                                        ? "text-green-300 bg-green-500/20" 
                                                        : "text-slate-300 bg-slate-500/20"
                                                )}>
                                                    {displayAgent.submissions_count > 0 ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && (
                    <div className="space-y-6">
                        <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-white">Trust Score History (30 Days)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {trustScoreHistory.length === 0 ? (
                                    <EmptyState
                                        icon="fas fa-chart-line"
                                        title="No Historical Data"
                                        description="Trust score history will appear as the agent submits more incidents."
                                    />
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={trustScoreHistory}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="date" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" domain={[0, 100]} />
                                            <Tooltip
                                                contentStyle={{ 
                                                    backgroundColor: '#1e293b', 
                                                    borderColor: 'rgba(255,255,255,0.1)', 
                                                    color: '#f8fafc' 
                                                }}
                                            />
                                            <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                                            <Line 
                                                type="monotone" 
                                                dataKey="score" 
                                                stroke="#3b82f6" 
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: '#3b82f6' }} 
                                                activeDot={{ r: 6, fill: '#60a5fa' }} 
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-white">Weekly Submission Trends</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {submissionTrends.length === 0 ? (
                                    <EmptyState
                                        icon="fas fa-chart-bar"
                                        title="No Submission History"
                                        description="Submission trends will appear as the agent becomes more active."
                                    />
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={submissionTrends}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="week" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip
                                                contentStyle={{ 
                                                    backgroundColor: '#1e293b', 
                                                    borderColor: 'rgba(255,255,255,0.1)', 
                                                    color: '#f8fafc' 
                                                }}
                                            />
                                            <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                                            <Bar dataKey="approved" stackId="a" fill="#22c55e" name="Approved" />
                                            <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Rejected" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Submissions Tab */}
                {activeTab === 'submissions' && (
                    <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-white">Recent Submissions ({agentSubmissions.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {agentSubmissions.length === 0 ? (
                                <EmptyState
                                    icon="fas fa-clipboard-list"
                                    title="No Submissions Found"
                                    description="This agent hasn't submitted any incidents yet."
                                />
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {agentSubmissions.slice(-10).reverse().map((incident) => (
                                        <div key={incident.incident_id} className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h5 className="text-sm font-bold text-white">{incident.title}</h5>
                                                    <p className="text-xs text-slate-400 mt-1">{incident.description}</p>
                                                    <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500">
                                                        <span><i className="fas fa-clock mr-1" />{new Date(incident.created_at).toLocaleString()}</span>
                                                        <span><i className="fas fa-map-marker-alt mr-1" />
                                                            {formatLocationDisplay(incident.location) || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-1">
                                                    <span className={cn(
                                                        "px-2 py-1 text-xs font-bold rounded",
                                                        incident.status === 'resolved' || incident.status === 'open' 
                                                            ? "text-green-300 bg-green-500/20" 
                                                            : incident.status === 'closed'
                                                            ? "text-red-300 bg-red-500/20"
                                                            : "text-yellow-300 bg-yellow-500/20"
                                                    )}>
                                                        {incident.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                    <span className={cn(
                                                        "px-2 py-1 text-xs font-bold rounded",
                                                        incident.severity === 'critical' ? "text-red-300 bg-red-500/20" :
                                                        incident.severity === 'high' ? "text-orange-300 bg-orange-500/20" :
                                                        incident.severity === 'medium' ? "text-yellow-300 bg-yellow-500/20" :
                                                        "text-blue-300 bg-blue-500/20"
                                                    )}>
                                                        {incident.severity?.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-white">Agent Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <i className="fas fa-info-circle text-yellow-400" />
                                        <p className="text-sm text-yellow-200">
                                            Agent management settings are controlled globally in the Settings tab. 
                                            Individual agent configuration will be available in a future update.
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-white">Trust Level Actions</h4>
                                        <div className="space-y-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full justify-start border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                                                disabled
                                            >
                                                <i className="fas fa-shield-check mr-2" />
                                                Verify Agent Identity
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full justify-start border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
                                                disabled
                                            >
                                                <i className="fas fa-exclamation-triangle mr-2" />
                                                Flag for Review
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-white">Data Actions</h4>
                                        <div className="space-y-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full justify-start border-green-500/30 text-green-300 hover:bg-green-500/10"
                                                disabled
                                            >
                                                <i className="fas fa-download mr-2" />
                                                Export Agent Data
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full justify-start border-slate-500/30 text-slate-300 hover:bg-slate-500/10"
                                                disabled
                                            >
                                                <i className="fas fa-sync-alt mr-2" />
                                                Reset Metrics
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </Modal>
    );
};

export default AgentPerformanceModal;