/**
 * useHandoverWebSocket
 *
 * Placeholder for real-time handover updates when the backend supports WebSocket.
 * Subscribe to handover.created, handover.updated, handover.completed, handover.deleted
 * and update context state. Until then, this is a no-op (returns an unsubscribe that does nothing).
 *
 * Integration: When backend adds WS, replace the no-op with a real subscription
 * (e.g. connect to ws://.../handovers, parse events, and call onHandoverEvent or merge into context).
 */

import { useCallback } from 'react';

export type HandoverWebSocketEvent =
  | { type: 'handover.created'; payload: unknown }
  | { type: 'handover.updated'; payload: unknown }
  | { type: 'handover.completed'; payload: unknown }
  | { type: 'handover.deleted'; payload: { id: string } };

export interface UseHandoverWebSocketOptions {
  onEvent?: (event: HandoverWebSocketEvent) => void;
  enabled?: boolean;
}

export function useHandoverWebSocket(_options?: UseHandoverWebSocketOptions): {
  subscribe: () => () => void;
  isConnected: boolean;
} {
  const subscribe = useCallback(() => {
    // No-op until backend supports WebSocket. When ready: open WS, on message parse and call onEvent, return cleanup.
    return () => {};
  }, []);

  return {
    subscribe,
    isConnected: false,
  };
}
