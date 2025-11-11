/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebSocketProvider, useWebSocket } from '../src/components/UI/WebSocketProvider';
import { AuthProvider } from '../src/contexts/AuthContext';

// Mock WebSocket
const mockWebSocket = {
  readyState: 1, // WebSocket.OPEN
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.WebSocket = jest.fn(() => mockWebSocket) as any;

// Mock environment variables
process.env.REACT_APP_WS_URL = 'ws://localhost:8000/ws';

// Mock useAuth hook
jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { user_id: 'test-user-123' },
    isAuthenticated: true,
  }),
}));

// Test component to use the WebSocket hook
const TestComponent = () => {
  const { isConnected, sendMessage, subscribe, lastMessage } = useWebSocket();
  
  const handleSendMessage = () => {
    sendMessage({
      type: 'test',
      data: { message: 'Hello WebSocket' },
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div data-testid="last-message">
        {lastMessage ? JSON.stringify(lastMessage) : 'No message'}
      </div>
      <button onClick={handleSendMessage} data-testid="send-button">
        Send Message
      </button>
    </div>
  );
};

// Wrapper component for testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <WebSocketProvider>
      {children}
    </WebSocketProvider>
  </AuthProvider>
);

describe('WebSocketProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.WebSocket as jest.Mock).mockImplementation(() => mockWebSocket);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Connection Management', () => {
    it('should establish WebSocket connection on mount', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8000/ws/test-user-123');
      });
    });

    it('should handle connection open event', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
      });

      // Simulate connection open
      const openHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )[1];
      
      act(() => {
        openHandler();
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });
    });

    it('should handle connection close event', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
      });

      // Simulate connection close
      const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'close'
      )[1];
      
      act(() => {
        closeHandler({ code: 1000, reason: 'Normal closure' });
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
      });
    });

    it('should handle connection error event', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      });

      // Simulate connection error
      const errorHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )[1];
      
      act(() => {
        errorHandler(new Error('Connection failed'));
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Message Handling', () => {
    it('should handle incoming messages', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });

      // Simulate incoming message
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1];
      
      const testMessage = {
        type: 'incident_alert',
        data: { incident_id: 'inc-123', severity: 'high' },
        timestamp: new Date().toISOString(),
      };

      act(() => {
        messageHandler({ data: JSON.stringify(testMessage) });
      });

      await waitFor(() => {
        expect(screen.getByTestId('last-message')).toHaveTextContent(
          JSON.stringify(testMessage)
        );
      });
    });

    it('should handle malformed JSON messages', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });

      // Simulate malformed message
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1];
      
      act(() => {
        messageHandler({ data: 'invalid json' });
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error parsing WebSocket message:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should send messages when connected', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Simulate connection open
      const openHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )[1];
      
      act(() => {
        openHandler();
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });

      // Send message
      const sendButton = screen.getByTestId('send-button');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockWebSocket.send).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'test',
            data: { message: 'Hello WebSocket' },
            timestamp: expect.any(String),
          })
        );
      });
    });

    it('should warn when sending message while disconnected', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Ensure disconnected state
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
      });

      // Send message
      const sendButton = screen.getByTestId('send-button');
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('WebSocket is not connected');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Subscription System', () => {
    it('should allow subscribing to message types', async () => {
      const TestSubscriptionComponent = () => {
        const { subscribe } = useWebSocket();
        const [receivedMessages, setReceivedMessages] = React.useState<any[]>([]);

        React.useEffect(() => {
          const unsubscribe = subscribe('incident_alert', (data) => {
            setReceivedMessages(prev => [...prev, data]);
          });

          return unsubscribe;
        }, [subscribe]);

        return (
          <div>
            <div data-testid="message-count">{receivedMessages.length}</div>
            <div data-testid="messages">
              {receivedMessages.map((msg, i) => (
                <div key={i} data-testid={`message-${i}`}>
                  {JSON.stringify(msg)}
                </div>
              ))}
            </div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestSubscriptionComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });

      // Simulate incoming message
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1];
      
      const testMessage = {
        type: 'incident_alert',
        data: { incident_id: 'inc-123', severity: 'high' },
        timestamp: new Date().toISOString(),
      };

      act(() => {
        messageHandler({ data: JSON.stringify(testMessage) });
      });

      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('1');
        expect(screen.getByTestId('message-0')).toHaveTextContent(
          JSON.stringify(testMessage.data)
        );
      });
    });

    it('should allow unsubscribing from message types', async () => {
      const TestUnsubscribeComponent = () => {
        const { subscribe } = useWebSocket();
        const [receivedMessages, setReceivedMessages] = React.useState<any[]>([]);
        const [isSubscribed, setIsSubscribed] = React.useState(true);

        React.useEffect(() => {
          if (isSubscribed) {
            const unsubscribe = subscribe('incident_alert', (data) => {
              setReceivedMessages(prev => [...prev, data]);
            });

            return unsubscribe;
          }
        }, [subscribe, isSubscribed]);

        return (
          <div>
            <button 
              onClick={() => setIsSubscribed(false)}
              data-testid="unsubscribe-button"
            >
              Unsubscribe
            </button>
            <div data-testid="message-count">{receivedMessages.length}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestUnsubscribeComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });

      // Simulate incoming message
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1];
      
      const testMessage = {
        type: 'incident_alert',
        data: { incident_id: 'inc-123', severity: 'high' },
        timestamp: new Date().toISOString(),
      };

      act(() => {
        messageHandler({ data: JSON.stringify(testMessage) });
      });

      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('1');
      });

      // Unsubscribe
      const unsubscribeButton = screen.getByTestId('unsubscribe-button');
      await userEvent.click(unsubscribeButton);

      // Send another message
      act(() => {
        messageHandler({ data: JSON.stringify(testMessage) });
      });

      // Should not receive the message after unsubscribing
      await waitFor(() => {
        expect(screen.getByTestId('message-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Reconnection Logic', () => {
    it('should attempt reconnection on connection close', async () => {
      jest.useFakeTimers();

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
      });

      // Simulate connection close
      const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'close'
      )[1];
      
      act(() => {
        closeHandler({ code: 1006, reason: 'Abnormal closure' });
      });

      // Fast-forward time to trigger reconnection
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });

    it('should limit reconnection attempts', async () => {
      jest.useFakeTimers();

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
      });

      // Simulate multiple connection failures
      const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'close'
      )[1];
      
      for (let i = 0; i < 6; i++) {
        act(() => {
          closeHandler({ code: 1006, reason: 'Abnormal closure' });
        });

        act(() => {
          jest.advanceTimersByTime(1000 * Math.pow(2, i));
        });
      }

      // Should not attempt more than 5 reconnections
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledTimes(6); // Initial + 5 attempts
      });

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket creation errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (global.WebSocket as jest.Mock).mockImplementation(() => {
        throw new Error('WebSocket creation failed');
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error creating WebSocket connection:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle missing user ID', async () => {
      // Mock useAuth to return no user
      jest.doMock('../src/hooks/useAuth', () => ({
        useAuth: () => ({
          user: null,
          isAuthenticated: false,
        }),
      }));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should not attempt connection without user ID
      await waitFor(() => {
        expect(global.WebSocket).not.toHaveBeenCalled();
      });
    });
  });
}); 