import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Select } from '../../../../components/UI/Select';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { IncidentStatus, AgentTrustLevel, BulkOperationResult } from '../../types/incident-log.types';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { Modal } from '../../../../components/UI/Modal';
import BulkOperationConfirmModal from '../modals/BulkOperationConfirmModal';

export const ReviewQueueTab: React.FC = () => {
    const {
        incidents,
        loading,
        updateIncident,
        setSelectedIncident,
        refreshIncidents,
        modals,
        // Enhanced bulk operations
        bulkApprove,
        bulkReject,
        bulkOperationResult,
        // Agent trust functionality
        getAgentTrustLevel,
        agentPerformanceMetrics,
        // New modal controls
        setShowBulkOperationModal
    } = useIncidentLogContext();

    const [sourceFilter, setSourceFilter] = useState<'all' | 'manager' | 'agent' | 'device' | 'sensor'>('all');
    
    // Enhanced bulk selection state
    const [selectedIncidentIds, setSelectedIncidentIds] = useState<Set<string>>(new Set());
    const [bulkActionInProgress, setBulkActionInProgress] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const pendingIncidents = useMemo(() => {
        const pending = incidents.filter((incident) => incident.status === IncidentStatus.PENDING_REVIEW);
        if (sourceFilter === 'all') return pending;
        return pending.filter((incident) => (incident.source || '').toLowerCase() === sourceFilter);
    }, [incidents, sourceFilter]);
    
    // Pagination
    const totalPages = Math.ceil(pendingIncidents.length / itemsPerPage);
    const paginatedPendingIncidents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return pendingIncidents.slice(start, start + itemsPerPage);
    }, [pendingIncidents, currentPage, itemsPerPage]);
    
    useEffect(() => {
        // Reset to page 1 when filters change
        setCurrentPage(1);
    }, [sourceFilter]);

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

    // Get agent trust level and styling
    const getAgentTrustBadge = (incidentSourceAgentId?: string) => {
        if (!incidentSourceAgentId) return null;
        
        const trustLevel = getAgentTrustLevel(incidentSourceAgentId);
        const agent = agentPerformanceMetrics.find(a => a.agent_id === incidentSourceAgentId);
        
        switch (trustLevel) {
            case AgentTrustLevel.HIGH:
                return {
                    icon: 'fas fa-shield-check',
                    text: `High Trust (${agent?.trust_score || 'N/A'}%)`,
                    className: 'text-green-300 bg-green-500/20 border border-green-500/30'
                };
            case AgentTrustLevel.MEDIUM:
                return {
                    icon: 'fas fa-shield-exclamation',
                    text: `Medium Trust (${agent?.trust_score || 'N/A'}%)`,
                    className: 'text-yellow-300 bg-yellow-500/20 border border-yellow-500/30'
                };
            case AgentTrustLevel.LOW:
                return {
                    icon: 'fas fa-shield-x',
                    text: `Low Trust (${agent?.trust_score || 'N/A'}%)`,
                    className: 'text-red-300 bg-red-500/20 border border-red-500/30'
                };
            default:
                return {
                    icon: 'fas fa-shield-question',
                    text: 'Unknown Trust',
                    className: 'text-slate-300 bg-slate-500/20 border border-slate-500/30'
                };
        }
    };

    // Bulk selection handlers
    const toggleIncidentSelection = useCallback((incidentId: string) => {
        setSelectedIncidentIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(incidentId)) {
                newSet.delete(incidentId);
            } else {
                newSet.add(incidentId);
            }
            return newSet;
        });
    }, []);

    const selectAllIncidents = useCallback(() => {
        setSelectedIncidentIds(new Set(paginatedPendingIncidents.map(i => i.incident_id)));
    }, [paginatedPendingIncidents]);

    const deselectAllIncidents = useCallback(() => {
        setSelectedIncidentIds(new Set());
    }, []);

    // Enhanced bulk operations using new modal system
    const handleBulkApprove = async () => {
        if (selectedIncidentIds.size === 0) return;
        
        setShowBulkOperationModal(true, {
            type: 'approve',
            incidentIds: Array.from(selectedIncidentIds),
            title: `Approve ${selectedIncidentIds.size} Selected Incidents`,
            description: `This will approve ${selectedIncidentIds.size} incidents submitted by mobile agents.`
        });
    };

    const handleBulkReject = async () => {
        if (selectedIncidentIds.size === 0) return;
        
        setShowBulkOperationModal(true, {
            type: 'reject',
            incidentIds: Array.from(selectedIncidentIds),
            title: `Reject ${selectedIncidentIds.size} Selected Incidents`,
            description: `This will reject ${selectedIncidentIds.size} incidents and require a detailed reason for audit purposes.`
        });
    };

    // Handler for bulk operation modal confirmation
    const handleBulkOperationConfirm = async (reason?: string): Promise<BulkOperationResult | boolean | null> => {
        if (!modals.bulkOperation) return false;
        
        setBulkActionInProgress(true);
        try {
            let result;
            if (modals.bulkOperation.type === 'approve') {
                result = await bulkApprove(modals.bulkOperation.incidentIds, reason || 'Bulk approval via Review Queue');
            } else if (modals.bulkOperation.type === 'reject') {
                result = await bulkReject(modals.bulkOperation.incidentIds, reason || 'Bulk rejection via Review Queue');
            }
            
            if (result && result.failed === 0) {
                setSelectedIncidentIds(new Set());
                await refreshIncidents();
            }
            
            return result || false;
        } catch (error) {
            ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), `bulkOperation-${modals.bulkOperation?.type || 'unknown'}`);
            return false;
        } finally {
            setBulkActionInProgress(false);
        }
    };

    const approveIncident = (id: string) => {
        setShowBulkOperationModal(true, {
            type: 'approve',
            incidentIds: [id],
            title: 'Approve Incident',
            description: 'This will approve the incident submitted by a mobile agent.'
        });
    };

    const rejectIncident = (id: string) => {
        setShowBulkOperationModal(true, {
            type: 'reject',
            incidentIds: [id],
            title: 'Reject Incident',
            description: 'This will reject the incident and require a detailed reason for audit purposes.'
        });
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Review Queue</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Approve or reject incidents submitted by agents
                    </p>
                </div>
            </div>

            <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500/80 to-slate-900 rounded-lg flex items-center justify-center mr-3  border border-white/5">
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
                    {/* Bulk Selection Controls */}
                    {pendingIncidents.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={selectAllIncidents}
                                    disabled={selectedIncidentIds.size === pendingIncidents.length}
                                    className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5"
                                >
                                    <i className="fas fa-check-square mr-1" />
                                    Select All
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={deselectAllIncidents}
                                    disabled={selectedIncidentIds.size === 0}
                                    className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-300 hover:bg-white/5"
                                >
                                    <i className="fas fa-square mr-1" />
                                    Deselect All
                                </Button>
                                {selectedIncidentIds.size > 0 && (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-300">
                                        {selectedIncidentIds.size} Selected
                                    </span>
                                )}
                            </div>
                            
                            {/* Enhanced Bulk Actions - Only show when items selected */}
                            {selectedIncidentIds.size > 0 && (
                                <div className="flex gap-2 pl-4 border-l border-white/5">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleBulkApprove}
                                        disabled={bulkActionInProgress}
                                        className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 font-black uppercase tracking-widest text-[10px] px-4"
                                    >
                                        {bulkActionInProgress ? (
                                            <i className="fas fa-spinner fa-spin mr-1" />
                                        ) : (
                                            <i className="fas fa-check mr-1" />
                                        )}
                                        Approve Selected ({selectedIncidentIds.size})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleBulkReject}
                                        disabled={bulkActionInProgress}
                                        className="border-red-500/30 text-red-300 hover:bg-red-500/10 font-black uppercase tracking-widest text-[10px] px-4"
                                    >
                                        <i className="fas fa-times mr-1" />
                                        Reject Selected ({selectedIncidentIds.size})
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {loading.incidents && incidents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" role="status" aria-label="Loading incidents" />
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
                                Loading Review Queue...
                            </p>
                        </div>
                    ) : pendingIncidents.length === 0 ? (
                        <EmptyState
                            icon="fas fa-inbox"
                            title="No Pending Incidents"
                            description="Agent-submitted incidents will appear here for review."
                            className="bg-black/20 border-dashed border-2 border-white/5"
                        />
                    ) : (
                        <>
                            <div className="space-y-4">
                                {paginatedPendingIncidents.map((incident) => {
                                const sourceLabel = incident.source
                                    || (incident.source_metadata && typeof incident.source_metadata === 'object' && 'source' in incident.source_metadata
                                        ? String(incident.source_metadata.source)
                                        : undefined);
                                
                                // Get agent trust badge if this is an agent-submitted incident
                                const isAgentSubmitted = sourceLabel === 'agent' || incident.source === 'agent';
                                const trustBadge = isAgentSubmitted ? getAgentTrustBadge(incident.source_agent_id) : null;
                                const isSelected = selectedIncidentIds.has(incident.incident_id);
                                
                                return (
                                    <div
                                        key={incident.incident_id}
                                        className={cn(
                                            "p-4 border rounded-lg bg-white/5 hover:bg-white/10 transition-all",
                                            isSelected ? "border-blue-400/50 bg-blue-500/10" : "border-white/5"
                                        )}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Selection Checkbox */}
                                            <div className="flex items-center pt-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleIncidentSelection(incident.incident_id)}
                                                    className="h-4 w-4 text-blue-400 bg-slate-800 border-white/20 rounded focus:ring-blue-500/20 focus:ring-2"
                                                />
                                            </div>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h4 className="font-bold text-white uppercase tracking-wide text-sm">{incident.title}</h4>
                                                    <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded", getSeverityBadgeClass(incident.severity))}>
                                                        {incident.severity}
                                                    </span>
                                                    {sourceLabel && (
                                                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-500/30 text-blue-200 bg-blue-500/10">
                                                            <i className="fas fa-user mr-1" />
                                                            {sourceLabel}
                                                        </span>
                                                    )}
                                                    {/* Agent Trust Score Badge */}
                                                    {trustBadge && (
                                                        <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded", trustBadge.className)}>
                                                            <i className={`${trustBadge.icon} mr-1`} />
                                                            {trustBadge.text}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-400 text-sm mb-2">{incident.description}</p>
                                                <div className="flex items-center space-x-4 text-xs text-slate-500 font-medium">
                                                    <span><i className="fas fa-map-marker-alt mr-1" />{formatLocationDisplay(incident.location) || 'Unknown'}</span>
                                                    <span><i className="fas fa-clock mr-1" />{incident.created_at}</span>
                                                    {/* Show agent name if available */}
                                                    {isAgentSubmitted && incident.source_agent_id && (
                                                        <span><i className="fas fa-user-badge mr-1" />Agent ID: {incident.source_agent_id.slice(0, 8)}...</span>
                                                    )}
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
                            
                            {/* Pagination Controls */}
                            {pendingIncidents.length > 0 && totalPages > 1 && (
                                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">
                                        Showing <span className="text-[color:var(--text-main)]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                        <span className="text-[color:var(--text-main)]">{Math.min(currentPage * itemsPerPage, pendingIncidents.length)}</span> of{' '}
                                        <span className="text-[color:var(--text-main)]">{pendingIncidents.length}</span> pending incidents
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="glass"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="text-[10px] font-black uppercase tracking-widest border-white/5"
                                        >
                                            <i className="fas fa-chevron-left mr-1" />
                                            Previous
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum: number;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={currentPage === pageNum ? 'primary' : 'glass'}
                                                        size="sm"
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className="text-[10px] font-black uppercase tracking-widest min-w-[2rem]"
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                        <Button
                                            variant="glass"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="text-[10px] font-black uppercase tracking-widest border-white/5"
                                        >
                                            Next
                                            <i className="fas fa-chevron-right ml-1" />
                                        </Button>
                                        <Select
                                            id="items-per-page"
                                            value={itemsPerPage.toString()}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="text-[10px] font-black uppercase tracking-widest w-20 ml-2"
                                        >
                                            <option value="10">10</option>
                                            <option value="25">25</option>
                                            <option value="50">50</option>
                                            <option value="100">100</option>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500/80 to-slate-900 rounded-lg flex items-center justify-center mr-3  border border-white/5">
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

            {/* Enhanced Bulk Operation Confirmation Modal */}
            <BulkOperationConfirmModal
                isOpen={modals.showBulkOperationModal}
                onClose={() => setShowBulkOperationModal(false)}
                operation={modals.bulkOperation}
                onConfirm={handleBulkOperationConfirm}
            />
        </div>
    );
};

export default ReviewQueueTab;
