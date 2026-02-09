import React, { useEffect, useState } from 'react';
import { SystemAdminProvider, useSystemAdminContext } from './context/SystemAdminContext';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';
import { OverviewTab } from './components/tabs/OverviewTab';
import { UsersTab } from './components/tabs/UsersTab';
import { RolesTab } from './components/tabs/RolesTab';
import { PropertiesTab } from './components/tabs/PropertiesTab';
import { SystemTab } from './components/tabs/SystemTab';
import { SecurityTab } from './components/tabs/SecurityTab';
import { AuditTab } from './components/tabs/AuditTab';
import { AddUserModal } from './components/modals/AddUserModal';
import { EditUserModal } from './components/modals/EditUserModal';
import { AddRoleModal } from './components/modals/AddRoleModal';
import { EditRoleModal } from './components/modals/EditRoleModal';
import { AddPropertyModal } from './components/modals/AddPropertyModal';
import { EditPropertyModal } from './components/modals/EditPropertyModal';
import { AddIntegrationModal } from './components/modals/AddIntegrationModal';
import { EditIntegrationModal } from './components/modals/EditIntegrationModal';
import { ImportRolesModal } from './components/modals/ImportRolesModal';
import { ModifyMatrixModal } from './components/modals/ModifyMatrixModal';
import { PropertyMetricsModal } from './components/modals/PropertyMetricsModal';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { OfflineQueueManager } from './components/OfflineQueueManager';
import { useSystemAdminWebSocket } from './hooks/useSystemAdminWebSocket';
import ModuleShell from '../../components/Layout/ModuleShell';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import type { AdminUser, SystemRole, SystemProperty, SystemIntegration, SystemSettings, SecurityPolicy, AuditLogEntry } from './types/system-admin.types';

const SystemAdminGlobalRefresh: React.FC = () => {
    const { register, unregister, triggerGlobalRefresh } = useGlobalRefresh();
    const { refreshData } = useSystemAdminContext();
    useEffect(() => {
        register('system-admin', async () => {
            await refreshData();
        });
        return () => unregister('system-admin');
    }, [register, unregister, refreshData]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                triggerGlobalRefresh();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [triggerGlobalRefresh]);

    return null;
};

