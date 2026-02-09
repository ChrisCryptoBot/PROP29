import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { Avatar } from '../../../../components/UI/Avatar';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { Select } from '../../../../components/UI/Select';
import { usePatrolContext } from '../../context/PatrolContext';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../../utils/toast';
import { retryWithBackoff } from '../../../../utils/retryWithBackoff';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';
import { CreateOfficerModal } from '../modals/CreateOfficerModal';
import { DeploymentConfirmationModal } from '../modals/DeploymentConfirmationModal';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingOfficerId, setDeletingOfficerId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleDeleteOfficer = (officerId: string) => {
        setDeletingOfficerId(officerId);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteOfficer = async () => {
        if (!deletingOfficerId) return;
        setIsDeleting(true);
        const toastId = showLoading('Deleting officer...');
        
        // Check if officer is assigned to active patrol
        const officer = officers.find(o => o.id === deletingOfficerId);
        if (officer && officer.status === 'on-duty' && officer.currentPatrol) {
            const activePatrol = upcomingPatrols.find(p => p.id === officer.currentPatrol && p.status === 'in-progress');
            if (activePatrol) {
                dismissLoadingAndShowError(toastId, 'Cannot delete officer assigned to active patrol. Reassign or complete patrol first.');
                setIsDeleting(false);
                return;
            }
        }

        try {
            await retryWithBackoff(
                () => PatrolEndpoint.deleteOfficer(deletingOfficerId),
                {
                    maxRetries: 3,
                    baseDelay: 1000,
                    maxDelay: 5000
                }
            );
            setOfficers(prev => prev.filter(officer => officer.id !== deletingOfficerId));
            dismissLoadingAndShowSuccess(toastId, 'Officer removed successfully');
            setShowDeleteConfirm(false);
            setDeletingOfficerId(null);
        } catch (e) {
            dismissLoadingAndShowError(toastId, 'Failed to delete officer. Please try again.');
            ErrorHandlerService.handle(e, 'deleteOfficer');
        } finally {
            setIsDeleting(false);
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
                    <h2 className="page-title">Deployment</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Assign officers and manage coverage
                    </p>
                </div>
            </div>

            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-6 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center text-white">
                            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                                <i className="fas fa-users text-white"></i>
                            </div>
                            <span className="card-title-text">Officer Roster</span>
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
                            <Select
                                value={officerStatusFilter}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOfficerStatusFilter(e.target.value as 'all' | 'on-duty' | 'off-duty' | 'break' | 'unavailable')}
                                className="h-11"
                            >
                                <option value="all">ALL STATUSES</option>
                                <option value="on-duty">ON DUTY</option>
                                <option value="off-duty">OFF DUTY</option>
                                <option value="break">MANDATORY BREAK</option>
                                <option value="unavailable">UNAVAILABLE</option>
                            </Select>
                        </div>
                    </div>
                    {/* List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredOfficers.length > 0 ? (
                            filteredOfficers.map(officer => {
                                const isDeployed = officer.status === 'on-duty';
                                const hasActivePatrol = upcomingPatrols.some(p => p.assignedOfficer === officer.name && p.status === 'in-progress');

                                return (
                                    <div key={officer.id} className="p-5 border border-white/5 rounded-md bg-slate-900/30 hover:border-indigo-500/20 transition-colors group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all"></div>

                                        <div className="flex items-center space-x-4 mb-5">
                                            <Avatar className="h-14 w-14 border border-white/5 rounded-md overflow-hidden ring-4 ring-indigo-500/5 group-hover:ring-indigo-500/15 transition-colors">
                                                <div className="flex items-center justify-center h-full w-full bg-blue-600 text-white text-base font-black shadow-inner">
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
                                                className={`w-full h-10 text-[10px] font-black uppercase tracking-widest transition-all ${isDeployed
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
            <ConfirmDeleteModal
                isOpen={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setDeletingOfficerId(null); }}
                onConfirm={confirmDeleteOfficer}
                title="Delete Officer"
                message="Are you sure you want to delete this officer?"
                itemName={deletingOfficerId ? officers.find(o => o.id === deletingOfficerId)?.name : undefined}
                isDeleting={isDeleting}
            />
        </div >
    );
};
