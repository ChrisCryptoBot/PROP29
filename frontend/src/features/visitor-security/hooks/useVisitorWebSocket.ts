/**
 * Visitor Security WebSocket Hook
 * Real-time updates for visitors, events, mobile agent submissions, and hardware device status.
 * Uses a ref for options to avoid subscribe/unsubscribe churn from inline callbacks.
 */

import { useEffect, useRef } from 'react';
import { useWebSocket } from '../../../components/UI/WebSocketProvider';
import { logger } from '../../../services/logger';
import type { Visitor } from '../types/visitor-security.types';

export interface UseVisitorWebSocketOptions {
  onVisitorCreated?: (visitor: Visitor) => void;
  onVisitorUpdated?: (visitor: Visitor) => void;
  onVisitorDeleted?: (visitorId: string) => void;
  onVisitorCheckIn?: (visitor: Visitor) => void;
  onVisitorCheckOut?: (visitor: Visitor) => void;
  onEventCreated?: (event: { id: string }) => void;
  onEventDeleted?: (eventId: string) => void;
  onMobileAgentSubmission?: (submission: { submission_id: string }) => void;
  onHardwareDeviceStatus?: (device: { device_id: string }) => void;
}

export function useVisitorWebSocket(options: UseVisitorWebSocketOptions = {}) {
  const { isConnected, subscribe } = useWebSocket();
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    if (!isConnected) {
      logger.debug('WebSocket not connected, skipping visitor-security subscriptions', {
        module: 'VisitorWebSocket'
      });
      return;
    }

    logger.info('Subscribing to visitor-security WebSocket channels', {
      module: 'VisitorWebSocket'
    });

    const unsubVisitorCreated = subscribe('visitor-security.visitor.created', (data: Record<string, unknown>) => {
      const o = optsRef.current;
      if (data?.visitor && o.onVisitorCreated) {
        logger.info('Visitor created via WebSocket', { module: 'VisitorWebSocket', visitorId: (data.visitor as Visitor).id });
        o.onVisitorCreated(data.visitor as Visitor);
      }
    });

    const unsubVisitorUpdated = subscribe('visitor-security.visitor.updated', (data: Record<string, unknown>) => {
      const o = optsRef.current;
      if (data?.visitor && o.onVisitorUpdated) {
        logger.info('Visitor updated via WebSocket', { module: 'VisitorWebSocket', visitorId: (data.visitor as Visitor).id });
        o.onVisitorUpdated(data.visitor as Visitor);
      }
    });

    const unsubVisitorDeleted = subscribe('visitor-security.visitor.deleted', (data: Record<string, unknown>) => {
      const o = optsRef.current;
      const visitorId = data?.visitor_id as string || (data?.visitor as { id?: string })?.id;
      if (visitorId && o.onVisitorDeleted) {
        logger.info('Visitor deleted via WebSocket', { module: 'VisitorWebSocket', visitorId });
        o.onVisitorDeleted(visitorId);
      }
    });

    const unsubVisitorCheckIn = subscribe('visitor-security.visitor.check-in', (data: Record<string, unknown>) => {
      const o = optsRef.current;
      if (data?.visitor && o.onVisitorCheckIn) {
        logger.info('Visitor check-in via WebSocket', { module: 'VisitorWebSocket', visitorId: (data.visitor as Visitor).id });
        o.onVisitorCheckIn(data.visitor as Visitor);
      }
    });

    const unsubVisitorCheckOut = subscribe('visitor-security.visitor.check-out', (data: Record<string, unknown>) => {
      const o = optsRef.current;
      if (data?.visitor && o.onVisitorCheckOut) {
        logger.info('Visitor check-out via WebSocket', { module: 'VisitorWebSocket', visitorId: (data.visitor as Visitor).id });
        o.onVisitorCheckOut(data.visitor as Visitor);
      }
    });

    const unsubEventCreated = subscribe('visitor-security.event.created', (data: Record<string, unknown>) => {
      const o = optsRef.current;
      if (data?.event && o.onEventCreated) {
        const event = data.event as { id: string };
        logger.info('Event created via WebSocket', { module: 'VisitorWebSocket', eventId: event.id });
        o.onEventCreated(event);
      }
    });

    const unsubEventDeleted = subscribe('visitor-security.event.deleted', (data: Record<string, unknown>) => {
      const o = optsRef.current;
      const eventId = (data?.event_id as string) || (data?.event as { id?: string })?.id;
      if (eventId && o.onEventDeleted) {
        logger.info('Event deleted via WebSocket', { module: 'VisitorWebSocket', eventId });
        o.onEventDeleted(eventId);
      }
    });

    const unsubMobileAgentSubmission = subscribe('visitor-security.mobile-agent.submission', (data: Record<string, unknown>) => {
      const o = optsRef.current;
      if (data?.submission && o.onMobileAgentSubmission) {
        const sub = data.submission as { submission_id: string };
        logger.info('Mobile agent submission via WebSocket', { module: 'VisitorWebSocket', submissionId: sub.submission_id });
        o.onMobileAgentSubmission(sub);
      }
    });

    const unsubHardwareDeviceStatus = subscribe('visitor-security.hardware.device.status', (data: Record<string, unknown>) => {
      const o = optsRef.current;
      if (data?.device && o.onHardwareDeviceStatus) {
        const dev = data.device as { device_id: string };
        logger.info('Hardware device status via WebSocket', { module: 'VisitorWebSocket', deviceId: dev.device_id });
        o.onHardwareDeviceStatus(dev);
      }
    });

    return () => {
      unsubVisitorCreated();
      unsubVisitorUpdated();
      unsubVisitorDeleted();
      unsubVisitorCheckIn();
      unsubVisitorCheckOut();
      unsubEventCreated();
      unsubEventDeleted();
      unsubMobileAgentSubmission();
      unsubHardwareDeviceStatus();
      logger.info('Unsubscribing from visitor-security WebSocket channels', { module: 'VisitorWebSocket' });
    };
  }, [isConnected, subscribe]);
}