/** Offline banner: shows when navigator.onLine is false so users know data may be stale. */
const OfflineBanner: React.FC = () => {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    useEffect(() => {
        if (typeof navigator === 'undefined') return;
        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);
    if (isOnline) return null;
    return (
        <div
            className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 flex items-center gap-2 text-sm font-bold text-amber-400 mb-6"
            role="status"
            aria-live="polite"
        >
            <i className="fas fa-wifi fa-rotate-90 text-amber-400" aria-hidden />
            <span>You&apos;re offline. Data may be stale. Reconnect to refresh.</span>
        </div>
    );
};

const SystemAdminOrchestratorContent: React.FC = () => {
    const {
        activeTab,
        setActiveTab,
        error,
        lastSyncTimestamp,
        loading,
        confirmModal,
        setConfirmModal,
        setUsers,
        setRoles,
        setProperties,
        setIntegrations,
        setSettings,
        setSecurityPolicies,
        prependAuditLogEntry
    } = useSystemAdminContext();

    // WebSocket integration for real-time updates
    useSystemAdminWebSocket({
        onUserCreated: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
                setUsers(prev => [...prev, data as AdminUser]);
            }
        },
        onUserUpdated: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
                setUsers(prev => prev.map(u => u.id === (data as AdminUser).id ? data as AdminUser : u));
            }
        },
        onUserDeleted: (userId) => {
            setUsers(prev => prev.filter(u => u.id !== userId));
        },
        onRoleCreated: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
                setRoles(prev => [...prev, data as SystemRole]);
            }
        },
        onRoleUpdated: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
                setRoles(prev => prev.map(r => r.id === (data as SystemRole).id ? data as SystemRole : r));
            }
        },
        onRoleDeleted: (roleId) => {
            setRoles(prev => prev.filter(r => r.id !== roleId));
        },
        onPropertyCreated: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
                setProperties(prev => [...prev, data as SystemProperty]);
            }
        },
        onPropertyUpdated: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
                setProperties(prev => prev.map(p => p.id === (data as SystemProperty).id ? data as SystemProperty : p));
            }
        },
        onPropertyDeleted: (propertyId) => {
            setProperties(prev => prev.filter(p => p.id !== propertyId));
        },
        onIntegrationCreated: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
                setIntegrations(prev => [...prev, data as SystemIntegration]);
            }
        },
        onIntegrationUpdated: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
                setIntegrations(prev => prev.map(i => i.id === (data as SystemIntegration).id ? data as SystemIntegration : i));
            }
        },
        onIntegrationDeleted: (integrationId) => {
            setIntegrations(prev => prev.filter(i => i.id !== integrationId));
        },
        onSettingsUpdated: (data) => {
            if (data && typeof data === 'object') {
                setSettings(data as SystemSettings);
            }
        },
        onSecurityPoliciesUpdated: (data) => {
            if (data && typeof data === 'object') {
                setSecurityPolicies(data as SecurityPolicy);
            }
        },
        onAuditEntryAdded: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
                prependAuditLogEntry(data as AuditLogEntry);
            }
        }
    });

    const tabs = [
        { id: 'dashboard', label: 'Overview' },
        { id: 'users', label: 'Users' },
        { id: 'roles', label: 'Roles' },
        { id: 'properties', label: 'Properties' },
        { id: 'security', label: 'Security' },
        { id: 'system', label: 'System' },
        { id: 'audit', label: 'Audit' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard': return <ErrorBoundary moduleName="SystemAdminOverviewTab"><OverviewTab /></ErrorBoundary>;
            case 'users': return <ErrorBoundary moduleName="SystemAdminUsersTab"><UsersTab /></ErrorBoundary>;
            case 'roles': return <ErrorBoundary moduleName="SystemAdminRolesTab"><RolesTab /></ErrorBoundary>;
            case 'properties': return <ErrorBoundary moduleName="SystemAdminPropertiesTab"><PropertiesTab /></ErrorBoundary>;
            case 'system': return <ErrorBoundary moduleName="SystemAdminSystemTab"><SystemTab /></ErrorBoundary>;
            case 'security': return <ErrorBoundary moduleName="SystemAdminSecurityTab"><SecurityTab /></ErrorBoundary>;
            case 'audit': return <ErrorBoundary moduleName="SystemAdminAuditTab"><AuditTab /></ErrorBoundary>;
            default: return <ErrorBoundary moduleName="SystemAdminOverviewTab"><OverviewTab /></ErrorBoundary>;
        }
    };

    return (
        <ModuleShell
            icon={<i className="fas fa-cog" />}
            title="System Administration"
            subtitle="Central command for platform governance and infrastructure"
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            actions={
                lastSyncTimestamp ? (
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest" aria-live="polite">
                        Last refreshed {lastSyncTimestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        {loading ? ' · Refreshing…' : ''}
                    </p>
                ) : null
            }
        >
            <OfflineBanner />
            <OfflineQueueManager />
            {error && (
                <div className="mb-6 bg-red-500/10 border-l-4 border-red-500/60 p-4 rounded-r-md">
                    <div className="flex items-center">
                        <i className="fas fa-exclamation-circle text-red-400 text-xl mr-3"></i>
                        <p className="text-red-200 font-medium">{error}</p>
                    </div>
                </div>
            )}

            {renderTabContent()}

            <AddUserModal />
            <EditUserModal />
            <AddRoleModal />
            <EditRoleModal />
            <AddPropertyModal />
            <EditPropertyModal />
            <AddIntegrationModal />
            <EditIntegrationModal />
            <ImportRolesModal />
            <ModifyMatrixModal />
            <PropertyMetricsModal />
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant || 'destructive'}
            />
        </ModuleShell>
    );
};

export const SystemAdminOrchestrator: React.FC = () => (
    <SystemAdminProvider>
        <SystemAdminGlobalRefresh />
        <SystemAdminOrchestratorContent />
    </SystemAdminProvider>
);


