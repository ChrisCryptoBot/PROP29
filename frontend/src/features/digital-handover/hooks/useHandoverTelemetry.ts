/**
 * Digital Handover Telemetry Hook
 * Tracks user actions for observability (handovers, templates, settings, equipment).
 */

import { useCallback } from 'react';
import { logger } from '../../../services/logger';
import { useAuth } from '../../../contexts/AuthContext';

type HandoverEntity = 'handover' | 'template' | 'settings' | 'equipment' | 'maintenance';

function trackEvent(action: string, entity: HandoverEntity, metadata?: Record<string, unknown>) {
  const enriched = {
    action,
    entity,
    metadata,
    timestamp: Date.now(),
    module: 'DigitalHandover',
  };
  if (process.env.NODE_ENV === 'development') {
    logger.info('Handover telemetry', enriched);
  }
}

export function useHandoverTelemetry() {
  const { user } = useAuth();

  const trackAction = useCallback((
    action: string,
    entity: HandoverEntity,
    metadata?: Record<string, unknown>
  ) => {
    trackEvent(action, entity, {
      ...metadata,
      userId: user?.user_id,
      propertyId: user?.roles?.[0] || undefined,
    });
  }, [user]);

  return { trackAction };
}
