import React, { useEffect, useMemo } from 'react';
import { PatrolContext, usePatrolContext } from './context/PatrolContext';
import { usePatrolState } from './hooks/usePatrolState';

// Tabs
import { DashboardTab } from './components/tabs/DashboardTab';
import { PatrolManagementTab } from './components/tabs/PatrolManagementTab';
import { DeploymentTab } from './components/tabs/DeploymentTab';
import { RoutesCheckpointsTab } from './components/tabs/RoutesCheckpointsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { Card, CardContent } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import ModuleShell from '../../components/Layout/ModuleShell';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';

const PatrolGlobalRefresh: React.FC = () => {
    const { register, unregister } = useGlobalRefresh();
    const { refreshPatrolData } = usePatrolContext();

    useEffect(() => {
        const handler = async () => {
            await refreshPatrolData();
        };
        register('patrol-command-center', handler);
        return () => unregister('patrol-command-center');
    }, [register, unregister, refreshPatrolData]);

    return null;
};

const PatrolCommandCenterLayout: React.FC = () => {
    const { activeTab, setActiveTab, properties, selectedPropertyId, setSelectedPropertyId, isOffline, settings, checkInQueuePendingCount } = React.useContext(PatrolContext)!;
    const { triggerGlobalRefresh } = useGlobalRefresh();

    const tabs = useMemo(() => {
        const base = [
            { id: 'dashboard' as const, label: 'Dashboard' },
            { id: 'patrol-management' as const, label: checkInQueuePendingCount > 0 ? (
                <span>Patrol Management <span className="text-amber-400">• {checkInQueuePendingCount} pending</span></span>
            ) : 'Patrol Management' },
            { id: 'deployment' as const, label: 'Deployment' },
            { id: 'routes-checkpoints' as const, label: 'Routes & Checkpoints' },
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
                return <DashboardTab setActiveTab={setActiveTab} />;
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
                                    Go to Dashboard
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
                <select
                    value={selectedPropertyId || ''}
                    onChange={(event) => setSelectedPropertyId(event.target.value || null)}
                    className="px-3 py-2 border border-white/10 rounded-md text-xs font-black uppercase tracking-widest bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                    {properties.map((property) => (
                        <option key={property.id} value={property.id} className="bg-slate-900">
                            {property.name}
                        </option>
                    ))}
                </select>
            ) : null}
        >
            {isOffline && (
                <div className="bg-amber-500/20 border-b border-amber-500/50 px-4 py-2">
                    <p className="text-amber-400 text-xs font-black uppercase tracking-wider">
                        {settings.offlineMode
                            ? 'Offline mode — changes will sync when connection is restored. Deployment is disabled.'
                            : 'Online only — reconnect to continue. Deployment is disabled.'}
                    </p>
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
