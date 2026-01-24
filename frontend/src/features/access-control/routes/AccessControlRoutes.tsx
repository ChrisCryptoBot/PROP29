/**
 * Access Control Tab Content Renderer
 * Conditionally renders tab content based on active tab
 * This is a simplified approach that works with current routing
 * 
 * For full nested routes, update App.tsx to use /modules/access-control/* pattern
 */

import React from 'react';
import { ErrorBoundary } from '../../../components/UI/ErrorBoundary';
import {
  DashboardTab,
  AccessPointsTab,
  UsersTab,
  EventsTab,
  AIAnalyticsTab,
  ReportsTab,
  ConfigurationTab,
  LockdownFacilityTab,
} from '../components/tabs';

export interface AccessControlTabContentProps {
  activeTab: string;
}

/**
 * Access Control Tab Content Component
 * Renders the appropriate tab component based on activeTab prop
 * This replaces the monolithic switch statement
 */
export const AccessControlTabContent: React.FC<AccessControlTabContentProps> = ({ activeTab }) => {
  switch (activeTab) {
    case 'dashboard':
      return <DashboardTab />;
    case 'access-points':
      return <AccessPointsTab />;
    case 'users':
      return <UsersTab />;
    case 'events':
      return <EventsTab />;
    case 'ai-analytics':
      return <AIAnalyticsTab />;
    case 'reports':
      return <ReportsTab />;
    case 'configuration':
      return <ConfigurationTab />;
    case 'lockdown-facility':
      return <LockdownFacilityTab />;
    default:
      return <DashboardTab />;
  }
};

/**
 * Legacy export for compatibility
 * @deprecated Use AccessControlTabContent instead
 */
export const AccessControlRoutes: React.FC<AccessControlTabContentProps> = (props) => {
  return (
    <ErrorBoundary moduleName="Access Control Routes">
      <AccessControlTabContent {...props} />
    </ErrorBoundary>
  );
};

export default AccessControlRoutes;

