/**
 * useHandovers Hook
 * 
 * Custom hook for handover CRUD operations and state management.
 * Provides all handover-related state and operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { handoverService } from '../services/handoverService';
import { logger } from '../../../services/logger';
import type {
  Handover,
  CreateHandoverRequest,
  UpdateHandoverRequest,
  HandoverFilters,
  HandoverSortOptions,
} from '../types';

export interface UseHandoversReturn {
  // Data
  handovers: Handover[];
  selectedHandover: Handover | null;

  // Loading states
  loading: boolean;
  error: Error | null;

  // Operations
  loadHandovers: (propertyId?: string) => Promise<void>;
  createHandover: (data: CreateHandoverRequest) => Promise<Handover>;
  updateHandover: (id: string, data: UpdateHandoverRequest) => Promise<Handover>;
  deleteHandover: (id: string) => Promise<void>;
  completeHandover: (id: string) => Promise<Handover>;
  getHandover: (id: string) => Promise<Handover>;
  refreshHandovers: (propertyId?: string) => Promise<void>;

  // Selection
  setSelectedHandover: (handover: Handover | null) => void;

  // Filters & Sort
  filters: HandoverFilters | undefined;
  setFilters: (filters: HandoverFilters | undefined) => void;
  sort: HandoverSortOptions | undefined;
  setSort: (sort: HandoverSortOptions | undefined) => void;
}

export interface UseHandoversOptions {
  filters?: HandoverFilters;
  sort?: HandoverSortOptions;
  autoLoad?: boolean; // Auto-load on mount (default: true)
}

/**
 * Hook for managing handovers
 */
export function useHandovers(options: UseHandoversOptions = {}): UseHandoversReturn {
  const { filters: initialFilters, sort: initialSort, autoLoad = true } = options;

  // State
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [selectedHandover, setSelectedHandover] = useState<Handover | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<HandoverFilters | undefined>(initialFilters);
  const [sort, setSort] = useState<HandoverSortOptions | undefined>(initialSort);

  /**
   * Load handovers with current filters and sort
   */
  const loadHandovers = useCallback(async (propertyId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const activePropertyId = propertyId || localStorage.getItem('propertyId') || '';
      const data = await handoverService.getHandovers(activePropertyId, filters, sort);
      setHandovers(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to load handovers', error, { module: 'useHandovers', action: 'loadHandovers' });
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  /**
   * Load handovers on mount and when filters/sort change
   */
  useEffect(() => {
    if (autoLoad) {
      loadHandovers();
    }
  }, [loadHandovers, autoLoad]);

  /**
   * Create a new handover
   */
  const createHandover = useCallback(async (data: CreateHandoverRequest): Promise<Handover> => {
    try {
      setLoading(true);
      setError(null);
      const newHandover = await handoverService.createHandover(data);
      setHandovers(prev => [newHandover, ...prev]);
      return newHandover;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to create handover', error, { module: 'useHandovers', action: 'createHandover' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an existing handover
   */
  const updateHandover = useCallback(async (id: string, data: UpdateHandoverRequest): Promise<Handover> => {
    try {
      setLoading(true);
      setError(null);
      const updated = await handoverService.updateHandover(id, data);
      setHandovers(prev => prev.map(h => h.id === id ? updated : h));

      // Update selected handover if it's the one being updated
      if (selectedHandover?.id === id) {
        setSelectedHandover(updated);
      }

      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to update handover', error, { module: 'useHandovers', action: 'updateHandover', handoverId: id });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedHandover]);

  /**
   * Delete a handover
   */
  const deleteHandover = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await handoverService.deleteHandover(id);
      setHandovers(prev => prev.filter(h => h.id !== id));

      // Clear selected handover if it's the one being deleted
      if (selectedHandover?.id === id) {
        setSelectedHandover(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to delete handover', error, { module: 'useHandovers', action: 'deleteHandover', handoverId: id });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedHandover]);

  /**
   * Complete a handover
   */
  const completeHandover = useCallback(async (id: string): Promise<Handover> => {
    try {
      setLoading(true);
      setError(null);
      const completed = await handoverService.completeHandover(id);
      setHandovers(prev => prev.map(h => h.id === id ? completed : h));

      // Update selected handover if it's the one being completed
      if (selectedHandover?.id === id) {
        setSelectedHandover(completed);
      }

      return completed;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to complete handover', error, { module: 'useHandovers', action: 'completeHandover', handoverId: id });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedHandover]);

  /**
   * Get a single handover by ID
   */
  const getHandover = useCallback(async (id: string): Promise<Handover> => {
    try {
      setLoading(true);
      setError(null);
      const handover = await handoverService.getHandover(id);
      return handover;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Failed to get handover', error, { module: 'useHandovers', action: 'getHandover', handoverId: id });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh handovers list
   */
  const refreshHandovers = useCallback(async (): Promise<void> => {
    await loadHandovers();
  }, [loadHandovers]);

  return {
    // Data
    handovers,
    selectedHandover,

    // Loading states
    loading,
    error,

    // Operations
    loadHandovers,
    createHandover,
    updateHandover,
    deleteHandover,
    completeHandover,
    getHandover,
    refreshHandovers,

    // Selection
    setSelectedHandover,

    // Filters & Sort
    filters,
    setFilters,
    sort,
    setSort,
  };
}
