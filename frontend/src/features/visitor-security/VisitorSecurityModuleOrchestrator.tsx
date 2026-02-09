/**
 * Visitor Security Module Orchestrator
 * Main orchestrator component for Visitor Security module
 * Manages tab navigation and modal visibility
 * 
 * Gold Standard Checklist:
 * ✅ Uses ModuleShell for consistent branding
 * ✅ High-contrast "Security Console" theme
 * ✅ Professional technical terminology
 * ✅ Accessibility (a11y)
 */

import React, { useState, useEffect } from 'react';
import { VisitorProvider, useVisitorContext } from './context/VisitorContext';
import {
  OverviewTab,
  VisitorsTab,
  EventsTab,
  SecurityRequestsTab,
  BadgesAccessTab,
  MobileAppConfigTab,
  SettingsTab
} from './components/tabs';
import { BannedIndividualsTab } from './components/tabs/BannedIndividualsTab';
import {
  RegisterVisitorModal,
  CreateEventModal,
  QRCodeModal,
  BadgePrintModal,
  VisitorDetailsModal,
  EventDetailsModal,
  ConflictResolutionModal
} from './components/modals';
import ModuleShell from '../../components/Layout/ModuleShell';
import { ErrorBoundary } from '../../components/UI/ErrorBoundary';
import { Button } from '../../components/UI/Button';
import { useGlobalRefresh } from '../../contexts/GlobalRefreshContext';
import { useVisitorWebSocket } from './hooks/useVisitorWebSocket';
import { useVisitorTelemetry } from './hooks/useVisitorTelemetry';
import { useVisitorQueue } from './hooks/useVisitorQueue';
import { useVisitorHeartbeat } from './hooks/useVisitorHeartbeat';
import { logger } from '../../services/logger';
import type { Visitor } from './types/visitor-security.types';

const tabs = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'visitors', label: 'Visitors' },
  { id: 'events', label: 'Events' },
  { id: 'security-requests', label: 'Security Requests' },
  { id: 'banned-individuals', label: 'Banned Individuals' },
  { id: 'badges-access', label: 'Badges & Access' },
  { id: 'mobile-app', label: 'Mobile Config' },
  { id: 'settings', label: 'Settings' }
];

const VisitorSecurityGlobalRefresh: React.FC = () => {
  const { register, unregister } = useGlobalRefresh();
  const {
    refreshVisitors,
    refreshEvents,
    refreshSecurityRequests,
    refreshMobileAgents,
    refreshHardwareDevices,
    refreshSystemStatus,
    refreshEnhancedSettings
  } = useVisitorContext();

  useEffect(() => {
    const handler = async () => {
      await Promise.all([
        refreshVisitors(),
        refreshEvents(),
        refreshSecurityRequests(),
        refreshMobileAgents(),
        refreshHardwareDevices(),
        refreshSystemStatus(),
        refreshEnhancedSettings()
      ]);
    };
    register('visitor-security', handler);
    return () => unregister('visitor-security');
  }, [register, unregister, refreshVisitors, refreshEvents, refreshSecurityRequests, refreshMobileAgents, refreshHardwareDevices, refreshSystemStatus, refreshEnhancedSettings]);

  return null;
};

const VisitorSecurityContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const {
    visitors,
    refreshVisitors,
    refreshEvents,
    refreshSecurityRequests,
    refreshMobileAgents,
    refreshHardwareDevices,
    selectedVisitor,
    setSelectedVisitor,
    mobileAgentDevices,
    hardwareDevices,
    setMobileAgentDevices,
    setHardwareDevices,
    setShowRegisterModal,
    lastSynced,
    updateVisitor,
    conflictInfo,
    setConflictInfo,
    handleConflictResolution
  } = useVisitorContext();
  const { triggerGlobalRefresh } = useGlobalRefresh();
  const { trackAction } = useVisitorTelemetry();

  // Offline detection
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator === 'undefined' ? false : !navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Global refresh keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        triggerGlobalRefresh();
        trackAction('global_refresh', 'settings', { source: 'keyboard_shortcut' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerGlobalRefresh, trackAction]);

  // WebSocket integration
  useVisitorWebSocket({
    onVisitorCreated: (visitor) => {
      refreshVisitors();
      trackAction('visitor_created', 'visitor', { visitorId: visitor.id, source: 'websocket' });
    },
    onVisitorUpdated: (visitor) => {
      refreshVisitors();
      if (selectedVisitor?.id === visitor.id) {
        setSelectedVisitor(visitor);
      }
      trackAction('visitor_updated', 'visitor', { visitorId: visitor.id, source: 'websocket' });
    },
    onVisitorDeleted: (visitorId) => {
      refreshVisitors();
      if (selectedVisitor?.id === visitorId) {
        setSelectedVisitor(null);
      }
      trackAction('visitor_deleted', 'visitor', { visitorId, source: 'websocket' });
    },
    onVisitorCheckIn: (visitor) => {
      refreshVisitors();
      trackAction('visitor_checkin', 'visitor', { visitorId: visitor.id, source: 'websocket' });
    },
    onVisitorCheckOut: (visitor) => {
      refreshVisitors();
      trackAction('visitor_checkout', 'visitor', { visitorId: visitor.id, source: 'websocket' });
    },
    onEventCreated: (event) => {
      refreshEvents();
      trackAction('event_created', 'event', { eventId: event.id, source: 'websocket' });
    },
    onEventDeleted: (eventId) => {
      refreshEvents();
      trackAction('event_deleted', 'event', { eventId, source: 'websocket' });
    },
    onMobileAgentSubmission: (submission) => {
      refreshSecurityRequests();
      trackAction('mobile_agent_submission', 'mobile_agent', { submissionId: submission.submission_id, source: 'websocket' });
    },
    onHardwareDeviceStatus: (device) => {
      refreshHardwareDevices();
      trackAction('hardware_device_status', 'hardware', { deviceId: device.device_id, source: 'websocket' });
    }
  });

  // Offline queue
  useVisitorQueue({
    onSynced: () => {
      refreshVisitors();
      refreshEvents();
      refreshSecurityRequests();
    }
  });

  // Heartbeat tracking
  useVisitorHeartbeat({
    hardwareDevices,
    setHardwareDevices,
    mobileAgentDevices,
    setMobileAgentDevices
  });

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith('visitor-security:')) return;

      if (e.key === 'visitor-security:visitor-created' || e.key === 'visitor-security:visitor-updated') {
        refreshVisitors();
      } else if (e.key === 'visitor-security:visitor-deleted') {
        refreshVisitors();
        setSelectedVisitor(null);
      } else if (e.key === 'visitor-security:event-created' || e.key === 'visitor-security:event-deleted') {
        refreshEvents();
      } else if (e.key === 'visitor-security:bulk-operation') {
        refreshVisitors();
        refreshEvents();
        refreshSecurityRequests();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshVisitors, refreshEvents, refreshSecurityRequests, setSelectedVisitor]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ErrorBoundary moduleName="VisitorSecurityOverviewTab">
            <OverviewTab />
          </ErrorBoundary>
        );
      case 'visitors':
        return (
          <ErrorBoundary moduleName="VisitorSecurityVisitorsTab">
            <VisitorsTab />
          </ErrorBoundary>
        );
      case 'events':
        return (
          <ErrorBoundary moduleName="VisitorSecurityEventsTab">
            <EventsTab />
          </ErrorBoundary>
        );
      case 'banned-individuals':
        return (
          <ErrorBoundary moduleName="VisitorSecurityBannedIndividualsTab">
            <BannedIndividualsTab />
          </ErrorBoundary>
        );
      case 'security-requests':
        return (
          <ErrorBoundary moduleName="VisitorSecuritySecurityRequestsTab">
            <SecurityRequestsTab />
          </ErrorBoundary>
        );
      case 'badges-access':
        return (
          <ErrorBoundary moduleName="VisitorSecurityBadgesAccessTab">
            <BadgesAccessTab />
          </ErrorBoundary>
        );
      case 'mobile-app':
        return (
          <ErrorBoundary moduleName="VisitorSecurityMobileAppConfigTab">
            <MobileAppConfigTab />
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <ErrorBoundary moduleName="VisitorSecuritySettingsTab">
            <SettingsTab />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary moduleName="VisitorSecurityOverviewTab">
            <OverviewTab />
          </ErrorBoundary>
        );
    }
  };

  return (
    <>
      <ModuleShell
        icon={<i className="fas fa-user-shield" />}
        title="Visitor Security"
        subtitle="Visitor screening, access authorization, and event badge logistics"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {/* Offline banner: in-flow inside ModuleShell (gold standard) */}
        {isOffline && (
          <div className="bg-amber-500/20 border-b border-amber-500/50 px-4 py-2">
            <p className="text-amber-400 text-xs font-black uppercase tracking-wider">
              Offline mode — changes will sync when connection is restored
            </p>
          </div>
        )}
        {renderTabContent()}
        <ModalContainer />

        {conflictInfo && (
          <ConflictResolutionModal
            isOpen={!!conflictInfo}
            onClose={() => setConflictInfo(null)}
            visitor={conflictInfo.localVisitor}
            localChanges={conflictInfo.localChanges}
            serverVersion={conflictInfo.serverVisitor}
            onResolve={handleConflictResolution}
          />
        )}

        {/* Quick Action FAB - Gold Standard: solid blue, circular */}
        <div className="fixed bottom-8 right-8 z-50">
          <Button
            onClick={() => setShowRegisterModal(true)}
            variant="primary"
            size="icon"
            className="w-14 h-14 rounded-full border-0"
            title="Register New Visitor"
            aria-label="Register New Visitor"
          >
            <i className="fas fa-user-plus text-xl" />
          </Button>
        </div>
      </ModuleShell>
    </>
  );
};

export const VisitorSecurityModuleOrchestrator: React.FC = () => {
  return (
    <VisitorProvider>
      <VisitorSecurityGlobalRefresh />
      <VisitorSecurityContent />
    </VisitorProvider>
  );
};

/**
 * Modal Container Component
 * Manages all modal visibility from context
 */
const ModalContainer: React.FC = () => {
  const {
    showRegisterModal,
    setShowRegisterModal,
    showEventModal,
    setShowEventModal,
    showQRModal,
    setShowQRModal,
    showBadgeModal,
    setShowBadgeModal,
    showVisitorDetailsModal,
    setShowVisitorDetailsModal,
    showEventDetailsModal,
    setShowEventDetailsModal
  } = useVisitorContext();

  return (
    <>
      <RegisterVisitorModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />
      <CreateEventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
      />
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
      <BadgePrintModal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
      />
      <VisitorDetailsModal
        isOpen={showVisitorDetailsModal}
        onClose={() => setShowVisitorDetailsModal(false)}
      />
      <EventDetailsModal
        isOpen={showEventDetailsModal}
        onClose={() => setShowEventDetailsModal(false)}
      />
    </>
  );
};

export default VisitorSecurityModuleOrchestrator;
