/**
 * Digital Handover Equipment Service
 * 
 * Service layer for equipment and maintenance request management.
 */

import apiService from '../../../services/ApiService';
import type { ApiResponse } from '../../../services/ApiService';
import { logger } from '../../../services/logger';
import type {
  Equipment,
  MaintenanceRequest,
  CreateEquipmentRequest,
  CreateMaintenanceRequestRequest,
} from '../types';

/**
 * Equipment Service
 */
export const equipmentService = {
  /**
   * Get all equipment
   */
  async getEquipment(propertyId: string, operationalPost?: string): Promise<Equipment[]> {
    try {
      const params: Record<string, string> = { property_id: propertyId };
      if (operationalPost) params.operational_post = operationalPost;

      const response = await apiService.get<Equipment[]>('/api/equipment', { params });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch equipment');
      }
      return response.data;
    } catch (error) {
      logger.error(
        'Failed to fetch equipment',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'equipmentService', action: 'getEquipment', propertyId, operationalPost }
      );
      throw error;
    }
  },

  /**
   * Get a single equipment by ID
   */
  async getEquipmentById(id: string): Promise<Equipment> {
    try {
      const response = await apiService.get<Equipment>(`/api/equipment/${id}`);
      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to fetch equipment ${id}`);
      }
      return response.data;
    } catch (error) {
      logger.error(
        `Failed to fetch equipment ${id}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'equipmentService', action: 'getEquipmentById', equipmentId: id }
      );
      throw error;
    }
  },

  /**
   * Create new equipment
   */
  async createEquipment(propertyId: string, data: CreateEquipmentRequest): Promise<Equipment> {
    try {
      const response = await apiService.post<Equipment>('/api/equipment', { ...data, property_id: propertyId });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create equipment');
      }
      logger.info('Equipment created successfully', { module: 'equipmentService', action: 'createEquipment', equipmentId: response.data.id });
      return response.data;
    } catch (error) {
      logger.error(
        'Failed to create equipment',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'equipmentService', action: 'createEquipment', propertyId, data }
      );
      throw error;
    }
  },

  /**
   * Update equipment
   */
  async updateEquipment(id: string, data: Partial<CreateEquipmentRequest>): Promise<Equipment> {
    try {
      const response = await apiService.put<Equipment>(`/api/equipment/${id}`, data);
      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to update equipment ${id}`);
      }
      logger.info('Equipment updated successfully', { module: 'equipmentService', action: 'updateEquipment', equipmentId: id });
      return response.data;
    } catch (error) {
      logger.error(
        `Failed to update equipment ${id}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'equipmentService', action: 'updateEquipment', equipmentId: id, data }
      );
      throw error;
    }
  },

  /**
   * Delete equipment
   */
  async deleteEquipment(id: string): Promise<void> {
    try {
      const response = await apiService.delete<void>(`/api/equipment/${id}`);
      if (!response.success) {
        throw new Error(response.error || `Failed to delete equipment ${id}`);
      }
      logger.info('Equipment deleted successfully', { module: 'equipmentService', action: 'deleteEquipment', equipmentId: id });
    } catch (error) {
      logger.error(
        `Failed to delete equipment ${id}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'equipmentService', action: 'deleteEquipment', equipmentId: id }
      );
      throw error;
    }
  },

  /**
   * Get maintenance requests
   */
  async getMaintenanceRequests(propertyId: string, status?: string): Promise<MaintenanceRequest[]> {
    try {
      const params: Record<string, string> = { property_id: propertyId };
      if (status) params.status = status;

      const response = await apiService.get<MaintenanceRequest[]>('/api/maintenance-requests', { params });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch maintenance requests');
      }
      return response.data;
    } catch (error) {
      logger.error(
        'Failed to fetch maintenance requests',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'equipmentService', action: 'getMaintenanceRequests', propertyId, status }
      );
      throw error;
    }
  },

  /**
   * Create maintenance request
   */
  async createMaintenanceRequest(propertyId: string, data: CreateMaintenanceRequestRequest): Promise<MaintenanceRequest> {
    try {
      const response = await apiService.post<MaintenanceRequest>('/api/maintenance-requests', { ...data, property_id: propertyId });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create maintenance request');
      }
      logger.info('Maintenance request created successfully', { module: 'equipmentService', action: 'createMaintenanceRequest', requestId: response.data.id });
      return response.data;
    } catch (error) {
      logger.error(
        'Failed to create maintenance request',
        error instanceof Error ? error : new Error(String(error)),
        { module: 'equipmentService', action: 'createMaintenanceRequest', propertyId, data }
      );
      throw error;
    }
  },

  /**
   * Update maintenance request
   */
  async updateMaintenanceRequest(id: string, data: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    try {
      const response = await apiService.put<MaintenanceRequest>(`/api/maintenance-requests/${id}`, data);
      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to update maintenance request ${id}`);
      }
      logger.info('Maintenance request updated successfully', { module: 'equipmentService', action: 'updateMaintenanceRequest', requestId: id });
      return response.data;
    } catch (error) {
      logger.error(
        `Failed to update maintenance request ${id}`,
        error instanceof Error ? error : new Error(String(error)),
        { module: 'equipmentService', action: 'updateMaintenanceRequest', requestId: id, data }
      );
      throw error;
    }
  },
};
