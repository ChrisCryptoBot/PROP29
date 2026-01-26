import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { Avatar } from '../../../../components/UI/Avatar';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { Select } from '../../../../components/UI/Select';
import { Modal } from '../../../../components/UI/Modal';
import LoadingSpinner from '../../../../components/UI/LoadingSpinner';
import { TemplateSuggestionsPanel } from '../../../../components/PatrolModule';
import { usePatrolContext } from '../../context/PatrolContext';
import { showLoading, showSuccess, showError, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../../utils/toast';
import { PatrolEndpoint, PatrolAuditLog } from '../../../../services/PatrolEndpoint';
import {
    PatrolTemplate,
    UpcomingPatrol,
    Checkpoint
} from '../../types';

const FILTERS_STORAGE_KEY = 'patrol-management.filters';

type PriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';
type HistoryFilter = 'all' | 'completed' | 'cancelled';

function loadFilters(): { search: string; priority: PriorityFilter; history: HistoryFilter } {
    try {
        const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
        if (!raw) return { search: '', priority: 'all', history: 'all' };
        const parsed = JSON.parse(raw) as { search?: string; priority?: string; history?: string };
        const priority = ['all', 'low', 'medium', 'high', 'critical'].includes(parsed.priority ?? '') ? (parsed.priority as PriorityFilter) : 'all';
        const history = ['all', 'completed', 'cancelled'].includes(parsed.history ?? '') ? (parsed.history as HistoryFilter) : 'all';
        return {
            search: typeof parsed.search === 'string' ? parsed.search : '',
            priority,
            history
        };
    } catch {
        return { search: '', priority: 'all', history: 'all' };
    }
}

function saveFilters(f: { search: string; priority: PriorityFilter; history: HistoryFilter }) {
    try {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(f));
    } catch (_) {}
}

// Placeholder imports for Modals (will be created next)
import { CreateTemplateModal } from '../modals/CreateTemplateModal';
import { ReassignOfficerModal } from '../modals/ReassignOfficerModal';
import { CheckpointCheckInModal } from '../modals/CheckpointCheckInModal';

