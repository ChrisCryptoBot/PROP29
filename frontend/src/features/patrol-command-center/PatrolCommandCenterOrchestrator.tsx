import React, { useEffect, useMemo, useRef } from 'react';
import { PatrolContext, usePatrolContext } from './context/PatrolContext';
import { usePatrolState } from './hooks/usePatrolState';
import { usePatrolWebSocket } from './hooks/usePatrolWebSocket';
import { usePatrolTelemetry } from './hooks/usePatrolTelemetry';

// Tabs
import { OverviewTab } from './components/tabs/OverviewTab';
import { PatrolManagementTab } from './components/tabs/PatrolManagementTab';
import { DeploymentTab } from './components/tabs/DeploymentTab';
import { RoutesCheckpointsTab } from './components/tabs/RoutesCheckpointsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { Card, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import { EmptyState } from '../../components/UI/EmptyState';
import { Select } from '../../components/UI/Select';
import ModuleShell from '../../components/Layout/ModuleShell';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';

const PatrolGlobalRefresh: React.FC = () => {
    const { register, unregister } = useGlobalRefresh();
    const { refreshPatrolData } = usePatrolContext();

    // Use ref to store latest refreshPatrolData function to prevent re-registration loops
    const refreshPatrolDataRef = useRef(refreshPatrolData);
    useEffect(() => {
        refreshPatrolDataRef.current = refreshPatrolData;
    }, [refreshPatrolData]);

    // register and unregister are stable (useCallback with empty deps in GlobalRefreshContext)
    // We use an empty dependency array to prevent re-registration on every render
    useEffect(() => {
        const handler = async () => {
            await refreshPatrolDataRef.current();
        };
        register('patrol-command-center', handler);
        return () => unregister('patrol-command-center');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - register/unregister are stable, refreshPatrolData is accessed via ref

    return null;
};

const PatrolCommandCenterLayout: React.FC = () => {
    const {
        activeTab,
        setActiveTab,
        properties,
        selectedPropertyId,
        setSelectedPropertyId,
        isOffline,
        settings,
        checkInQueuePendingCount,
        checkInQueueFailedCount,
        operationQueuePendingCount,
        operationQueueFailedCount,
        lastSyncTimestamp,
        setUpcomingPatrols,
        setOfficers,
        setAlerts,
        setEmergencyStatus,
        refreshPatrolData
    } = React.useContext(PatrolContext)!;
    const { triggerGlobalRefresh } = useGlobalRefresh();
    const { trackAction } = usePatrolTelemetry();

    // WebSocket integration for real-time updates
    usePatrolWebSocket({
        onPatrolUpdated: (patrol) => {
            setUpcomingPatrols(prev => prev.map(p => p.id === patrol.id ? patrol : p));
            trackAction('patrol_updated', 'patrol', { patrolId: patrol.id });
        },
        onCheckpointCheckIn: (data) => {
            setUpcomingPatrols(prev => prev.map(p => {
                if (p.id === data.patrolId) {
                    const checkpoints = p.checkpoints?.map(cp =>
                        cp.id === data.checkpointId ? data.checkpoint : cp
                    ) || [data.checkpoint];
                    return { ...p, checkpoints };
                }
                return p;
            }));
            trackAction('checkpoint_checkin', 'checkpoint', {
                patrolId: data.patrolId,
                checkpointId: data.checkpointId
            });
        },
        onOfficerStatusChange: (officer) => {
            setOfficers(prev => prev.map(o => o.id === officer.id ? officer : o));
            trackAction('officer_status_changed', 'officer', { officerId: officer.id });
        },
        onEmergencyAlert: (alert) => {
            setAlerts(prev => [alert, ...prev]);
            trackAction('emergency_alert', 'emergency', { alertId: alert.id });
        },
        onLocationUpdate: (data) => {
            // Update officer location if needed
            setOfficers(prev => prev.map(o => {
                if (o.id === data.officerId) {
                    return { ...o, location: `${data.location.lat}, ${data.location.lng}` };
                }
                return o;
            }));
            trackAction('location_updated', 'officer', { officerId: data.officerId });
        },
        onHeartbeat: (data) => {
            setOfficers(prev => prev.map(o => {
                if (o.id === data.officerId) {
                    return {
                        ...o,
                        last_heartbeat: data.last_heartbeat,
                        connection_status: data.connection_status
                    };
                }
                return o;
            }));
        }
    });

    const tabs = useMemo(() => {
        const base = [
            { id: 'dashboard' as const, label: 'Overview' },
            { id: 'patrol-management' as const, label: checkInQueuePendingCount > 0 ? (
                <span>Patrol Management <span className="text-amber-400">• {checkInQueuePendingCount} pending</span></span>
            ) : 'Patrol Management' },
            { id: 'routes-checkpoints' as const, label: 'Routes & Checkpoints' },
            { id: 'deployment' as const, label: 'Deployment' },
            { id: 'patrol-settings' as const, label: 'Settings' }
        ];
        return base;
    }, [checkInQueuePendingCount]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                triggerGlobalRefresh();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [triggerGlobalRefresh]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <OverviewTab setActiveTab={setActiveTab} />;
            case 'patrol-management':
                return <PatrolManagementTab />;
            case 'deployment':
                return <DeploymentTab />;
            case 'routes-checkpoints':
                return <RoutesCheckpointsTab />;
            case 'patrol-settings':
                return <SettingsTab />;
            default:
                return (
                    <div className="text-center py-12" role="main" aria-label="Patrol Command Center">
                        <Card>
                            <CardContent className="py-12">
                                <i className="fas fa-exclamation-triangle text-slate-400 text-4xl mb-4" />
                                <h3 className="text-lg font-semibold text-slate-600 mb-2">Tab not found</h3>
                                <p className="text-slate-500 mb-4">The requested tab does not exist.</p>
                                <Button onClick={() => setActiveTab('dashboard')}>
                                    <i className="fas fa-home mr-2"></i>
                                    Go to Overview
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                );
        }
    };

    return (
        <ModuleShell
            icon={<i className="fas fa-route" />}
            title="Patrol Command Center"
            subtitle="Advanced patrol management and security operations"
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            actions={properties.length > 0 ? (
                <Select
                    value={selectedPropertyId || ''}
                    onChange={(e) => setSelectedPropertyId(e.target.value || null)}
                    className="w-64"
                    containerClassName="min-w-[200px]"
                >
                    {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                            {property.name}
                        </option>
                    ))}
                </Select>
            ) : null}
        >
            {isOffline && (
                <div className="bg-amber-500/20 border-b border-amber-500/50 px-4 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <p className="text-amber-400 text-xs font-black uppercase tracking-wider">
                                {settings.offlineMode
                                    ? 'Offline mode — changes will sync when connection is restored. Deployment is disabled.'
                                    : 'Online only — reconnect to continue. Deployment is disabled.'}
                            </p>
                            {(checkInQueuePendingCount > 0 || operationQueuePendingCount > 0) && (
                                <span className="text-[9px] font-mono text-amber-300/70 uppercase tracking-widest">
                                    {checkInQueuePendingCount + operationQueuePendingCount} pending sync{checkInQueuePendingCount + operationQueuePendingCount !== 1 ? 's' : ''}
                                </span>
                            )}
                            {(checkInQueueFailedCount > 0 || operationQueueFailedCount > 0) && (
                                <span className="text-[9px] font-mono text-red-300/70 uppercase tracking-widest">
                                    {checkInQueueFailedCount + operationQueueFailedCount} failed
                                </span>
                            )}
                        </div>
                        {lastSyncTimestamp && (
                            <p className="text-[9px] font-mono text-amber-300/70 uppercase tracking-widest ml-4">
                                Last sync: {lastSyncTimestamp.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </div>
            )}
            <ErrorBoundary>
                {renderTabContent()}
            </ErrorBoundary>
        </ModuleShell>
    );
};

export const PatrolCommandCenterOrchestrator: React.FC = () => {
    const patrolState = usePatrolState();

    return (
        <PatrolContext.Provider value={patrolState}>
            <PatrolGlobalRefresh />
            <PatrolCommandCenterLayout />
        </PatrolContext.Provider>
    );
};
