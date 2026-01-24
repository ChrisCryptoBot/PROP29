import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { Avatar } from '../../../../components/UI/Avatar';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { OfficerMatchingPanel } from '../../../../components/PatrolModule';
import { usePatrolContext } from '../../context/PatrolContext';
import { showSuccess, showError } from '../../../../utils/toast';
import { CreateOfficerModal } from '../modals/CreateOfficerModal';
import { DeploymentConfirmationModal } from '../modals/DeploymentConfirmationModal';
import { PatrolEndpoint } from '../../../../services/PatrolEndpoint';
import { PatrolOfficer, UpcomingPatrol } from '../../types';

export const DeploymentTab: React.FC = () => {
    const {
        officers,
        upcomingPatrols,
        setOfficers,
        handleDeployOfficer,
        isOffline
    } = usePatrolContext();

    const [officerSearchQuery, setOfficerSearchQuery] = useState('');
    const [officerStatusFilter, setOfficerStatusFilter] = useState<'all' | 'on-duty' | 'off-duty' | 'break' | 'unavailable'>('all');
    const [showCreateOfficerModal, setShowCreateOfficerModal] = useState(false);
    const [editingOfficer, setEditingOfficer] = useState<PatrolOfficer | null>(null);
    const [showDeployConfirm, setShowDeployConfirm] = useState(false);
    const [deployOfficer, setDeployOfficer] = useState<PatrolOfficer | null>(null);
    const [deployPatrol, setDeployPatrol] = useState<UpcomingPatrol | null>(null);
    const [isDeployConfirming, setIsDeployConfirming] = useState(false);

    const requestDeploy = (officer: PatrolOfficer, patrol: UpcomingPatrol) => {
        if (isOffline) {
            showError('Deployment disabled while offline');
            return;
        }
        setDeployOfficer(officer);
        setDeployPatrol(patrol);
        setShowDeployConfirm(true);
    };

    const handleConfirmDeploy = async () => {
        if (!deployOfficer || !deployPatrol) return;
        setIsDeployConfirming(true);
        try {
            await handleDeployOfficer(deployOfficer.id, deployPatrol.id);
            setShowDeployConfirm(false);
            setDeployOfficer(null);
            setDeployPatrol(null);
        } finally {
            setIsDeployConfirming(false);
        }
    };

    const handleEditOfficer = (officer: PatrolOfficer) => {
        setEditingOfficer(officer);
        setShowCreateOfficerModal(true);
    };

    const handleDeleteOfficer = async (officerId: string) => {
        if (confirm('Are you sure you want to delete this officer? This action cannot be undone.')) {
            try {
                await PatrolEndpoint.deleteOfficer(officerId);
                setOfficers(prev => prev.filter(officer => officer.id !== officerId));
                showSuccess('Officer removed successfully');
            } catch (e) {
                showError('Failed to delete officer');
            }
        }
    };

    // Cleanup modal state on close
    const handleCloseModal = () => {
        setShowCreateOfficerModal(false);
        setEditingOfficer(null);
    };

    const filteredOfficers = useMemo(() => {
        let filtered = officers || [];

        if (officerStatusFilter !== 'all') {
            filtered = filtered.filter(o => o && o.status === officerStatusFilter);
        }

        const query = officerSearchQuery.toLowerCase().trim();
        if (query) {
            filtered = filtered.filter(officer => {
                const specializationsStr = (officer.specializations || []).join(' ').toLowerCase();
                return (
                    (officer.name || '').toLowerCase().includes(query) ||
                    (officer.location || '').toLowerCase().includes(query) ||
                    specializationsStr.includes(query)
                );
            });
        }
        return filtered;
    }, [officers, officerSearchQuery, officerStatusFilter]);

    // Find next scheduled patrol for AI matching context
    const nextScheduledPatrol = useMemo(() => {
        return upcomingPatrols.find(p => p && p.status === 'scheduled');
    }, [upcomingPatrols]);

    return (
        <div className="space-y-6" role="main" aria-label="Patrol Deployment">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Deployment</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Assign officers and manage coverage
                    </p>
                </div>
            </div>
            {/* AI Officer Matching */}
            {nextScheduledPatrol && officers.length > 0 ? (
                <OfficerMatchingPanel
                    selectedPatrol={{
                        id: nextScheduledPatrol.id,
                        name: nextScheduledPatrol.name || 'Unnamed Patrol',
                        location: nextScheduledPatrol.location || 'Unknown',
                        priority: nextScheduledPatrol.priority || 'medium',
                        estimatedDuration: nextScheduledPatrol.duration || '45 min'
                    }}
                    officers={officers.map(o => ({
                        ...o,
                        activePatrols: upcomingPatrols.filter(p =>
                            p && p.assignedOfficer === o.name && p.status === 'in-progress'
                        ).length
                    }))}
                    onSelectOfficer={(officerId) => {
                        if (!officerId) { showError('Invalid officer ID'); return; }
                        const officer = officers.find(o => o.id === officerId);
                        if (!officer) { showError('Officer not found'); return; }
                        requestDeploy(officer, nextScheduledPatrol);
                    }}
                />
            ) : (
                <EmptyState
                    icon="fas fa-microchip"
                    title="No scheduled patrols for matching"
                    description="Schedule a patrol to get officer recommendations"
                />
            )}

            <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl">
                <CardHeader className="border-b border-white/5 pb-6 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center text-white">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5 shadow-lg">
                                <i className="fas fa-users text-white"></i>
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest">Officer Roster</span>
                        </span>
                        <div className="flex items-center space-x-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">{filteredOfficers.length} OFFICER(S) FOUND</span>
                            <Button
                                onClick={() => setShowCreateOfficerModal(true)}
                                variant="glass"
                                className="border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 h-10 px-6"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Register Officer
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    {/* Filters */}
                    <div className="mb-8 flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <SearchBar
                                value={officerSearchQuery}
                                onChange={setOfficerSearchQuery}
                                placeholder="Filter by officer name, role, or shift..."
                                debounceMs={300}
                                className="bg-slate-900/50 border-white/5 text-white placeholder-slate-500 h-11"
                            />
                        </div>
                        <div className="md:w-64">
                            <select
                                value={officerStatusFilter}
                                onChange={(e) => setOfficerStatusFilter(e.target.value as any)}
                                className="w-full px-4 py-2 border border-white/5 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-900/50 text-slate-300 focus:ring-0 focus:border-indigo-500/40 h-11 transition-all"
                            >
                                <option value="all" className="bg-slate-900">ALL STATUSES</option>
                                <option value="on-duty" className="bg-slate-900">ON DUTY</option>
                                <option value="off-duty" className="bg-slate-900">OFF DUTY</option>
                                <option value="break" className="bg-slate-900">MANDATORY BREAK</option>
                                <option value="unavailable" className="bg-slate-900">UNAVAILABLE</option>
                            </select>
                        </div>
                    </div>
                    {/* List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredOfficers.length > 0 ? (
                            filteredOfficers.map(officer => {
                                const isDeployed = officer.status === 'on-duty';
                                const hasActivePatrol = upcomingPatrols.some(p => p.assignedOfficer === officer.name && p.status === 'in-progress');

                                return (
                                    <div key={officer.id} className="p-5 border border-white/5 rounded-2xl bg-slate-900/30 hover:border-indigo-500/20 transition-all duration-300 group shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all"></div>

                                        <div className="flex items-center space-x-4 mb-5">
                                            <Avatar className="h-14 w-14 border border-white/10 shadow-2xl rounded-xl overflow-hidden ring-4 ring-indigo-500/5 group-hover:ring-indigo-500/15 transition-all">
                                                <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-blue-600/80 to-slate-900 text-white text-base font-black shadow-inner">
                                                    {officer.avatar || '?'}
                                                </div>
                                            </Avatar>
                                            <div>
                                                <p className="font-black text-white text-base uppercase tracking-widest">{officer.name}</p>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{officer.experience} EXP OFFICER</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${isDeployed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    officer.status === 'break' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        officer.status === 'off-duty' ? 'bg-slate-500/10 text-slate-400 border-white/5' :
                                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>{officer.status.toUpperCase()}</div>
                                                {hasActivePatrol && <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 animate-pulse flex items-center"><i className="fas fa-satellite-dish mr-1.5"></i>LIVE</span>}
                                            </div>
                                            {officer.connection_status && (
                                                <p className="text-[9px] font-mono uppercase tracking-wider text-slate-500">
                                                    Device: <span className={officer.connection_status === 'online' ? 'text-emerald-400' : officer.connection_status === 'offline' ? 'text-amber-400' : 'text-slate-400'}>{officer.connection_status}</span>
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-2 h-14 overflow-hidden content-start pt-1">
                                                {officer.specializations.map(s => <Badge key={s} variant="outline" className="text-[9px] font-black uppercase tracking-widest border-white/5 text-slate-500 bg-white/5">{s}</Badge>)}
                                            </div>

                                            <Button
                                                size="sm"
                                                className={`w-full h-10 text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all ${isDeployed
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                                                    : !nextScheduledPatrol || isOffline
                                                        ? 'bg-slate-900/50 text-slate-600 cursor-not-allowed border border-white/5'
                                                        : 'variant-glass bg-indigo-600/10 border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300'}`}
                                                onClick={() => {
                                                    if (!nextScheduledPatrol) { showError('No scheduled patrol available'); return; }
                                                    requestDeploy(officer, nextScheduledPatrol);
                                                }}
                                                disabled={isDeployed || !nextScheduledPatrol || isOffline}
                                            >
                                                <i className={`fas ${isDeployed ? 'fa-check-double' : 'fa-bolt'} mr-2`}></i>
                                                {isDeployed ? 'ON DUTY' : !nextScheduledPatrol ? 'NO PATROL' : isOffline ? 'OFFLINE' : 'ASSIGN PATROL'}
                                            </Button>

                                            <div className="flex gap-2 pt-1">
                                                <Button
                                                    size="sm"
                                                    variant="glass"
                                                    className="flex-1 text-[9px] font-black uppercase tracking-widest h-8 border-white/5 text-slate-500"
                                                    onClick={() => handleEditOfficer(officer)}
                                                >
                                                    Modify
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="glass"
                                                    className="flex-1 text-[9px] font-black uppercase tracking-widest h-8 border-white/5 text-red-500/60 hover:text-red-400 hover:border-red-500/30"
                                                    onClick={() => handleDeleteOfficer(officer.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-12">
                                <EmptyState title="No officers found" icon="fas fa-user-slash" description="Adjust your filters to see more results" />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <CreateOfficerModal
                isOpen={showCreateOfficerModal}
                onClose={handleCloseModal}
                editingOfficer={editingOfficer}
            />
            <DeploymentConfirmationModal
                isOpen={showDeployConfirm}
                onClose={() => { setShowDeployConfirm(false); setDeployOfficer(null); setDeployPatrol(null); }}
                officer={deployOfficer}
                patrol={deployPatrol}
                onConfirm={handleConfirmDeploy}
                isConfirming={isDeployConfirming}
            />
        </div >
    );
};
