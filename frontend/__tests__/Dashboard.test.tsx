/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../src/pages/Dashboard';
import { AuthProvider } from '../src/contexts/AuthContext';
import { WebSocketProvider } from '../src/components/UI/WebSocketProvider';

// Mock API calls
jest.mock('../src/services/api', () => ({
  getDashboardMetrics: jest.fn(() => Promise.resolve({
    total_incidents: 5,
    active_patrols: 3,
    security_score: 85,
    recent_incidents: [
      { id: '1', type: 'theft', severity: 'medium', status: 'open' },
      { id: '2', type: 'disturbance', severity: 'low', status: 'resolved' }
    ],
    patrol_efficiency: 92,
    access_events: 150,
    guest_safety_events: 2
  })),
  getIncidents: jest.fn(() => Promise.resolve([])),
  getPatrols: jest.fn(() => Promise.resolve([])),
  getAccessEvents: jest.fn(() => Promise.resolve([])),
  getGuestSafetyEvents: jest.fn(() => Promise.resolve([])),
  getIoTData: jest.fn(() => Promise.resolve([])),
}));

// Mock WebSocket
const mockWebSocket = {
  readyState: 1,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.WebSocket = jest.fn(() => mockWebSocket) as any;

// Mock useAuth hook
jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { 
      user_id: 'test-user-123',
      first_name: 'John',
      last_name: 'Doe',
      roles: ['security_manager']
    },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: jest.fn(),
  registerables: [],
}));

