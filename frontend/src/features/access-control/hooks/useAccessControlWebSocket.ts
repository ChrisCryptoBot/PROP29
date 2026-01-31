/**
 * Access Control WebSocket Hook
 * Handles real-time updates for access points, events, users, and emergency alerts.
 * Uses a ref for options to avoid subscribe/unsubscribe churn from inline callbacks.
 */

import { useEffect, useRef } from 'react';
import { useWebSocket } from '../../../components/UI/WebSocketProvider';
import { logger } from '../../../services/logger';
import type { AccessPoint, AccessControlUser, AccessEvent } from '../../../shared/types/access-control.types';

export interface UseAccessControlWebSocketOptions {
  onAccessPointUpdated?: (point: AccessPoint) => void;
  onAccessPointOffline?: (data: { accessPointId: string; isOnline: boolean }) => void;
  onEventCreated?: (event: AccessEvent) => void;
  onUserUpdated?: (user: AccessControlUser) => void;
  onEmergencyActivated?: (data: { mode: 'lockdown' | 'unlock' | 'restore'; initiatedBy: string; timestamp: string }) => void;
  onAgentEventPending?: (data: { event: AccessEvent }) => void;
  onHeldOpenAlarm?: (data: { accessPointId: string; accessPointName: string; location: string; duration: number; severity: 'warning' | 'critical' }) => void;
}

export function useAccessControlWebSocket(options: UseAccessControlWebSocketOptions = {}) {
  const { isConnected, subscribe } = useWebSocket();
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    if (!isConnected) {
      logger.debug('WebSocket not connected, skipping access control subscriptions', {
        module: 'AccessControlWebSocket'
      });
      return;
    }

    logger.info('Subscribing to access control WebSocket channels', {
      module: 'AccessControlWebSocket'
    });

    const unsubscribePointUpdated = subscribe('access-control.point.updated', (data: any) => {
      if (data?.point && optsRef.current.onAccessPointUpdated) {
        logger.info('Access point updated via WebSocket', {
          module: 'AccessControlWebSocket',
          accessPointId: data.point.id
        });
        optsRef.current.onAccessPointUpdated!(data.point);
      }
    });

    const unsubscribePointOffline = subscribe('access-control.point.offline', (data: any) => {
      if (data?.accessPointId !== undefined && optsRef.current.onAccessPointOffline) {
        logger.info('Access point offline via WebSocket', {
          module: 'AccessControlWebSocket',
          accessPointId: data.accessPointId
        });
        optsRef.current.onAccessPointOffline!({
          accessPointId: data.accessPointId,
          isOnline: data.isOnline !== undefined ? data.isOnline : false
        });
      }
    });

    const unsubscribeEventCreated = subscribe('access-control.event.created', (data: any) => {
      if (data?.event && optsRef.current.onEventCreated) {
        logger.info('Access event created via WebSocket', {
          module: 'AccessControlWebSocket',
          eventId: data.event.id
        });
        optsRef.current.onEventCreated!(data.event);
      }
    });

    const unsubscribeUserUpdated = subscribe('access-control.user.updated', (data: any) => {
      if (data?.user && optsRef.current.onUserUpdated) {
        logger.info('User updated via WebSocket', {
          module: 'AccessControlWebSocket',
          userId: data.user.id
        });
        optsRef.current.onUserUpdated!(data.user);
      }
    });

    const unsubscribeEmergencyActivated = subscribe('access-control.emergency.activated', (data: any) => {
      if (data?.mode && optsRef.current.onEmergencyActivated) {
        logger.warn('Emergency mode activated via WebSocket', {
          module: 'AccessControlWebSocket',
          mode: data.mode
        });
        optsRef.current.onEmergencyActivated!({
          mode: data.mode,
          initiatedBy: data.initiatedBy || 'System',
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });

    const unsubscribeAgentEventPending = subscribe('access-control.agent-event.pending', (data: any) => {
      if (data?.event && optsRef.current.onAgentEventPending) {
        logger.info('Agent event pending via WebSocket', {
          module: 'AccessControlWebSocket',
          eventId: data.event.id
        });
        optsRef.current.onAgentEventPending!({ event: data.event });
      }
    });

    const unsubscribeHeldOpenAlarm = subscribe('access-control.held-open-alarm', (data: any) => {
      if (data?.accessPointId && optsRef.current.onHeldOpenAlarm) {
        logger.warn('Held-open alarm via WebSocket', {
          module: 'AccessControlWebSocket',
          accessPointId: data.accessPointId,
          severity: data.severity
        });
        optsRef.current.onHeldOpenAlarm!({
          accessPointId: data.accessPointId,
          accessPointName: data.accessPointName || 'Unknown',
          location: data.location || 'Unknown',
          duration: data.duration || 0,
          severity: data.severity || 'warning'
        });
      }
    });

    return () => {
      unsubscribePointUpdated();
      unsubscribePointOffline();
      unsubscribeEventCreated();
      unsubscribeUserUpdated();
      unsubscribeEmergencyActivated();
      unsubscribeAgentEventPending();
      unsubscribeHeldOpenAlarm();
      logger.debug('Unsubscribed from access control WebSocket channels', {
        module: 'AccessControlWebSocket'
      });
    };
  }, [isConnected, subscribe]);
}
