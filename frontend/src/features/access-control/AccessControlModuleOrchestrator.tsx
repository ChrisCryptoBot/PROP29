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
import { useAccessControlWebSocket } from './hooks/useAccessControlWebSocket';
import { useAccessControlTelemetry } from './hooks/useAccessControlTelemetry';
import { OfflineQueueManager } from './components/OfflineQueueManager';
import { logger } from '../../services/logger';

interface Tab {
  id: string;
  label: string;
  path: string;
}

const tabs: Tab[] = [
  { id: 'dashboard', label: 'Overview', path: '/modules/access-control' },
  { id: 'access-points', label: 'Access Points', path: '/modules/access-control' },
  { id: 'users', label: 'User Management', path: '/modules/access-control' },
  { id: 'events', label: 'Access Events', path: '/modules/access-control' },
  { id: 'lockdown-facility', label: 'Lockdown Facility', path: '/modules/access-control' },
  { id: 'reports', label: 'Analytics', path: '/modules/access-control' },
  { id: 'configuration', label: 'Settings', path: '/modules/access-control' }
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
  const { trackAction } = useAccessControlTelemetry();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        triggerGlobalRefresh();
        trackAction('global_refresh', 'configuration', { source: 'keyboard_shortcut' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerGlobalRefresh, trackAction]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    trackAction('tab_changed', 'configuration', { tabId });
  };

  return (
    <AccessControlProvider>
      <AccessControlGlobalRefresh />
      <AccessControlWebSocketIntegration />
      <OfflineQueueManager />
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

/**
 * WebSocket Integration Component
 * Handles real-time updates from WebSocket
 */
const AccessControlWebSocketIntegration: React.FC = () => {
  const {
    accessPoints,
    users,
    accessEvents,
    setAccessPoints,
    setUsers,
    setAccessEvents,
    refreshAccessPoints,
    refreshUsers,
    refreshAccessEvents,
    operationLock,
  } = useAccessControlContext();
  const { trackAction } = useAccessControlTelemetry();

  useAccessControlWebSocket({
    onAccessPointUpdated: (point) => {
      // Check if update operation is locked
      if (operationLock.isLocked('update_access_point', point.id)) {
        logger.debug('Skipping WebSocket update - operation locked', { module: 'AccessControlWebSocket', accessPointId: point.id });
        return;
      }
      setAccessPoints(prev => prev.map(p => p.id === point.id ? point : p));
      trackAction('access_point_updated', 'access_point', { accessPointId: point.id });
    },
    onAccessPointOffline: (data) => {
      // Offline status updates don't need lock checks
      setAccessPoints(prev => prev.map(p => 
        p.id === data.accessPointId ? { ...p, isOnline: data.isOnline } : p
      ));
      trackAction('access_point_offline', 'access_point', { accessPointId: data.accessPointId, isOnline: data.isOnline });
    },
    onEventCreated: (event) => {
      // Event creation doesn't need lock checks
      setAccessEvents(prev => [event, ...prev]);
      trackAction('event_created', 'event', { eventId: event.id });
    },
    onUserUpdated: (user) => {
      // Check if update operation is locked
      if (operationLock.isLocked('update_user', user.id)) {
        logger.debug('Skipping WebSocket update - operation locked', { module: 'AccessControlWebSocket', userId: user.id });
        return;
      }
      setUsers(prev => prev.map(u => u.id === user.id ? user : u));
      trackAction('user_updated', 'user', { userId: user.id });
    },
    onEmergencyActivated: (data) => {
      trackAction('emergency_activated', 'emergency', { mode: data.mode, initiatedBy: data.initiatedBy });
      // Refresh data to get updated state
      refreshAccessPoints();
    },
    onAgentEventPending: (data) => {
      setAccessEvents(prev => [data.event, ...prev]);
      trackAction('agent_event_pending', 'event', { eventId: data.event.id });
    },
    onHeldOpenAlarm: (data) => {
      trackAction('held_open_alarm', 'access_point', { 
        accessPointId: data.accessPointId, 
        severity: data.severity,
        duration: data.duration 
      });
      refreshAccessPoints();
    },
  });

  return null;
};

export default AccessControlModuleOrchestrator;


