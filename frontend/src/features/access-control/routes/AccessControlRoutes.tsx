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
  OverviewTab,
  AccessPointsTab,
  UsersTab,
  EventsTab,
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
      return <OverviewTab />;
    case 'access-points':
      return <AccessPointsTab />;
    case 'users':
      return <UsersTab />;
    case 'events':
      return <EventsTab />;
    case 'reports':
      return <ReportsTab />;
    case 'configuration':
      return <ConfigurationTab />;
    case 'lockdown-facility':
      return <LockdownFacilityTab />;
    default:
      return <OverviewTab />;
  }
};

// AccessControlTabContent is the primary export
// Default export removed - use named export instead

