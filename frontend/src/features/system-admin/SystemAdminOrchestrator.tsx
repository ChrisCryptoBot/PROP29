import React from 'react';
import { SystemAdminProvider, useSystemAdminContext } from './context/SystemAdminContext';
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
import ModuleShell from '../../components/Layout/ModuleShell';

const SystemAdminOrchestratorContent: React.FC = () => {
    const { activeTab, setActiveTab, error } = useSystemAdminContext();

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
            case 'dashboard': return <OverviewTab />;
            case 'users': return <UsersTab />;
            case 'roles': return <RolesTab />;
            case 'properties': return <PropertiesTab />;
            case 'system': return <SystemTab />;
            case 'security': return <SecurityTab />;
            case 'audit': return <AuditTab />;
            default: return <OverviewTab />;
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
        >
            {error && (
                <div className="mb-6 bg-red-500/10 border-l-4 border-red-500/60 p-4 rounded-r-xl shadow-sm">
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
        </ModuleShell>
    );
};

export const SystemAdminOrchestrator: React.FC = () => (
    <SystemAdminProvider>
        <SystemAdminOrchestratorContent />
    </SystemAdminProvider>
);


