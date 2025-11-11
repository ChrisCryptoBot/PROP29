import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  subscribe: (type: string, callback: (data: any) => void) => () => void;
  lastMessage: WebSocketMessage | null;
}

// Create context with default value to prevent undefined errors
const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  sendMessage: () => console.warn('WebSocket not initialized'),
  subscribe: () => () => {},
  lastMessage: null,
});

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = React.useCallback(() => {
    // Only connect if user is authenticated and has a user_id
    if (!isAuthenticated || !user?.user_id) {
      console.log('WebSocket: User not authenticated or no user_id, skipping connection');
      return;
    }

    // Don't connect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket: Already connected');
      return;
    }

    const wsUrl = process.env.REACT_APP_WS_URL || `ws://localhost:8000/ws/${user.user_id}`;
    
    try {
      console.log('WebSocket: Attempting to connect to', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Notify subscribers
          const subscribers = subscribersRef.current.get(message.type);
          if (subscribers) {
            subscribers.forEach(callback => {
              try {
                callback(message.data);
              } catch (error) {
                console.error('Error in WebSocket subscriber callback:', error);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        // Only attempt to reconnect if user is still authenticated
        if (isAuthenticated && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`WebSocket: Attempting reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [isAuthenticated, user?.user_id]);

  const disconnect = React.useCallback(() => {
    console.log('WebSocket: Disconnecting');
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnecting');
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = React.useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket is not connected, cannot send message:', message);
    }
  }, []);

  const subscribe = React.useCallback((type: string, callback: (data: any) => void) => {
    if (!subscribersRef.current.has(type)) {
      subscribersRef.current.set(type, new Set());
    }
    subscribersRef.current.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = subscribersRef.current.get(type);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          subscribersRef.current.delete(type);
        }
      }
    };
  }, []);

  // Connect when authenticated user is available
  useEffect(() => {
    if (isAuthenticated && user?.user_id) {
      connect();
    } else {
      disconnect();
    }
  }, [isAuthenticated, user?.user_id, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value: WebSocketContextType = React.useMemo(() => ({
    isConnected,
    sendMessage,
    subscribe,
    lastMessage,
  }), [isConnected, sendMessage, subscribe, lastMessage]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Enhanced hook with better error handling
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  
  // This should never happen with the default value, but keeping for safety
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  return context;
}; 