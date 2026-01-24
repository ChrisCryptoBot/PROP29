/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSecurityOperationsState } from '../hooks/useSecurityOperationsState';
import { logger } from '../../../services/logger';
import { showError } from '../../../utils/toast';
import { useAuth } from '../../../hooks/useAuth';

jest.mock('../services/securityOperationsCenterService', () => ({
  getCameras: jest.fn(),
  getRecordings: jest.fn(),
  getEvidence: jest.fn(),
  getMetrics: jest.fn(),
  getAnalytics: jest.fn(),
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
  createCamera: jest.fn(),
  updateCamera: jest.fn(),
  deleteCamera: jest.fn(),
}));
jest.mock('../../../services/logger');
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../../../utils/toast', () => ({
  showLoading: jest.fn(() => 'toast-id'),
  dismissLoadingAndShowSuccess: jest.fn(),
  dismissLoadingAndShowError: jest.fn(),
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));

const mockService = jest.requireMock('../services/securityOperationsCenterService') as {
  getCameras: jest.Mock;
  getRecordings: jest.Mock;
  getEvidence: jest.Mock;
  getMetrics: jest.Mock;
  getAnalytics: jest.Mock;
  getSettings: jest.Mock;
  updateSettings: jest.Mock;
  createCamera: jest.Mock;
  updateCamera: jest.Mock;
  deleteCamera: jest.Mock;
};
const mockUseAuth = useAuth as jest.Mock;

const mockCamera = {
  id: 'cam-100',
  name: 'Test Camera',
  location: 'Test Location',
  ipAddress: '192.168.1.10',
  streamUrl: 'https://example.com/stream.m3u8',
  status: 'online' as const,
  resolution: '1080p',
  uptime: '99%',
  previewType: 'online' as const,
  isRecording: true,
  motionDetectionEnabled: true,
};

const mockRecording = {
  id: 'rec-test',
  cameraId: 100,
  cameraName: 'Test Camera',
  date: '2026-01-16',
  time: '12:00',
  duration: '00:10:00',
  size: '500 MB',
};

const mockEvidence = {
  id: 'ev-test',
  title: 'Test Evidence',
  camera: 'CAM-TEST',
  time: '12:05',
  date: '2026-01-16',
  type: 'video' as const,
  size: '200 MB',
  status: 'pending' as const,
  chainOfCustody: [{ timestamp: '2026-01-16 12:06', handler: 'Officer Test', action: 'Captured' }],
  tags: ['test'],
};

describe('useSecurityOperationsState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { roles: ['ADMIN'] } });

    mockService.getCameras.mockResolvedValue([]);
    mockService.getRecordings.mockResolvedValue([]);
    mockService.getEvidence.mockResolvedValue([]);
    mockService.getMetrics.mockResolvedValue(null);
    mockService.getAnalytics.mockResolvedValue(null);
    mockService.getSettings.mockResolvedValue(null);
    mockService.updateSettings.mockResolvedValue(null);
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useSecurityOperationsState());

    expect(result.current.cameras.length).toBe(0);
    expect(result.current.recordings.length).toBe(0);
    expect(result.current.evidence.length).toBe(0);
    expect(result.current.metrics.total).toBe(0);
    expect(result.current.canUpdateSettings).toBe(true);
  });

  it('refreshes cameras from service', async () => {
    mockService.getCameras.mockResolvedValue([mockCamera]);
    const { result } = renderHook(() => useSecurityOperationsState());

    await act(async () => {
      await result.current.refreshCameras();
    });

    await waitFor(() => {
      expect(result.current.cameras).toHaveLength(1);
      expect(result.current.cameras[0].name).toBe('Test Camera');
    });
  });

  it('refreshes recordings from service', async () => {
    mockService.getRecordings.mockResolvedValue([mockRecording]);
    const { result } = renderHook(() => useSecurityOperationsState());

    await act(async () => {
      await result.current.refreshRecordings();
    });

    await waitFor(() => {
      expect(result.current.recordings).toHaveLength(1);
      expect(result.current.recordings[0].id).toBe('rec-test');
    });
  });

  it('refreshes evidence from service', async () => {
    mockService.getEvidence.mockResolvedValue([mockEvidence]);
    const { result } = renderHook(() => useSecurityOperationsState());

    await act(async () => {
      await result.current.refreshEvidence();
    });

    await waitFor(() => {
      expect(result.current.evidence).toHaveLength(1);
      expect(result.current.evidence[0].id).toBe('ev-test');
    });
  });

  it('computes metrics when service returns null', async () => {
    mockService.getMetrics.mockResolvedValue(null);
    const { result } = renderHook(() => useSecurityOperationsState());

    await act(async () => {
      await result.current.refreshMetrics();
    });

    await waitFor(() => {
      expect(result.current.metrics.total).toBe(result.current.cameras.length);
    });
  });

  it('toggles recording and motion detection', async () => {
    const { result } = renderHook(() => useSecurityOperationsState());

    mockService.getCameras.mockResolvedValue([mockCamera]);
    await act(async () => {
      await result.current.refreshCameras();
    });

    const targetId = result.current.cameras[0].id;
    const initialRecording = result.current.cameras[0].isRecording;
    const initialMotion = result.current.cameras[0].motionDetectionEnabled;

    await act(async () => {
      await result.current.toggleRecording(targetId);
      await result.current.toggleMotionDetection(targetId);
    });

    expect(result.current.cameras[0].isRecording).toBe(!initialRecording);
    expect(result.current.cameras[0].motionDetectionEnabled).toBe(!initialMotion);
  });

  it('blocks settings update when user lacks admin role', async () => {
    mockUseAuth.mockReturnValue({ user: { roles: ['SECURITY_OFFICER'] } });
    const { result } = renderHook(() => useSecurityOperationsState());

    await act(async () => {
      await result.current.updateSettings(result.current.settings);
    });

    expect(showError).toHaveBeenCalledWith('You do not have permission to update settings');
  });

  it('logs errors when refresh fails', async () => {
    mockService.getCameras.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useSecurityOperationsState());

    await act(async () => {
      await result.current.refreshCameras();
    });

    await waitFor(() => {
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
