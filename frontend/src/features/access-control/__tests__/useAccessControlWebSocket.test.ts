/**
 * Unit Tests for useAccessControlWebSocket Hook
 * Tests WebSocket subscription, reconnection, and event handling
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useAccessControlWebSocket } from '../hooks/useAccessControlWebSocket';
import { useWebSocket } from '../../../../components/UI/WebSocketProvider';

// Mock WebSocket provider
jest.mock('../../../../components/UI/WebSocketProvider');
jest.mock('../../../../services/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;

describe('useAccessControlWebSocket', () => {
  let mockSubscribe: jest.Mock;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    mockSubscribe = jest.fn();
    mockUnsubscribe = jest.fn();
    
    mockUseWebSocket.mockReturnValue({
      isConnected: true,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should subscribe to all channels when connected', () => {
    const onAccessPointUpdated = jest.fn();
    const onEventCreated = jest.fn();

    renderHook(() =>
      useAccessControlWebSocket({
        onAccessPointUpdated,
        onEventCreated,
      })
    );

    expect(mockSubscribe).toHaveBeenCalledWith(
      'access-control.point.updated',
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalledWith(
      'access-control.event.created',
      expect.any(Function)
    );
  });

  it('should not subscribe when disconnected', () => {
    mockUseWebSocket.mockReturnValue({
      isConnected: false,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    } as any);

    renderHook(() => useAccessControlWebSocket({}));

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useAccessControlWebSocket({}));

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should call onAccessPointUpdated when point updated', () => {
    const onAccessPointUpdated = jest.fn();
    let subscribeCallback: ((data: any) => void) | null = null;

    mockSubscribe.mockImplementation((channel, callback) => {
      if (channel === 'access-control.point.updated') {
        subscribeCallback = callback;
      }
    });

    renderHook(() =>
      useAccessControlWebSocket({
        onAccessPointUpdated,
      })
    );

    const pointData = {
      id: 'point-123',
      name: 'Test Point',
      status: 'active',
    };

    if (subscribeCallback) {
      subscribeCallback(pointData);
    }

    expect(onAccessPointUpdated).toHaveBeenCalledWith(pointData);
  });

  it('should handle reconnection by resubscribing', () => {
    const { rerender } = renderHook(
      ({ connected }) =>
        useAccessControlWebSocket({}),
      {
        initialProps: { connected: false },
      }
    );

    mockUseWebSocket.mockReturnValue({
      isConnected: false,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    } as any);

    expect(mockSubscribe).not.toHaveBeenCalled();

    // Simulate reconnection
    mockUseWebSocket.mockReturnValue({
      isConnected: true,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    } as any);

    rerender({ connected: true });

    expect(mockSubscribe).toHaveBeenCalled();
  });
});