// Wrapper component for testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <WebSocketProvider>
        {children}
      </WebSocketProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.WebSocket as jest.Mock).mockImplementation(() => mockWebSocket);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render dashboard with all main sections', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Check for main dashboard elements
      await waitFor(() => {
        expect(screen.getByText(/PROPER 2.9/i)).toBeInTheDocument();
        expect(screen.getByText(/AI-Enhanced Security Dashboard/i)).toBeInTheDocument();
      });

      // Check for navigation elements
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Incidents/i)).toBeInTheDocument();
      expect(screen.getByText(/Patrols/i)).toBeInTheDocument();
      expect(screen.getByText(/Access Control/i)).toBeInTheDocument();
      expect(screen.getByText(/Guest Safety/i)).toBeInTheDocument();
    });

    it('should display user information', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
        expect(screen.getByText(/Security Manager/i)).toBeInTheDocument();
      });
    });

    it('should show system status indicators', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/System Status/i)).toBeInTheDocument();
        expect(screen.getByText(/Online/i)).toBeInTheDocument();
      });
    });
  });

  describe('Metrics Display', () => {
    it('should display key security metrics', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/5/i)).toBeInTheDocument(); // Total incidents
        expect(screen.getByText(/3/i)).toBeInTheDocument(); // Active patrols
        expect(screen.getByText(/85/i)).toBeInTheDocument(); // Security score
      });
    });

    it('should display patrol efficiency', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/92%/i)).toBeInTheDocument(); // Patrol efficiency
      });
    });

    it('should display access events count', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/150/i)).toBeInTheDocument(); // Access events
      });
    });

    it('should display guest safety events', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/2/i)).toBeInTheDocument(); // Guest safety events
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should handle WebSocket connection status', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      // Simulate WebSocket connection
      const openHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )[1];
      
      fireEvent(openHandler);

      await waitFor(() => {
        expect(screen.getByText(/Connected/i)).toBeInTheDocument();
      });
    });

    it('should handle real-time incident alerts', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });

      // Simulate incident alert
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1];
      
      const incidentAlert = {
        type: 'incident_alert',
        data: {
          incident_id: 'inc-123',
          incident_type: 'theft',
          severity: 'high',
          location: 'Parking Lot A',
          timestamp: new Date().toISOString()
        }
      };

      fireEvent(messageHandler({ data: JSON.stringify(incidentAlert) }));

      await waitFor(() => {
        expect(screen.getByText(/New Incident Alert/i)).toBeInTheDocument();
        expect(screen.getByText(/theft/i)).toBeInTheDocument();
        expect(screen.getByText(/high/i)).toBeInTheDocument();
      });
    });

    it('should handle real-time patrol updates', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });

      // Simulate patrol update
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1];
      
      const patrolUpdate = {
        type: 'patrol_update',
        data: {
          patrol_id: 'patrol-123',
          guard_id: 'guard-456',
          status: 'active',
          current_location: { lat: 40.7128, lng: -74.0060 },
          checkpoint_id: 'checkpoint-1'
        }
      };

      fireEvent(messageHandler({ data: JSON.stringify(patrolUpdate) }));

      await waitFor(() => {
        expect(screen.getByText(/Patrol Update/i)).toBeInTheDocument();
        expect(screen.getByText(/active/i)).toBeInTheDocument();
      });
    });

    it('should handle unauthorized access alerts', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });

      // Simulate unauthorized access
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1];
      
      const unauthorizedAccess = {
        type: 'unauthorized_access',
        data: {
          access_point: 'Restricted Area',
          attempted_by: 'unknown',
          location: 'Server Room',
          timestamp: new Date().toISOString()
        }
      };

      fireEvent(messageHandler({ data: JSON.stringify(unauthorizedAccess) }));

      await waitFor(() => {
        expect(screen.getByText(/Unauthorized Access/i)).toBeInTheDocument();
        expect(screen.getByText(/Restricted Area/i)).toBeInTheDocument();
      });
    });

    it('should handle guest safety emergencies', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });

      // Simulate guest safety emergency
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1];
      
      const safetyEmergency = {
        type: 'guest_safety_emergency',
        data: {
          event_type: 'panic_button',
          guest_id: 'guest-123',
          room_number: '205',
          severity_level: 'emergency',
          timestamp: new Date().toISOString()
        }
      };

      fireEvent(messageHandler({ data: JSON.stringify(safetyEmergency) }));

      await waitFor(() => {
        expect(screen.getByText(/Guest Safety Emergency/i)).toBeInTheDocument();
        expect(screen.getByText(/panic_button/i)).toBeInTheDocument();
        expect(screen.getByText(/Room 205/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and Module Access', () => {
    it('should navigate to incidents page', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const incidentsLink = screen.getByText(/Incidents/i);
      await userEvent.click(incidentsLink);

      // Should navigate to incidents page
      expect(window.location.pathname).toBe('/incidents');
    });

    it('should navigate to patrols page', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const patrolsLink = screen.getByText(/Patrols/i);
      await userEvent.click(patrolsLink);

      // Should navigate to patrols page
      expect(window.location.pathname).toBe('/patrols');
    });

    it('should navigate to access control page', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const accessControlLink = screen.getByText(/Access Control/i);
      await userEvent.click(accessControlLink);

      // Should navigate to access control page
      expect(window.location.pathname).toBe('/access-control');
    });

    it('should navigate to guest safety page', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const guestSafetyLink = screen.getByText(/Guest Safety/i);
      await userEvent.click(guestSafetyLink);

      // Should navigate to guest safety page
      expect(window.location.pathname).toBe('/guest-safety');
    });

    it('should navigate to analytics page', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const analyticsLink = screen.getByText(/Analytics/i);
      await userEvent.click(analyticsLink);

      // Should navigate to analytics page
      expect(window.location.pathname).toBe('/analytics');
    });

    it('should navigate to settings page', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      const settingsLink = screen.getByText(/Settings/i);
      await userEvent.click(settingsLink);

      // Should navigate to settings page
      expect(window.location.pathname).toBe('/settings');
    });
  });

  describe('Quick Actions', () => {
    it('should have emergency response button', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Emergency Response/i)).toBeInTheDocument();
      });
    });

    it('should have lockdown protocol button', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Lockdown Protocol/i)).toBeInTheDocument();
      });
    });

    it('should have incident report button', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Report Incident/i)).toBeInTheDocument();
      });
    });

    it('should have patrol assignment button', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Assign Patrol/i)).toBeInTheDocument();
      });
    });
  });

  describe('AI Features', () => {
    it('should display AI risk assessment', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/AI Risk Assessment/i)).toBeInTheDocument();
        expect(screen.getByText(/Risk Level/i)).toBeInTheDocument();
      });
    });

    it('should display predictive analytics', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Predictive Analytics/i)).toBeInTheDocument();
        expect(screen.getByText(/Incident Forecast/i)).toBeInTheDocument();
      });
    });

    it('should display patrol optimization', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Patrol Optimization/i)).toBeInTheDocument();
        expect(screen.getByText(/Route Efficiency/i)).toBeInTheDocument();
      });
    });
  });

  describe('Recent Activity', () => {
    it('should display recent incidents', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Recent Incidents/i)).toBeInTheDocument();
        expect(screen.getByText(/theft/i)).toBeInTheDocument();
        expect(screen.getByText(/disturbance/i)).toBeInTheDocument();
      });
    });

    it('should display recent access events', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Recent Access Events/i)).toBeInTheDocument();
      });
    });

    it('should display recent patrol activities', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Recent Patrol Activities/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API to throw error
      const { getDashboardMetrics } = require('../src/services/api');
      getDashboardMetrics.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Error loading dashboard data/i)).toBeInTheDocument();
      });
    });

    it('should handle WebSocket connection errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.WebSocket as jest.Mock).mockImplementation(() => {
        throw new Error('WebSocket connection failed');
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error creating WebSocket connection:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on different screen sizes', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Test mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByText(/PROPER 2.9/i)).toBeInTheDocument();
      });

      // Test desktop view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByText(/PROPER 2.9/i)).toBeInTheDocument();
      });
    });
  });
}); 