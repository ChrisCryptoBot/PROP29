/**
 * Patrol Command Center WebSocket Hook
 * Handles real-time updates for patrols, checkpoints, officers, and emergency alerts.
 * Uses a ref for options to avoid subscribe/unsubscribe churn from inline callbacks.
 */

import { useEffect, useRef } from 'react';
import { useWebSocket } from '../../../components/UI/WebSocketProvider';
import { logger } from '../../../services/logger';
import type { UpcomingPatrol, PatrolOfficer, Alert, Checkpoint } from '../types';

export interface UsePatrolWebSocketOptions {
  onPatrolUpdated?: (patrol: UpcomingPatrol) => void;
  onCheckpointCheckIn?: (data: { patrolId: string; checkpointId: string; checkpoint: Checkpoint }) => void;
  onOfficerStatusChange?: (officer: PatrolOfficer) => void;
  onEmergencyAlert?: (alert: Alert) => void;
  onLocationUpdate?: (data: { officerId: string; location: { lat: number; lng: number } }) => void;
  onHeartbeat?: (data: { officerId: string; last_heartbeat: string; connection_status: 'online' | 'offline' }) => void;
}

export function usePatrolWebSocket(options: UsePatrolWebSocketOptions = {}) {
  const { isConnected, subscribe } = useWebSocket();
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    if (!isConnected) {
      logger.debug('WebSocket not connected, skipping patrol subscriptions', {
        module: 'PatrolWebSocket'
      });
      return;
    }

    logger.info('Subscribing to patrol WebSocket channels', {
      module: 'PatrolWebSocket'
    });

    const unsubscribePatrolUpdated = subscribe('patrol.updated', (data: any) => {
      if (data?.patrol && optsRef.current.onPatrolUpdated) {
        logger.info('Patrol updated via WebSocket', {
          module: 'PatrolWebSocket',
          patrolId: data.patrol.id
        });
        optsRef.current.onPatrolUpdated!(data.patrol);
      }
    });

    const unsubscribeCheckpointCheckIn = subscribe('checkpoint.checkin', (data: any) => {
      if (data?.patrolId && data?.checkpointId && data?.checkpoint && optsRef.current.onCheckpointCheckIn) {
        logger.info('Checkpoint check-in via WebSocket', {
          module: 'PatrolWebSocket',
          patrolId: data.patrolId,
          checkpointId: data.checkpointId
        });
        optsRef.current.onCheckpointCheckIn!({
          patrolId: data.patrolId,
          checkpointId: data.checkpointId,
          checkpoint: data.checkpoint
        });
      }
    });

    const unsubscribeOfficerStatus = subscribe('officer.status', (data: any) => {
      if (data?.officer && optsRef.current.onOfficerStatusChange) {
        logger.info('Officer status changed via WebSocket', {
          module: 'PatrolWebSocket',
          officerId: data.officer.id
        });
        optsRef.current.onOfficerStatusChange!(data.officer);
      }
    });

    const unsubscribeEmergencyAlert = subscribe('emergency.alert', (data: any) => {
      if (data?.alert && optsRef.current.onEmergencyAlert) {
        logger.info('Emergency alert via WebSocket', {
          module: 'PatrolWebSocket',
          alertId: data.alert.id
        });
        optsRef.current.onEmergencyAlert!(data.alert);
      }
    });

    const unsubscribeLocationUpdate = subscribe('location.update', (data: any) => {
      if (data?.officerId && data?.location && optsRef.current.onLocationUpdate) {
        logger.debug('Location update via WebSocket', {
          module: 'PatrolWebSocket',
          officerId: data.officerId
        });
        optsRef.current.onLocationUpdate!({
          officerId: data.officerId,
          location: data.location
        });
      }
    });

    const unsubscribeHeartbeat = subscribe('heartbeat.update', (data: any) => {
      if (data?.officerId && data?.last_heartbeat && optsRef.current.onHeartbeat) {
        logger.debug('Heartbeat update via WebSocket', {
          module: 'PatrolWebSocket',
          officerId: data.officerId
        });
        optsRef.current.onHeartbeat!({
          officerId: data.officerId,
          last_heartbeat: data.last_heartbeat,
          connection_status: data.connection_status || 'online'
        });
      }
    });

    return () => {
      unsubscribePatrolUpdated();
      unsubscribeCheckpointCheckIn();
      unsubscribeOfficerStatus();
      unsubscribeEmergencyAlert();
      unsubscribeLocationUpdate();
      unsubscribeHeartbeat();
      logger.debug('Unsubscribed from patrol WebSocket channels', {
        module: 'PatrolWebSocket'
      });
    };
  }, [isConnected, subscribe]);
}