export const PatrolManagementTab: React.FC = () => {
    const {
        upcomingPatrols,
        routes,
        templates,
        handleDeleteTemplate,
        handleCancelPatrol,
        handleCompletePatrol,
        refreshPatrolData,
        selectedPropertyId,
        checkInQueuePendingCount,
        checkInQueueFailedCount,
        retryCheckInQueue
    } = usePatrolContext();

    // Helper: Calculate checkpoint progress
    const getPatrolCheckpointProgress = (patrol: UpcomingPatrol) => {
        const route = routes.find(r => r && (r.id === patrol.routeId || r.name === patrol.location));
        const checkpoints = patrol.checkpoints?.length ? patrol.checkpoints : (route?.checkpoints || []);
        if (!checkpoints || checkpoints.length === 0) {
            return { completed: 0, total: 0, percentage: 0 };
        }
        const total = checkpoints.length;
        const completed = checkpoints.filter(cp => cp?.status === 'completed').length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed, total, percentage };
    };


    // Local UI State (persisted)
    const [patrolSearchQuery, setPatrolSearchQuery] = useState(() => loadFilters().search);
    const [patrolPriorityFilter, setPatrolPriorityFilter] = useState<PriorityFilter>(() => loadFilters().priority);
    const [patrolHistoryFilter, setPatrolHistoryFilter] = useState<HistoryFilter>(() => loadFilters().history);

    useEffect(() => {
        saveFilters({ search: patrolSearchQuery, priority: patrolPriorityFilter, history: patrolHistoryFilter });
    }, [patrolSearchQuery, patrolPriorityFilter, patrolHistoryFilter]);
    const [auditLogs, setAuditLogs] = useState<PatrolAuditLog[]>([]);
    const [isAuditLoading, setIsAuditLoading] = useState(false);
    const [auditSort, setAuditSort] = useState<'newest' | 'oldest'>('newest');
    const [auditDateFrom, setAuditDateFrom] = useState<string>('');
    const [auditDateTo, setAuditDateTo] = useState<string>('');

    // Modal States
    const [showCreateTemplate, setShowCreateTemplate] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<PatrolTemplate | null>(null);

    const [showReassignModal, setShowReassignModal] = useState(false);
    const [reassigningPatrolId, setReassigningPatrolId] = useState<string | null>(null);

    const [showCheckpointCheckIn, setShowCheckpointCheckIn] = useState(false);
    const [checkingInPatrolId, setCheckingInPatrolId] = useState<string | null>(null);
    const [checkingInCheckpointId, setCheckingInCheckpointId] = useState<string | null>(null);
    const [showAbortConfirm, setShowAbortConfirm] = useState(false);
    const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
    const [confirmingPatrolId, setConfirmingPatrolId] = useState<string | null>(null);
    const [confirmProgress, setConfirmProgress] = useState<{ completed: number; total: number; percentage: number } | null>(null);

    useEffect(() => {
        let isMounted = true;
        const loadAuditLogs = async () => {
            setIsAuditLoading(true);
            try {
                const logs = await PatrolEndpoint.getAuditLogs(selectedPropertyId || undefined);
                if (isMounted) {
                    setAuditLogs(logs || []);
                }
            } catch (error) {
                if (isMounted) {
                    setAuditLogs([]);
                }
            } finally {
                if (isMounted) {
                    setIsAuditLoading(false);
                }
            }
        };
        loadAuditLogs();
        return () => {
            isMounted = false;
        };
    }, [selectedPropertyId]);

    // Filter Active Patrols
    const activeFilteredPatrols = useMemo(() => {
        let filtered = upcomingPatrols.filter(p => p && p.status === 'in-progress');

        if (patrolPriorityFilter !== 'all') {
            filtered = filtered.filter(p => p.priority === patrolPriorityFilter);
        }

        const query = patrolSearchQuery.toLowerCase().trim();
        if (query) {
            filtered = filtered.filter(patrol =>
                (patrol.name || '').toLowerCase().includes(query) ||
                (patrol.assignedOfficer || '').toLowerCase().includes(query) ||
                (patrol.location || '').toLowerCase().includes(query) ||
                (patrol.description || '').toLowerCase().includes(query)
            );
        }
        return filtered;
    }, [upcomingPatrols, patrolSearchQuery, patrolPriorityFilter]);

    // Filter History Patrols
    const historyPatrols = useMemo(() => {
        let filtered = upcomingPatrols.filter(p => p && (p.status === 'completed' || p.status === 'cancelled'));

        if (patrolHistoryFilter !== 'all') {
            filtered = filtered.filter(p => p.status === patrolHistoryFilter);
        }

        return filtered;
    }, [upcomingPatrols, patrolHistoryFilter]);

    // Filter & sort audit logs (client-side)
    const filteredAuditLogs = useMemo(() => {
        let list = [...(auditLogs || [])];
        const from = auditDateFrom ? new Date(auditDateFrom).getTime() : null;
        const to = auditDateTo ? new Date(auditDateTo + 'T23:59:59').getTime() : null;
        if (from != null) list = list.filter(l => new Date(l.timestamp).getTime() >= from);
        if (to != null) list = list.filter(l => new Date(l.timestamp).getTime() <= to);
        list.sort((a, b) => {
            const ta = new Date(a.timestamp).getTime();
            const tb = new Date(b.timestamp).getTime();
            return auditSort === 'newest' ? tb - ta : ta - tb;
        });
        return list;
    }, [auditLogs, auditSort, auditDateFrom, auditDateTo]);

    return (
        <div className="space-y-6" role="main" aria-label="Patrol Management">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Patrol Management</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Templates, active patrols, and audit trail
                    </p>
                </div>
            </div>
            {/* AI Template Suggestions */}
            {upcomingPatrols.length > 0 && routes.length > 0 && (
                <TemplateSuggestionsPanel
                    patrolHistory={upcomingPatrols}
                    incidents={[]}
                    onCreateTemplate={(suggestion) => {
                        if (!suggestion || !suggestion.name?.trim()) {
                            showError('Invalid suggestion');
                            return;
                        }
                        // Validate suggestion has required fields
                        if (!suggestion.routeId && !suggestion.route) {
                            showError('Template suggestion missing route information');
                            return;
                        }
                        setEditingTemplate(suggestion as any);
                        setShowCreateTemplate(true);
                        showSuccess(`Template "${suggestion.name}" ready to create`);
                    }}
                />
            )}

            {/* Patrol Templates */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center text-white">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-lg">
                                <i className="fas fa-file-alt text-white"></i>
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest">Patrol Templates</span>
                        </span>
                        <Button
                            onClick={() => { setEditingTemplate(null); setShowCreateTemplate(true); }}
                            variant="glass"
                            className="border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 h-10 px-6"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Create Template
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-6">
                    <div className="space-y-4">
                        {templates.length > 0 ? (
                            templates.map((template) => {
                                const route = routes.find(r => r && r.id === template.routeId);
                                return (
                                    <div key={template.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 border border-white/5 hover:border-indigo-500/20 transition-all group">
                                        <div className="flex-1">
                                            <h3 className="font-black text-white uppercase tracking-widest text-xs mb-1">{template.name || 'Unnamed Template'}</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 opacity-70 italic">{template.description || 'No description'}</p>
                                            <div className="flex items-center space-x-4 flex-wrap gap-3">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Route: {route?.name || 'Route not found'}</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Cycle: <span className="text-white opacity-100">{template.schedule?.startTime || 'N/A'} - {template.schedule?.endTime || 'N/A'}</span></span>
                                                <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${template.priority === 'critical' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                                                    template.priority === 'high' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                                                        'text-indigo-400 bg-indigo-400/10 border-indigo-400/20'
                                                    }`}>
                                                    {template.priority || 'medium'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                size="sm"
                                                variant="glass"
                                                onClick={() => { setEditingTemplate(template); setShowCreateTemplate(true); }}
                                                className="h-8 border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest"
                                            >
                                                <i className="fas fa-edit mr-2"></i> Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="glass"
                                                onClick={() => handleDeleteTemplate(template.id)}
                                                className="h-8 border-white/5 text-red-500/60 hover:text-red-400 hover:border-red-500/30 text-[10px] font-black uppercase tracking-widest"
                                            >
                                                <i className="fas fa-trash mr-2"></i> Delete
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={async () => {
                                                    if (!template.schedule?.startTime) { showError('Template schedule incomplete'); return; }
                                                    const route = routes.find(r => r && r.id === template.routeId);
                                                    if (!route) { showError('Route not found'); return; }
                                                    const toastId = showLoading('Starting patrol from template...');
                                                    try {
                                                        await PatrolEndpoint.createPatrol({
                                                            property_id: selectedPropertyId || undefined,
                                                            guard_id: template.assignedOfficers?.[0],
                                                            template_id: template.id,
                                                            patrol_type: 'scheduled',
                                                            route: {
                                                                name: route.name,
                                                                description: route.description,
                                                                estimated_duration: route.estimatedDuration,
                                                                priority: template.priority,
                                                                route_id: route.id
                                                            },
                                                            checkpoints: route.checkpoints || []
                                                        });
                                                        await refreshPatrolData();
                                                        dismissLoadingAndShowSuccess(toastId, `Template "${template.name}" started`);
                                                    } catch (error) {
                                                        dismissLoadingAndShowError(toastId, 'Failed to start patrol');
                                                    }
                                                }}
                                                variant="glass"
                                                className="h-8 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest"
                                            >
                                                <i className="fas fa-play mr-2"></i> Start Patrol
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <EmptyState
                                icon="fas fa-file-invoice"
                                title="No patrol templates"
                                description="Create a template to start scheduled patrols"
                            />
                        )}
                    </div>
                </CardContent>
            </Card>
            {/* Active Patrols */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center text-white">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-lg">
                                <i className="fas fa-route text-white"></i>
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest">Live Patrol Monitoring</span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">{activeFilteredPatrols.length} ACTIVE PATROLS</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-6">
                    {/* Search & Filter */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <SearchBar
                                value={patrolSearchQuery}
                                onChange={setPatrolSearchQuery}
                                placeholder="Filter active patrols..."
                                debounceMs={300}
                                className="bg-slate-900/50 border-white/5 text-white placeholder-slate-500 h-10"
                            />
                        </div>
                        <div className="md:w-48">
                            <select
                                value={patrolPriorityFilter}
                                onChange={(e) => setPatrolPriorityFilter(e.target.value as any)}
                                className="w-full px-3 py-2 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900/50 text-slate-300 focus:ring-0 focus:border-indigo-500/30 h-10"
                            >
                                <option value="all" className="bg-slate-900">ALL LEVELS</option>
                                <option value="critical" className="bg-slate-900">CRITICAL</option>
                                <option value="high" className="bg-slate-900">HIGH</option>
                                <option value="medium" className="bg-slate-900">MEDIUM</option>
                                <option value="low" className="bg-slate-900">LOW</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {activeFilteredPatrols.length > 0 ? (
                            activeFilteredPatrols.map(patrol => {
                                // Validate patrol has required data
                                if (!patrol.id || !patrol.name) {
                                    return null;
                                }
                                
                                const progress = getPatrolCheckpointProgress(patrol);
                                const route = routes.find(r => r && (r.id === patrol.routeId || r.name === patrol.location));
                                const checkpoints = patrol.checkpoints?.length ? patrol.checkpoints : (route?.checkpoints || []);

                                return (
                                    <div key={patrol.id} className="p-5 border border-indigo-500/20 rounded-2xl bg-indigo-950/20 space-y-4 hover:border-indigo-500/40 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>

                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-black text-white uppercase tracking-widest text-sm">{patrol.name}</h3>
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-80">{patrol.description}</p>
                                                <div className="flex gap-3 mt-3">
                                                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${patrol.priority === 'critical' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                                                        patrol.priority === 'high' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                                                            'text-indigo-400 bg-indigo-400/10 border-indigo-500/20'
                                                        }`}>
                                                        {patrol.priority.toUpperCase()}
                                                    </div>
                                                    {progress.total > 0 && (
                                                        <div className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-white/5 bg-white/5 text-slate-500">
                                                            {progress.completed}/{progress.total} SECTORS CLEARED
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="glass"
                                                    onClick={() => { setReassigningPatrolId(patrol.id); setShowReassignModal(true); }}
                                                    className="h-8 border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest px-3"
                                                >
                                                    Modify
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="glass"
                                                    onClick={() => {
                                                        if (progress.total > 0 && progress.percentage < 100) {
                                                            setConfirmProgress(progress);
                                                            setConfirmingPatrolId(patrol.id);
                                                            setShowAbortConfirm(true);
                                                        } else {
                                                            handleCancelPatrol(patrol.id);
                                                        }
                                                    }}
                                                    className="h-8 border-white/5 text-red-500/60 hover:text-red-400 text-[10px] font-black uppercase tracking-widest px-3"
                                                >
                                                    Abort
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        if (progress.total > 0 && progress.percentage < 100) {
                                                            setConfirmProgress(progress);
                                                            setConfirmingPatrolId(patrol.id);
                                                            setShowFinalizeConfirm(true);
                                                        } else {
                                                            handleCompletePatrol(patrol.id);
                                                        }
                                                    }}
                                                    variant="glass"
                                                    className="h-8 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-4"
                                                >
                                                    Finalize
                                                </Button>
                                            </div>
                                        </div>
                                        {/* Progress Bar */}
                                        {progress.total > 0 && (
                                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                                                    style={{ width: `${progress.percentage}%` }}
                                                />
                                            </div>
                                        )}
                                        {/* Checkpoints List */}
                                        {checkpoints?.length ? (
                                            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {checkpoints.map(cp => (
                                                    <div key={cp.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-900/30 border border-white/5 hover:border-indigo-500/20 transition-all group/cp">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${cp.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                                                            <span className={`text-[10px] font-black uppercase tracking-widest truncate ${cp.status === 'completed' ? 'text-slate-600' : 'text-slate-400'}`}>{cp.name}</span>
                                                            {cp.status === 'completed' && (cp as Checkpoint).syncStatus === 'pending' && (
                                                                <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-amber-400" title="Queued for sync">⏳ Pending</span>
                                                            )}
                                                            {cp.status === 'completed' && ((cp as Checkpoint).syncStatus === 'synced' || !(cp as Checkpoint).syncStatus) && (
                                                                <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-emerald-400" title="Synced">✓ Confirmed</span>
                                                            )}
                                                        </div>
                                                        {cp.status !== 'completed' && (
                                                            <Button
                                                                size="sm"
                                                                variant="glass"
                                                                onClick={() => {
                                                                    setCheckingInPatrolId(patrol.id);
                                                                    setCheckingInCheckpointId(cp.id);
                                                                    setShowCheckpointCheckIn(true);
                                                                }}
                                                                className="h-6 text-[8px] font-black uppercase tracking-widest border-indigo-500/20 text-indigo-400 py-0 shrink-0"
                                                            >
                                                                Check In
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })
                        ) : (
                            <EmptyState
                                icon="fas fa-satellite"
                                title="No active deployments"
                                description="Deploy a protocol to begin live monitoring"
                            />
                        )}
                    </div>
                </CardContent>
            </Card>
            {/* History */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl opacity-80 hover:opacity-100 transition-opacity">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="text-white text-sm font-black uppercase tracking-widest">Patrol History</CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-6">
                    <div className="space-y-3">
                        {historyPatrols.length > 0 ? historyPatrols.map(p => (
                            <div key={p.id} className="p-4 border border-white/5 rounded-xl flex justify-between items-center bg-slate-900/30 hover:bg-slate-900/50 transition-all group">
                                <div>
                                    <h4 className="font-black text-white uppercase tracking-widest text-xs mb-1">{p.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic opacity-70">
                                        {p.startTime} <span className="mx-2 opacity-30">|</span> {p.status.toUpperCase()}
                                    </p>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${p.status === 'completed' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                                        'text-red-400 bg-red-400/10 border-red-400/20'
                                    }`}>
                                    {p.status}
                                </div>
                            </div>
                        )) : (
                            <EmptyState
                                icon="fas fa-history"
                                title="No historical patrols"
                                description="Completed patrols will appear here"
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Audit Log */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="text-white text-sm font-black uppercase tracking-widest">Audit Log</span>
                        {(checkInQueuePendingCount > 0 || checkInQueueFailedCount > 0) && (
                            <div className="flex items-center gap-2">
                                {checkInQueuePendingCount > 0 && (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                                        {checkInQueuePendingCount} pending sync
                                    </span>
                                )}
                                {checkInQueueFailedCount > 0 && (
                                    <Button
                                        size="sm"
                                        variant="glass"
                                        onClick={retryCheckInQueue}
                                        className="h-7 text-[9px] font-black uppercase tracking-widest border-amber-500/30 text-amber-400 hover:border-amber-500/50"
                                    >
                                        Retry failed sync
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-6">
                    {isAuditLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                            <LoadingSpinner variant="spinner" size="medium" message="Loading audit log..." />
                        </div>
                    ) : auditLogs.length > 0 ? (
                        <>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <Select
                                    label="Sort"
                                    value={auditSort}
                                    onChange={(e) => setAuditSort(e.target.value as 'newest' | 'oldest')}
                                    className="w-40"
                                    containerClassName=""
                                >
                                    <option value="newest">Newest first</option>
                                    <option value="oldest">Oldest first</option>
                                </Select>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">From</label>
                                    <input
                                        type="date"
                                        value={auditDateFrom}
                                        onChange={(e) => setAuditDateFrom(e.target.value)}
                                        className="px-3 py-1.5 border border-white/5 rounded-md text-xs font-mono bg-white/5 text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                        aria-label="Audit log date from"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">To</label>
                                    <input
                                        type="date"
                                        value={auditDateTo}
                                        onChange={(e) => setAuditDateTo(e.target.value)}
                                        className="px-3 py-1.5 border border-white/5 rounded-md text-xs font-mono bg-white/5 text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10"
                                        aria-label="Audit log date to"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                            {filteredAuditLogs.length === 0 ? (
                                <p className="text-xs text-slate-500 uppercase tracking-widest py-4">No audit events match the selected filters</p>
                            ) : filteredAuditLogs.map(log => {
                                const source = log.log_metadata?.source as string | undefined;
                                return (
                                    <div key={log.log_id} className="p-3 border border-white/5 rounded-lg bg-slate-900/30">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{String(log.message || '').replace(/_/g, ' ')}</span>
                                            <div className="flex items-center gap-2">
                                                {source && (
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${source === 'mobile_agent' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border border-white/5'}`}>
                                                        {source}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {log.log_metadata && Object.keys(log.log_metadata).length > 0 && (
                                            <div className="mt-2 text-[10px] text-slate-500 font-mono">
                                                {JSON.stringify(log.log_metadata)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            icon="fas fa-clipboard-list"
                            title="No audit activity"
                            description="Audit events will appear here"
                        />
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            {showCreateTemplate && (
                <CreateTemplateModal
                    isOpen={showCreateTemplate}
                    onClose={() => { setShowCreateTemplate(false); setEditingTemplate(null); }}
                    initialData={editingTemplate}
                />
            )}

            {showReassignModal && reassigningPatrolId && (
                <ReassignOfficerModal
                    isOpen={showReassignModal}
                    onClose={() => { setShowReassignModal(false); setReassigningPatrolId(null); }}
                    patrolId={reassigningPatrolId}
                />
            )}

            {showCheckpointCheckIn && checkingInPatrolId && checkingInCheckpointId && (
                <CheckpointCheckInModal
                    isOpen={showCheckpointCheckIn}
                    onClose={() => { setShowCheckpointCheckIn(false); setCheckingInPatrolId(null); setCheckingInCheckpointId(null); }}
                    patrolId={checkingInPatrolId}
                    checkpointId={checkingInCheckpointId}
                />
            )}

            {/* Abort Confirmation Modal */}
            <Modal
                isOpen={showAbortConfirm}
                onClose={() => { setShowAbortConfirm(false); setConfirmingPatrolId(null); setConfirmProgress(null); }}
                title="Confirm Abort Patrol"
                size="sm"
            >
                <div className="space-y-4">
                    {confirmProgress && confirmProgress.percentage < 100 && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs font-bold text-amber-400">
                                Patrol is only {confirmProgress.percentage}% complete ({confirmProgress.completed}/{confirmProgress.total} checkpoints)
                            </p>
                        </div>
                    )}
                    <p className="text-sm text-white">
                        Are you sure you want to abort this patrol? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="subtle"
                            onClick={() => { setShowAbortConfirm(false); setConfirmingPatrolId(null); setConfirmProgress(null); }}
                            className="text-[10px] font-black uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (confirmingPatrolId) {
                                    handleCancelPatrol(confirmingPatrolId);
                                    setShowAbortConfirm(false);
                                    setConfirmingPatrolId(null);
                                    setConfirmProgress(null);
                                }
                            }}
                            className="text-[10px] font-black uppercase tracking-widest"
                        >
                            Abort Patrol
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Finalize Confirmation Modal */}
            <Modal
                isOpen={showFinalizeConfirm}
                onClose={() => { setShowFinalizeConfirm(false); setConfirmingPatrolId(null); setConfirmProgress(null); }}
                title="Confirm Finalize Patrol"
                size="sm"
            >
                <div className="space-y-4">
                    {confirmProgress && confirmProgress.percentage < 100 && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs font-bold text-amber-400">
                                Patrol is only {confirmProgress.percentage}% complete ({confirmProgress.completed}/{confirmProgress.total} checkpoints)
                            </p>
                            <p className="text-[10px] text-amber-300/70 mt-1">
                                You can still finalize, but incomplete checkpoints will be marked as skipped.
                            </p>
                        </div>
                    )}
                    <p className="text-sm text-white">
                        Are you sure you want to finalize this patrol?
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="subtle"
                            onClick={() => { setShowFinalizeConfirm(false); setConfirmingPatrolId(null); setConfirmProgress(null); }}
                            className="text-[10px] font-black uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                if (confirmingPatrolId) {
                                    handleCompletePatrol(confirmingPatrolId);
                                    setShowFinalizeConfirm(false);
                                    setConfirmingPatrolId(null);
                                    setConfirmProgress(null);
                                }
                            }}
                            className="text-[10px] font-black uppercase tracking-widest"
                        >
                            Finalize Patrol
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
