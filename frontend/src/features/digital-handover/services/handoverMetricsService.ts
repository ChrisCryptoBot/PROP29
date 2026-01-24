/**
 * Digital Handover Metrics Service
 * 
 * Service layer for handover analytics and metrics.
 */

import apiService from '../../../services/ApiService';
import type { ApiResponse } from '../../../services/ApiService';
import { logger } from '../../../services/logger';
import type { HandoverMetrics } from '../types';

/**
 * Handover Metrics Service
 */
export const handoverMetricsService = {
  /**
   * Get handover metrics
   */
  async getMetrics(propertyId: string, dateFrom?: string, dateTo?: string): Promise<HandoverMetrics> {
    try {
      // Guard against mismatched date parameters
      if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
        throw new Error('Both start date and end date must be provided together');
      }

      const params: Record<string, string> = { property_id: propertyId };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await apiService.get<HandoverMetrics>('/handovers/metrics', { params });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch handover metrics');
      }
      return response.data;
    } catch (error) {
      logger.error(
        'Failed to fetch handover metrics',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverMetricsService', action: 'getMetrics', dateFrom, dateTo }
      );
      throw error;
    }
  },
};
