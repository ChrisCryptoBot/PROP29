/**
 * Digital Handover Settings Service
 * 
 * Service layer for handover settings and configuration management.
 */

import apiService from '../../../services/ApiService';
import type { ApiResponse } from '../../../services/ApiService';
import { logger } from '../../../services/logger';
import type { HandoverSettings, UpdateHandoverSettingsRequest } from '../types';

/**
 * Handover Settings Service
 */
export const handoverSettingsService = {
  /**
   * Get handover settings
   */
  async getSettings(propertyId: string): Promise<HandoverSettings> {
    try {
      const response = await apiService.get<HandoverSettings>('/handovers/settings', {
        params: { property_id: propertyId }
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch handover settings');
      }
      return response.data;
    } catch (error) {
      logger.error(
        'Failed to fetch handover settings',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverSettingsService', action: 'getSettings' }
      );
      throw error;
    }
  },

  /**
   * Update handover settings
   */
  async updateSettings(propertyId: string, data: UpdateHandoverSettingsRequest): Promise<HandoverSettings> {
    try {
      const response = await apiService.put<HandoverSettings>('/handovers/settings', data, {
        params: { property_id: propertyId }
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update handover settings');
      }
      logger.info('Handover settings updated successfully', { module: 'handoverSettingsService', action: 'updateSettings' });
      return response.data;
    } catch (error) {
      logger.error(
        'Failed to update handover settings',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverSettingsService', action: 'updateSettings', data }
      );
      throw error;
    }
  },
};
