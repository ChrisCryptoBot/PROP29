/**
 * Guest Safety Telemetry Hook
 * Tracks user actions, performance metrics, and errors for observability
 */

import { useCallback } from 'react';
import { logger } from '../../../services/logger';
import { ErrorHandlerService } from '../../../services/ErrorHandlerService';
import { useAuth } from '../../../contexts/AuthContext';

export type GuestSafetyTelemetryEntity =
  | 'incident'
  | 'team'
  | 'message'
  | 'mass_notification'
  | 'settings'
  | 'evacuation'
  | 'hardware'
  | 'agent'
  | 'tab';

class GuestSafetyTelemetry {
  private trackEvent(action: string, entity: GuestSafetyTelemetryEntity, metadata?: Record<string, unknown>) {
    const enrichedEvent = {
      action,
      entity,
      metadata,
      timestamp: Date.now(),
      module: 'GuestSafety',
    };

    if (process.env.NODE_ENV === 'development') {
      logger.info('Telemetry event', enrichedEvent);
    }

    // External integration: Send to analytics service (e.g., Sentry, Analytics API).
  }

  trackUserAction(
    action: string,
    entity: GuestSafetyTelemetryEntity,
    metadata?: Record<string, unknown>
  ) {
    this.trackEvent(action, entity, metadata);
  }

  trackPerformance(operation: string, duration: number, metadata?: Record<string, unknown>) {
    this.trackEvent('performance', 'incident', {
      operation,
      duration,
      ...metadata,
    });
  }

  trackError(error: Error, context: Record<string, unknown>) {
    const action = typeof context?.action === 'string' ? context.action : 'GuestSafety';
    ErrorHandlerService.logError(error, action);
  }
}

const telemetry = new GuestSafetyTelemetry();

export function useGuestSafetyTelemetry() {
  const { user } = useAuth();

  const trackAction = useCallback(
    (
      action: string,
      entity: GuestSafetyTelemetryEntity,
      metadata?: Record<string, unknown>
    ) => {
      telemetry.trackUserAction(action, entity, {
        ...metadata,
        userId: user?.user_id,
        propertyId: user?.roles?.[0] || (user as { property_id?: string })?.property_id,
      });
    },
    [user]
  );

  const trackPerformance = useCallback(
    (operation: string, duration: number, metadata?: Record<string, unknown>) => {
      telemetry.trackPerformance(operation, duration, {
        ...metadata,
        userId: user?.user_id,
      });
    },
    [user]
  );

  const trackError = useCallback(
    (error: Error, context: Record<string, unknown>) => {
      telemetry.trackError(error, {
        ...context,
        userId: user?.user_id,
        propertyId: user?.roles?.[0] || (user as { property_id?: string })?.property_id,
      });
    },
    [user]
  );

  return {
    trackAction,
    trackPerformance,
    trackError,
  };
}
