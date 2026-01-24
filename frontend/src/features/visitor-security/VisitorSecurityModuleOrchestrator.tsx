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

import React, { useState } from 'react';
import { VisitorProvider, useVisitorContext } from './context/VisitorContext';
import {
  DashboardTab,
  VisitorsTab,
  EventsTab,
  SecurityRequestsTab,
  BadgesAccessTab,
  MobileAppConfigTab,
  SettingsTab
} from './components/tabs';
import {
  RegisterVisitorModal,
  CreateEventModal,
  QRCodeModal,
  BadgePrintModal,
  VisitorDetailsModal,
  EventDetailsModal
} from './components/modals';
import ModuleShell from '../../components/Layout/ModuleShell';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'visitors', label: 'Visitors' },
  { id: 'events', label: 'Events' },
  { id: 'security-requests', label: 'Security Requests' },
  { id: 'badges-access', label: 'Badges & Access' },
  { id: 'mobile-app', label: 'Mobile App Config' },
  { id: 'settings', label: 'Settings' }
];

export const VisitorSecurityModuleOrchestrator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'visitors': return <VisitorsTab />;
      case 'events': return <EventsTab />;
      case 'security-requests': return <SecurityRequestsTab />;
      case 'badges-access': return <BadgesAccessTab />;
      case 'mobile-app': return <MobileAppConfigTab />;
      case 'settings': return <SettingsTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <VisitorProvider>
      <ModuleShell
        icon={<i className="fas fa-user-shield" />}
        title="Visitor Security"
        subtitle="Visitor screening, access authorization, and event badge logistics"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {renderTabContent()}
        <ModalContainer />
      </ModuleShell>
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
