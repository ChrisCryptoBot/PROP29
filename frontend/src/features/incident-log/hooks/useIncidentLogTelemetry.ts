/**
 * Incident Log Telemetry Hook
 * Tracks user actions, performance metrics, and errors for observability
 */

import { useCallback } from 'react';
import { logger } from '../../../services/logger';
import { useAuth } from '../../../contexts/AuthContext';

export interface IncidentLogTelemetryEvent {
  action: string;
  entity: 'incident' | 'emergency' | 'agent' | 'hardware' | 'bulk_operation' | 'settings';
  metadata?: Record<string, unknown>;
  timestamp?: number;
}

class IncidentLogTelemetry {
  private trackEvent(event: IncidentLogTelemetryEvent) {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      module: 'IncidentLog'
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('Telemetry event', enrichedEvent);
    }

    // TODO: Send to analytics service (e.g., Sentry, Analytics API)
    // This would be implemented based on your analytics provider
  }

  trackUserAction(
    action: string,
    entity: 'incident' | 'emergency' | 'agent' | 'hardware' | 'bulk_operation' | 'settings',
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
      entity: 'incident',
      metadata: {
        operation,
        duration,
        ...metadata
      }
    });
  }

  trackError(error: Error, context: Record<string, unknown>) {
    logger.error('Incident Log error', error, {
      module: 'IncidentLogTelemetry',
      ...context
    });
  }
}

const telemetry = new IncidentLogTelemetry();

export function useIncidentLogTelemetry() {
  const { user } = useAuth();

  const trackAction = useCallback((
    action: string,
    entity: 'incident' | 'emergency' | 'agent' | 'hardware' | 'bulk_operation' | 'settings',
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
