/**
 * useEquipment Hook
 * 
 * Custom hook for equipment and maintenance request management.
 */

import { useState, useEffect, useCallback } from 'react';
import { equipmentService } from '../services/equipmentService';
import { logger } from '../../../services/logger';
import type {
  Equipment,
  MaintenanceRequest,
  CreateEquipmentRequest,
  CreateMaintenanceRequestRequest,
} from '../types';

export interface UseEquipmentReturn {
  // Data
  equipment: Equipment[];
  maintenanceRequests: MaintenanceRequest[];

  // Loading states
  loading: boolean;
  error: Error | null;

  // Equipment operations
  loadEquipment: (propertyId?: string, operationalPost?: string) => Promise<void>;
  getEquipmentById: (id: string) => Promise<Equipment>;
  createEquipment: (propertyId: string | CreateEquipmentRequest, data?: CreateEquipmentRequest) => Promise<Equipment>;
  updateEquipment: (id: string, data: Partial<CreateEquipmentRequest>) => Promise<Equipment>;
  deleteEquipment: (id: string) => Promise<void>;
  refreshEquipment: (propertyId?: string) => Promise<void>;

  // Maintenance request operations
  loadMaintenanceRequests: (propertyId?: string, status?: string) => Promise<void>;
  createMaintenanceRequest: (propertyId: string | CreateMaintenanceRequestRequest, data?: CreateMaintenanceRequestRequest) => Promise<MaintenanceRequest>;
  updateMaintenanceRequest: (id: string, data: Partial<MaintenanceRequest>) => Promise<MaintenanceRequest>;
  refreshMaintenanceRequests: (propertyId?: string) => Promise<void>;

  // Filter
  operationalPost: string | undefined;
  setOperationalPost: (post: string | undefined) => void;
}

/**
 * Hook for managing equipment and maintenance requests
 */
export function useEquipment(initialPost?: string): UseEquipmentReturn {
  // State
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [operationalPost, setOperationalPost] = useState<string | undefined>(initialPost);

  /**
   * Load equipment
   */
  const loadEquipment = useCallback(async (propertyId?: string, post?: string) => {
    try {
      setLoading(true);
      setError(null);
      const activePropertyId = propertyId || localStorage.getItem('propertyId') || '';
      const data = await equipmentService.getEquipment(activePropertyId, post || operationalPost);
      setEquipment(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to load equipment', error, { module: 'useEquipment', action: 'loadEquipment' });
    } finally {
      setLoading(false);
    }
  }, [operationalPost]);

  /**
   * Load equipment on mount and when operational post changes
   */
  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  /**
   * Get equipment by ID
   */
  const getEquipmentById = useCallback(async (id: string): Promise<Equipment> => {
    try {
      setLoading(true);
      setError(null);
      const item = await equipmentService.getEquipmentById(id);
      return item;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to get equipment', error, { module: 'useEquipment', action: 'getEquipmentById', equipmentId: id });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create equipment
   */
  const createEquipment = useCallback(async (propertyId: string | CreateEquipmentRequest, data?: CreateEquipmentRequest): Promise<Equipment> => {
    try {
      setLoading(true);
      setError(null);

      let activePropertyId: string;
      let equipmentData: CreateEquipmentRequest;

      if (typeof propertyId === 'string') {
        activePropertyId = propertyId;
        equipmentData = data!;
      } else {
        activePropertyId = localStorage.getItem('propertyId') || '';
        equipmentData = propertyId;
      }

      const newEquipment = await equipmentService.createEquipment(activePropertyId, equipmentData);
      setEquipment(prev => [...prev, newEquipment]);
      return newEquipment;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to create equipment', error, { module: 'useEquipment', action: 'createEquipment' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update equipment
   */
  const updateEquipment = useCallback(async (id: string, data: Partial<CreateEquipmentRequest>): Promise<Equipment> => {
    try {
      setLoading(true);
      setError(null);
      const updated = await equipmentService.updateEquipment(id, data);
      setEquipment(prev => prev.map(e => e.id === id ? updated : e));
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to update equipment', error, { module: 'useEquipment', action: 'updateEquipment', equipmentId: id });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete equipment
   */
  const deleteEquipment = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await equipmentService.deleteEquipment(id);
      setEquipment(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to delete equipment', error, { module: 'useEquipment', action: 'deleteEquipment', equipmentId: id });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh equipment
   */
  const refreshEquipment = useCallback(async (propertyId?: string): Promise<void> => {
    await loadEquipment(propertyId);
  }, [loadEquipment]);

  /**
   * Load maintenance requests
   */
  const loadMaintenanceRequests = useCallback(async (propertyId?: string, status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const activePropertyId = propertyId || localStorage.getItem('propertyId') || '';
      const data = await equipmentService.getMaintenanceRequests(activePropertyId, status);
      setMaintenanceRequests(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to load maintenance requests', error, { module: 'useEquipment', action: 'loadMaintenanceRequests' });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load maintenance requests on mount
   */
  useEffect(() => {
    loadMaintenanceRequests();
  }, [loadMaintenanceRequests]);

  /**
   * Create maintenance request
   */
  const createMaintenanceRequest = useCallback(async (propertyId: string | CreateMaintenanceRequestRequest, data?: CreateMaintenanceRequestRequest): Promise<MaintenanceRequest> => {
    try {
      setLoading(true);
      setError(null);

      let activePropertyId: string;
      let requestData: CreateMaintenanceRequestRequest;

      if (typeof propertyId === 'string') {
        activePropertyId = propertyId;
        requestData = data!;
      } else {
        activePropertyId = localStorage.getItem('propertyId') || '';
        requestData = propertyId;
      }

      const newRequest = await equipmentService.createMaintenanceRequest(activePropertyId, requestData);
      setMaintenanceRequests(prev => [...prev, newRequest]);
      return newRequest;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to create maintenance request', error, { module: 'useEquipment', action: 'createMaintenanceRequest' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update maintenance request
   */
  const updateMaintenanceRequest = useCallback(async (id: string, data: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> => {
    try {
      setLoading(true);
      setError(null);
      const updated = await equipmentService.updateMaintenanceRequest(id, data);
      setMaintenanceRequests(prev => prev.map(r => r.id === id ? updated : r));
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to update maintenance request', error, { module: 'useEquipment', action: 'updateMaintenanceRequest', requestId: id });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh maintenance requests
   */
  const refreshMaintenanceRequests = useCallback(async (propertyId?: string): Promise<void> => {
    await loadMaintenanceRequests(propertyId);
  }, [loadMaintenanceRequests]);

  return {
    // Data
    equipment,
    maintenanceRequests,

    // Loading states
    loading,
    error,

    // Equipment operations
    loadEquipment,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    refreshEquipment,

    // Maintenance request operations
    loadMaintenanceRequests,
    createMaintenanceRequest,
    updateMaintenanceRequest,
    refreshMaintenanceRequests,

    // Filter
    operationalPost,
    setOperationalPost,
  };
}
