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

// --- Module-level shared WebSocket so Strict Mode unmount doesn't close the connection ---
type WsListener = {
  onOpen: () => void;
  onClose: () => void;
  onMessage: (msg: WebSocketMessage) => void;
};
let sharedSocket: WebSocket | null = null;
let sharedUserId: string | null = null;
const listeners = new Set<WsListener>();

function notifyOpen(): void {
  listeners.forEach((l) => {
    try {
      l.onOpen();
    } catch (e) {
      logger.error('WebSocket listener onOpen error', e instanceof Error ? e : new Error(String(e)), { module: 'WebSocketProvider' });
    }
  });
}

function notifyClose(): void {
  sharedSocket = null;
  sharedUserId = null;
  listeners.forEach((l) => {
    try {
      l.onClose();
    } catch (e) {
      logger.error('WebSocket listener onClose error', e instanceof Error ? e : new Error(String(e)), { module: 'WebSocketProvider' });
    }
  });
}

function notifyMessage(msg: WebSocketMessage): void {
  listeners.forEach((l) => {
    try {
      l.onMessage(msg);
    } catch (e) {
      logger.error('WebSocket listener onMessage error', e instanceof Error ? e : new Error(String(e)), { module: 'WebSocketProvider' });
    }
  });
}

function connectShared(userId: string, token: string | null): void {
  if (sharedSocket?.readyState === WebSocket.OPEN && sharedUserId === userId) {
    logger.debug('WebSocket: Reusing existing connection', { module: 'WebSocketProvider', userId });
    notifyOpen();
    return;
  }
  if (sharedSocket) {
    sharedSocket.close(1000, 'Reconnecting');
    sharedSocket = null;
    sharedUserId = null;
  }
  const wsUrl = token
    ? `${env.WS_URL}/${userId}?token=${encodeURIComponent(token)}`
    : `${env.WS_URL}/${userId}`;
  try {
    logger.debug(`WebSocket: Connecting to ${env.WS_URL}/${userId}`, { module: 'WebSocketProvider', action: 'connect' });
    const ws = new WebSocket(wsUrl);
    sharedSocket = ws;
    sharedUserId = userId;
    ws.onopen = () => {
      logger.info('WebSocket connected successfully', { module: 'WebSocketProvider', action: 'onopen', userId });
      notifyOpen();
    };
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        notifyMessage(message);
      } catch (error) {
        logger.error('Error parsing WebSocket message', error instanceof Error ? error : new Error(String(error)), { module: 'WebSocketProvider', action: 'onmessage' });
      }
    };
    ws.onclose = () => {
      logger.debug('WebSocket closed', { module: 'WebSocketProvider', action: 'onclose' });
      notifyClose();
    };
    ws.onerror = () => {
      notifyClose();
    };
  } catch (error) {
    logger.error('Error creating WebSocket', error instanceof Error ? error : new Error(String(error)), { module: 'WebSocketProvider', action: 'connect' });
    sharedSocket = null;
    sharedUserId = null;
    notifyClose();
  }
}

function disconnectShared(): void {
  if (sharedSocket) {
    sharedSocket.close(1000, 'User disconnecting');
    sharedSocket = null;
    sharedUserId = null;
  }
  notifyClose();
}

function sendShared(message: WebSocketMessage): void {
  if (sharedSocket?.readyState === WebSocket.OPEN) {
    try {
      sharedSocket.send(JSON.stringify(message));
    } catch (error) {
      logger.error('Error sending WebSocket message', error instanceof Error ? error : new Error(String(error)), { module: 'WebSocketProvider', action: 'sendMessage' });
    }
  } else {
    logger.warn('WebSocket is not connected, cannot send message', { module: 'WebSocketProvider', action: 'sendMessage', messageType: message.type });
  }
}

// --- Provider ---
interface WebSocketProviderProps {
  children: ReactNode;
}

const MIN_RECONNECT_DELAY_MS = 2500;
const maxReconnectAttempts = 5;

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: Record<string, unknown>) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const listenerRef = useRef<WsListener>({
    onOpen: () => {},
    onClose: () => {},
    onMessage: () => {},
  });

  const connect = React.useCallback(() => {
    if (!isAuthenticated || !user?.user_id) return;
    const token = localStorage.getItem('access_token');
    connectShared(user.user_id, token);
  }, [isAuthenticated, user?.user_id]);

  useEffect(() => {
    listenerRef.current.onOpen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };
    listenerRef.current.onClose = () => {
      setIsConnected(false);
      if (!isAuthenticated || reconnectAttemptsRef.current >= maxReconnectAttempts) return;
      const delay = Math.max(MIN_RECONNECT_DELAY_MS, Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000));
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current += 1;
        connect();
      }, delay);
    };
    listenerRef.current.onMessage = (msg) => {
      setLastMessage(msg);
      const subscribers = subscribersRef.current.get(msg.type);
      if (subscribers) {
        subscribers.forEach((cb) => {
          try {
            cb(msg.data);
          } catch (e) {
            logger.error('WebSocket subscriber error', e instanceof Error ? e : new Error(String(e)), { module: 'WebSocketProvider' });
          }
        });
      }
    };
  });

  const sendMessage = React.useCallback((message: WebSocketMessage) => {
    sendShared(message);
  }, []);

  const subscribe = React.useCallback((type: string, callback: (data: Record<string, unknown>) => void) => {
    if (!subscribersRef.current.has(type)) {
      subscribersRef.current.set(type, new Set());
    }
    subscribersRef.current.get(type)!.add(callback);
    return () => {
      const subscribers = subscribersRef.current.get(type);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) subscribersRef.current.delete(type);
      }
    };
  }, []);

  // When authenticated: register listener and connect. On unmount only unregister (do not close socket).
  useEffect(() => {
    if (isAuthenticated && user?.user_id) {
      listeners.add(listenerRef.current);
      connect();
      return () => {
        listeners.delete(listenerRef.current);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
    }
    disconnectShared();
    return () => {};
  }, [isAuthenticated, user?.user_id, connect]);

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
