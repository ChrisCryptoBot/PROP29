/**
 * Security Operations Center Telemetry Hook
 * Tracks user actions, performance metrics, and errors for observability
 * Following patrol-command-center pattern exactly
 */

import { useCallback } from 'react';
import { logger } from '../../../services/logger';
import { useAuth } from '../../../contexts/AuthContext';

export interface SecurityOperationsTelemetryEvent {
  action: string;
  entity: 'camera' | 'recording' | 'evidence' | 'settings' | 'alert' | 'analytics' | 'camera_wall';
  metadata?: Record<string, unknown>;
  timestamp?: number;
}

class SecurityOperationsTelemetry {
  private trackEvent(event: SecurityOperationsTelemetryEvent) {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      module: 'SecurityOperationsCenter'
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('Telemetry event', enrichedEvent);
    }

    // Integration point: Send to analytics/monitoring (Sentry, DataDog, internal API).
    // Implement trackEvent() to POST enrichedEvent to your analytics endpoint.
    // See README.md in this feature for deployment and 3rd-party integration notes.
  }

  trackUserAction(
    action: string,
    entity: 'camera' | 'recording' | 'evidence' | 'settings' | 'alert' | 'analytics' | 'camera_wall',
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
      entity: 'camera',
      metadata: {
        operation,
        duration,
        ...metadata
      }
    });
  }

  trackError(error: Error, context: Record<string, unknown>) {
    this.trackEvent({
      action: 'error',
      entity: 'camera',
      metadata: {
        errorMessage: error.message,
        errorStack: error.stack,
        ...context
      }
    });
  }
}

const telemetryInstance = new SecurityOperationsTelemetry();

export function useSecurityOperationsTelemetry() {
  const { user } = useAuth();

  const trackAction = useCallback(
    (
      action: string,
      entity: 'camera' | 'recording' | 'evidence' | 'settings' | 'alert' | 'analytics' | 'camera_wall',
      metadata?: Record<string, unknown>
    ) => {
      telemetryInstance.trackUserAction(action, entity, {
        userId: user?.user_id,
        ...metadata
      });
    },
    [user]
  );

  const trackPerformance = useCallback(
    (operation: string, duration: number, metadata?: Record<string, unknown>) => {
      telemetryInstance.trackPerformance(operation, duration, {
        userId: user?.user_id,
        ...metadata
      });
    },
    [user]
  );

  const trackError = useCallback(
    (error: Error, context: Record<string, unknown>) => {
      telemetryInstance.trackError(error, {
        userId: user?.user_id,
        ...context
      });
    },
    [user]
  );

  return {
    trackAction,
    trackPerformance,
    trackError
  };
}
