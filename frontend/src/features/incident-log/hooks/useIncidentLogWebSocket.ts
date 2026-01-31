/**
 * Incident Log WebSocket Hook
 * Handles real-time updates for incidents, emergency alerts, hardware devices, and agent submissions.
 * Uses a ref for options to avoid subscribe/unsubscribe churn from inline callbacks.
 */

import { useEffect, useRef } from 'react';
import { useWebSocket } from '../../../components/UI/WebSocketProvider';
import { logger } from '../../../services/logger';
import type { Incident, EmergencyAlertResponse, DeviceHealthStatus, AgentPerformanceMetrics } from '../types/incident-log.types';

export interface UseIncidentLogWebSocketOptions {
  onIncidentCreated?: (incident: Incident) => void;
  onIncidentUpdated?: (incident: Incident) => void;
  onIncidentDeleted?: (incidentId: string) => void;
  onEmergencyAlert?: (alert: EmergencyAlertResponse) => void;
  onHardwareDeviceStatus?: (device: DeviceHealthStatus) => void;
  onAgentSubmission?: (data: { incident: Incident; agentId: string }) => void;
}

export function useIncidentLogWebSocket(options: UseIncidentLogWebSocketOptions = {}) {
  const { isConnected, subscribe } = useWebSocket();
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    if (!isConnected) {
      logger.debug('WebSocket not connected, skipping incident log subscriptions', {
        module: 'IncidentLogWebSocket'
      });
      return;
    }

    logger.info('Subscribing to incident log WebSocket channels', {
      module: 'IncidentLogWebSocket'
    });

    const unsubscribeIncidentCreated = subscribe('incident.created', (data: any) => {
      if (data?.incident && optsRef.current.onIncidentCreated) {
        logger.info('Incident created via WebSocket', {
          module: 'IncidentLogWebSocket',
          incidentId: data.incident.incident_id
        });
        optsRef.current.onIncidentCreated!(data.incident);
      }
    });

    const unsubscribeIncidentUpdated = subscribe('incident.updated', (data: any) => {
      if (data?.incident && optsRef.current.onIncidentUpdated) {
        logger.info('Incident updated via WebSocket', {
          module: 'IncidentLogWebSocket',
          incidentId: data.incident.incident_id
        });
        optsRef.current.onIncidentUpdated!(data.incident);
      }
    });

    const unsubscribeIncidentDeleted = subscribe('incident.deleted', (data: any) => {
      if (data?.incident_id && optsRef.current.onIncidentDeleted) {
        logger.info('Incident deleted via WebSocket', {
          module: 'IncidentLogWebSocket',
          incidentId: data.incident_id
        });
        optsRef.current.onIncidentDeleted!(data.incident_id);
      }
    });

    const unsubscribeEmergencyAlert = subscribe('emergency.alert', (data: any) => {
      if (data?.alert && optsRef.current.onEmergencyAlert) {
        logger.info('Emergency alert via WebSocket', {
          module: 'IncidentLogWebSocket',
          alertId: data.alert.alert_id
        });
        optsRef.current.onEmergencyAlert!(data.alert);
      }
    });

    const unsubscribeHardwareDeviceStatus = subscribe('hardware.device.status', (data: any) => {
      if (data?.device && optsRef.current.onHardwareDeviceStatus) {
        logger.debug('Hardware device status update via WebSocket', {
          module: 'IncidentLogWebSocket',
          deviceId: data.device.device_id
        });
        optsRef.current.onHardwareDeviceStatus!(data.device);
      }
    });

    const unsubscribeAgentSubmission = subscribe('agent.submission', (data: any) => {
      if (data?.incident && data?.agent_id && optsRef.current.onAgentSubmission) {
        logger.info('Agent submission via WebSocket', {
          module: 'IncidentLogWebSocket',
          incidentId: data.incident.incident_id,
          agentId: data.agent_id
        });
        optsRef.current.onAgentSubmission!({
          incident: data.incident,
          agentId: data.agent_id
        });
      }
    });

    return () => {
      unsubscribeIncidentCreated();
      unsubscribeIncidentUpdated();
      unsubscribeIncidentDeleted();
      unsubscribeEmergencyAlert();
      unsubscribeHardwareDeviceStatus();
      unsubscribeAgentSubmission();
      logger.debug('Unsubscribed from incident log WebSocket channels', {
        module: 'IncidentLogWebSocket'
      });
    };
  }, [isConnected, subscribe]);
}
