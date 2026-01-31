/**
 * Visitor Security Telemetry Hook
 * Tracks user actions, performance metrics, and errors for observability
 */

import { useCallback } from 'react';
import { logger } from '../../../services/logger';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { useAuth } from '../../../contexts/AuthContext';

export interface VisitorTelemetryEvent {
  action: string;
  entity: 'visitor' | 'event' | 'security_request' | 'mobile_agent' | 'hardware' | 'bulk_operation' | 'settings';
  metadata?: Record<string, unknown>;
  timestamp?: number;
}

class VisitorTelemetry {
  private trackEvent(event: VisitorTelemetryEvent) {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      module: 'VisitorSecurity'
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('Telemetry event', enrichedEvent);
    }

    // External integration: Send to analytics service (e.g., Sentry, Analytics API).
    // Implement by calling your provider here, e.g.:
    // - Sentry: captureMessage/captureException with tags { module: 'VisitorSecurity', entity }
    // - Analytics API: POST /api/analytics/events with enrichedEvent
    // - Custom: window.__analytics?.track?.('VisitorSecurity', enrichedEvent)
  }

  trackUserAction(
    action: string,
    entity: 'visitor' | 'event' | 'security_request' | 'mobile_agent' | 'hardware' | 'bulk_operation' | 'settings',
    metadata?: Record<string, unknown>
  ) {
    this.trackEvent({
      action,
      entity,
      metadata
    });
  }

  trackPerformance(operation: string, duration: number, metadata?: Record<string, unknown>) {
    this.trackEvent({
      action: 'performance',
      entity: 'visitor',
      metadata: {
        operation,
        duration,
        ...metadata
      }
    });
  }

  trackError(error: Error, context: Record<string, unknown>) {
    const action = typeof context?.action === 'string' ? context.action : 'VisitorSecurity';
    ErrorHandlerService.logError(error, action);
  }
}

const telemetry = new VisitorTelemetry();

export function useVisitorTelemetry() {
  const { user } = useAuth();

  const trackAction = useCallback((
    action: string,
    entity: 'visitor' | 'event' | 'security_request' | 'mobile_agent' | 'hardware' | 'bulk_operation' | 'settings',
    metadata?: Record<string, unknown>
  ) => {
    telemetry.trackUserAction(action, entity, {
      ...metadata,
      userId: user?.user_id,
      propertyId: user?.roles?.[0] || undefined
    });
  }, [user]);

  const trackPerformance = useCallback((
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>
  ) => {
    telemetry.trackPerformance(operation, duration, {
      ...metadata,
      userId: user?.user_id
    });
  }, [user]);

  const trackError = useCallback((
    error: Error,
    context: Record<string, unknown>
  ) => {
    telemetry.trackError(error, {
      ...context,
      userId: user?.user_id,
      propertyId: user?.roles?.[0] || undefined
    });
  }, [user]);

  return {
    trackAction,
    trackPerformance,
    trackError
  };
}
