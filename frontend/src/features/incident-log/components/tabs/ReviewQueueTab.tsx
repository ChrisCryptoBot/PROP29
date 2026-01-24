import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { IncidentStatus } from '../../types/incident-log.types';
import { cn } from '../../../../utils/cn';
import { Modal } from '../../../../components/UI/Modal';

export const ReviewQueueTab: React.FC = () => {
    const {
        incidents,
        loading,
        updateIncident,
        setSelectedIncident,
        refreshIncidents
    } = useIncidentLogContext();

    const [confirmAction, setConfirmAction] = useState<{
        ids: string[];
        nextStatus: IncidentStatus;
        label: string;
    } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [sourceFilter, setSourceFilter] = useState<'all' | 'manager' | 'agent' | 'device' | 'sensor'>('all');

    const pendingIncidents = useMemo(() => {
        const pending = incidents.filter((incident) => incident.status === IncidentStatus.PENDING_REVIEW);
        if (sourceFilter === 'all') return pending;
        return pending.filter((incident) => (incident.source || '').toLowerCase() === sourceFilter);
    }, [incidents, sourceFilter]);

    const rejectedIncidents = useMemo(() => {
        return incidents.filter((incident) => {
            if (incident.status !== IncidentStatus.CLOSED) return false;
            if (!incident.source_metadata || typeof incident.source_metadata !== 'object') return false;
            return 'rejection_reason' in incident.source_metadata && Boolean(incident.source_metadata.rejection_reason);
        });
    }, [incidents]);

    const getSeverityBadgeClass = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'text-red-300 bg-red-500/20 border border-red-500/30';
            case 'high': return 'text-orange-300 bg-orange-500/20 border border-orange-500/30';
            case 'medium': return 'text-yellow-300 bg-yellow-500/20 border border-yellow-500/30';
            case 'low': return 'text-blue-300 bg-blue-500/20 border border-blue-500/30';
            default: return 'text-slate-300 bg-slate-500/20 border border-slate-500/30';
        }
    };

    const approveIncident = (id: string) => {
        setConfirmAction({
            ids: [id],
            nextStatus: IncidentStatus.OPEN,
            label: 'Approve incident'
        });
    };

    const rejectIncident = (id: string) => {
        setConfirmAction({
            ids: [id],
            nextStatus: IncidentStatus.CLOSED,
            label: 'Reject incident'
        });
    };

    const handleConfirm = async () => {
        if (!confirmAction) return;
        if (confirmAction.nextStatus === IncidentStatus.CLOSED && !rejectReason.trim()) {
            return;
        }
        await Promise.all(
            confirmAction.ids.map((id) => updateIncident(id, {
                status: confirmAction.nextStatus,
                ...(confirmAction.nextStatus === IncidentStatus.CLOSED
                    ? { source_metadata: { rejection_reason: rejectReason.trim() } }
                    : {})
            }))
        );
        setConfirmAction(null);
        setRejectReason('');
        // Refresh incidents to update pending list
        refreshIncidents();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Incident Log</p>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Review Queue</h2>
                    <p className="text-[11px] text-[color:var(--text-sub)]">Approve or reject incidents submitted by agents.</p>
                </div>
            </div>

            <Card className="glass-card border border-white/5 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                            <i className="fas fa-inbox text-white" />
                        </div>
                        <span className="uppercase tracking-tight">Pending Review ({pendingIncidents.length})</span>
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSourceFilter('all')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                sourceFilter === 'all' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            All Sources
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSourceFilter('agent')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-blue-500/30",
                                sourceFilter === 'agent' ? "text-blue-200 bg-blue-500/10" : "text-blue-300 hover:bg-blue-500/10"
                            )}
                        >
                            Agents
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSourceFilter('device')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-indigo-500/30",
                                sourceFilter === 'device' ? "text-indigo-200 bg-indigo-500/10" : "text-indigo-300 hover:bg-indigo-500/10"
                            )}
                        >
                            Devices
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSourceFilter('sensor')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-cyan-500/30",
                                sourceFilter === 'sensor' ? "text-cyan-200 bg-cyan-500/10" : "text-cyan-300 hover:bg-cyan-500/10"
                            )}
                        >
                            Sensors
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSourceFilter('manager')}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-emerald-500/30",
                                sourceFilter === 'manager' ? "text-emerald-200 bg-emerald-500/10" : "text-emerald-300 hover:bg-emerald-500/10"
                            )}
                        >
                            Managers
                        </Button>
                    </div>
                    {pendingIncidents.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmAction({
                                    ids: pendingIncidents.map((incident) => incident.incident_id),
                                    nextStatus: IncidentStatus.OPEN,
                                    label: `Approve ${pendingIncidents.length} incidents`
                                })}
                                className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 font-black uppercase tracking-widest text-[10px] px-4"
                            >
                                Approve All
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmAction({
                                    ids: pendingIncidents.map((incident) => incident.incident_id),
                                    nextStatus: IncidentStatus.CLOSED,
                                    label: `Reject ${pendingIncidents.length} incidents`
                                })}
                                className="border-red-500/30 text-red-300 hover:bg-red-500/10 font-black uppercase tracking-widest text-[10px] px-4"
                            >
                                Reject All
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {pendingIncidents.length === 0 ? (
                        <EmptyState
                            icon="fas fa-inbox"
                            title="No Pending Incidents"
                            description="Agent-submitted incidents will appear here for review."
                            className="bg-black/20 border-dashed border-2 border-white/5"
                        />
                    ) : (
                        <div className="space-y-4">
                            {pendingIncidents.map((incident) => {
                                const sourceLabel = incident.source
                                    || (incident.source_metadata && typeof incident.source_metadata === 'object' && 'source' in incident.source_metadata
                                        ? String(incident.source_metadata.source)
                                        : undefined);
                                return (
                                    <div
                                        key={incident.incident_id}
                                        className="p-4 border border-white/5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h4 className="font-bold text-white uppercase tracking-wide text-sm">{incident.title}</h4>
                                                    <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded", getSeverityBadgeClass(incident.severity))}>
                                                        {incident.severity}
                                                    </span>
                                                    {sourceLabel && (
                                                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-500/30 text-blue-200 bg-blue-500/10">
                                                            {sourceLabel}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-400 text-sm mb-2">{incident.description}</p>
                                                <div className="flex items-center space-x-4 text-xs text-slate-500 font-medium">
                                                    <span><i className="fas fa-map-marker-alt mr-1" />{typeof incident.location === 'string' ? incident.location : incident.location?.area || 'Unknown'}</span>
                                                    <span><i className="fas fa-clock mr-1" />{incident.created_at}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedIncident(incident)}
                                                    className="border-white/5 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white font-black uppercase tracking-widest text-[10px] px-4"
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => approveIncident(incident.incident_id)}
                                                    disabled={loading.incidents}
                                                    className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 font-black uppercase tracking-widest text-[10px] px-4"
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => rejectIncident(incident.incident_id)}
                                                    disabled={loading.incidents}
                                                    className="border-red-500/30 text-red-300 hover:bg-red-500/10 font-black uppercase tracking-widest text-[10px] px-4"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="glass-card border border-white/5 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500/80 to-slate-900 rounded-lg flex items-center justify-center mr-3 shadow-2xl border border-white/5">
                            <i className="fas fa-ban text-white" />
                        </div>
                        <span className="uppercase tracking-tight">Review History ({rejectedIncidents.length})</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {rejectedIncidents.length === 0 ? (
                        <EmptyState
                            icon="fas fa-ban"
                            title="No Rejections Logged"
                            description="Rejected incidents with reasons will appear here."
                            className="bg-black/20 border-dashed border-2 border-white/5"
                        />
                    ) : (
                        <div className="space-y-4">
                            {rejectedIncidents.map((incident) => {
                                const rejectionReason = (incident.source_metadata && typeof incident.source_metadata === 'object' && 'rejection_reason' in incident.source_metadata
                                    ? String(incident.source_metadata.rejection_reason)
                                    : undefined);
                                const sourceLabel = incident.source
                                    || (incident.source_metadata && typeof incident.source_metadata === 'object' && 'source' in incident.source_metadata
                                        ? String(incident.source_metadata.source)
                                        : undefined);
                                return (
                                    <div
                                        key={incident.incident_id}
                                        className="p-4 border border-white/5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h4 className="font-bold text-white uppercase tracking-wide text-sm">{incident.title}</h4>
                                                    {sourceLabel && (
                                                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-500/30 text-blue-200 bg-blue-500/10">
                                                            {sourceLabel}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-400 text-sm mb-2">{incident.description}</p>
                                                <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                                                    {rejectionReason}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSelectedIncident(incident)}
                                                    className="border-white/5 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white font-black uppercase tracking-widest text-[10px] px-4"
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal
                isOpen={Boolean(confirmAction)}
                onClose={() => setConfirmAction(null)}
                title="Confirm Action"
                size="md"
                footer={(
                    <>
                        <Button
                            variant="subtle"
                            onClick={() => setConfirmAction(null)}
                            className="text-[9px] font-black uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="glass"
                            onClick={handleConfirm}
                            disabled={loading.incidents || (confirmAction?.nextStatus === IncidentStatus.CLOSED && !rejectReason.trim())}
                            className="text-[9px] font-black uppercase tracking-widest"
                        >
                            Confirm
                        </Button>
                    </>
                )}
            >
                <div className="space-y-3">
                    <p className="text-sm text-[color:var(--text-sub)]">
                        {confirmAction?.label}
                    </p>
                    <p className="text-xs text-[color:var(--text-sub)]">
                        This will update the incident status for the selected items.
                    </p>
                    {confirmAction?.nextStatus === IncidentStatus.CLOSED && (
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">
                                Rejection Reason
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(event) => setRejectReason(event.target.value)}
                                className="w-full min-h-[80px] px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                                placeholder="Describe why this incident was rejected"
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ReviewQueueTab;
