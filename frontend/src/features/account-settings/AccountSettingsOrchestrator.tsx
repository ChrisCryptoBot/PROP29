/**
 * Account Settings Module Orchestrator
 * Wraps content in AccountSettingsProvider, ModuleShell, tabs, and modals.
 * Registers with Global Refresh; uses ErrorBoundary per tab.
 */

import React, { useState, useEffect } from 'react';
import { AccountSettingsProvider, useAccountSettingsContext } from './context/AccountSettingsContext';
import { TeamManagementTab, TeamSettingsTab, IntegrationsTab, PermissionsTab } from './components/tabs';
import { AddMemberModal, EditMemberModal, ConfirmRemoveModal, AddIntegrationModal } from './components/modals';
import ModuleShell from '../../components/Layout/ModuleShell';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';
import type { TeamMember } from './types/account-settings.types';

const TABS = [
  { id: 'team', label: 'Team Management' },
  { id: 'settings', label: 'Team Settings' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'permissions', label: 'Role Permissions' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const AccountSettingsGlobalRefresh: React.FC = () => {
  const { register, unregister } = useGlobalRefresh();
  const { refreshData } = useAccountSettingsContext();

  useEffect(() => {
    const handler = async () => {
      await refreshData();
    };
    register('account-settings', handler);
    return () => unregister('account-settings');
  }, [register, unregister, refreshData]);

  return null;
};

const AccountSettingsContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('team');
  const [showAddMember, setShowAddMember] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<TeamMember | null>(null);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const { triggerGlobalRefresh } = useGlobalRefresh();

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

  const renderTab = () => {
    switch (activeTab) {
      case 'team':
        return (
          <ErrorBoundary moduleName="AccountSettingsTeamManagementTab">
            <TeamManagementTab
              onAddMember={() => setShowAddMember(true)}
              onEditMember={(m) => setEditMember(m)}
              onRemoveMember={(m) => setConfirmRemoveMember(m)}
            />
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <ErrorBoundary moduleName="AccountSettingsTeamSettingsTab">
            <TeamSettingsTab />
          </ErrorBoundary>
        );
      case 'integrations':
        return (
          <ErrorBoundary moduleName="AccountSettingsIntegrationsTab">
            <IntegrationsTab onAddIntegration={() => setShowAddIntegration(true)} />
          </ErrorBoundary>
        );
      case 'permissions':
        return (
          <ErrorBoundary moduleName="AccountSettingsPermissionsTab">
            <PermissionsTab />
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ModuleShell
        icon={<i className="fas fa-cog" aria-hidden />}
        title="Account Settings"
        subtitle="Team, integrations, and role permissions"
        tabs={[...TABS]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      >
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          {renderTab()}
        </div>
      </ModuleShell>

      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onSuccess={() => setShowAddMember(false)}
      />
      <EditMemberModal
        isOpen={!!editMember}
        member={editMember}
        onClose={() => setEditMember(null)}
        onSuccess={() => setEditMember(null)}
      />
      <ConfirmRemoveModal
        isOpen={!!confirmRemoveMember}
        member={confirmRemoveMember}
        onClose={() => setConfirmRemoveMember(null)}
        onSuccess={() => setConfirmRemoveMember(null)}
      />
      <AddIntegrationModal
        isOpen={showAddIntegration}
        onClose={() => setShowAddIntegration(false)}
        onSuccess={() => setShowAddIntegration(false)}
      />
    </>
  );
};

const AccountSettingsOrchestrator: React.FC = () => {
  return (
    <AccountSettingsProvider>
      <AccountSettingsGlobalRefresh />
      <AccountSettingsContent />
    </AccountSettingsProvider>
  );
};

export default AccountSettingsOrchestrator;
