/**
 * Incident Log State Reconciliation Hook
 * Handles state reconciliation between WebSocket updates and API responses
 * Prevents race conditions and ensures data consistency
 */

import { useEffect, useCallback } from 'react';
import { logger } from '../../../services/logger';
import type { Incident } from '../types/incident-log.types';

export interface UseIncidentLogStateReconciliationOptions {
  incidents: Incident[];
  setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
}

export function useIncidentLogStateReconciliation(options: UseIncidentLogStateReconciliationOptions) {
  const {
    incidents,
    setIncidents
  } = options;

  // Reconcile incidents state
  const reconcileIncidents = useCallback(() => {
    // Check for duplicate IDs (shouldn't happen, but handle gracefully)
    const seenIds = new Set<string>();
    const duplicates: string[] = [];
    
    incidents.forEach(incident => {
      if (seenIds.has(incident.incident_id)) {
        duplicates.push(incident.incident_id);
      } else {
        seenIds.add(incident.incident_id);
      }
    });

    if (duplicates.length > 0) {
      logger.warn('Duplicate incident IDs detected, removing duplicates', {
        module: 'IncidentLogStateReconciliation',
        duplicateIds: duplicates
      });
      // Remove duplicates, keeping the first occurrence
      const unique = incidents.filter((incident, index, self) =>
        index === self.findIndex(i => i.incident_id === incident.incident_id)
      );
      setIncidents(unique);
    }

    // Reconcile status consistency
    // Check for incidents with invalid status transitions
    const now = Date.now();
    const reconciled = incidents.map(incident => {
      // If incident is marked as resolved but has no resolved_at, add it
      if (incident.status === 'resolved' && !incident.resolved_at) {
        logger.debug('Reconciling incident resolved_at', {
          module: 'IncidentLogStateReconciliation',
          incidentId: incident.incident_id
        });
        return {
          ...incident,
          resolved_at: new Date().toISOString()
        };
      }

      // If incident is marked as closed but has no resolved_at, add it
      if (incident.status === 'closed' && !incident.resolved_at) {
        logger.debug('Reconciling incident resolved_at for closed status', {
          module: 'IncidentLogStateReconciliation',
          incidentId: incident.incident_id
        });
        return {
          ...incident,
          resolved_at: new Date().toISOString()
        };
      }

      return incident;
    });

    // Only update if changes were made
    const hasChanges = reconciled.some((incident, index) => incident !== incidents[index]);
    if (hasChanges) {
      setIncidents(reconciled);
    }
  }, [incidents, setIncidents]);

  // Run reconciliation on data changes (debounced)
  useEffect(() => {
    if (incidents.length > 0) {
      const timeoutId = setTimeout(reconcileIncidents, 1000); // Debounce 1 second
      return () => clearTimeout(timeoutId);
    }
  }, [incidents, reconcileIncidents]);

  return {
    reconcileIncidents
  };
}
