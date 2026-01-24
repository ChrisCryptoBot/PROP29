/**
 * Lost & Found Service
 * API service layer for Lost & Found feature
 * Provides all API methods for lost & found management
 */

import apiService from '../../../services/ApiService';
import { env } from '../../../config/env';
import type { ApiResponse } from '../../../services/ApiService';
import type {
  LostFoundItem,
  LostFoundItemCreate,
  LostFoundItemUpdate,
  LostFoundItemFilters,
  LostFoundClaim,
  LostFoundMatch,
  LostFoundMetrics,
  LostFoundSettings
} from '../types/lost-and-found.types';

class LostFoundService {
  /**
   * Get all lost & found items with optional filters
   * GET /api/lost-found/items?property_id=xxx&status=xxx&item_type=xxx
   */
  async getItems(filters?: LostFoundItemFilters): Promise<ApiResponse<LostFoundItem[]>> {
    const params: Record<string, unknown> = {};
    if (filters?.property_id) params.property_id = filters.property_id;
    if (filters?.status) params.status = filters.status;
    if (filters?.item_type) params.item_type = filters.item_type;
    if (filters?.category) params.category = filters.category;
    if (filters?.storageLocation) params.storage_location = filters.storageLocation;
    if (filters?.dateFrom) params.date_from = filters.dateFrom;
    if (filters?.dateTo) params.date_to = filters.dateTo;
    if (filters?.search) params.search = filters.search;

    return apiService.get<LostFoundItem[]>('/lost-found/items', { params });
  }

  /**
   * Get a single item by ID
   * GET /api/lost-found/items/{item_id}
   */
  async getItem(itemId: string): Promise<ApiResponse<LostFoundItem>> {
    return apiService.get<LostFoundItem>(`/lost-found/items/${itemId}`);
  }

  /**
   * Register a new lost/found item
   * POST /api/lost-found/items
   */
  async createItem(item: LostFoundItemCreate): Promise<ApiResponse<LostFoundItem>> {
    return apiService.post<LostFoundItem>('/lost-found/items', item);
  }

  /**
   * Update an existing item
   * PUT /api/lost-found/items/{item_id}
   */
  async updateItem(
    itemId: string,
    updates: LostFoundItemUpdate
  ): Promise<ApiResponse<LostFoundItem>> {
    return apiService.put<LostFoundItem>(`/lost-found/items/${itemId}`, updates);
  }

  /**
   * Delete an item (admin only)
   * DELETE /api/lost-found/items/{item_id}
   */
  async deleteItem(itemId: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/lost-found/items/${itemId}`);
  }

  /**
   * Claim an item
   * POST /api/lost-found/items/{item_id}/claim
   */
  async claimItem(itemId: string, claim: LostFoundClaim): Promise<ApiResponse<LostFoundItem>> {
    return apiService.post<LostFoundItem>(`/lost-found/items/${itemId}/claim`, claim);
  }

  /**
   * Notify guest about an item
   * POST /api/lost-found/items/{item_id}/notify
   */
  async notifyGuest(itemId: string, guestId?: string): Promise<ApiResponse<{ notified: boolean }>> {
    const body = guestId ? { guest_id: guestId } : {};
    return apiService.post<{ notified: boolean }>(`/lost-found/items/${itemId}/notify`, body);
  }

  /**
   * Match items using AI
   * POST /api/lost-found/match
   */
  async matchItems(
    itemType: string,
    description: string
  ): Promise<ApiResponse<LostFoundMatch[]>> {
    return apiService.post<LostFoundMatch[]>('/lost-found/match', {
      item_type: itemType,
      description
    });
  }

  /**
   * Get metrics/analytics
   * GET /api/lost-found/metrics?property_id=xxx&date_from=xxx&date_to=xxx
   */
  async getMetrics(
    propertyId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<LostFoundMetrics>> {
    const params: Record<string, unknown> = {};
    if (propertyId) params.property_id = propertyId;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    return apiService.get<LostFoundMetrics>('/lost-found/metrics', { params });
  }

  /**
   * Get settings
   * GET /api/lost-found/settings?property_id=xxx
   */
  async getSettings(propertyId?: string): Promise<ApiResponse<LostFoundSettings>> {
    const params = propertyId ? { property_id: propertyId } : undefined;
    const response = await apiService.get<{ settings: LostFoundSettings }>('/lost-found/settings', { params });
    // Backend returns { settings: {...} }, map to just settings
    if (response.data?.settings) {
      return { ...response, data: response.data.settings };
    }
    // If no data, return response with undefined data
    return { ...response, data: undefined };
  }

  /**
   * Update settings
   * PUT /api/lost-found/settings?property_id=xxx
   */
  async updateSettings(
    settings: Partial<LostFoundSettings>,
    propertyId?: string
  ): Promise<ApiResponse<LostFoundSettings>> {
    const url = propertyId 
      ? `/lost-found/settings?property_id=${encodeURIComponent(propertyId)}`
      : '/lost-found/settings';
    const response = await apiService.put<{ settings: LostFoundSettings }>(url, settings);
    // Backend returns { settings: {...} }, map to just settings
    if (response.data?.settings) {
      return { ...response, data: response.data.settings };
    }
    // If no data, return response with undefined data
    return { ...response, data: undefined };
  }

  /**
   * Export report as PDF or CSV
   * GET /api/lost-found/reports/export?format=pdf&start_date=xxx&end_date=xxx
   */
  async exportReport(
    format: 'pdf' | 'csv',
    filters?: LostFoundItemFilters,
    startDate?: string,
    endDate?: string
  ): Promise<Blob> {
    const params: Record<string, unknown> = {
      format
    };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (filters?.property_id) params.property_id = filters.property_id;
    if (filters?.status) params.status = filters.status;
    if (filters?.item_type) params.item_type = filters.item_type;

    const token = localStorage.getItem('access_token');
    const baseUrl = env.API_BASE_URL;
    
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    
    const response = await fetch(`${baseUrl}/lost-found/reports/export?${queryString}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    
    return response.blob();
  }
}

// Export singleton instance
export const lostFoundService = new LostFoundService();
export default lostFoundService;
