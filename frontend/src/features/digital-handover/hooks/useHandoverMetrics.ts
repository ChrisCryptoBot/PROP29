/**
 * useHandoverMetrics Hook
 * 
 * Custom hook for handover analytics and metrics.
 */

import { useState, useEffect, useCallback } from 'react';
import { handoverMetricsService } from '../services/handoverMetricsService';
import { logger } from '../../../services/logger';
import type { HandoverMetrics } from '../types';

export interface UseHandoverMetricsReturn {
  // Data
  metrics: HandoverMetrics | null;

  // Loading states
  loading: boolean;
  error: Error | null;

  // Operations
  loadMetrics: (propertyId?: string, dateFrom?: string, dateTo?: string) => Promise<void>;
  refreshMetrics: (propertyId?: string) => Promise<void>;

  // Date range
  dateFrom: string | undefined;
  dateTo: string | undefined;
  setDateRange: (dateFrom?: string, dateTo?: string) => void;
}

/**
 * Hook for managing handover metrics
 */
export function useHandoverMetrics(initialDateFrom?: string, initialDateTo?: string): UseHandoverMetricsReturn {
  // State
  const [metrics, setMetrics] = useState<HandoverMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [dateFrom, setDateFrom] = useState<string | undefined>(initialDateFrom);
  const [dateTo, setDateTo] = useState<string | undefined>(initialDateTo);

  /**
   * Load metrics
   */
  const loadMetrics = useCallback(async (propertyId?: string, from?: string, to?: string) => {
    try {
      setLoading(true);
      setError(null);
      const activePropertyId = propertyId || localStorage.getItem('propertyId') || '';
      const data = await handoverMetricsService.getMetrics(activePropertyId, from || dateFrom, to || dateTo);
      setMetrics(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to load handover metrics', error, { module: 'useHandoverMetrics', action: 'loadMetrics' });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  /**
   * Load metrics on mount
   */
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  /**
   * Refresh metrics with current date range
   */
  const refreshMetrics = useCallback(async (): Promise<void> => {
    await loadMetrics();
  }, [loadMetrics]);

  /**
   * Set date range and reload metrics
   */
  const setDateRange = useCallback((from?: string, to?: string) => {
    setDateFrom(from);
    setDateTo(to);
    // Metrics will reload when dateFrom/dateTo change
  }, []);

  /**
   * Reload metrics when date range changes
   */
  useEffect(() => {
    loadMetrics();
  }, [dateFrom, dateTo, loadMetrics]);

  return {
    // Data
    metrics,

    // Loading states
    loading,
    error,

    // Operations
    loadMetrics,
    refreshMetrics,

    // Date range
    dateFrom,
    dateTo,
    setDateRange,
  };
}
