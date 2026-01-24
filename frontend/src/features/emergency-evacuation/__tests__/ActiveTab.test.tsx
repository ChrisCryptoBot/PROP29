/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActiveTab from '../components/tabs/ActiveTab';

jest.mock('../context/EmergencyEvacuationContext', () => ({
  useEmergencyEvacuationContext: jest.fn(),
}));

const mockUseContext = require('../context/EmergencyEvacuationContext').useEmergencyEvacuationContext;

describe('ActiveTab', () => {
  const mockContext = {
    floors: [],
    staff: [{ id: 'staff-1', name: 'Test Staff', role: 'Test', status: 'active', location: 'Floor 1', avatar: 'TS', guestsAssisted: 0 }],
    guestAssistance: [{ id: 'assist-1', room: '101', guestName: 'Guest', need: 'Help', priority: 'high', status: 'pending' }],
    routes: [{ id: 'route-1', name: 'Route A', status: 'clear', description: 'Clear', capacity: 10, currentOccupancy: 2, floors: ['1'], estimatedTime: '2 min' }],
    activeStaff: [{ id: 'staff-1', name: 'Test Staff', role: 'Test', status: 'active', location: 'Floor 1', avatar: 'TS', guestsAssisted: 0 }],
    pendingAssistance: [{ id: 'assist-1', room: '101', guestName: 'Guest', need: 'Help', priority: 'high', status: 'pending' }],
    loading: false,
    hasManagementAccess: true,
    getStatusBadgeClass: jest.fn(() => ''),
    getRiskLevelBadgeClass: jest.fn(() => ''),
    getPriorityBadgeClass: jest.fn(() => ''),
    handleAssignAssistance: jest.fn(),
    handleCompleteAssistance: jest.fn(),
    handleViewRoute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseContext.mockReturnValue(mockContext);
  });

  it('renders pending assistance and assigns staff', () => {
    render(<ActiveTab />);
    const assignButton = screen.getByText('Assign Staff');
    fireEvent.click(assignButton);
    expect(mockContext.handleAssignAssistance).toHaveBeenCalledWith('assist-1', 'staff-1');
  });

  it('opens route details from button', () => {
    render(<ActiveTab />);
    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);
    expect(mockContext.handleViewRoute).toHaveBeenCalledWith(mockContext.routes[0]);
  });
});

