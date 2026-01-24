/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AccessControlProvider, useAccessControlContext } from '../context/AccessControlContext';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock dependencies
jest.mock('../hooks/useAccessControlState');
jest.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({ user: { user_id: 'test-user', email: 'test@example.com' }, isAuthenticated: true })
}));

const mockUseAccessControlState = require('../hooks/useAccessControlState').useAccessControlState;

describe('AccessControlContext', () => {
  const mockContextValue = {
    accessPoints: [],
    users: [],
    accessEvents: [],
    metrics: {
      totalAccessPoints: 0,
      activeAccessPoints: 0,
      totalUsers: 0,
      activeUsers: 0,
      todayAccessEvents: 0,
      deniedAccessEvents: 0,
      averageResponseTime: 'N/A',
      systemUptime: 'N/A',
      topAccessPoints: [],
      recentAlerts: 0,
      securityScore: 0,
      lastSecurityScan: new Date().toISOString()
    },
    heldOpenAlerts: [],
    emergencyMode: 'normal' as const,
    emergencyController: null,
    emergencyTimeoutDuration: 1800,
    loading: {
      accessPoints: false,
      users: false,
      accessEvents: false,
      metrics: false
    },
    refreshAccessPoints: jest.fn(),
    refreshUsers: jest.fn(),
    refreshAccessEvents: jest.fn(),
    refreshMetrics: jest.fn(),
    createAccessPoint: jest.fn(),
    updateAccessPoint: jest.fn(),
    deleteAccessPoint: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    handleEmergencyLockdown: jest.fn(),
    handleEmergencyUnlock: jest.fn(),
    handleNormalMode: jest.fn(),
    acknowledgeHeldOpenAlert: jest.fn(),
    toggleAccessPoint: jest.fn(),
    syncCachedEvents: jest.fn(),
    reviewAgentEvent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccessControlState.mockReturnValue(mockContextValue);
  });

  const TestComponent: React.FC = () => {
    const context = useAccessControlContext();
    return (
      <div>
        <div data-testid="access-points-count">{context.accessPoints.length}</div>
        <div data-testid="users-count">{context.users.length}</div>
        <div data-testid="emergency-mode">{context.emergencyMode}</div>
        <button data-testid="refresh-button" onClick={context.refreshAccessPoints}>
          Refresh
        </button>
      </div>
    );
  };

  it('should provide context values to children', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AccessControlProvider>
            <TestComponent />
          </AccessControlProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('access-points-count')).toHaveTextContent('0');
    expect(screen.getByTestId('users-count')).toHaveTextContent('0');
    expect(screen.getByTestId('emergency-mode')).toHaveTextContent('normal');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    const TestComponentWithoutProvider: React.FC = () => {
      useAccessControlContext();
      return <div>Test</div>;
    };

    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useAccessControlContext must be used within AccessControlProvider');

    console.error = originalError;
  });

  it('should provide all context actions', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AccessControlProvider>
            <TestComponent />
          </AccessControlProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    const refreshButton = screen.getByTestId('refresh-button');
    act(() => {
      refreshButton.click();
    });

    expect(mockContextValue.refreshAccessPoints).toHaveBeenCalled();
  });

  it('should update context when hook state changes', async () => {
    const updatedValue = {
      ...mockContextValue,
      accessPoints: [
        { id: '1', name: 'Main Entrance', location: 'Lobby', type: 'door', status: 'active', accessMethod: 'card', lastAccess: '2024-01-15T14:30:00Z', accessCount: 1247, permissions: ['staff'], securityLevel: 'high', isOnline: true, sensorStatus: 'closed', powerSource: 'mains', cachedEvents: [] }
      ]
    };

    mockUseAccessControlState.mockReturnValue(updatedValue);

    const { rerender } = render(
      <BrowserRouter>
        <AuthProvider>
          <AccessControlProvider>
            <TestComponent />
          </AccessControlProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    rerender(
      <BrowserRouter>
        <AuthProvider>
          <AccessControlProvider>
            <TestComponent />
          </AccessControlProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('access-points-count')).toHaveTextContent('1');
    });
  });
});

