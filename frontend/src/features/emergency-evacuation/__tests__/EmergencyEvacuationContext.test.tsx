/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmergencyEvacuationProvider, useEmergencyEvacuationContext } from '../context/EmergencyEvacuationContext';

jest.mock('../hooks/useEmergencyEvacuationState', () => ({
  useEmergencyEvacuationState: jest.fn(),
}));

const mockUseEmergencyEvacuationState = require('../hooks/useEmergencyEvacuationState').useEmergencyEvacuationState;

describe('EmergencyEvacuationContext', () => {
  const mockContextValue = {
    activeTab: 'overview',
    setActiveTab: jest.fn(),
    isAuthenticated: true,
    loading: false,
    error: null,
    setError: jest.fn(),
    timer: 0,
    evacuationActive: false,
    metrics: {
      evacuated: 0,
      inProgress: 0,
      remaining: 0,
      staffDeployed: 0,
      elapsedTime: '00:00',
      totalOccupancy: 0,
      evacuationProgress: 0,
    },
    floors: [],
    staff: [],
    timeline: [],
    guestAssistance: [],
    routes: [],
    communicationLogs: [],
    evacuationDrills: [],
    settings: {
      autoEvacuation: true,
      emergencyServicesContact: true,
      guestNotifications: true,
      staffAlerts: true,
      soundAlarms: true,
      unlockExits: true,
      elevatorShutdown: true,
      hvacControl: true,
      lightingControl: true,
      announcementVolume: '80',
      evacuationTimeout: '30',
      drillFrequency: '90',
    },
    setSettings: jest.fn(),
    announcementText: '',
    setAnnouncementText: jest.fn(),
    assistanceNotes: '',
    setAssistanceNotes: jest.fn(),
    showAssistanceModal: false,
    setShowAssistanceModal: jest.fn(),
    showAnnouncementModal: false,
    setShowAnnouncementModal: jest.fn(),
    showRouteModal: false,
    setShowRouteModal: jest.fn(),
    selectedAssistance: null,
    setSelectedAssistance: jest.fn(),
    selectedRoute: null,
    setSelectedRoute: jest.fn(),
    activeStaff: [],
    clearRoutes: [],
    completedAssistance: [],
    pendingAssistance: [],
    hasManagementAccess: true,
    ensureAuthorized: jest.fn(() => true),
    handleStartEvacuation: jest.fn(),
    handleEndEvacuation: jest.fn(),
    handleAllCallAnnouncement: jest.fn(),
    handleSendAnnouncement: jest.fn(),
    handleUnlockExits: jest.fn(),
    handleContactEmergencyServices: jest.fn(),
    handleSendGuestNotifications: jest.fn(),
    handleAssignAssistance: jest.fn(),
    handleCompleteAssistance: jest.fn(),
    handleViewRoute: jest.fn(),
    handleExportData: jest.fn(),
    handleSaveSettings: jest.fn(),
    handleResetSettings: jest.fn(),
    getStatusBadgeClass: jest.fn(),
    getRiskLevelBadgeClass: jest.fn(),
    getPriorityBadgeClass: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEmergencyEvacuationState.mockReturnValue(mockContextValue);
  });

  const TestComponent: React.FC = () => {
    const context = useEmergencyEvacuationContext();
    return (
      <div>
        <div data-testid="active-tab">{context.activeTab}</div>
        <button data-testid="start" onClick={context.handleStartEvacuation}>Start</button>
      </div>
    );
  };

  it('provides context values to children', () => {
    render(
      <EmergencyEvacuationProvider>
        <TestComponent />
      </EmergencyEvacuationProvider>
    );

    expect(screen.getByTestId('active-tab')).toHaveTextContent('overview');
  });

  it('throws error when used outside provider', () => {
    const originalError = console.error;
    console.error = jest.fn();

    const BadComponent: React.FC = () => {
      useEmergencyEvacuationContext();
      return <div>Bad</div>;
    };

    expect(() => render(<BadComponent />)).toThrow('useEmergencyEvacuationContext must be used within EmergencyEvacuationProvider');

    console.error = originalError;
  });

  it('invokes context actions', () => {
    render(
      <EmergencyEvacuationProvider>
        <TestComponent />
      </EmergencyEvacuationProvider>
    );

    screen.getByTestId('start').click();
    expect(mockContextValue.handleStartEvacuation).toHaveBeenCalled();
  });
});

