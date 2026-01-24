/**
 * Package Service
 * API service layer for Package management
 * Abstracts all backend API interactions
 */

import apiService from '../../../services/ApiService';
import type { ApiResponse } from '../../../services/ApiService';
import type {
  Package,
  PackageCreate,
  PackageUpdate,
  PackageFilters
} from '../types/package.types';

class PackageService {
  /**
   * Get all packages with optional filtering
   */
  async getPackages(filters?: PackageFilters): Promise<ApiResponse<Package[]>> {
    const params: Record<string, string> = {};

    if (filters?.property_id) {
      params.property_id = filters.property_id;
    }
    if (filters?.status) {
      params.status = filters.status;
    }
    if (filters?.guest_id) {
      params.guest_id = filters.guest_id;
    }
    if (filters?.tracking_number) {
      params.tracking_number = filters.tracking_number;
    }

    return apiService.get<Package[]>('/packages', {
      params: Object.keys(params).length > 0 ? params : undefined
    });
  }

  /**
   * Get a single package by ID
   */
  async getPackage(packageId: string): Promise<ApiResponse<Package>> {
    return apiService.get<Package>(`/packages/${packageId}`);
  }

  /**
   * Create a new package
   */
  async createPackage(packageData: PackageCreate): Promise<ApiResponse<Package>> {
    return apiService.post<Package>('/packages', packageData);
  }

  /**
   * Update an existing package
   */
  async updatePackage(
    packageId: string,
    updates: PackageUpdate
  ): Promise<ApiResponse<Package>> {
    return apiService.put<Package>(`/packages/${packageId}`, updates);
  }

  /**
   * Delete a package
   */
  async deletePackage(packageId: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/packages/${packageId}`);
  }

  /**
   * Notify a guest about a package
   */
  async notifyGuest(
    packageId: string,
    guestId?: string
  ): Promise<ApiResponse<{ notified: boolean }>> {
    const url = guestId
      ? `/packages/${packageId}/notify?guest_id=${encodeURIComponent(guestId)}`
      : `/packages/${packageId}/notify`;
    return apiService.post<{ notified: boolean }>(url, undefined);
  }

  /**
   * Deliver a package
   */
  async deliverPackage(
    packageId: string,
    deliveredTo?: string
  ): Promise<ApiResponse<Package>> {
    const url = deliveredTo
      ? `/packages/${packageId}/deliver?delivered_to=${encodeURIComponent(deliveredTo)}`
      : `/packages/${packageId}/deliver`;
    return apiService.post<Package>(url, undefined);
  }

  /**
   * Mark a package as picked up
   */
  async pickupPackage(packageId: string): Promise<ApiResponse<Package>> {
    return apiService.post<Package>(`/packages/${packageId}/pickup`);
  }
}

// Export singleton instance
export const packageService = new PackageService();
export default packageService;
