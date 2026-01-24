/**
 * Digital Handover Service
 * 
 * Service layer for handover CRUD operations with authentication.
 * Handles all API calls related to handover management.
 */

import apiService from '../../../services/ApiService';
import type { ApiResponse } from '../../../services/ApiService';
import { logger } from '../../../services/logger';
import type {
  Handover,
  CreateHandoverRequest,
  UpdateHandoverRequest,
  HandoverFilters,
  HandoverSortOptions,
} from '../types';

/**
 * Handover Service
 */
export const handoverService = {
  /**
   * Get all handovers with optional filters and sorting
   */
  async getHandovers(
    propertyId: string,
    filters?: HandoverFilters,
    sort?: HandoverSortOptions
  ): Promise<Handover[]> {
    try {
      const params: Record<string, unknown> = { property_id: propertyId };

      if (filters) {
        if (filters.status?.length) params.status = filters.status;
        if (filters.shiftType?.length) params.shift_type = filters.shiftType;
        if (filters.priority?.length) params.priority = filters.priority;
        if (filters.handoverFrom) params.handover_from = filters.handoverFrom;
        if (filters.handoverTo) params.handover_to = filters.handoverTo;
        if (filters.dateFrom) params.date_from = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        if (filters.operationalPost) params.operational_post = filters.operationalPost;
        if (filters.searchQuery) params.search = filters.searchQuery;
      }

      if (sort) {
        params.sort_by = sort.field;
        params.sort_order = sort.direction;
      }

      const response = await apiService.get<Handover[]>('/handovers', { params });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch handovers');
      }
      return response.data;
    } catch (error) {
      logger.error(
        'Failed to fetch handovers',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverService', action: 'getHandovers', filters, sort }
      );
      throw error;
    }
  },

  /**
   * Get a single handover by ID
   */
  async getHandover(id: string): Promise<Handover> {
    try {
      const response = await apiService.get<Handover>(`/handovers/${id}`);
      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to fetch handover ${id}`);
      }
      return response.data;
    } catch (error) {
      logger.error(
        `Failed to fetch handover ${id}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverService', action: 'getHandover', handoverId: id }
      );
      throw error;
    }
  },

  /**
   * Create a new handover
   */
  async createHandover(data: CreateHandoverRequest): Promise<Handover> {
    try {
      const response = await apiService.post<Handover>('/handovers', data);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create handover');
      }
      logger.info('Handover created successfully', { module: 'handoverService', action: 'createHandover', handoverId: response.data.id });
      return response.data;
    } catch (error) {
      logger.error(
        'Failed to create handover',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverService', action: 'createHandover', data }
      );
      throw error;
    }
  },

  /**
   * Update an existing handover
   */
  async updateHandover(id: string, data: UpdateHandoverRequest): Promise<Handover> {
    try {
      const response = await apiService.put<Handover>(`/handovers/${id}`, data);
      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to update handover ${id}`);
      }
      logger.info('Handover updated successfully', { module: 'handoverService', action: 'updateHandover', handoverId: id });
      return response.data;
    } catch (error) {
      logger.error(
        `Failed to update handover ${id}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverService', action: 'updateHandover', handoverId: id, data }
      );
      throw error;
    }
  },

  /**
   * Delete a handover
   */
  async deleteHandover(id: string): Promise<void> {
    try {
      const response = await apiService.delete<void>(`/handovers/${id}`);
      if (!response.success) {
        throw new Error(response.error || `Failed to delete handover ${id}`);
      }
      logger.info('Handover deleted successfully', { module: 'handoverService', action: 'deleteHandover', handoverId: id });
    } catch (error) {
      logger.error(
        `Failed to delete handover ${id}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverService', action: 'deleteHandover', handoverId: id }
      );
      throw error;
    }
  },

  /**
   * Complete a handover
   */
  async completeHandover(id: string): Promise<Handover> {
    try {
      const response = await apiService.post<Handover>(`/handovers/${id}/complete`);
      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to complete handover ${id}`);
      }
      logger.info('Handover completed successfully', { module: 'handoverService', action: 'completeHandover', handoverId: id });
      return response.data;
    } catch (error) {
      logger.error(
        `Failed to complete handover ${id}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'handoverService', action: 'completeHandover', handoverId: id }
      );
      throw error;
    }
  },

  /**
   * Get staff members for a property
   */
  async getStaff(propertyId: string): Promise<any[]> {
    try {
      const response = await apiService.get<any[]>('/handovers/staff', {
        params: { property_id: propertyId }
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch staff');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch staff', error as Error);
      throw error;
    }
  },

  /**
   * Get today's shift timeline
   */
  async getShiftTimeline(propertyId: string): Promise<any[]> {
    try {
      const response = await apiService.get<any[]>('/handovers/timeline', {
        params: { property_id: propertyId }
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch timeline');
      }
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch timeline', error as Error);
      throw error;
    }
  },
};
