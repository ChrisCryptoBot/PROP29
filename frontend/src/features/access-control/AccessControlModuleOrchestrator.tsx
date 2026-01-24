/**
 * Access Control Module Orchestrator
 * Slimmed-down orchestrator component that replaces the 4,800+ line monolith
 * 
 * Gold Standard Checklist:
 * ✅ Only handles high-level layout and routing
 * ✅ Zero business logic - all moved to useAccessControlState hook
 * ✅ Tab navigation (can be upgraded to nested routes later)
 * ✅ Provides AccessControlProvider context
 */

import React, { useEffect, useState } from 'react';
import { AccessControlProvider, useAccessControlContext } from './context/AccessControlContext';
import { AccessControlTabContent } from './routes/AccessControlRoutes';
import ModuleShell from '../../components/Layout/ModuleShell';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';

interface Tab {
  id: string;
  label: string;
  path: string;
}

const tabs: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/modules/access-control' },
  { id: 'access-points', label: 'Access Points', path: '/modules/access-control' },
  { id: 'users', label: 'User Management', path: '/modules/access-control' },
  { id: 'events', label: 'Access Events', path: '/modules/access-control' },
  { id: 'ai-analytics', label: 'AI Analytics', path: '/modules/access-control' },
  { id: 'reports', label: 'Reports & Analytics', path: '/modules/access-control' },
  { id: 'configuration', label: 'Configuration', path: '/modules/access-control' },
  { id: 'lockdown-facility', label: 'Lockdown Facility', path: '/modules/access-control' }
];

const AccessControlGlobalRefresh: React.FC = () => {
  const { register, unregister } = useGlobalRefresh();
  const {
    refreshAccessPoints,
    refreshUsers,
    refreshAccessEvents,
    refreshMetrics,
    refreshAuditLog
  } = useAccessControlContext();

  useEffect(() => {
    const handler = async () => {
      await Promise.allSettled([
        refreshAccessPoints(),
        refreshUsers(),
        refreshAccessEvents(),
        refreshMetrics(),
        refreshAuditLog()
      ]);
    };
    register('access-control', handler);
    return () => unregister('access-control');
  }, [register, unregister, refreshAccessEvents, refreshAccessPoints, refreshMetrics, refreshUsers, refreshAuditLog]);

  return null;
};

/**
 * Access Control Module Orchestrator
 * Provides layout, header, tab navigation, and routes the tab content
 * All business logic is in the hook, all UI is in extracted tab components
 * 
 * Note: Currently uses local state for tab navigation. Can be upgraded to URL-based
 * nested routes by updating App.tsx to use /modules/access-control/* pattern.
 */
const AccessControlModuleOrchestrator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
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

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <AccessControlProvider>
      <AccessControlGlobalRefresh />
      <ModuleShell
        icon={<i className="fas fa-key" />}
        title="Access Control"
        subtitle="Advanced access management and security control"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        <AccessControlTabContent activeTab={activeTab} />
      </ModuleShell>
    </AccessControlProvider>
  );
};

export default AccessControlModuleOrchestrator;


