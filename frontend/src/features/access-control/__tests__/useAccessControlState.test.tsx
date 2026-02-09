/**
 * @jest-environment jsdom
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAccessControlState } from '../hooks/useAccessControlState';
import { AuthProvider } from '../../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import apiService from '../../../services/ApiService';
import { logger } from '../../../services/logger';

// Mock dependencies
jest.mock('../../../services/ApiService');
jest.mock('../../../services/logger');
jest.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({ user: { user_id: 'test-user', email: 'test@example.com' }, isAuthenticated: true })
}));

// Mock toast functions
jest.mock('../../../utils/toast', () => ({
  showLoading: jest.fn(() => 'toast-id'),
  dismissLoadingAndShowSuccess: jest.fn(),
  dismissLoadingAndShowError: jest.fn(),
  showSuccess: jest.fn(),
  showError: jest.fn()
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('useAccessControlState', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.get.mockResolvedValue({ data: [] });
    mockApiService.post.mockResolvedValue({ data: {} });
    mockApiService.put.mockResolvedValue({ data: {} });
    mockApiService.delete.mockResolvedValue({});
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAccessControlState(), { wrapper });

      expect(result.current.accessPoints).toEqual([]);
      expect(result.current.users).toEqual([]);
      expect(result.current.accessEvents).toEqual([]);
      expect(result.current.metrics).toBeDefined();
      expect(result.current.emergencyMode).toBe('normal');
      expect(result.current.emergencyController).toBeNull();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch access points', async () => {
      const mockAccessPoints = [
        { id: '1', name: 'Main Entrance', location: 'Lobby', type: 'door', status: 'active', accessMethod: 'card', lastAccess: '2024-01-15T14:30:00Z', accessCount: 1247, permissions: ['staff'], securityLevel: 'high', isOnline: true, sensorStatus: 'closed', powerSource: 'mains', cachedEvents: [] }
      ];
      mockApiService.get.mockResolvedValue({ data: { data: mockAccessPoints } });

      const { result } = renderHook(() => useAccessControlState(), { wrapper });

      await act(async () => {
        await result.current.refreshAccessPoints();
      });

      await waitFor(() => {
        expect(result.current.accessPoints).toHaveLength(mockAccessPoints.length);
      });
    });

    it('should fetch users', async () => {
      const mockUsers = [
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', department: 'Security', status: 'active', accessLevel: 'elevated', accessCount: 45, avatar: 'JD', permissions: ['all'] }
      ];
      mockApiService.get.mockResolvedValue({ data: { data: mockUsers } });

      const { result } = renderHook(() => useAccessControlState(), { wrapper });

      await act(async () => {
        await result.current.refreshUsers();
      });

      await waitFor(() => {
        expect(result.current.users).toHaveLength(mockUsers.length);
      });
    });

    it('should fetch access events', async () => {
      const mockEvents = [
        { id: '1', userId: '1', userName: 'John Doe', accessPointId: '1', accessPointName: 'Main Entrance', action: 'granted', timestamp: '2024-01-15T14:30:00Z', location: 'Lobby', accessMethod: 'card' }
      ];
      mockApiService.get.mockResolvedValue({ data: { data: mockEvents } });

      const { result } = renderHook(() => useAccessControlState(), { wrapper });

      await act(async () => {
        await result.current.refreshAccessEvents();
      });

      await waitFor(() => {
        expect(result.current.accessEvents).toHaveLength(mockEvents.length);
      });
    });

    it('should fetch metrics', async () => {
      const mockMetrics = {
        totalAccessPoints: 5,
        activeAccessPoints: 4,
        totalUsers: 10,
        activeUsers: 8,
        todayAccessEvents: 100,
        deniedAccessEvents: 5,
        averageResponseTime: '50ms',
        systemUptime: '99.9%',
        topAccessPoints: [],
        recentAlerts: 2,
        securityScore: 95,
        lastSecurityScan: new Date().toISOString()
      };
      mockApiService.get.mockResolvedValue({ data: mockMetrics });

      const { result } = renderHook(() => useAccessControlState(), { wrapper });

      await act(async () => {
        await result.current.refreshMetrics();
      });

      await waitFor(() => {
        expect(result.current.metrics.totalAccessPoints).toBe(mockMetrics.totalAccessPoints);
      });
    });
  });

  describe('User Management', () => {
    it('should create a user', async () => {
      const newUser = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'employee' as const,
        department: 'HR',
        status: 'active' as const,
        accessLevel: 'standard' as const,
        accessCount: 0,
        avatar: 'JD',
        permissions: ['lobby']
      };
      const createdUser = { id: '2', ...newUser };
      mockApiService.post.mockResolvedValue({ data: createdUser });
      mockApiService.get.mockResolvedValue({ data: { data: [createdUser] } });

      const { result } = renderHook(() => useAccessControlState(), { wrapper });

      await act(async () => {
        await result.current.createUser(newUser);
      });

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledWith('/access-control/users', newUser);
      });
    });

    it('should update a user', async () => {
      const updatedUser = {
        id: '1',
        name: 'John Updated',
        email: 'john@example.com',
        role: 'manager' as const,
        department: 'Security',
        status: 'active' as const,
        accessLevel: 'elevated' as const,
        accessCount: 45,
        avatar: 'JU',
        permissions: ['all']
      };
      mockApiService.put.mockResolvedValue({ data: updatedUser });

      const { result } = renderHook(() => useAccessControlState(), { wrapper });

      await act(async () => {
        await result.current.updateUser('1', { name: 'John Updated', avatar: 'JU' });
      });

      await waitFor(() => {
        expect(mockApiService.put).toHaveBeenCalledWith('/access-control/users/1', { name: 'John Updated', avatar: 'JU' });
      });
    });

    it('should delete a user', async () => {
      mockApiService.delete.mockResolvedValue({});

      const { result } = renderHook(() => useAccessControlState(), { wrapper });

      await act(async () => {
        await result.current.deleteUser('1');
      });

      await waitFor(() => {
        expect(mockApiService.delete).toHaveBeenCalledWith('/access-control/users/1');
      });
    });
  });

  describe('Emergency Actions', () => {
    it('should handle emergency lockdown', async () => {
      window.confirm = jest.fn(() => true);

      const { result } = renderHook(() => useAccessControlState(), { wrapper });

      await act(async () => {
        await result.current.handleEmergencyLockdown();
      });

      await waitFor(() => {
        expect(result.current.emergencyMode).toBe('lockdown');
      });
    });

    it('should handle emergency unlock', async () => {
      window.confirm = jest.fn(() => true);

      const { result } = renderHook(() => useAccessControlState(), { wrapper });

      await act(async () => {
        await result.current.handleEmergencyUnlock();
      });

      await waitFor(() => {
        expect(result.current.emergencyMode).toBe('unlock');
      });
    });

    it('should restore normal mode', async () => {
      const { result } = renderHook(() => useAccessControlState(), { wrapper });

      // First set to lockdown
      window.confirm = jest.fn(() => true);
      await act(async () => {
        await result.current.handleEmergencyLockdown();
      });

      // Then restore normal
      await act(async () => {
        await result.current.handleNormalMode();
      });

      await waitFor(() => {
        expect(result.current.emergencyMode).toBe('normal');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      mockApiService.get.mockRejectedValue(error);

      const { result } = renderHook(() => useAccessControlState(), { wrapper });

      await act(async () => {
        await result.current.refreshAccessPoints();
      });

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalled();
      });
    });
  });
});
