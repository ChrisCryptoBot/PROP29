import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Select } from '../../../../components/UI/Select';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { cn } from '../../../../utils/cn';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { IncidentStatus } from '../../types/incident-log.types';
import { getSeverityBadgeClass, getStatusBadgeClass, getTypeIcon } from '../../utils/badgeHelpers';
import { EmptyState } from '../../../../components/UI/EmptyState';

export const IncidentsTab: React.FC = () => {
    const {
        incidents,
        loading,
        refreshIncidents,
        setSelectedIncident,
        updateIncident,
        deleteIncident,
        bulkDelete,
        bulkStatusChange,
        setShowCreateModal,
        setShowAdvancedFilters,
        resolveIncident: resolveAction
    } = useIncidentLogContext();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filter, setFilter] = useState<'all' | IncidentStatus>(() => {
        const saved = localStorage.getItem('incident-log-status-filter');
        return (saved as 'all' | IncidentStatus) || 'all';
    });
    const [sourceFilter, setSourceFilter] = useState<'all' | 'manager' | 'agent' | 'device' | 'sensor'>(() => {
        const saved = localStorage.getItem('incident-log-source-filter');
        return (saved as 'all' | 'manager' | 'agent' | 'device' | 'sensor') || 'all';
    });

    // Persist filters to localStorage
    useEffect(() => {
        localStorage.setItem('incident-log-status-filter', filter);
    }, [filter]);

    useEffect(() => {
        localStorage.setItem('incident-log-source-filter', sourceFilter);
    }, [sourceFilter]);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const filteredIncidents = useMemo(() => {
        let data = incidents;
        if (filter !== 'all') {
            data = data.filter(i => i.status === filter);
        }
        if (sourceFilter !== 'all') {
            data = data.filter(i => (i.source || '').toLowerCase() === sourceFilter);
        }
        return data;
    }, [incidents, filter, sourceFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
    const paginatedIncidents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredIncidents.slice(start, start + itemsPerPage);
    }, [filteredIncidents, currentPage, itemsPerPage]);

    useEffect(() => {
        // Reset to page 1 when filters change
        setCurrentPage(1);
    }, [filter, sourceFilter]);

    const handleSelectAll = () => {
        if (selectedIds.length === filteredIncidents.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedIncidents.map(i => i.incident_id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="page-title">Incident Management</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Review, filter, and act on live incidents
                    </p>
                </div>
            </div>
            {/* PRINT ONLY LAYOUT */}
            <div className="print-only-container hidden">
                <div className="print-header">
                    <h1 className="print-title">Incident Report Log</h1>
                    <div className="text-sm text-gray-500 mt-2">Generated: {new Date().toLocaleString()}</div>
                </div>

                <div className="watermark">CONFIDENTIAL</div>

                <div className="space-y-8">
                    {selectedIds.length > 0 ? (
                        // Print selected incidents only
                        filteredIncidents
                            .filter(i => selectedIds.includes(i.incident_id))
                            .map(incident => (
                                <div key={incident.incident_id} className="border-b-2 border-dashed border-gray-300 pb-8 break-inside-avoid">
                                    <div className="print-meta">
                                        <div><strong>ID:</strong> {incident.incident_id}</div>
                                        <div><strong>Type:</strong> <span className="uppercase">{incident.incident_type}</span></div>
                                        <div><strong>Date:</strong> {incident.created_at}</div>
                                        <div><strong>Location:</strong> {formatLocationDisplay(incident.location) || 'Unknown'}</div>
                                        <div><strong>Severity:</strong> <span className="badge-print">{incident.severity}</span></div>
                                        <div><strong>Status:</strong> <span className="badge-print">{incident.status}</span></div>
                                    </div>
                                    <div className="mb-4">
                                        <strong>Title:</strong>
                                        <div className="text-xl font-bold mt-1">{incident.title}</div>
                                    </div>
                                    <div>
                                        <strong>Description:</strong>
                                        <p className="mt-2 text-justify leading-relaxed">{incident.description}</p>
                                    </div>
                                </div>
                            ))
                    ) : (
                        // If nothing selected, print current view list summary
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b-2 border-black">
                                    <th className="py-2">ID</th>
                                    <th className="py-2">Date</th>
                                    <th className="py-2">Type</th>
                                    <th className="py-2">Title</th>
                                    <th className="py-2">Severity</th>
                                    <th className="py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIncidents.map(incident => (
                                    <tr key={incident.incident_id} className="border-b border-gray-200">
                                        <td className="py-2 font-mono text-xs">{incident.incident_id.substring(0, 8)}</td>
                                        <td className="py-2">{new Date(incident.created_at).toLocaleDateString()}</td>
                                        <td className="py-2 uppercase text-xs font-bold">{incident.incident_type}</td>
                                        <td className="py-2">{incident.title}</td>
                                        <td className="py-2"><span className="badge-print text-xs">{incident.severity}</span></td>
                                        <td className="py-2"><span className="badge-print text-xs">{incident.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="mt-12 pt-8 border-t border-black text-center text-xs text-gray-500">
                    <p>PROPER 2.9 SECURITY CONSOLE - OFFICIAL RECORD</p>
                    <p>Contains Confidential Information - Do Not Distribute Without Authorization</p>
                </div>
            </div>

            {/* SCREEN LAYOUT */}
            <Card className="bg-slate-900/50 border border-white/5 no-print">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                                <i className="fas fa-tasks text-white" />
                            </div>
                            <span className="card-title-text">Incident Management</span>
                        </CardTitle>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAdvancedFilters(true)}
                                className="border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                            >
                                <i className="fas fa-filter mr-2" />
                                Advanced Filters
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                                className="border-white/5 text-slate-300 hover:bg-white/5 hover:text-white"
                            >
                                <i className="fas fa-print mr-2" />
                                Print Report
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => refreshIncidents()} disabled={loading.incidents} className="border-white/5 text-slate-300 hover:bg-white/5 hover:text-white">
                                <i className={cn("fas fa-sync-alt mr-2", loading.incidents && "animate-spin")} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-white/5",
                                filter === 'all' ? "text-white bg-white/10" : "text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                            )}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-amber-500/30",
                                filter === IncidentStatus.PENDING_REVIEW ? "text-amber-200 bg-amber-500/10" : "text-amber-300 hover:bg-amber-500/10"
                            )}
                            onClick={() => setFilter(IncidentStatus.PENDING_REVIEW)}
                        >
                            Pending Review
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-red-500/30",
                                filter === IncidentStatus.OPEN ? "text-red-200 bg-red-500/10" : "text-red-300 hover:bg-red-500/10"
                            )}
                            onClick={() => setFilter(IncidentStatus.OPEN)}
                        >
                            Open
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-blue-500/30",
                                filter === IncidentStatus.INVESTIGATING ? "text-blue-200 bg-blue-500/10" : "text-blue-300 hover:bg-blue-500/10"
                            )}
                            onClick={() => setFilter(IncidentStatus.INVESTIGATING)}
                        >
                            Investigating
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-emerald-500/30",
                                filter === IncidentStatus.RESOLVED ? "text-emerald-200 bg-emerald-500/10" : "text-emerald-300 hover:bg-emerald-500/10"
                            )}
                            onClick={() => setFilter(IncidentStatus.RESOLVED)}
                        >
                            Resolved
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest border-orange-500/30",
                                filter === IncidentStatus.CLOSED ? "text-orange-200 bg-orange-500/10" : "text-orange-300 hover:bg-orange-500/10"
                            )}
                            onClick={() => setFilter(IncidentStatus.CLOSED)}
                        >
                            Closed
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
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
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="glass"
                            className="text-[9px] font-black uppercase tracking-widest"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <i className="fas fa-plus mr-2" />
                            Create Incident
                        </Button>
                        {selectedIds.length > 0 && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-[9px] font-black uppercase tracking-widest border-red-500/30 text-red-400 hover:bg-red-500/10"
                                    onClick={() => bulkDelete(selectedIds)}
                                >
                                    <i className="fas fa-trash mr-2" />
                                    Delete Selected ({selectedIds.length})
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-[9px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                    onClick={() => bulkStatusChange(selectedIds, IncidentStatus.RESOLVED)}
                                >
                                    <i className="fas fa-check mr-2" />
                                    Mark Resolved
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Incident List */}
            <Card className="bg-slate-900/50 border border-white/5 mb-8 no-print">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                                <i className="fas fa-list-alt text-white" aria-hidden />
                            </div>
                            <span className="card-title-text">All Incidents ({filteredIncidents.length})</span>
                        </span>
                        <Button variant="outline" size="sm" onClick={handleSelectAll} className="border-white/5 text-slate-300 hover:bg-white/5 hover:text-white">
                            {selectedIds.length === paginatedIncidents.length ? 'Deselect All' : 'Select All'}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading.incidents && incidents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" role="status" aria-label="Loading incidents" />
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
                                    Loading Incidents...
                                </p>
                            </div>
                        ) : paginatedIncidents.length === 0 ? (
                            <EmptyState
                                icon="fas fa-list-alt"
                                title="No Incidents Found"
                                description="There are no incidents matching your criteria."
                                className="bg-black/20 border-dashed border-2 border-white/5"
                                action={{
                                    label: "CREATE INCIDENT",
                                    onClick: () => setShowCreateModal(true),
                                    variant: "outline"
                                }}
                            />
                        ) : (
                            paginatedIncidents.map((incident) => {
                                const id = incident.incident_id;
                                const isSelected = selectedIds.includes(id);
                                const sourceLabel = incident.source
                                    || (incident.source_metadata && typeof incident.source_metadata === 'object' && 'source' in incident.source_metadata
                                        ? String(incident.source_metadata.source)
                                        : undefined);
                                return (
                                    <div
                                        key={id}
                                        className={cn(
                                            "p-4 border rounded-md transition-all cursor-pointer",
                                            isSelected
                                                ? "border-white/30 bg-white/10"
                                                : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                        )}
                                        onClick={() => toggleSelect(id)}
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
                                                    {sourceLabel && (
                                                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-500/30 text-blue-200 bg-blue-500/10">
                                                            {sourceLabel}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-400 text-sm mb-2">{incident.description}</p>
                                                <div className="flex items-center space-x-4 text-xs text-slate-500 font-medium">
                                                    <span><i className="fas fa-map-marker-alt mr-1" />{formatLocationDisplay(incident.location) || 'Unknown'}</span>
                                                    <span><i className="fas fa-clock mr-1" />{incident.created_at}</span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                                                <Button size="sm" variant="outline" onClick={() => setSelectedIncident(incident)} className="border-white/5 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white font-black uppercase tracking-widest text-[10px] px-4">
                                                    View
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleResolve(id)} className="border-white/5 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white font-black uppercase tracking-widest text-[10px] px-4">
                                                    Resolve
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    
                    {/* Pagination Controls */}
                    {filteredIncidents.length > 0 && totalPages > 1 && (
                        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                            <div className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">
                                Showing <span className="text-[color:var(--text-main)]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                <span className="text-[color:var(--text-main)]">{Math.min(currentPage * itemsPerPage, filteredIncidents.length)}</span> of{' '}
                                <span className="text-[color:var(--text-main)]">{filteredIncidents.length}</span> incidents
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="glass"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="text-[10px] font-black uppercase tracking-widest border-white/5"
                                    aria-label="Previous page"
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
                                    aria-label="Next page"
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
                </CardContent>
            </Card>
        </div>
    );

    async function handleResolve(id: string) {
        await resolveAction(id);
    }
};

export default IncidentsTab;



