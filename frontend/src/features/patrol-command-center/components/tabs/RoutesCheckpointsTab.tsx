import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { usePatrolContext } from '../../context/PatrolContext';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../../utils/toast';
import { retryWithBackoff } from '../../../../utils/retryWithBackoff';
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';
import { PatrolEndpoint } from '../../../../services/PatrolEndpoint';
import { formatLocationDisplay } from '../../../../utils/formatLocation';
import { PatrolRoute, Checkpoint } from '../../types';

import { CreateRouteModal } from '../modals/CreateRouteModal';
import { AddCheckpointModal } from '../modals/AddCheckpointModal';
import { ViewRouteModal } from '../modals/ViewRouteModal';
import { ViewCheckpointModal } from '../modals/ViewCheckpointModal';

export const RoutesCheckpointsTab: React.FC = () => {
    const {
        routes,
        upcomingPatrols,
        officers,
        setRoutes,
        refreshPatrolData,
        handleDeleteRoute,
        handleDeleteCheckpoint,
        selectedPropertyId
    } = usePatrolContext();


    // Modal & Selection State
    const [showCreateRoute, setShowCreateRoute] = useState(false);
    const [editingRoute, setEditingRoute] = useState<PatrolRoute | null>(null);
    const [viewingRoute, setViewingRoute] = useState<PatrolRoute | null>(null);

    const [showAddCheckpoint, setShowAddCheckpoint] = useState(false);
    const [editingCheckpoint, setEditingCheckpoint] = useState<Checkpoint | null>(null);
    const [viewingCheckpoint, setViewingCheckpoint] = useState<Checkpoint | null>(null);

    return (
        <div className="space-y-6" role="main" aria-label="Routes and Checkpoints">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">Routes & Checkpoints</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
                        Define patrol routes and checkpoints
                    </p>
                </div>
            </div>

            {/* Route Management */}
                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center text-white">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5">
                                <i className="fas fa-route text-white"></i>
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest">Patrol Routes</span>
                        </span>
                        <Button
                            variant="glass"
                            onClick={() => { setEditingRoute(null); setShowCreateRoute(true); }}
                            className="border-white/5 hover:border-blue-500/30 text-white h-10 px-6"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Create Route
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="space-y-4">
                        {routes.length > 0 ? (
                            routes.map(route => {
                                if (!route) return null;
                                return (
                                    <div key={route.id} className="p-4 border border-white/5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-[color:var(--text-main)] text-lg">{route.name}</h3>
                                                    <Badge variant={route.isActive ? 'success' : 'secondary'} className="glass-card border-none">{route.isActive ? 'Active' : 'Inactive'}</Badge>
                                                </div>
                                                <p className="text-sm text-[color:var(--text-sub)] mt-1">{route.description}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Badge variant={route.difficulty === 'hard' ? 'destructive' : route.difficulty === 'medium' ? 'warning' : 'default'} className="glass-card border-none opacity-80">{route.difficulty}</Badge>
                                                <Badge variant="secondary" className="glass-card border-none opacity-80">{route.frequency}</Badge>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm bg-black/20 p-3 rounded-lg border border-white/5">
                                            <div className="flex justify-between md:justify-start md:gap-2"><span className="text-slate-500">Duration:</span> <span className="font-mono text-blue-300">{route.estimatedDuration}</span></div>
                                            <div className="flex justify-between md:justify-start md:gap-2"><span className="text-slate-500">Checkpoints:</span> <span className="font-mono text-blue-300">{route.checkpoints?.length || 0}</span></div>
                                            <div className="flex justify-between md:justify-start md:gap-2"><span className="text-slate-500">Performance:</span> <span className="font-mono text-green-300">{route.performanceScore ?? 0}%</span></div>
                                        </div>
                                        <div className="flex space-x-2 justify-end">
                                            <Button size="sm" variant="glass" onClick={() => setViewingRoute(route)} className="border-white/5 text-slate-300"><i className="fas fa-eye mr-1"></i> View</Button>
                                            <Button size="sm" variant="glass" onClick={() => { setEditingRoute(route); setShowCreateRoute(true); }} className="border-white/5 text-slate-300"><i className="fas fa-edit mr-1"></i> Edit</Button>
                                            <Button size="sm" variant="glass" onClick={() => handleDeleteRoute(route.id)} className="border-red-500/20 text-red-400 hover:border-red-500/40"><i className="fas fa-trash mr-1"></i> Delete</Button>
                                            <Button
                                                size="sm"
                                                variant="glass"
                                                onClick={async () => {
                                                    if (!route.checkpoints?.length) {
                                                        showError('Route has no checkpoints');
                                                        return;
                                                    }
                                                    
                                                    // Check for available officers
                                                    const availableOfficers = officers.filter(o => o.status !== 'on-duty');
                                                    if (availableOfficers.length === 0) {
                                                        showError('No available officers. All officers are currently on duty.');
                                                        return;
                                                    }
                                                    
                                                    const toastId = showLoading('Starting patrol...');
                                                    try {
                                                        await retryWithBackoff(
                                                            () => PatrolEndpoint.createPatrol({
                                                                property_id: selectedPropertyId || undefined,
                                                                patrol_type: 'scheduled',
                                                                route: {
                                                                    name: route.name,
                                                                    description: route.description,
                                                                    estimated_duration: route.estimatedDuration,
                                                                    priority: 'medium',
                                                                    route_id: route.id
                                                                },
                                                                checkpoints: route.checkpoints || []
                                                            }),
                                                            {
                                                                maxRetries: 3,
                                                                baseDelay: 1000,
                                                                maxDelay: 5000
                                                            }
                                                        );
                                                        await refreshPatrolData();
                                                        dismissLoadingAndShowSuccess(toastId, `Patrol started for "${route.name}"`);
                                                    } catch (error) {
                                                        dismissLoadingAndShowError(toastId, 'Failed to start patrol. Please try again.');
                                                        ErrorHandlerService.handle(error, 'startPatrolFromRoute');
                                                    }
                                                }}
                                                disabled={!route.checkpoints?.length}
                                                className="border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 ml-2"
                                            >
                                                <i className="fas fa-play mr-1"></i> Start Patrol
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <EmptyState icon="fas fa-route" title="No patrol routes" description="Create routes to organize patrol checkpoints" />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Checkpoint Management */}
                <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center text-white">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 border border-white/5">
                                <i className="fas fa-map-marker-alt text-white"></i>
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest">Checkpoint Management</span>
                        </span>
                        <Button
                            variant="glass"
                            onClick={() => { setEditingCheckpoint(null); setShowAddCheckpoint(true); }}
                            className="border-white/5 hover:border-blue-500/30 text-white h-10 px-6"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Add Checkpoint
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 px-6 pb-6">
                    <div className="space-y-4">
                        {(() => {
                            const allCheckpoints = routes
                                .filter(r => r?.checkpoints?.length > 0)
                                .flatMap(r => (r.checkpoints || []).map(cp => ({ ...cp, routeId: r.id })));

                            return allCheckpoints.length > 0 ? (
                                allCheckpoints.map(checkpoint => (
                                    <div
                                        key={checkpoint.id}
                                        className={`flex items-center justify-between p-4 rounded-lg transition-colors border-l-4 ${
                                            checkpoint.isCritical
                                                ? 'border-l-red-500 bg-red-500/5 border border-red-500/20 hover:bg-red-500/10'
                                                : 'border-l-transparent border border-white/5 bg-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                {checkpoint.isCritical && <i className="fas fa-exclamation-triangle text-red-400 text-sm" title="Critical checkpoint" />}
                                                <h3 className="font-bold text-[color:var(--text-main)]">{checkpoint.name}</h3>
                                                {checkpoint.isCritical && <Badge variant="destructive" className="text-[10px] uppercase">Critical</Badge>}
                                            </div>
                                            <p className="text-sm text-[color:var(--text-sub)] mt-0.5"><i className="fas fa-map-pin mr-1 text-slate-500"></i>{formatLocationDisplay(checkpoint.location) || '—'}</p>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant={checkpoint.type === 'security' ? 'destructive' : checkpoint.type === 'safety' ? 'warning' : 'default'} className="glass-card border-none bg-black/20 text-slate-300">{checkpoint.type}</Badge>
                                                <span className="text-xs font-mono text-slate-500 bg-black/20 px-2 py-0.5 rounded">Est: {checkpoint.estimatedTime ?? 0} min</span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button size="sm" variant="glass" onClick={() => setViewingCheckpoint(checkpoint)} className="border-white/5 text-slate-300"><i className="fas fa-map-marker-alt mr-1"></i> View</Button>
                                            <Button size="sm" variant="glass" onClick={() => { setEditingCheckpoint(checkpoint); setShowAddCheckpoint(true); }} className="border-white/5 text-slate-300"><i className="fas fa-edit mr-1"></i> Edit</Button>
                                            <Button size="sm" variant="glass" onClick={() => handleDeleteCheckpoint(checkpoint.id, checkpoint.routeId)} className="border-red-500/20 text-red-400 hover:border-red-500/40"><i className="fas fa-trash mr-1"></i> Delete</Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState icon="fas fa-map-marker-alt" title="No checkpoints" description="Add checkpoints to routes" />
                            );
                        })()}
                    </div>
                </CardContent>
            </Card>

            {/* Modals */}
            {showCreateRoute && (
                <CreateRouteModal
                    isOpen={showCreateRoute}
                    onClose={() => { setShowCreateRoute(false); setEditingRoute(null); }}
                    initialData={editingRoute}
                />
            )}
            {showAddCheckpoint && (
                <AddCheckpointModal
                    isOpen={showAddCheckpoint}
                    onClose={() => { setShowAddCheckpoint(false); setEditingCheckpoint(null); }}
                    initialData={editingCheckpoint}
                />
            )}
            <ViewRouteModal
                isOpen={!!viewingRoute}
                onClose={() => setViewingRoute(null)}
                route={viewingRoute}
            />
            <ViewCheckpointModal
                isOpen={!!viewingCheckpoint}
                onClose={() => setViewingCheckpoint(null)}
                checkpoint={viewingCheckpoint}
            />
        </div>
    );
};
