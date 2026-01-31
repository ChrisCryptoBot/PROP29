/**
 * Access Control Telemetry Hook
 * Tracks user actions, performance metrics, and errors for observability
 * Following patrol-command-center pattern exactly
 */

import { useCallback } from 'react';
import { logger } from '../../../services/logger';
import { useAuth } from '../../../contexts/AuthContext';

export interface AccessControlTelemetryEvent {
  action: string;
  entity: 'access_point' | 'user' | 'event' | 'emergency' | 'audit' | 'configuration';
  metadata?: Record<string, unknown>;
  timestamp?: number;
}

class AccessControlTelemetry {
  private trackEvent(event: AccessControlTelemetryEvent) {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      module: 'AccessControl'
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('Telemetry event', enrichedEvent);
    }

    // Send to analytics service (structured for future integration)
    // In production, this would send to:
    // - Sentry for error tracking
    // - Analytics API for user behavior tracking
    // - Performance monitoring service
    // For now, events are logged via logger and can be collected server-side
    // Structure is ready for direct integration with analytics providers
    try {
      // Future: await analyticsService.track(enrichedEvent);
      // Future: if (error) Sentry.captureException(error, { extra: enrichedEvent });
    } catch (error) {
      // Silently fail - telemetry should not break the app
      logger.warn('Failed to send telemetry event', { module: 'AccessControlTelemetry', error });
    }
  }

  trackUserAction(
    action: string,
    entity: 'access_point' | 'user' | 'event' | 'emergency' | 'audit' | 'configuration',
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
      entity: 'access_point',
      metadata: {
        operation,
        duration,
        ...metadata
      }
    });
  }

  trackError(error: Error, context: Record<string, unknown>) {
    logger.error('Access Control error', error, {
      module: 'AccessControlTelemetry',
      ...context
    });
    
    // Send error to analytics service (structured for future integration)
    // In production, this would send to Sentry or similar error tracking service
    try {
      // Future: Sentry.captureException(error, { extra: context });
      // Future: analyticsService.trackError(error, context);
    } catch (analyticsError) {
      // Silently fail - error tracking should not break the app
      logger.warn('Failed to send error to analytics', { module: 'AccessControlTelemetry', analyticsError });
    }
  }
}

const telemetry = new AccessControlTelemetry();

export function useAccessControlTelemetry() {
  const { user } = useAuth();

  const trackAction = useCallback((
    action: string,
    entity: 'access_point' | 'user' | 'event' | 'emergency' | 'audit' | 'configuration',
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
