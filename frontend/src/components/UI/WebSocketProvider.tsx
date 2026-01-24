import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { logger } from '../../services/logger';
import { env } from '../../config/env';

interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  subscribe: (type: string, callback: (data: Record<string, unknown>) => void) => () => void;
  lastMessage: WebSocketMessage | null;
}

// Create context with default value to prevent undefined errors
const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  sendMessage: () => {
    logger.warn('WebSocket not initialized', { module: 'WebSocketProvider', action: 'sendMessage' });
  },
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
  const subscribersRef = useRef<Map<string, Set<(data: Record<string, unknown>) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = React.useCallback(() => {
    // Only connect if user is authenticated and has a user_id
    if (!isAuthenticated || !user?.user_id) {
      logger.debug('WebSocket: User not authenticated or no user_id, skipping connection', { module: 'WebSocketProvider', action: 'connect' });
      return;
    }

    // Don't connect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      logger.debug('WebSocket: Already connected', { module: 'WebSocketProvider', action: 'connect' });
      return;
    }

    const accessToken = localStorage.getItem('access_token');
    const wsUrl = accessToken
      ? `${env.WS_URL}/${user.user_id}?token=${encodeURIComponent(accessToken)}`
      : `${env.WS_URL}/${user.user_id}`;
    
    try {
      logger.debug(`WebSocket: Attempting to connect to ${wsUrl}`, { module: 'WebSocketProvider', action: 'connect', wsUrl });
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        logger.info('WebSocket connected successfully', { module: 'WebSocketProvider', action: 'onopen', userId: user.user_id });
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
                logger.error('Error in WebSocket subscriber callback', error instanceof Error ? error : new Error(String(error)), { module: 'WebSocketProvider', action: 'onmessage', messageType: message.type });
              }
            });
          }
        } catch (error) {
          logger.error('Error parsing WebSocket message', error instanceof Error ? error : new Error(String(error)), { module: 'WebSocketProvider', action: 'onmessage' });
        }
      };

      ws.onclose = (event) => {
        logger.info(`WebSocket disconnected: ${event.code} ${event.reason}`, { module: 'WebSocketProvider', action: 'onclose', code: event.code, reason: event.reason });
        setIsConnected(false);
        wsRef.current = null;
        
        // Only attempt to reconnect if user is still authenticated
        if (isAuthenticated && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          logger.debug(`WebSocket: Attempting reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`, { module: 'WebSocketProvider', action: 'onclose', delay, attempt: reconnectAttemptsRef.current + 1 });
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        logger.error('WebSocket error', new Error('WebSocket connection error'), { module: 'WebSocketProvider', action: 'onerror', error });
        setIsConnected(false);
      };

    } catch (error) {
      logger.error('Error creating WebSocket connection', error instanceof Error ? error : new Error(String(error)), { module: 'WebSocketProvider', action: 'connect' });
      setIsConnected(false);
    }
  }, [isAuthenticated, user?.user_id]);

  const disconnect = React.useCallback(() => {
    logger.debug('WebSocket: Disconnecting', { module: 'WebSocketProvider', action: 'disconnect' });
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
        logger.error('Error sending WebSocket message', error instanceof Error ? error : new Error(String(error)), { module: 'WebSocketProvider', action: 'sendMessage', messageType: message.type });
      }
    } else {
      logger.warn('WebSocket is not connected, cannot send message', { module: 'WebSocketProvider', action: 'sendMessage', messageType: message.type });
    }
  }, []);

  const subscribe = React.useCallback((type: string, callback: (data: Record<string, unknown>) => void) => {
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
