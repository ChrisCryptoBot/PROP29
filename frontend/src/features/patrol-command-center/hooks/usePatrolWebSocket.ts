/**
 * Patrol Command Center WebSocket Hook
 * Handles real-time updates for patrols, checkpoints, officers, and emergency alerts
 */

import { useEffect } from 'react';
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

    // Subscribe to patrol updates
    const unsubscribePatrolUpdated = subscribe('patrol.updated', (data: any) => {
      if (data?.patrol && options.onPatrolUpdated) {
        logger.info('Patrol updated via WebSocket', {
          module: 'PatrolWebSocket',
          patrolId: data.patrol.id
        });
        options.onPatrolUpdated(data.patrol);
      }
    });

    // Subscribe to checkpoint check-ins
    const unsubscribeCheckpointCheckIn = subscribe('checkpoint.checkin', (data: any) => {
      if (data?.patrolId && data?.checkpointId && data?.checkpoint && options.onCheckpointCheckIn) {
        logger.info('Checkpoint check-in via WebSocket', {
          module: 'PatrolWebSocket',
          patrolId: data.patrolId,
          checkpointId: data.checkpointId
        });
        options.onCheckpointCheckIn({
          patrolId: data.patrolId,
          checkpointId: data.checkpointId,
          checkpoint: data.checkpoint
        });
      }
    });

    // Subscribe to officer status changes
    const unsubscribeOfficerStatus = subscribe('officer.status', (data: any) => {
      if (data?.officer && options.onOfficerStatusChange) {
        logger.info('Officer status changed via WebSocket', {
          module: 'PatrolWebSocket',
          officerId: data.officer.id
        });
        options.onOfficerStatusChange(data.officer);
      }
    });

    // Subscribe to emergency alerts
    const unsubscribeEmergencyAlert = subscribe('emergency.alert', (data: any) => {
      if (data?.alert && options.onEmergencyAlert) {
        logger.info('Emergency alert via WebSocket', {
          module: 'PatrolWebSocket',
          alertId: data.alert.id
        });
        options.onEmergencyAlert(data.alert);
      }
    });

    // Subscribe to GPS location updates
    const unsubscribeLocationUpdate = subscribe('location.update', (data: any) => {
      if (data?.officerId && data?.location && options.onLocationUpdate) {
        logger.debug('Location update via WebSocket', {
          module: 'PatrolWebSocket',
          officerId: data.officerId
        });
        options.onLocationUpdate({
          officerId: data.officerId,
          location: data.location
        });
      }
    });

    // Subscribe to heartbeat updates
    const unsubscribeHeartbeat = subscribe('heartbeat.update', (data: any) => {
      if (data?.officerId && data?.last_heartbeat && options.onHeartbeat) {
        logger.debug('Heartbeat update via WebSocket', {
          module: 'PatrolWebSocket',
          officerId: data.officerId
        });
        options.onHeartbeat({
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
  }, [isConnected, subscribe, options]);
}
