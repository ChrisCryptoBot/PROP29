/**
 * Profile Settings Module — Gold Standard.
 * ModuleShell + tabs; ProfileSettingsProvider; ErrorBoundary per tab; Global Refresh.
 * Reference: Patrol Command Center (layout, tab bar, content wrapper).
 */

import React, { useState, useEffect, useRef } from 'react';
import { ProfileSettingsProvider, useProfileSettingsContext } from './context/ProfileSettingsContext';
import {
  PersonalInfoTab,
  WorkDetailsTab,
  CertificationsTab,
  PreferencesTab,
  SecurityTab,
} from './components/tabs';
import ModuleShell from '../../components/Layout/ModuleShell';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';
import type { ProfileTabId } from './types/profile-settings.types';

const TABS: { id: ProfileTabId; label: string }[] = [
  { id: 'personal', label: 'Personal Info' },
  { id: 'work', label: 'Work Details' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'security', label: 'Security' },
];

const ProfileSettingsGlobalRefresh: React.FC = () => {
  const { register, unregister } = useGlobalRefresh();
  const { refreshProfile } = useProfileSettingsContext();
  const refreshRef = useRef(refreshProfile);
  useEffect(() => {
    refreshRef.current = refreshProfile;
  }, [refreshProfile]);
  useEffect(() => {
    const handler = async () => {
      await refreshRef.current();
    };
    register('profile-settings', handler);
    return () => unregister('profile-settings');
  }, [register, unregister]);
  return null;
};

const ProfileSettingsContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProfileTabId>('personal');
  const { profile, error, setError, loading } = useProfileSettingsContext();
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
      case 'personal':
        return (
          <ErrorBoundary moduleName="ProfileSettingsPersonalInfoTab">
            <PersonalInfoTab />
          </ErrorBoundary>
        );
      case 'work':
        return (
          <ErrorBoundary moduleName="ProfileSettingsWorkDetailsTab">
            <WorkDetailsTab />
          </ErrorBoundary>
        );
      case 'certifications':
        return (
          <ErrorBoundary moduleName="ProfileSettingsCertificationsTab">
            <CertificationsTab />
          </ErrorBoundary>
        );
      case 'preferences':
        return (
          <ErrorBoundary moduleName="ProfileSettingsPreferencesTab">
            <PreferencesTab />
          </ErrorBoundary>
        );
      case 'security':
        return (
          <ErrorBoundary moduleName="ProfileSettingsSecurityTab">
            <SecurityTab />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary moduleName="ProfileSettingsPersonalInfoTab">
            <PersonalInfoTab />
          </ErrorBoundary>
        );
    }
  };

  return (
    <ModuleShell
      icon={<i className="fas fa-user-cog text-2xl text-white" aria-hidden />}
      title="Profile Settings"
      subtitle="Manage your personal and work information"
      tabs={TABS.map((tab) => ({
        id: tab.id,
        label: (
          <span className="flex items-center gap-2">
            <i
              className={
                tab.id === 'personal'
                  ? 'fas fa-user'
                  : tab.id === 'work'
                    ? 'fas fa-briefcase'
                    : tab.id === 'certifications'
                      ? 'fas fa-certificate'
                      : tab.id === 'preferences'
                        ? 'fas fa-cog'
                        : 'fas fa-shield-alt'
              }
              aria-hidden
            />
            <span>{tab.label}</span>
          </span>
        ),
      }))}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as ProfileTabId)}
    >
      <div className="max-w-[1800px] w-full px-6 py-8 text-left">
        {error && (
          <div
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-between"
            role="alert"
          >
            <span>
              <i className="fas fa-exclamation-triangle mr-2" aria-hidden />
              {error}
            </span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 uppercase tracking-widest"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}
        {loading.profile && !profile?.id ? (
          <div
            className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
            role="status"
            aria-label="Loading profile"
          >
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
              Loading profile...
            </p>
          </div>
        ) : (
          renderTab()
        )}
      </div>
    </ModuleShell>
  );
};

const ProfileSettingsOrchestrator: React.FC = () => {
  return (
    <ProfileSettingsProvider>
      <ProfileSettingsGlobalRefresh />
      <ProfileSettingsContent />
    </ProfileSettingsProvider>
  );
};

export default ProfileSettingsOrchestrator;
